import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#059669"/>
  <text x="50" y="68" font-size="48" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-weight="bold">S</text>
</svg>`;

export async function GET() {
  try {
    // 1. Check Pengaturan.logoSekolah (where the pengaturan page stores it)
    const logoSetting = await db.pengaturan.findUnique({
      where: { key: 'logoSekolah' },
    });
    if (logoSetting?.value && logoSetting.value.startsWith('data:')) {
      const [meta, base64] = logoSetting.value.split(',');
      const mime = meta.match(/data:([^;]+)/)?.[1] || 'image/png';
      const buffer = Buffer.from(base64, 'base64');
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': mime,
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          'Content-Length': buffer.length.toString(),
        },
      });
    }

    // 2. Check IdentitasSekolah.logo (secondary source)
    const sekolah = await db.identitasSekolah.findFirst();
    if (sekolah?.logo) {
      const logo = sekolah.logo;

      // Data URI (base64)
      if (logo.startsWith('data:')) {
        const [meta, base64] = logo.split(',');
        const mime = meta.match(/data:([^;]+)/)?.[1] || 'image/png';
        const buffer = Buffer.from(base64, 'base64');
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': mime,
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
            'Content-Length': buffer.length.toString(),
          },
        });
      }

      // File path (local dev only)
      if (!process.env.VERCEL) {
        const { readFile } = await import('fs/promises');
        const path = await import('path');
        const filePath = path.join(process.cwd(), 'public', logo);
        const buffer = await readFile(filePath);
        const ext = path.extname(logo).toLowerCase();
        let contentType = 'image/png';
        if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.svg') contentType = 'image/svg+xml';
        else if (ext === '.webp') contentType = 'image/webp';

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
            'Content-Length': buffer.length.toString(),
          },
        });
      }
    }
  } catch {
    // Fall through to fallback
  }

  return new NextResponse(FALLBACK_SVG, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache',
    },
  });
}
