import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const totalSiswa = await db.siswa.count();
    const totalGuru = await db.guru.count();
    const totalMutasiMasuk = await db.mutasiMasuk.count();
    const totalMutasiKeluar = await db.mutasiKeluar.count();

    const siswaPerKelas = await db.siswa.groupBy({
      by: ['kelas'],
      _count: { kelas: true },
      orderBy: { kelas: 'asc' },
    });

    const siswaAktif = await db.siswa.count({ where: { status: 'Aktif' } });
    const siswaNonaktif = await db.siswa.count({ where: { status: 'Nonaktif' } });
    const guruAktif = await db.guru.count({ where: { status: 'Aktif' } });
    const guruNonaktif = await db.guru.count({ where: { status: 'Nonaktif' } });

    const mutasiMasukPerBulan = await db.mutasiMasuk.findMany({
      select: { tanggalMasuk: true },
      orderBy: { tanggalMasuk: 'asc' },
    });

    const mutasiKeluarPerBulan = await db.mutasiKeluar.findMany({
      select: { tanggalKeluar: true },
      orderBy: { tanggalKeluar: 'asc' },
    });

    const recentMutasiMasuk = await db.mutasiMasuk.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentMutasiKeluar = await db.mutasiKeluar.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
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
      mutasiMasukPerBulan,
      mutasiKeluarPerBulan,
      recentMutasiMasuk,
      recentMutasiKeluar,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memuat data dashboard' }, { status: 500 });
  }
}