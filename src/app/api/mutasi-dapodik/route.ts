import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  try {
    // ── Auth check: only admin & operator can toggle ──────────────────────
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string })?.role || '';
    if (!session || (role !== 'admin' && role !== 'operator')) {
      return NextResponse.json({ error: 'Akses ditolak. Hanya admin dan operator yang dapat mengubah status Dapodik.' }, { status: 403 });
    }

    const body = await request.json();
    const { type, id, statusDapodik } = body;

    if (!type || !id || typeof statusDapodik !== 'boolean') {
      return NextResponse.json({ error: 'Parameter tidak lengkap' }, { status: 400 });
    }

    if (type === 'masuk') {
      const updated = await db.mutasiMasuk.update({
        where: { id },
        data: { statusDapodik },
      });
      return NextResponse.json({ id: updated.id, statusDapodik: updated.statusDapodik });
    }

    if (type === 'keluar') {
      const updated = await db.mutasiKeluar.update({
        where: { id },
        data: { statusDapodik },
      });
      return NextResponse.json({ id: updated.id, statusDapodik: updated.statusDapodik });
    }

    return NextResponse.json({ error: 'Tipe tidak valid. Gunakan "masuk" atau "keluar".' }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal mengubah status Dapodik';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}