import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const isVercel = !!process.env.VERCEL;
  const hasDbUrl = !!process.env.DATABASE_URL;

  let ok = false;
  let error: string | null = null;

  try {
    await db.$queryRaw`SELECT 1`;
    ok = true;
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : 'Database connection failed';
  }

  return NextResponse.json({
    status: ok ? 'ok' : 'error',
    environment: isVercel ? 'vercel' : 'local',
    database: {
      connected: ok,
      urlConfigured: hasDbUrl,
      error: error,
    },
  });
}
