import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

// ── Role options ──
export const USER_ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'operator', label: 'Operator' },
  { value: 'kesiswaan', label: 'Kesiswaan' },
  { value: 'kurikulum', label: 'Kurikulum' },
  { value: 'kepala_sekolah', label: 'Kepala Sekolah' },
  { value: 'tata_usaha', label: 'Tata Usaha' },
  { value: 'perpustakaan', label: 'Perpustakaan' },
  { value: 'bk', label: 'Bimbingan Konseling' },
] as const;

export async function GET() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('GET /api/user error:', error);
    return NextResponse.json({ error: 'Gagal memuat data user' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, nama, role } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({ error: 'Username minimal 3 karakter' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    // Check uniqueness
    const existing = await db.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);

    const user = await db.user.create({
      data: {
        username,
        password: hashedPassword,
        nama: nama || '',
        role: role || 'operator',
        active: true,
      },
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('POST /api/user error:', error);
    return NextResponse.json({ error: 'Gagal menambah user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, username, nama, role, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (nama !== undefined) updateData.nama = nama;
    if (role !== undefined) updateData.role = role;
    if (active !== undefined) updateData.active = active;
    if (username !== undefined) {
      if (username.length < 3) {
        return NextResponse.json({ error: 'Username minimal 3 karakter' }, { status: 400 });
      }
      // Check uniqueness
      const existing = await db.user.findFirst({ where: { username, NOT: { id } } });
      if (existing) {
        return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
      }
      updateData.username = username;
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('PUT /api/user error:', error);
    return NextResponse.json({ error: 'Gagal mengupdate user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
    }

    await db.user.delete({ where: { id } });
    return NextResponse.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    console.error('DELETE /api/user error:', error);
    return NextResponse.json({ error: 'Gagal menghapus user' }, { status: 500 });
  }
}