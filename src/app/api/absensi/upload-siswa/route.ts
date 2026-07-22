import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── POST: Upload Excel with student data → save to AbsensiSiswa (INDEPENDEN) ──
// Expected columns: URUT, NISN, NIM/NIPD, Nama, JK, AGM, KELAS
// Uses buffer-based parsing (no filesystem) — compatible with Vercel serverless
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as { role?: string })?.role || "";
    if (role !== "admin" && role !== "operator") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const tahunPelajaran = (formData.get("tahunPelajaran") as string) || "";
    const semester = (formData.get("semester") as string) || "Ganjil";

    if (!file) return NextResponse.json({ error: "File wajib diupload" }, { status: 400 });
    if (!tahunPelajaran) return NextResponse.json({ error: "Tahun Pelajaran wajib" }, { status: 400 });

    // Read file into buffer (no filesystem — Vercel compatible)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Dynamic import xlsx for serverless compatibility
    let XLSX: any;
    try {
      XLSX = (await import("xlsx")).default || (await import("xlsx"));
    } catch (e) {
      console.error("[UPLOAD] Failed to import xlsx:", e);
      return NextResponse.json({ error: "Library xlsx tidak tersedia" }, { status: 500 });
    }

    // Parse Excel from buffer (no file system needed)
    let rows: Record<string, unknown>[];
    try {
      const wb = XLSX.read(buffer, { type: "array" });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
    } catch (e) {
      console.error("[UPLOAD] Failed to parse Excel:", e);
      return NextResponse.json({ error: "Gagal membaca file Excel" }, { status: 400 });
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "File kosong" }, { status: 400 });
    }

    // Find column indices (flexible header matching)
    const headerRow = rows[0];
    const headers = Object.keys(headerRow);
    const findCol = (aliases: string[]): string => {
      for (const alias of aliases) {
        const found = headers.find((h) => h.toLowerCase().trim() === alias.toLowerCase());
        if (found) return found;
      }
      return "";
    };
    const colNo = findCol(["urut", "no", "nomor"]);
    const colNisn = findCol(["nisn"]);
    const colNipd = findCol(["nim", "nipd", "nip"]);
    const colNama = findCol(["nama", "nama siswa", "name"]);
    const colJk = findCol(["jk", "jenis kelamin", "jenis_kelamin", "kelamin", "laki", "perempuan"]);
    const colAgm = findCol(["agm", "agama", "religion"]);
    const colKelas = findCol(["kelas", "rombel", "rombongan belajar", "kelompok"]);

    if (!colNama) {
      return NextResponse.json({ error: "Kolom 'Nama' tidak ditemukan" }, { status: 400 });
    }

    // Group rows by kelas
    const studentsByKelas: Record<string, { no: string; nisn: string; nipd: string; nama: string; jk: string; agm: string; kelas: string }[]> = {};
    let total = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const nama = String(row[colNama] || "").trim();
      if (!nama) continue;

      const kelas = colKelas ? String(row[colKelas] || "").trim() : "";
      if (!kelas) continue;

      const nisn = colNisn ? String(row[colNisn] || "").trim() : "";
      const jk = colJk ? String(row[colJk] || "").trim() : "";
      const agm = colAgm ? String(row[colAgm] || "").trim() : "";
      const no = colNo ? String(row[colNo] || "").trim() : "";
      const nipd = colNipd ? String(row[colNipd] || "").trim() : "";

      if (!studentsByKelas[kelas]) studentsByKelas[kelas] = [];
      studentsByKelas[kelas].push({ no, nisn, nipd, nama, jk, agm, kelas });
      total++;
    }

    // Process each kelas
    const results = {
      total,
      matched: 0,
      updated: 0,
      created: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const [kelas, students] of Object.entries(studentsByKelas)) {
      // Find existing entries in AbsensiSiswa for this rombel
      const existing = await db.absensiSiswa.findMany({
        where: { tahunPelajaran, semester, rombel: kelas },
      });

      const existingByNisn = new Map<string, typeof existing[0]>();
      const existingByNama = new Map<string, typeof existing[0]>();
      for (const s of existing) {
        if (s.nisn) existingByNisn.set(s.nisn, s);
        existingByNama.set(s.nama.toLowerCase().trim(), s);
      }

      // Separate into updates and creates for batch processing
      const toUpdate: { id: string; data: Record<string, string> }[] = [];
      const toCreate: { no: string; nama: string; nisn: string; nipd: string; jenisKelamin: string; agama: string; rombel: string; tahunPelajaran: string; semester: string }[] = [];

      for (const student of students) {
        try {
          // Try to match by NISN first, then by name
          let matched = student.nisn ? existingByNisn.get(student.nisn) : null;
          if (!matched) {
            matched = existingByNama.get(student.nama.toLowerCase().trim());
          }

          if (matched) {
            // Collect changes
            const changes: Record<string, string> = {};
            if (student.nama && student.nama !== matched.nama) changes.nama = student.nama;
            if (student.jk && student.jk !== matched.jenisKelamin) changes.jenisKelamin = student.jk;
            if (student.agm && student.agm !== matched.agama) changes.agama = student.agm;
            if (student.no && student.no !== matched.no) changes.no = student.no;
            if (student.nipd && student.nipd !== matched.nipd) changes.nipd = student.nipd;
            if (student.nisn && student.nisn !== matched.nisn) changes.nisn = student.nisn;

            if (Object.keys(changes).length > 0) {
              toUpdate.push({ id: matched.id, data: changes });
            }
            results.matched++;
          } else {
            toCreate.push({
              no: student.no || String(total),
              nama: student.nama,
              nisn: student.nisn,
              nipd: student.nipd,
              jenisKelamin: student.jk,
              agama: student.agm,
              rombel: student.kelas,
              tahunPelajaran,
              semester,
            });
          }
        } catch (e) {
          results.errors.push(`${student.nama}: ${e instanceof Error ? e.message : "Error"}`);
        }
      }

      // Batch update
      for (const item of toUpdate) {
        try {
          await db.absensiSiswa.update({ where: { id: item.id }, data: item.data });
          results.updated++;
        } catch (e) {
          results.errors.push(`Update ${item.id}: ${e instanceof Error ? e.message : "Error"}`);
        }
      }

      // Batch create with skipDuplicates for safety
      if (toCreate.length > 0) {
        try {
          const created = await db.absensiSiswa.createMany({
            data: toCreate,
            skipDuplicates: true,
          });
          results.created += created.count;
        } catch (e) {
          // Fallback: create one by one if createMany fails
          console.warn("[UPLOAD] createMany failed, falling back to individual creates:", e);
          for (const item of toCreate) {
            try {
              await db.absensiSiswa.create({ data: item });
              results.created++;
            } catch (e2) {
              results.errors.push(`${item.nama}: ${e2 instanceof Error ? e2.message : "Error"}`);
            }
          }
        }
      }
    }

    const message = [
      `${results.matched} cocok`,
      results.updated > 0 ? `${results.updated} diperbarui` : null,
      results.created > 0 ? `${results.created} siswa baru ditambahkan` : null,
    ].filter(Boolean).join(", ");

    return NextResponse.json({
      success: true,
      message: message || "Tidak ada perubahan",
      ...results,
      kelasList: Object.keys(studentsByKelas),
    });
  } catch (error) {
    console.error("[UPLOAD SISWA ABSENSI]", error);
    return NextResponse.json({
      error: "Gagal mengupload file",
      detail: error instanceof Error ? error.message : undefined,
    }, { status: 500 });
  }
}
