import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── GET: Rekap catatan siswa per rombel untuk cetak ─────────────────────
// Query params: tahunPelajaran, semester, rombel
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tahunPelajaran = searchParams.get("tahunPelajaran") || "2025/2026";
    const semester = searchParams.get("semester") || "Ganjil";
    const rombel = searchParams.get("rombel") || "";

    if (!rombel) return NextResponse.json({ error: "rombel wajib" }, { status: 400 });

    // Fetch all students in this rombel from Siswa table
    const siswaList = await db.siswa.findMany({
      where: { tahunPelajaran, semester, rombel, status: "Aktif" },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true, nisn: true, rombel: true },
    });

    // Also try from AbsensiSiswa as fallback
    const absensiSiswaList = siswaList.length === 0
      ? await db.absensiSiswa.findMany({
          where: { tahunPelajaran, semester, rombel },
          orderBy: { nama: "asc" },
        })
      : [];

    const students = siswaList.length > 0
      ? siswaList.map((s) => ({ id: s.id, nama: s.nama, nisn: s.nisn, rombel: s.rombel }))
      : absensiSiswaList.map((s) => ({ id: s.id, nama: s.nama, nisn: s.nisn, rombel: s.rombel }));

    // Fetch all catatan for this rombel
    const catatanList = await db.catatanSiswa.findMany({
      where: { tahunPelajaran, semester, rombel },
      orderBy: [{ siswaNama: "asc" }, { tanggal: "desc" }],
    });

    // Build maps for quick lookup
    const catatanById = new Map<string, typeof catatanList>();
    const catatanByName = new Map<string, typeof catatanList>();

    for (const c of catatanList) {
      // Map by siswaId
      if (!catatanById.has(c.siswaId)) {
        catatanById.set(c.siswaId, []);
      }
      catatanById.get(c.siswaId)!.push(c);

      // Also map by siswaNama for cross-table matching
      const nameKey = c.siswaNama.toLowerCase();
      if (!catatanByName.has(nameKey)) {
        catatanByName.set(nameKey, []);
      }
      catatanByName.get(nameKey)!.push(c);
    }

    // Build summary: all students, with their catatan (if any)
    const summary: {
      siswaId: string;
      siswaNama: string;
      nisn: string;
      rombel: string;
      catatan: { id: string; tanggal: string; kategori: string; catatan: string; tindakan: string; dibuatOleh: string; createdAt: string }[];
    }[] = [];

    for (const siswa of students) {
      // Try matching by ID first, then by name
      let records = catatanById.get(siswa.id);
      if (!records || records.length === 0) {
        records = catatanByName.get(siswa.nama.toLowerCase());
      }
      if (!records) records = [];

      summary.push({
        siswaId: siswa.id,
        siswaNama: siswa.nama,
        nisn: siswa.nisn || "",
        rombel: siswa.rombel,
        catatan: records.map((c) => ({
          id: c.id,
          tanggal: c.tanggal,
          kategori: c.kategori,
          catatan: c.catatan,
          tindakan: c.tindakan,
          dibuatOleh: c.dibuatOleh,
          createdAt: c.createdAt.toISOString(),
        })),
      });
    }

    // Also add any catatan students not in the student list (edge case)
    const existingStudentIds = new Set(students.map((s) => s.id));
    const existingStudentNames = new Set(students.map((s) => s.nama.toLowerCase()));

    for (const c of catatanList) {
      if (!existingStudentIds.has(c.siswaId) && !existingStudentNames.has(c.siswaNama.toLowerCase())) {
        // This student has catatan but is not in the student list — add them
        const exists = summary.find((s) => s.siswaId === c.siswaId || s.siswaNama.toLowerCase() === c.siswaNama.toLowerCase());
        if (!exists) {
          summary.push({
            siswaId: c.siswaId,
            siswaNama: c.siswaNama,
            nisn: c.nisn,
            rombel: c.rombel,
            catatan: [{
              id: c.id,
              tanggal: c.tanggal,
              kategori: c.kategori,
              catatan: c.catatan,
              tindakan: c.tindakan,
              dibuatOleh: c.dibuatOleh,
              createdAt: c.createdAt.toISOString(),
            }],
          });
        }
      }
    }

    // Sort by name
    summary.sort((a, b) => a.siswaNama.localeCompare(b.siswaNama));

    // Count per category
    const kategoriCount: Record<string, number> = {};
    for (const c of catatanList) {
      kategoriCount[c.kategori] = (kategoriCount[c.kategori] || 0) + 1;
    }

    // Count students with catatan
    const totalSiswaDenganCatatan = summary.filter((s) => s.catatan.length > 0).length;

    return NextResponse.json({
      rombel,
      tahunPelajaran,
      semester,
      tanggalCetak: new Date().toISOString(),
      totalCatatan: catatanList.length,
      totalSiswaDenganCatatan,
      totalSiswa: students.length,
      kategoriCount,
      summary,
    });
  } catch (error) {
    console.error("[LAPORAN CATATAN]", error);
    return NextResponse.json({ error: "Gagal memuat rekap catatan" }, { status: 500 });
  }
}
