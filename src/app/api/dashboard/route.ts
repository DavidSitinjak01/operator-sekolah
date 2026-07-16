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

    const totalSiswa = await db.siswa.count({ where: whereTP });
    const totalGuru = await db.guru.count({ where: whereTP });
    const totalMutasiMasuk = await db.mutasiMasuk.count({ where: whereTP });
    const totalMutasiKeluar = await db.mutasiKeluar.count({ where: whereTP });

    const siswaPerRombel = await db.siswa.groupBy({
      by: ['rombel'],
      where: whereTP,
      _count: { rombel: true },
      orderBy: { rombel: 'asc' },
    });

    const recentMutasiMasuk = await db.mutasiMasuk.findMany({
      where: whereTP,
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentMutasiKeluar = await db.mutasiKeluar.findMany({
      where: whereTP,
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const siswaGroups = await db.siswa.groupBy({
      by: ['tahunPelajaran', 'semester'],
      _count: { id: true },
      orderBy: [{ tahunPelajaran: 'asc' }, { semester: 'asc' }],
    });

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