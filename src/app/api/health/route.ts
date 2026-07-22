import { testDbConnection } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const isVercel = !!process.env.VERCEL;
  const hasDbUrl = !!process.env.DATABASE_URL;

  const dbTest = await testDbConnection();

  return NextResponse.json({
    status: dbTest.ok ? 'ok' : 'error',
    environment: isVercel ? 'vercel' : 'local',
    database: {
      connected: dbTest.ok,
      urlConfigured: hasDbUrl,
      error: dbTest.error || null,
    },
  });
}