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

    // ── Today's date in YYYY-MM-DD ──
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Run all queries in parallel
    const [
      totalSiswa,
      totalGuru,
      totalMutasiMasuk,
      totalMutasiKeluar,
      siswaPerRombel,
      genderDist,
      statusDist,
      recentMutasiMasuk,
      recentMutasiKeluar,
      siswaGroups,
      // ── Absensi queries ──
      absensiRombels,
      todayAbsensiAll,
      monthAbsensiAll,
      totalAbsensiRecords,
      rombelList,
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
      db.siswa.groupBy({
        by: ['jenisKelamin'],
        where: whereTP,
        _count: { id: true },
      }),
      db.siswa.groupBy({
        by: ['status'],
        where: whereTP,
        _count: { id: true },
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
      // ── Get distinct rombels that have absensi data ──
      db.absensi.groupBy({
        by: ['rombel'],
        where: { tahunPelajaran: tahunPelajaran || undefined, semester: semester || undefined },
        _count: { id: true },
        orderBy: { rombel: 'asc' },
      }),
      // ── Today's absensi summary across all rombels ──
      db.absensi.groupBy({
        by: ['kodeAbsensi'],
        where: {
          tahunPelajaran: tahunPelajaran || undefined,
          semester: semester || undefined,
          tanggal: todayStr,
        },
        _count: { id: true },
      }),
      // ── This month's absensi summary across all rombels ──
      db.absensi.groupBy({
        by: ['kodeAbsensi'],
        where: {
          tahunPelajaran: tahunPelajaran || undefined,
          semester: semester || undefined,
          tanggal: { startsWith: monthStr },
        },
        _count: { id: true },
      }),
      // ── Total absensi records for this TP/semester ──
      db.absensi.count({
        where: { tahunPelajaran: tahunPelajaran || undefined, semester: semester || undefined },
      }),
      // ── All rombels from AbsensiSiswa for dropdown ──
      db.absensiSiswa.groupBy({
        by: ['rombel'],
        where: { tahunPelajaran: tahunPelajaran || undefined, semester: semester || undefined },
        _count: { id: true },
        orderBy: { rombel: 'asc' },
      }),
    ]);

    // ── Build today's kehadiran summary ──
    const todaySummary = todayAbsensiAll.reduce((acc, g) => {
      acc[g.kodeAbsensi] = g._count.id;
      return acc;
    }, {} as Record<string, number>);

    // ── Build month kehadiran summary ──
    const monthSummary = monthAbsensiAll.reduce((acc, g) => {
      acc[g.kodeAbsensi] = g._count.id;
      return acc;
    }, {} as Record<string, number>);

    // ── Per-rombel attendance stats for today ──
    const perRombelStats = await Promise.all(
      rombelList.map(async (r) => {
        const rombelName = r.rombel;
        const [todayGroup, monthGroup, siswaCount] = await Promise.all([
          db.absensi.groupBy({
            by: ['kodeAbsensi'],
            where: {
              rombel: rombelName,
              tahunPelajaran: tahunPelajaran || undefined,
              semester: semester || undefined,
              tanggal: todayStr,
            },
            _count: { id: true },
          }),
          db.absensi.groupBy({
            by: ['kodeAbsensi'],
            where: {
              rombel: rombelName,
              tahunPelajaran: tahunPelajaran || undefined,
              semester: semester || undefined,
              tanggal: { startsWith: monthStr },
            },
            _count: { id: true },
          }),
          db.absensiSiswa.count({
            where: {
              rombel: rombelName,
              tahunPelajaran: tahunPelajaran || undefined,
              semester: semester || undefined,
            },
          }),
        ]);

        const todayMap: Record<string, number> = {};
        todayGroup.forEach((g) => { todayMap[g.kodeAbsensi] = g._count.id; });

        const monthMap: Record<string, number> = {};
        monthGroup.forEach((g) => { monthMap[g.kodeAbsensi] = g._count.id; });

        return {
          rombel: rombelName,
          totalSiswa: siswaCount,
          // Today
          todayHadir: todayMap['H'] || 0,
          todaySakit: todayMap['S'] || 0,
          todayIzin: todayMap['I'] || 0,
          todayAlpa: todayMap['A'] || 0,
          todayFilled: Object.values(todayMap).reduce((a, b) => a + b, 0),
          // Month
          monthHadir: monthMap['H'] || 0,
          monthSakit: monthMap['S'] || 0,
          monthIzin: monthMap['I'] || 0,
          monthAlpa: monthMap['A'] || 0,
          monthFilled: Object.values(monthMap).reduce((a, b) => a + b, 0),
        };
      })
    );

    return NextResponse.json({
      totalSiswa, totalGuru, totalMutasiMasuk, totalMutasiKeluar,
      genderDistribution: genderDist.map((g) => ({
        jenisKelamin: g.jenisKelamin || 'Tidak diisi',
        jumlah: g._count.id,
      })),
      statusDistribution: statusDist.map((s) => ({
        status: s.status || 'Tidak diisi',
        jumlah: s._count.id,
      })),
      siswaPerRombel: siswaPerRombel.map((s) => ({ kelas: s.rombel, jumlah: s._count.rombel })),
      recentMutasiMasuk, recentMutasiKeluar,
      tahunPelajaranOverview: siswaGroups.map((g) => ({
        tahunPelajaran: g.tahunPelajaran, semester: g.semester, jumlahSiswa: g._count.id,
      })),
      // ── Absensi enrichment ──
      tanggalHariIni: todayStr,
      bulanIni: monthStr,
      hariIni: {
        hadir: todaySummary['H'] || 0,
        sakit: todaySummary['S'] || 0,
        izin: todaySummary['I'] || 0,
        alpa: todaySummary['A'] || 0,
        total: Object.values(todaySummary).reduce((a, b) => a + b, 0),
        totalSiswa,
      },
      bulanIniSummary: {
        hadir: monthSummary['H'] || 0,
        sakit: monthSummary['S'] || 0,
        izin: monthSummary['I'] || 0,
        alpa: monthSummary['A'] || 0,
        total: Object.values(monthSummary).reduce((a, b) => a + b, 0),
      },
      totalAbsensiRecords,
      perRombelAbsensi: perRombelStats,
      totalRombelAbsensi: rombelList.length,
    });
  } catch (error) {
    console.error('[DASHBOARD]', error);
    return NextResponse.json({ error: 'Gagal memuat data dashboard' }, { status: 500 });
  }
}
