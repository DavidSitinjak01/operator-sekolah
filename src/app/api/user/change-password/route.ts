import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { compare, hash } from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, oldPassword, newPassword, confirmNewPassword } = body;

    if (!userId || !oldPassword || !newPassword || !confirmNewPassword) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
    }

    if (newPassword !== confirmNewPassword) {
      return NextResponse.json({ error: 'Konfirmasi password tidak cocok' }, { status: 400 });
    }

    // Find user
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Verify old password
    const isOldPasswordValid = await compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return NextResponse.json({ error: 'Password lama salah' }, { status: 401 });
    }

    // Hash and update new password
    const hashedPassword = await hash(newPassword, 10);
    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('POST /api/user/change-password error:', error);
    return NextResponse.json({ error: 'Gagal mengubah password' }, { status: 500 });
  }
}