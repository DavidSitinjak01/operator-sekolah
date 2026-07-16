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

    const siswaPerKelas = await db.siswa.groupBy({
      by: ['kelas'],
      where: whereTP,
      _count: { kelas: true },
      orderBy: { kelas: 'asc' },
    });

    const siswaAktif = await db.siswa.count({ where: { ...whereTP, status: 'Aktif' } });
    const siswaNonaktif = await db.siswa.count({ where: { ...whereTP, status: 'Nonaktif' } });
    const guruAktif = await db.guru.count({ where: { ...whereTP, status: 'Aktif' } });
    const guruNonaktif = await db.guru.count({ where: { ...whereTP, status: 'Nonaktif' } });

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

    // Get all unique tahun pelajaran and semester combinations for the overview
    const siswaGroups = await db.siswa.groupBy({
      by: ['tahunPelajaran', 'semester'],
      _count: { id: true },
      orderBy: [{ tahunPelajaran: 'asc' }, { semester: 'asc' }],
    });

    return NextResponse.json({
      totalSiswa,
      totalGuru,
      totalMutasiMasuk,
      totalMutasiKeluar,
      siswaAktif,
      siswaNonaktif,
      guruAktif,
      guruNonaktif,
      siswaPerKelas: siswaPerKelas.map((s) => ({ kelas: s.kelas, jumlah: s._count.kelas })),
      recentMutasiMasuk,
      recentMutasiKeluar,
      tahunPelajaranOverview: siswaGroups.map((g) => ({
        tahunPelajaran: g.tahunPelajaran,
        semester: g.semester,
        jumlahSiswa: g._count.id,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memuat data dashboard' }, { status: 500 });
  }
}