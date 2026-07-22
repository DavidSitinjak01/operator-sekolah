import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    const existing = await db.user.findUnique({
      where: { username: 'admin' },
    });

    if (existing) {
      return NextResponse.json({ message: 'Admin already exists' });
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        nama: 'Administrator',
        role: 'admin',
        active: true,
      },
    });

    return NextResponse.json({ message: 'Default admin created' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal men-seed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}