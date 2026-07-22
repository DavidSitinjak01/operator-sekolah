import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper to get authenticated session
async function getSession() {
  return getServerSession(authOptions);
}

const USER_SELECT = {
  id: true,
  username: true,
  name: true,
  role: true,
  active: true,
  createdAt: true,
} as const;

// GET /api/users — list all users (admin only)
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }
    const role = (session.user as Record<string, unknown>).role as string;
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const users = await db.user.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(users);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memuat';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/users — create user (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }
    const role = (session.user as Record<string, unknown>).role as string;
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await req.json();
    const { username, password, name, userRole } = body;

    if (!username || !password || !name) {
      return NextResponse.json({ error: 'Username, password, dan nama wajib diisi' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
    }

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: userRole || 'user',
        active: true,
      },
      select: USER_SELECT,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menambah user';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT /api/users — change password
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, oldPassword, newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
    }

    const currentUserRole = (session.user as Record<string, unknown>).role as string;
    const currentUserId = session.user.id;

    // Non-admin cannot change other users' passwords at all
    if (currentUserRole !== 'admin' && userId && userId !== currentUserId) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    // Admin changing another user's password — no old password needed
    if (currentUserRole === 'admin' && userId && userId !== currentUserId) {
      const target = await db.user.findUnique({ where: { id: userId } });
      if (!target) {
        return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
      }

      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return NextResponse.json({ message: 'Password berhasil diubah' });
    }

    // User changing own password — old password required
    if (!oldPassword) {
      return NextResponse.json({ error: 'Password lama wajib diisi' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: currentUserId } });
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const bcrypt = await import('bcryptjs');
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Password lama salah' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.user.update({
      where: { id: currentUserId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: 'Password berhasil diubah' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal mengubah password';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH /api/users — toggle active OR edit user (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }
    const role = (session.user as Record<string, unknown>).role as string;
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, action, name, editRole } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib diisi' }, { status: 400 });
    }

    // Prevent admin from modifying themselves
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Tidak dapat mengubah akun sendiri dari sini' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // ── Edit user (name, role) ──
    if (action === 'edit') {
      if (!name?.trim()) {
        return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
      }

      // If demoting the only admin, prevent
      if (user.role === 'admin' && editRole && editRole !== 'admin') {
        const adminCount = await db.user.count({ where: { role: 'admin', active: true } });
        if (adminCount <= 1) {
          return NextResponse.json({ error: 'Tidak dapat mengubah role admin terakhir' }, { status: 400 });
        }
      }

      const updated = await db.user.update({
        where: { id: userId },
        data: {
          name: name.trim(),
          ...(editRole !== undefined ? { role: editRole } : {}),
        },
        select: USER_SELECT,
      });

      return NextResponse.json(updated);
    }

    // ── Toggle active status ──
    if (user.active) {
      // Deactivating — check if this is the last admin
      if (user.role === 'admin') {
        const adminCount = await db.user.count({ where: { role: 'admin', active: true } });
        if (adminCount <= 1) {
          return NextResponse.json({ error: 'Tidak dapat menonaktifkan admin terakhir' }, { status: 400 });
        }
      }
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: { active: !user.active },
      select: USER_SELECT,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal mengubah data user';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/users — delete user (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }
    const role = (session.user as Record<string, unknown>).role as string;
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib diisi' }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun sendiri' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await db.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Tidak dapat menghapus admin terakhir' }, { status: 400 });
      }
    }

    await db.user.delete({ where: { id: userId } });

    return NextResponse.json({ message: 'User berhasil dihapus' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menghapus user';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}