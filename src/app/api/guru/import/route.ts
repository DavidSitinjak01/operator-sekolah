import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// Handle Dapodik-format Excel: rows 0-3 are metadata, row 4 is header, data starts row 5
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

    const isDapodik = rawData.length > 4 && typeof rawData[0][0] === 'string' &&
      (rawData[0][0].includes('Daftar Guru') || rawData[0][0].includes('Daftar'));

    const s = (v: unknown) => String(v ?? '').trim();

    const guruData: Record<string, string>[] = [];

    if (isDapodik) {
      // Dapodik format: data starts at row 5
      for (let i = 5; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || !row[0] || !s(row[1])) continue;

        guruData.push({
          no: s(row[0]),
          nama: s(row[1]),
          nuptk: s(row[2]),
          jenisKelamin: s(row[3]),
          tempatLahir: s(row[4]),
          tanggalLahir: s(row[5]),
          nip: s(row[6]),
          statusKepegawaian: s(row[7]),
          jenisPTK: s(row[8]),
          agama: s(row[9]),
          alamat: s(row[10]),
          rt: s(row[11]),
          rw: s(row[12]),
          namaDusun: s(row[13]),
          desaKelurahan: s(row[14]),
          kecamatan: s(row[15]),
          kodePos: s(row[16]),
          telepon: s(row[17]),
          hp: s(row[18]),
          email: s(row[19]),
          tugasTambahan: s(row[20]),
          skCPNS: s(row[21]),
          tanggalCPNS: s(row[22]),
          skPengangkatan: s(row[23]),
          tmtPengangkatan: s(row[24]),
          lembagaPengangkatan: s(row[25]),
          pangkatGolongan: s(row[26]),
          sumberGaji: s(row[27]),
          namaIbuKandung: s(row[28]),
          statusPerkawinan: s(row[29]),
          namaSuamiIstri: s(row[30]),
          nipSuamiIstri: s(row[31]),
          pekerjaanSuamiIstri: s(row[32]),
          tmtPNS: s(row[33]),
          sudahLisensiKepsek: s(row[34]),
          pernahDiklatKepengawasan: s(row[35]),
          keahlianBraille: s(row[36]),
          keahlianBahasaIsyarat: s(row[37]),
          npwp: s(row[38]),
          namaWajibPajak: s(row[39]),
          kewarganegaraan: s(row[40]),
          bank: s(row[41]),
          nomorRekeningBank: s(row[42]),
          rekeningAtasNama: s(row[43]),
          nik: s(row[44]),
          noKK: s(row[45]),
          karpeg: s(row[46]),
          karisKarsu: s(row[47]),
          lintang: s(row[48]),
          bujur: s(row[49]),
          nuks: s(row[50]),
          tahunPelajaran,
          semester,
          status: 'Aktif',
        });
      }
    } else {
      // Simple format fallback
      const fieldMap: Record<string, string> = {
        'no': 'no', 'nama': 'nama', 'nuptk': 'nuptk', 'jenis kelamin': 'jenisKelamin',
        'jk': 'jenisKelamin', 'tempat lahir': 'tempatLahir', 'tanggal lahir': 'tanggalLahir',
        'nip': 'nip', 'status kepegawaian': 'statusKepegawaian', 'jenis ptk': 'jenisPTK',
        'agama': 'agama', 'alamat': 'alamat', 'alamat jalan': 'alamat',
        'hp': 'hp', 'email': 'email', 'tugas tambahan': 'tugasTambahan',
        'pangkat/golongan': 'pangkatGolongan', 'pangkat golongan': 'pangkatGolongan',
        'sumber gaji': 'sumberGaji', 'status perkawinan': 'statusPerkawinan',
        'kewarganegaraan': 'kewarganegaraan', 'telepon': 'telepon',
        'nama ibu kandung': 'namaIbuKandung', 'rt': 'rt', 'rw': 'rw',
        'nama dusun': 'namaDusun', 'desa/kelurahan': 'desaKelurahan',
        'kecamatan': 'kecamatan', 'kode pos': 'kodePos', 'nik': 'nik',
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
        guruData.push(record);
      }
    }

    if (guruData.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data guru yang dapat dibaca dari file.' }, { status: 400 });
    }

    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < guruData.length; i++) {
      try {
        await db.guru.create({ data: guruData[i] });
        inserted++;
      } catch {
        skipped++;
        errors.push(`Baris ${i + 2}: Gagal menyimpan`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import berhasil: ${inserted} data guru diimport${skipped > 0 ? `, ${skipped} gagal` : ''}.`,
      inserted,
      skipped,
      total: guruData.length,
      errors,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal import data guru';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}