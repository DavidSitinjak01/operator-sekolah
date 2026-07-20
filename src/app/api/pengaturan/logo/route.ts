import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('logo') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File logo tidak ditemukan' }, { status: 400 });
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.' },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Ukuran file maksimal 5MB. File Anda ${(file.size / 1024 / 1024).toFixed(1)}MB.` },
        { status: 400 }
      );
    }

    // Convert to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Save to pengaturan
    await db.pengaturan.upsert({
      where: { key: 'logoSekolah' },
      update: { value: base64 },
      create: { key: 'logoSekolah', value: base64 },
    });

    return NextResponse.json({
      success: true,
      message: 'Logo berhasil diupload',
      logoUrl: base64,
    });
  } catch (error) {
    console.error('POST /api/pengaturan/logo error:', error);
    return NextResponse.json({ error: 'Gagal mengupload logo' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await db.pengaturan.upsert({
      where: { key: 'logoSekolah' },
      update: { value: '' },
      create: { key: 'logoSekolah', value: '' },
    });

    return NextResponse.json({ success: true, message: 'Logo berhasil dihapus' });
  } catch (error) {
    console.error('DELETE /api/pengaturan/logo error:', error);
    return NextResponse.json({ error: 'Gagal menghapus logo' }, { status: 500 });
  }
}