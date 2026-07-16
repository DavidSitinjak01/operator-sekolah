import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const kelas = searchParams.get('kelas') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { nis: { contains: search } },
      ];
    }
    if (kelas) where.kelas = kelas;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      db.siswa.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.siswa.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memuat data siswa' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const siswa = await db.siswa.create({ data: body });
    return NextResponse.json(siswa, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menambah siswa';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });

    const siswa = await db.siswa.update({ where: { id }, data });
    return NextResponse.json(siswa);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal mengupdate siswa';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });

    await db.siswa.delete({ where: { id } });
    return NextResponse.json({ message: 'Siswa berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus siswa' }, { status: 400 });
  }
}