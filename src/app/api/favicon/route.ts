import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const setting = await db.pengaturan.findUnique({
      where: { key: 'logoSekolah' },
    });

    if (!setting || !setting.value) {
      // Return a simple SVG fallback
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#059669"/><text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="28" font-weight="bold" fill="white">OS</text></svg>`;
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    const base64 = setting.value;
    const match = base64.match(/^data:(.+?);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: 'Invalid logo format' }, { status: 500 });
    }

    const mimeType = match[1];
    const buffer = Buffer.from(match[2], 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('GET /api/favicon error:', error);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#059669"/><text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="28" font-weight="bold" fill="white">OS</text></svg>`;
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
      },
    });
  }
}
