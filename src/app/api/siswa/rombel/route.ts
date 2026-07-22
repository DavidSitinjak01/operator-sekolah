import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Lightweight endpoint — only returns distinct rombel values (no full siswa data)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tahunPelajaran = searchParams.get('tahunPelajaran') || '';
    const semester = searchParams.get('semester') || '';

    const where: Record<string, unknown> = {};
    if (tahunPelajaran) where.tahunPelajaran = tahunPelajaran;
    if (semester) where.semester = semester;

    const rows = await db.siswa.groupBy({
      by: ['rombel'],
      where: { ...where, rombel: { not: '' } },
      _count: { rombel: true },
      orderBy: { rombel: 'asc' },
    });

    return NextResponse.json(rows.map((r) => r.rombel));
  } catch (error) {
    return NextResponse.json([], { status: 200 });
  }
}
