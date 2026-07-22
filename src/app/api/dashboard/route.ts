import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tahunPelajaran = searchParams.get('tahunPelajaran') || '';
    const semester = searchParams.get('semester') || '';

    const whereTP: Record<string, unknown> = {};
    if (tahunPelajaran) whereTP.tahunPelajaran = tahunPelajaran;
    if (semester) whereTP.semester = semester;

    // Run all queries in parallel for maximum speed
    const [
      totalSiswa,
      totalGuru,
      totalMutasiMasuk,
      totalMutasiKeluar,
      siswaPerRombel,
      recentMutasiMasuk,
      recentMutasiKeluar,
      siswaGroups,
    ] = await Promise.all([
      db.siswa.count({ where: whereTP }),
      db.guru.count({ where: whereTP }),
      db.mutasiMasuk.count({ where: whereTP }),
      db.mutasiKeluar.count({ where: whereTP }),
      db.siswa.groupBy({
        by: ['rombel'],
        where: whereTP,
        _count: { rombel: true },
        orderBy: { rombel: 'asc' },
      }),
      db.mutasiMasuk.findMany({
        where: whereTP,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, nama: true, nis: true, asalSekolah: true, tanggalMasuk: true },
      }),
      db.mutasiKeluar.findMany({
        where: whereTP,
        include: { siswa: { select: { nama: true, nipd: true, nisn: true, rombel: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      db.siswa.groupBy({
        by: ['tahunPelajaran', 'semester'],
        _count: { id: true },
        orderBy: [{ tahunPelajaran: 'asc' }, { semester: 'asc' }],
      }),
    ]);

    return NextResponse.json({
      totalSiswa, totalGuru, totalMutasiMasuk, totalMutasiKeluar,
      siswaPerRombel: siswaPerRombel.map((s) => ({ kelas: s.rombel, jumlah: s._count.rombel })),
      recentMutasiMasuk, recentMutasiKeluar,
      tahunPelajaranOverview: siswaGroups.map((g) => ({
        tahunPelajaran: g.tahunPelajaran, semester: g.semester, jumlahSiswa: g._count.id,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memuat data dashboard' }, { status: 500 });
  }
}
