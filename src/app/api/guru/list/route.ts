import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Lightweight endpoint — returns all guru (id, nama, no) without pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tahunPelajaran = searchParams.get('tahunPelajaran') || '';
    const semester = searchParams.get('semester') || '';

    const where: Record<string, unknown> = {};
    if (tahunPelajaran) where.tahunPelajaran = tahunPelajaran;
    if (semester) where.semester = semester;

    const guru = await db.guru.findMany({
      where,
      select: { id: true, nama: true, no: true },
      orderBy: { nama: 'asc' },
    });

    return NextResponse.json(guru);
  } catch (error) {
    return NextResponse.json([], { status: 200 });
  }
}
