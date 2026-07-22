import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB (Vercel limit is ~4.5MB)

// Detect if running on Vercel (read-only filesystem)
const isVercel = !!process.env.VERCEL;

// Local dev: save to filesystem
async function saveFileLocal(
  file: File,
  prefix: string,
  defaultExt: string,
): Promise<string> {
  const { writeFile, mkdir } = await import('fs/promises');
  const path = await import('path');
  const dir = path.join(process.cwd(), 'public', 'upload', 'sekolah');
  try { await mkdir(dir, { recursive: true }); } catch { /* ok */ }
  const ext = path.extname(file.name) || defaultExt;
  const filename = `${prefix}_${Date.now()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);
  return `/upload/sekolah/${filename}`;
}

// Vercel / universal: save as base64 data URI in database
async function saveFileBase64(file: File): Promise<string> {
  const arrayBuf = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuf).toString('base64');
  const mime = file.type || 'application/octet-stream';
  return `data:${mime};base64,${base64}`;
}

async function handleFile(file: File, prefix: string, defaultExt: string): Promise<string> {
  if (isVercel) {
    return saveFileBase64(file);
  }
  return saveFileLocal(file, prefix, defaultExt);
}

// GET — fetch school identity (singleton row)
export async function GET() {
  try {
    let data = await db.identitasSekolah.findFirst();
    if (!data) {
      data = await db.identitasSekolah.create({ data: {} });
    }
    return NextResponse.json(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memuat';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT — update school identity + optional file uploads
export async function PUT(req: NextRequest) {
  try {
    const formData = await req.formData();
    const namaSekolah = (formData.get('namaSekolah') as string) || '';
    const npsn = (formData.get('npsn') as string) || '';
    const alamat = (formData.get('alamat') as string) || '';

    const logoFile = formData.get('logo') as File | null;
    const fotoFile = formData.get('fotoSekolah') as File | null;

    let logo = (formData.get('logoExisting') as string) || '';
    let fotoSekolah = (formData.get('fotoSekolahExisting') as string) || '';

    // Save logo
    if (logoFile && logoFile.size > 0) {
      if (logoFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Ukuran logo terlalu besar untuk diunggah. Gunakan file lebih kecil dari 4MB.` },
          { status: 400 },
        );
      }
      logo = await handleFile(logoFile, 'logo', '.png');
    }

    // Save foto sekolah
    if (fotoFile && fotoFile.size > 0) {
      if (fotoFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Ukuran foto terlalu besar untuk diunggah. Gunakan file lebih kecil dari 4MB.` },
          { status: 400 },
        );
      }
      fotoSekolah = await handleFile(fotoFile, 'foto', '.jpg');
    }

    let data = await db.identitasSekolah.findFirst();
    if (!data) {
      data = await db.identitasSekolah.create({
        data: { namaSekolah, npsn, alamat, logo, fotoSekolah },
      });
    } else {
      data = await db.identitasSekolah.update({
        where: { id: data.id },
        data: { namaSekolah, npsn, alamat, logo, fotoSekolah },
      });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menyimpan';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}