import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// ── GET: List with joined siswa data ─────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tahunPelajaran = searchParams.get('tahunPelajaran') || '';
    const semester = searchParams.get('semester') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: Record<string, unknown> = {};
    if (tahunPelajaran) where.tahunPelajaran = tahunPelajaran;
    if (semester) where.semester = semester;

    // Search across siswa fields via the relation
    if (search) {
      where.siswa = {
        OR: [
          { nama: { contains: search } },
          { nipd: { contains: search } },
          { nisn: { contains: search } },
          { nik: { contains: search } },
        ],
      };
    }

    const [records, total] = await Promise.all([
      db.mutasiKeluar.findMany({
        where,
        include: {
          siswa: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.mutasiKeluar.count({ where }),
    ]);

    // Flatten: merge siswa data into each record
    const data = records.map((r) => ({
      id: r.id,
      siswaId: r.siswaId,
      tujuanSekolah: r.tujuanSekolah,
      tanggalKeluar: r.tanggalKeluar,
      alasan: r.alasan,
      noSurat: r.noSurat,
      statusDapodik: r.statusDapodik,
      tahunPelajaran: r.tahunPelajaran,
      semester: r.semester,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      // Joined siswa fields
      siswa: r.siswa,
    }));

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memuat data mutasi keluar' }, { status: 500 });
  }
}

// ── POST: Create ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siswaId, tujuanSekolah, tanggalKeluar, alasan, noSurat, tahunPelajaran, semester } = body;

    if (!siswaId) {
      return NextResponse.json({ error: 'Siswa wajib dipilih' }, { status: 400 });
    }

    // Verify siswa exists
    const siswa = await db.siswa.findUnique({ where: { id: siswaId } });
    if (!siswa) {
      return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 });
    }

    // Check for duplicate
    const existing = await db.mutasiKeluar.findFirst({
      where: { siswaId, tahunPelajaran: tahunPelajaran || '2025/2026', semester: semester || 'Ganjil' },
    });
    if (existing) {
      return NextResponse.json({ error: 'Siswa ini sudah tercatat mutasi keluar di tahun pelajaran dan semester ini' }, { status: 409 });
    }

    const mutasi = await db.mutasiKeluar.create({
      data: { siswaId, tujuanSekolah, tanggalKeluar, alasan, noSurat, tahunPelajaran, semester },
      include: { siswa: true },
    });

    // Update siswa status
    await db.siswa.update({
      where: { id: siswaId },
      data: { status: 'Mutasi Keluar' },
    });

    return NextResponse.json(mutasi, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menambah mutasi keluar';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

// ── PUT: Update ──────────────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });

    const mutasi = await db.mutasiKeluar.update({
      where: { id },
      data,
      include: { siswa: true },
    });
    return NextResponse.json(mutasi);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal mengupdate mutasi keluar';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

// ── DELETE: Delete & restore siswa status ────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });

    const mutasi = await db.mutasiKeluar.findUnique({ where: { id } });
    if (!mutasi) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });

    await db.mutasiKeluar.delete({ where: { id } });

    // Restore siswa status to Aktif
    await db.siswa.update({
      where: { id: mutasi.siswaId },
      data: { status: 'Aktif' },
    });

    return NextResponse.json({ message: 'Mutasi keluar berhasil dihapus. Status siswa dikembalikan ke Aktif.' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus mutasi keluar' }, { status: 400 });
  }
}