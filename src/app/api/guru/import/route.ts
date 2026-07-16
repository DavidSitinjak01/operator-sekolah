import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// Column mapping from Excel header → DB field
const GURU_FIELD_MAP: Record<string, string> = {
  'no': 'no',
  'nama': 'nama',
  'nuptk': 'nuptk',
  'jenis kelamin': 'jenisKelamin',
  'tempat lahir': 'tempatLahir',
  'tanggal lahir': 'tanggalLahir',
  'nip': 'nip',
  'status kepegawaian': 'statusKepegawaian',
  'jenis ptk': 'jenisPTK',
  'agama': 'agama',
  'alamat': 'alamat',
  'hp': 'hp',
  'email': 'email',
  'tugas tambahan': 'tugasTambahan',
  'pangkat/golongan': 'pangkatGolongan',
  'pangkat golongan': 'pangkatGolongan',
  'sumber gaji': 'sumberGaji',
  'status perkawinan': 'statusPerkawinan',
  'kewarganegaraan': 'kewarganegaraan',
};

const REQUIRED_FIELDS = ['no', 'nama'];

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
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

    if (rows.length === 0) {
      return NextResponse.json({ error: 'File Excel kosong' }, { status: 400 });
    }

    // Get the actual headers from the first row
    const headers = Object.keys(rows[0]);

    // Build reverse mapping
    const headerToField: Record<string, string> = {};
    for (const header of headers) {
      const normalizedHeader = header.toString().toLowerCase().trim();
      const mappedField = GURU_FIELD_MAP[normalizedHeader];
      if (mappedField) {
        headerToField[header] = mappedField;
      }
    }

    // Check required fields
    const mappedFields = Object.values(headerToField);
    for (const req of REQUIRED_FIELDS) {
      if (!mappedFields.includes(req)) {
        return NextResponse.json({
          error: `Kolom "${req}" tidak ditemukan di file Excel. Pastikan kolom header sesuai.`,
        }, { status: 400 });
      }
    }

    // Transform rows
    const guruData = rows.map((row) => {
      const record: Record<string, string> = {
        tahunPelajaran,
        semester,
        status: 'Aktif',
      };

      for (const [excelHeader, dbField] of Object.entries(headerToField)) {
        const value = row[excelHeader];
        if (value !== undefined && value !== null) {
          record[dbField] = String(value).trim();
        } else {
          record[dbField] = '';
        }
      }

      if (!record.no && record.no !== '0') return null;
      if (!record.nama) return null;

      return record;
    }).filter(Boolean) as Record<string, string>[];

    // Bulk insert
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
      total: rows.length,
      errors,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal import data guru';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}