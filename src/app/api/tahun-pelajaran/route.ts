import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await db.tahunPelajaran.findMany({
      orderBy: { tahunPelajaran: 'asc' },
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memuat data tahun pelajaran' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tahunPelajaran } = body;
    if (!tahunPelajaran?.trim()) {
      return NextResponse.json({ error: 'Tahun pelajaran wajib diisi' }, { status: 400 });
    }
    const existing = await db.tahunPelajaran.findUnique({ where: { tahunPelajaran: tahunPelajaran.trim() } });
    if (existing) {
      return NextResponse.json({ error: 'Tahun pelajaran sudah ada' }, { status: 409 });
    }
    const data = await db.tahunPelajaran.create({ data: { tahunPelajaran: tahunPelajaran.trim() } });
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menambah tahun pelajaran';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
    await db.tahunPelajaran.delete({ where: { id } });
    return NextResponse.json({ message: 'Tahun pelajaran berhasil dihapus' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghapus tahun pelajaran';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}