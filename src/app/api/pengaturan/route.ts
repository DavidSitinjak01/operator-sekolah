import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Default settings keys
const SETTINGS_KEYS = [
  'logoSekolah',
  'namaSekolah',
  'npsn',
  'alamat',
  'kabupaten',
  'provinsi',
  'kodePos',
  'kepalaSekolah',
  'nipKepsek',
  'akreditasi',
] as const;

type SettingKey = (typeof SETTINGS_KEYS)[number];

const DEFAULTS: Record<SettingKey, string> = {
  logoSekolah: '',
  namaSekolah: 'SMA NEGERI 1 GIDO',
  npsn: '10200955',
  alamat: 'Jl. Pelajar No. 1, Desa Bawodesolo, Kec. Gido',
  kabupaten: 'Kabupaten Nias',
  provinsi: 'Provinsi Sumatera Utara',
  kodePos: '22862',
  kepalaSekolah: 'Drs. YAFETI HIA, M.Pd',
  nipKepsek: '196805151993031007',
  akreditasi: 'A',
};

export async function GET() {
  try {
    const rows = await db.pengaturan.findMany({
      where: { key: { in: SETTINGS_KEYS } },
    });

    const map: Record<string, string> = {};
    for (const r of rows) {
      map[r.key] = r.value;
    }

    // Merge with defaults so frontend always gets complete data
    const result: Record<string, string> = {};
    for (const k of SETTINGS_KEYS) {
      result[k] = map[k] !== undefined && map[k] !== '' ? map[k] : DEFAULTS[k];
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/pengaturan error:', error);
    return NextResponse.json({ error: 'Gagal memuat pengaturan' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Build upsert operations
    const operations = Object.entries(body)
      .filter(([key]) => (SETTINGS_KEYS as readonly string[]).includes(key))
      .map(([key, value]) => {
        const strValue = typeof value === 'string' ? value : '';
        return db.pengaturan.upsert({
          where: { key },
          update: { value: strValue },
          create: { key, value: strValue },
        });
      });

    if (operations.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data yang valid' }, { status: 400 });
    }

    await db.$transaction(operations);

    return NextResponse.json({ success: true, message: 'Pengaturan berhasil disimpan' });
  } catch (error) {
    console.error('PUT /api/pengaturan error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan' }, { status: 500 });
  }
}