import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import * as XLSX from "xlsx";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// ─── POST: Upload Excel with student data, sync to Siswa by NISN ──────────
// Expected columns: URUT, NISN, NIM/NIPD, Nama, JK, AGM, KELAS
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

    // Validate file type
    const ext = path.extname(file.name).toLowerCase();
    if (ext !== ".xlsx" && ext !== ".xls" && ext !== ".csv") {
      return NextResponse.json({ error: "Format file harus .xlsx, .xls, atau .csv" }, { status: 400 });
    }

    // Save to temp file
    const bytes = await file.arrayBuffer();
    const tmpPath = path.join("/tmp", `upload-${randomUUID()}${ext}`);
    await writeFile(tmpPath, Buffer.from(bytes));

    try {
      // Parse Excel
      const wb = XLSX.readFile(tmpPath);
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

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

      // Process each row
      const results = {
        total: 0,
        matched: 0,
        updated: 0,
        notFound: [] as string[],
        errors: [] as string[],
      };

      // Group rows by kelas
      const studentsByKelas: Record<string, { no: string; nisn: string; nipd: string; nama: string; jk: string; agm: string; kelas: string }[]> = {};

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const nama = String(row[colNama] || "").trim();
        if (!nama) continue;

        const kelas = colKelas ? String(row[colKelas] || "").trim() : "";
        const nisn = colNisn ? String(row[colNisn] || "").trim() : "";
        const jk = colJk ? String(row[colJk] || "").trim() : "";
        const agm = colAgm ? String(row[colAgm] || "").trim() : "";
        const no = colNo ? String(row[colNo] || "").trim() : "";
        const nipd = colNipd ? String(row[colNipd] || "").trim() : "";

        if (!kelas) continue;

        if (!studentsByKelas[kelas]) studentsByKelas[kelas] = [];
        studentsByKelas[kelas].push({ no, nisn, nipd, nama, jk, agm, kelas });
        results.total++;
      }

      // For each kelas, match students by NISN and update
      for (const [kelas, students] of Object.entries(studentsByKelas)) {
        // Find existing students in this rombel
        const existing = await db.siswa.findMany({
          where: { tahunPelajaran, semester, rombel: kelas },
        });

        const existingByNisn = new Map<string, typeof existing[0]>();
        for (const s of existing) {
          if (s.nisn) existingByNisn.set(s.nisn, s);
        }

        for (const student of students) {
          try {
            // Try to match by NISN first
            let matched = student.nisn ? existingByNisn.get(student.nisn) : null;

            if (matched) {
              // Check if anything changed
              const changes: Record<string, string> = {};
              if (student.nama && student.nama !== matched.nama) changes.nama = student.nama;
              if (student.jk && student.jk !== matched.jenisKelamin) changes.jenisKelamin = student.jk;
              if (student.agm && student.agm !== matched.agama) changes.agama = student.agm;
              if (student.no && student.no !== matched.no) changes.no = student.no;
              if (student.nipd && student.nipd !== matched.nipd) changes.nipd = student.nipd;

              if (Object.keys(changes).length > 0) {
                await db.siswa.update({
                  where: { id: matched.id },
                  data: changes,
                });
                results.updated++;
              }
              results.matched++;
            } else {
              // No match by NISN
              results.notFound.push(`${student.nama} (${kelas})${student.nisn ? ` [NISN: ${student.nisn}]` : ""}`);
            }
          } catch (e) {
            results.errors.push(`${student.nama}: ${e instanceof Error ? e.message : "Error"}`);
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Proses selesai: ${results.matched} cocok, ${results.updated} diperbarui, ${results.notFound.length} tidak ditemukan`,
        ...results,
        kelasList: Object.keys(studentsByKelas),
      });
    } finally {
      // Clean up temp file
      try { await unlink(tmpPath); } catch {}
    }
  } catch (error) {
    console.error("[UPLOAD SISWA]", error);
    return NextResponse.json({ error: "Gagal mengupload file" }, { status: 500 });
  }
}
