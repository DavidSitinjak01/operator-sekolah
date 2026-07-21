import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tahunPelajaran = searchParams.get('tahunPelajaran') || '';
    const semester = searchParams.get('semester') || '';
    const rombel = searchParams.get('rombel') || '';

    const where: Record<string, unknown> = { status: 'Aktif' };

    if (tahunPelajaran) where.tahunPelajaran = tahunPelajaran;
    if (semester) where.semester = semester;
    if (rombel) where.rombel = rombel;

    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { nipd: { contains: search } },
        { nisn: { contains: search } },
        { nik: { contains: search } },
      ];
    }

    const data = await db.siswa.findMany({
      where,
      orderBy: [{ rombel: 'asc' }, { no: 'asc' }],
      take: 100,
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memuat data siswa';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}