import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── GET: Rekap kehadiran per siswa untuk cetak laporan ──────────────────
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

    // Fetch all students in this rombel from Siswa table (primary data source)
    const siswaList = await db.siswa.findMany({
      where: { tahunPelajaran, semester, rombel, status: "Aktif" },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true, nisn: true, jenisKelamin: true, rombel: true },
    });

    // Also try from AbsensiSiswa as fallback (in case students are only there)
    const absensiSiswaList = siswaList.length === 0
      ? await db.absensiSiswa.findMany({
          where: { tahunPelajaran, semester, rombel },
          orderBy: { nama: "asc" },
        })
      : [];

    // Use whichever has data
    const students = siswaList.length > 0
      ? siswaList.map((s) => ({ id: s.id, nama: s.nama, nisn: s.nisn, jenisKelamin: s.jenisKelamin, rombel: s.rombel }))
      : absensiSiswaList.map((s) => ({ id: s.id, nama: s.nama, nisn: s.nisn, jenisKelamin: s.jenisKelamin, rombel: s.rombel }));

    // Collect all student IDs and names for matching
    const studentIds = new Set(students.map((s) => s.id));
    const studentNames = new Map(students.map((s) => [s.nama.toLowerCase(), s]));

    // Fetch all absensi records for this rombel
    const absensiRecords = await db.absensi.findMany({
      where: { tahunPelajaran, semester, rombel },
      orderBy: { tanggal: "asc" },
    });

    // Build a map of siswaId -> records (using ID match)
    const absensiById = new Map<string, typeof absensiRecords>();
    // Build a map of nama -> records (using name match as fallback)
    const absensiByName = new Map<string, typeof absensiRecords>();

    for (const record of absensiRecords) {
      // Map by siswaId
      if (!absensiById.has(record.siswaId)) {
        absensiById.set(record.siswaId, []);
      }
      absensiById.get(record.siswaId)!.push(record);

      // Also map by siswaNama for cross-table matching
      const nameKey = record.siswaNama.toLowerCase();
      if (!absensiByName.has(nameKey)) {
        absensiByName.set(nameKey, []);
      }
      absensiByName.get(nameKey)!.push(record);
    }

    // Get unique dates sorted
    const allDates = [...new Set(absensiRecords.map((a) => a.tanggal))].sort();

    // Build summary per siswa
    const summary: {
      siswaId: string;
      siswaNama: string;
      nisn: string;
      rombel: string;
      jenisKelamin: string;
      totalHariEfektif: number;
      H: number;
      S: number;
      I: number;
      A: number;
      persentase: number;
    }[] = [];

    for (const siswa of students) {
      // Try matching by ID first, then by name
      let records = absensiById.get(siswa.id);
      if (!records || records.length === 0) {
        records = absensiByName.get(siswa.nama.toLowerCase());
      }
      if (!records) records = [];

      const H = records.filter((r) => r.kodeAbsensi === "H").length;
      const S = records.filter((r) => r.kodeAbsensi === "S").length;
      const I = records.filter((r) => r.kodeAbsensi === "I").length;
      const A = records.filter((r) => r.kodeAbsensi === "A").length;
      const totalHariEfektif = allDates.length;
      const persentase = totalHariEfektif > 0 ? Math.round((H / totalHariEfektif) * 100) : 0;

      summary.push({
        siswaId: siswa.id,
        siswaNama: siswa.nama,
        nisn: siswa.nisn || "",
        rombel: siswa.rombel,
        jenisKelamin: siswa.jenisKelamin || "",
        totalHariEfektif,
        H, S, I, A,
        persentase,
      });
    }

    // Class totals
    const totalSiswa = students.length;
    const totalLaki = students.filter((s) => s.jenisKelamin === "L").length;
    const totalPerempuan = students.filter((s) => s.jenisKelamin === "P").length;
    const avgPersentase = totalSiswa > 0
      ? Math.round(summary.reduce((a, b) => a + b.persentase, 0) / totalSiswa)
      : 0;

    return NextResponse.json({
      rombel,
      tahunPelajaran,
      semester,
      tanggalCetak: new Date().toISOString(),
      totalHariEfektif: allDates.length,
      totalSiswa,
      totalLaki,
      totalPerempuan,
      avgPersentase,
      summary,
    });
  } catch (error) {
    console.error("[LAPORAN KEHADIRAN]", error);
    return NextResponse.json({ error: "Gagal memuat rekap kehadiran" }, { status: 500 });
  }
}
