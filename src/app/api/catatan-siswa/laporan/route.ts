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

    // Fetch all students in this rombel
    const siswaList = await db.absensiSiswa.findMany({
      where: { tahunPelajaran, semester, rombel },
      orderBy: { nama: "asc" },
    });

    // Fetch all absensi records for this rombel
    const absensiRecords = await db.absensi.findMany({
      where: { tahunPelajaran, semester, rombel },
      orderBy: { tanggal: "asc" },
    });

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

    for (const siswa of siswaList) {
      const records = absensiRecords.filter((a) => a.siswaId === siswa.id);
      const H = records.filter((r) => r.kodeAbsensi === "H").length;
      const S = records.filter((r) => r.kodeAbsensi === "S").length;
      const I = records.filter((r) => r.kodeAbsensi === "I").length;
      const A = records.filter((r) => r.kodeAbsensi === "A").length;
      const totalHariEfektif = allDates.length;
      const persentase = totalHariEfektif > 0 ? Math.round((H / totalHariEfektif) * 100) : 0;

      summary.push({
        siswaId: siswa.id,
        siswaNama: siswa.nama,
        nisn: siswa.nisn,
        rombel: siswa.rombel,
        jenisKelamin: siswa.jenisKelamin,
        totalHariEfektif,
        H, S, I, A,
        persentase,
      });
    }

    // Class totals
    const totalSiswa = siswaList.length;
    const totalLaki = siswaList.filter((s) => s.jenisKelamin === "L").length;
    const totalPerempuan = siswaList.filter((s) => s.jenisKelamin === "P").length;
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
