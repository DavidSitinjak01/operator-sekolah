import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { nis: { contains: search } },
        { tujuanSekolah: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      db.mutasiKeluar.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.mutasiKeluar.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memuat data mutasi keluar' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mutasi = await db.mutasiKeluar.create({ data: body });
    return NextResponse.json(mutasi, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menambah mutasi keluar';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });

    const mutasi = await db.mutasiKeluar.update({ where: { id }, data });
    return NextResponse.json(mutasi);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal mengupdate mutasi keluar';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });

    await db.mutasiKeluar.delete({ where: { id } });
    return NextResponse.json({ message: 'Mutasi keluar berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus mutasi keluar' }, { status: 400 });
  }
}