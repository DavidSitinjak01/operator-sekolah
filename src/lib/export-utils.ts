import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

interface ExportOptions {
  title: string;
  subtitle?: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  filename: string;
  orientation?: 'portrait' | 'landscape';
}

// ─── Excel Export ─────────────────────────────────────────────────────────────

export function exportToExcel({ title, subtitle, columns, data, filename }: ExportOptions) {
  const headers = columns.map((c) => c.header);

  // Filter data to only include keys that are in columns
  const rows = data.map((row) => columns.map((c) => {
    const val = row[c.key];
    return val ?? '';
  }));

  // Create worksheet with title rows
  const wsData: (string | number)[][] = [];
  if (subtitle) {
    wsData.push([subtitle]);
  }
  wsData.push([title]);
  wsData.push([]); // blank row
  wsData.push(headers);
  rows.forEach((row) => wsData.push(row));

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Merge title cells
  const colCount = columns.length;
  ws['!merges'] = [];
  if (subtitle) {
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } });
    ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } });
  } else {
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } });
  }

  // Set column widths
  ws['!cols'] = columns.map((c) => ({ wch: c.width || 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 31));

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

export function exportToPDF({ title, subtitle, columns, data, filename, orientation = 'landscape' }: ExportOptions) {
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  let yPos = 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, yPos, { align: 'center' });

  if (subtitle) {
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, pageWidth / 2, yPos, { align: 'center' });
  }

  yPos += 4;
  // Timestamp
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const now = new Date().toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  doc.text(`Dicetak: ${now}`, pageWidth - 14, yPos, { align: 'right' });

  // Table data
  const headers = columns.map((c) => c.header);
  const rows = data.map((row) => columns.map((c) => String(row[c.key] ?? '')));

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: yPos + 4,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: { fillColor: [243, 244, 246] },
    margin: { left: 10, right: 10 },
    tableWidth: 'auto',
  });

  // Footer with page number
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  doc.save(`${filename}.pdf`);
}

// ─── Preset Configs ──────────────────────────────────────────────────────────

export const SISWA_COLUMNS: ExportColumn[] = [
  { header: 'No', key: 'no', width: 6 },
  { header: 'Nama', key: 'nama', width: 25 },
  { header: 'NIPD', key: 'nipd', width: 12 },
  { header: 'JK', key: 'jenisKelamin', width: 6 },
  { header: 'NISN', key: 'nisn', width: 16 },
  { header: 'Tempat Lahir', key: 'tempatLahir', width: 16 },
  { header: 'Tanggal Lahir', key: 'tanggalLahir', width: 16 },
  { header: 'NIK', key: 'nik', width: 20 },
  { header: 'Agama', key: 'agama', width: 10 },
  { header: 'Alamat', key: 'alamat', width: 25 },
  { header: 'RT/RW', key: 'rt_rw', width: 8 },
  { header: 'Kelurahan', key: 'kelurahan', width: 16 },
  { header: 'Kecamatan', key: 'kecamatan', width: 16 },
  { header: 'Kode Pos', key: 'kodePos', width: 10 },
  { header: 'Jenis Tinggal', key: 'jenisTinggal', width: 14 },
  { header: 'Transportasi', key: 'alatTransportasi', width: 14 },
  { header: 'Telepon', key: 'telepon', width: 14 },
  { header: 'HP', key: 'hp', width: 14 },
  { header: 'Email', key: 'email', width: 22 },
  { header: 'Nama Ayah', key: 'namaAyah', width: 20 },
  { header: 'Pekerjaan Ayah', key: 'ayahPekerjaan', width: 16 },
  { header: 'Nama Ibu', key: 'namaIbu', width: 20 },
  { header: 'Pekerjaan Ibu', key: 'ibuPekerjaan', width: 16 },
  { header: 'Rombel', key: 'rombel', width: 16 },
  { header: 'Kebutuhan Khusus', key: 'kebutuhanKhusus', width: 14 },
  { header: 'Sekolah Asal', key: 'sekolahAsal', width: 20 },
  { header: 'Status', key: 'status', width: 12 },
];

export const GURU_COLUMNS: ExportColumn[] = [
  { header: 'No', key: 'no', width: 6 },
  { header: 'Nama', key: 'nama', width: 25 },
  { header: 'NUPTK', key: 'nuptk', width: 18 },
  { header: 'JK', key: 'jenisKelamin', width: 6 },
  { header: 'NIP', key: 'nip', width: 20 },
  { header: 'Tempat Lahir', key: 'tempatLahir', width: 16 },
  { header: 'Tanggal Lahir', key: 'tanggalLahir', width: 16 },
  { header: 'Status Kepeg.', key: 'statusKepegawaian', width: 14 },
  { header: 'Jenis PTK', key: 'jenisPTK', width: 16 },
  { header: 'Agama', key: 'agama', width: 10 },
  { header: 'Alamat', key: 'alamat', width: 25 },
  { header: 'Kelurahan', key: 'desaKelurahan', width: 16 },
  { header: 'Kecamatan', key: 'kecamatan', width: 16 },
  { header: 'HP', key: 'hp', width: 14 },
  { header: 'Email', key: 'email', width: 22 },
  { header: 'Tugas Tambahan', key: 'tugasTambahan', width: 18 },
  { header: 'Pangkat/Gol.', key: 'pangkatGolongan', width: 14 },
  { header: 'Sumber Gaji', key: 'sumberGaji', width: 14 },
  { header: 'Status Kawin', key: 'statusPerkawinan', width: 12 },
  { header: 'Kewargane garaan', key: 'kewarganegaraan', width: 14 },
  { header: 'NIK', key: 'nik', width: 20 },
  { header: 'Status', key: 'status', width: 12 },
];

export const MUTASI_MASUK_COLUMNS: ExportColumn[] = [
  { header: 'No', key: 'no', width: 6 },
  { header: 'Nama', key: 'nama', width: 25 },
  { header: 'NIS', key: 'nis', width: 16 },
  { header: 'Asal Sekolah', key: 'asalSekolah', width: 25 },
  { header: 'Kelas', key: 'kelas', width: 10 },
  { header: 'Tanggal Masuk', key: 'tanggalMasuk', width: 16 },
  { header: 'Alasan', key: 'alasan', width: 25 },
  { header: 'No. Surat', key: 'noSurat', width: 20 },
];

export const MUTASI_KELUAR_COLUMNS: ExportColumn[] = [
  { header: 'No', key: 'no', width: 6 },
  { header: 'Nama Siswa', key: 'nama', width: 25 },
  { header: 'NIPD', key: 'nipd', width: 12 },
  { header: 'NISN', key: 'nisn', width: 16 },
  { header: 'JK', key: 'jenisKelamin', width: 6 },
  { header: 'Rombel', key: 'rombel', width: 16 },
  { header: 'Tujuan Sekolah', key: 'tujuanSekolah', width: 25 },
  { header: 'Tanggal Keluar', key: 'tanggalKeluar', width: 16 },
  { header: 'Alasan', key: 'alasan', width: 25 },
  { header: 'No. Surat', key: 'noSurat', width: 20 },
];

// ─── Helper: flatten row for export ───────────────────────────────────────────

export function flattenSiswaRow(s: Record<string, unknown>, idx: number) {
  return {
    ...s,
    no: String(idx + 1),
    rt_rw: [s.rt, s.rw].filter(Boolean).join('/'),
  };
}