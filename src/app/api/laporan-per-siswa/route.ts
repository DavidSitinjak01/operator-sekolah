import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── GET: Data laporan per siswa (kehadiran + catatan) ──────────────────
// Query params: tahunPelajaran, semester, rombel, siswaId
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tahunPelajaran = searchParams.get("tahunPelajaran") || "2025/2026";
    const semester = searchParams.get("semester") || "Ganjil";
    const rombel = searchParams.get("rombel") || "";
    const siswaId = searchParams.get("siswaId") || "";

    if (!rombel || !siswaId) {
      return NextResponse.json({ error: "rombel dan siswaId wajib" }, { status: 400 });
    }

    // Fetch student info from Siswa table (primary)
    const siswa = await db.siswa.findFirst({
      where: { id: siswaId, tahunPelajaran, semester, rombel, status: "Aktif" },
      select: { id: true, nama: true, nisn: true, jenisKelamin: true, rombel: true, no: true },
    });

    // Fallback to AbsensiSiswa
    const absensiSiswa = !siswa
      ? await db.absensiSiswa.findFirst({
          where: { id: siswaId, tahunPelajaran, semester, rombel },
          select: { id: true, nama: true, nisn: true, jenisKelamin: true, rombel: true, no: true },
        })
      : null;

    const student = siswa || absensiSiswa;
    if (!student) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
    }

    // Fetch all absensi records for this rombel (to get unique dates for total)
    const allAbsensi = await db.absensi.findMany({
      where: { tahunPelajaran, semester, rombel },
      orderBy: { tanggal: "asc" },
    });

    // Fetch absensi records for this student (by ID and by name for cross-table compatibility)
    let studentRecords = allAbsensi.filter((a) => a.siswaId === siswaId);
    if (studentRecords.length === 0) {
      studentRecords = allAbsensi.filter(
        (a) => a.siswaNama.toLowerCase() === student.nama.toLowerCase()
      );
    }

    // Count kehadiran
    const H = studentRecords.filter((r) => r.kodeAbsensi === "H").length;
    const S = studentRecords.filter((r) => r.kodeAbsensi === "S").length;
    const I = studentRecords.filter((r) => r.kodeAbsensi === "I").length;
    const A = studentRecords.filter((r) => r.kodeAbsensi === "A").length;
    const allDates = [...new Set(allAbsensi.map((a) => a.tanggal))].sort();
    const totalHariEfektif = allDates.length;
    const persentase = totalHariEfektif > 0 ? Math.round((H / totalHariEfektif) * 100) : 0;

    // Detail per tanggal
    const detailAbsensi = studentRecords
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
      .map((r) => ({
        tanggal: r.tanggal,
        kodeAbsensi: r.kodeAbsensi,
        keterangan: r.kodeAbsensi === "H" ? "Hadir" : r.kodeAbsensi === "S" ? "Sakit" : r.kodeAbsensi === "I" ? "Izin" : r.kodeAbsensi === "A" ? "Alpa/Tidak Hadir" : r.kodeAbsensi,
      }));

    // Fetch catatan for this student
    let catatanList = await db.catatanSiswa.findMany({
      where: { tahunPelajaran, semester, siswaId, rombel },
      orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
    });

    // Cross-table fallback for catatan
    if (catatanList.length === 0) {
      catatanList = await db.catatanSiswa.findMany({
        where: { tahunPelajaran, semester, rombel, siswaNama: student.nama },
        orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
      });
    }

    const catatan = catatanList.map((c) => ({
      id: c.id,
      tanggal: c.tanggal,
      kategori: c.kategori,
      catatan: c.catatan,
      tindakan: c.tindakan,
      dibuatOleh: c.dibuatOleh,
    }));

    return NextResponse.json({
      siswa: {
        id: student.id,
        nama: student.nama,
        nisn: student.nisn || "",
        rombel: student.rombel,
        jenisKelamin: student.jenisKelamin || "",
        no: student.no || "",
      },
      kehadiran: { H, S, I, A, totalHariEfektif, persentase },
      detailAbsensi,
      catatan,
      tanggalCetak: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[LAPORAN PER SISWA]", error);
    return NextResponse.json({ error: "Gagal memuat data laporan siswa" }, { status: 500 });
  }
}
