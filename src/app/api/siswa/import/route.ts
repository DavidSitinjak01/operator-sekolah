import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// Handle Dapodik-format Excel: rows 0-3 are metadata, row 4 is header, row 5 is sub-header, data starts row 6
// Columns are index-based because of merged cells

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const tahunPelajaran = formData.get('tahunPelajaran') as string || '2025/2026';
    const semester = formData.get('semester') as string || 'Ganjil';

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return NextResponse.json({ error: 'Format file harus .xlsx, .xls, atau .csv' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, { header: 1, defval: '' });

    // Detect if Dapodik format (has merged header rows) or simple format
    const isDapodik = rawData.length > 5 && typeof rawData[0][0] === 'string' &&
      (rawData[0][0].includes('Peserta Didik') || rawData[0][0].includes('Daftar'));

    const s = (v: unknown) => String(v ?? '').trim();

    const siswaData: Record<string, string>[] = [];

    if (isDapodik) {
      // Dapodik format: data starts at row 6
      for (let i = 6; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || !row[0] || !s(row[1])) continue;

        siswaData.push({
          no: s(row[0]),
          nama: s(row[1]),
          nipd: s(row[2]),
          jenisKelamin: s(row[3]),
          nisn: s(row[4]),
          tempatLahir: s(row[5]),
          tanggalLahir: s(row[6]),
          nik: s(row[7]),
          agama: s(row[8]),
          alamat: s(row[9]),
          rt: s(row[10]),
          rw: s(row[11]),
          dusun: s(row[12]),
          kelurahan: s(row[13]),
          kecamatan: s(row[14]),
          kodePos: s(row[15]),
          jenisTinggal: s(row[16]),
          alatTransportasi: s(row[17]),
          telepon: s(row[18]),
          hp: s(row[19]),
          email: s(row[20]),
          skhun: s(row[21]),
          penerimaKPS: s(row[22]),
          noKPS: s(row[23]),
          namaAyah: s(row[24]),
          ayahTahunLahir: s(row[25]),
          ayahJenjangPendidikan: s(row[26]),
          ayahPekerjaan: s(row[27]),
          ayahPenghasilan: s(row[28]),
          ayahNik: s(row[29]),
          namaIbu: s(row[30]),
          ibuTahunLahir: s(row[31]),
          ibuJenjangPendidikan: s(row[32]),
          ibuPekerjaan: s(row[33]),
          ibuPenghasilan: s(row[34]),
          ibuNik: s(row[35]),
          namaWali: s(row[36]),
          waliTahunLahir: s(row[37]),
          waliJenjangPendidikan: s(row[38]),
          waliPekerjaan: s(row[39]),
          waliPenghasilan: s(row[40]),
          waliNik: s(row[41]),
          rombel: s(row[42]),
          noPesertaUN: s(row[43]),
          noSeriIjazah: s(row[44]),
          penerimaKIP: s(row[45]),
          nomorKIP: s(row[46]),
          namaKIP: s(row[47]),
          nomorKKS: s(row[48]),
          noRegAktaLahir: s(row[49]),
          bank: s(row[50]),
          nomorRekeningBank: s(row[51]),
          rekeningAtasNama: s(row[52]),
          layakPIP: s(row[53]),
          alasanLayakPIP: s(row[54]),
          kebutuhanKhusus: s(row[55]),
          sekolahAsal: s(row[56]),
          anakKeBerapa: s(row[57]),
          lintang: s(row[58]),
          bujur: s(row[59]),
          noKK: s(row[60]),
          beratBadan: s(row[61]),
          tinggiBadan: s(row[62]),
          lingkarKepala: s(row[63]),
          jmlSaudaraKandung: s(row[64]),
          jarakRumahKeSekolah: s(row[65]),
          tahunPelajaran,
          semester,
          status: 'Aktif',
        });
      }
    } else {
      // Simple format: first row is header, data starts at row 1
      const fieldMap: Record<string, string> = {
        'no': 'no', 'nama': 'nama', 'nipd': 'nipd', 'jenis kelamin': 'jenisKelamin',
        'jk': 'jenisKelamin', 'nisn': 'nisn', 'tempat lahir': 'tempatLahir',
        'tanggal lahir': 'tanggalLahir', 'nik': 'nik', 'agama': 'agama',
        'alamat': 'alamat', 'hp': 'hp', 'email': 'email', 'rombel': 'rombel',
        'rombel saat ini': 'rombel', 'kebutuhan khusus': 'kebutuhanKhusus',
        'sekolah asal': 'sekolahAsal', 'nama ayah': 'namaAyah', 'nama ibu': 'namaIbu',
        'nama wali': 'namaWali', 'telepon': 'telepon', 'rt': 'rt', 'rw': 'rw',
        'dusun': 'dusun', 'kelurahan': 'kelurahan', 'kecamatan': 'kecamatan',
        'kode pos': 'kodePos', 'jenis tinggal': 'jenisTinggal',
        'alat transportasi': 'alatTransportasi', 'skhun': 'skhun',
        'penerima kps': 'penerimaKPS', 'no. kps': 'noKPS', 'no kps': 'noKPS',
      };

      const headers = Object.keys(rawData[0] as Record<string, unknown>);
      const headerToField: Record<string, string> = {};
      for (const h of headers) {
        const mapped = fieldMap[h.toLowerCase().trim()];
        if (mapped) headerToField[h] = mapped;
      }

      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i] as (string | number)[];
        if (!row[0] || !s(row[1])) continue;

        const record: Record<string, string> = { tahunPelajaran, semester, status: 'Aktif' };
        for (let j = 0; j < headers.length; j++) {
          const field = headerToField[headers[j]];
          if (field) record[field] = s(row[j]);
        }
        record.no = s(row[0]);
        record.nama = s(row[1]);
        siswaData.push(record);
      }
    }

    if (siswaData.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data siswa yang dapat dibaca dari file.' }, { status: 400 });
    }

    // Bulk insert
    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < siswaData.length; i++) {
      try {
        await db.siswa.create({ data: siswaData[i] });
        inserted++;
      } catch {
        skipped++;
        errors.push(`Baris ${i + 2}: Gagal menyimpan`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import berhasil: ${inserted} data siswa diimport${skipped > 0 ? `, ${skipped} gagal` : ''}.`,
      inserted,
      skipped,
      total: siswaData.length,
      errors,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal import data siswa';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}