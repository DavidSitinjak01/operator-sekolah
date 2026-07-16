import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tahunPelajaran = searchParams.get('tahunPelajaran') || '';
    const semester = searchParams.get('semester') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { nipd: { contains: search } },
        { nisn: { contains: search } },
        { tujuanSekolah: { contains: search } },
      ];
    }
    if (tahunPelajaran) where.tahunPelajaran = tahunPelajaran;
    if (semester) where.semester = semester;

    const [data, total] = await Promise.all([
      db.mutasiKeluar.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.mutasiKeluar.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memuat data mutasi keluar' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siswaId, ...rest } = body;

    // If siswaId is provided, fetch siswa data and auto-fill
    let dataToSave = { ...rest };
    if (siswaId) {
      const siswa = await db.siswa.findUnique({ where: { id: siswaId } });
      if (siswa) {
        dataToSave = {
          ...dataToSave,
          siswaId: siswa.id,
          nama: siswa.nama,
          nipd: siswa.nipd || '',
          nisn: siswa.nisn || '',
          nik: siswa.nik || '',
          jenisKelamin: siswa.jenisKelamin || '',
          tempatLahir: siswa.tempatLahir || '',
          tanggalLahir: siswa.tanggalLahir || '',
          agama: siswa.agama || '',
          alamat: siswa.alamat || '',
          hp: siswa.hp || '',
          namaAyah: siswa.namaAyah || '',
          namaIbu: siswa.namaIbu || '',
          rombel: siswa.rombel || '',
          sekolahAsal: siswa.sekolahAsal || '',
          kelas: siswa.rombel || dataToSave.kelas || '',
        };

        // Update siswa status to Mutasi Keluar
        await db.siswa.update({
          where: { id: siswaId },
          data: { status: 'Mutasi Keluar' },
        });
      }
    }

    const mutasi = await db.mutasiKeluar.create({ data: dataToSave });
    return NextResponse.json(mutasi, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menambah mutasi keluar';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, siswaId, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });

    // If siswaId is provided, fetch siswa data and auto-fill
    let dataToSave = { ...data };
    if (siswaId) {
      const siswa = await db.siswa.findUnique({ where: { id: siswaId } });
      if (siswa) {
        dataToSave = {
          ...dataToSave,
          siswaId: siswa.id,
          nama: siswa.nama,
          nipd: siswa.nipd || '',
          nisn: siswa.nisn || '',
          nik: siswa.nik || '',
          jenisKelamin: siswa.jenisKelamin || '',
          tempatLahir: siswa.tempatLahir || '',
          tanggalLahir: siswa.tanggalLahir || '',
          agama: siswa.agama || '',
          alamat: siswa.alamat || '',
          hp: siswa.hp || '',
          namaAyah: siswa.namaAyah || '',
          namaIbu: siswa.namaIbu || '',
          rombel: siswa.rombel || '',
          sekolahAsal: siswa.sekolahAsal || '',
          kelas: siswa.rombel || dataToSave.kelas || '',
        };
      }
    }

    const mutasi = await db.mutasiKeluar.update({ where: { id }, data: dataToSave });
    return NextResponse.json(mutasi);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal mengupdate mutasi keluar';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });

    // Get the mutasi record to find siswaId
    const mutasi = await db.mutasiKeluar.findUnique({ where: { id } });

    if (mutasi?.siswaId) {
      // Restore siswa status back to Aktif
      await db.siswa.update({
        where: { id: mutasi.siswaId },
        data: { status: 'Aktif' },
      });
    }

    await db.mutasiKeluar.delete({ where: { id } });
    return NextResponse.json({ message: 'Mutasi keluar berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus mutasi keluar' }, { status: 400 });
  }
}