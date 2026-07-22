'use client';

import { useCallback, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import { User, Printer, Download, X, Building2, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SiswaData {
  nama: string;
  nipd: string;
  nisn: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  agama: string;
  alamat: string;
  kelurahan: string;
  kecamatan: string;
  rombel: string;
  namaAyah: string;
  namaIbu: string;
  namaWali: string;
  tahunPelajaran: string;
  hp?: string;
}

export interface SekolahData {
  namaSekolah: string;
  npsn: string;
  alamat: string;
  logo: string;
  fotoSekolah: string;
}

export interface KartuPelajarDialogProps {
  siswa: SiswaData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTanggalTTL(iso: string): string {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

function buildTTL(tempatLahir: string, tanggalLahir: string): string {
  const tgl = formatTanggalTTL(tanggalLahir);
  return `${tempatLahir || '-'}, ${tgl}`;
}

function buildNamaOrtuTua(s: SiswaData): string {
  if (s.namaWali && s.namaWali.trim()) return s.namaWali;
  const parts: string[] = [];
  if (s.namaAyah && s.namaAyah.trim()) parts.push(s.namaAyah);
  if (s.namaIbu && s.namaIbu.trim()) parts.push(s.namaIbu);
  return parts.join(' / ') || '-';
}

function buildAlamat(s: SiswaData): string {
  const parts: string[] = [];
  if (s.alamat && s.alamat.trim()) parts.push(s.alamat.trim());
  if (s.kelurahan && s.kelurahan.trim()) parts.push(s.kelurahan.trim());
  if (s.kecamatan && s.kecamatan.trim()) {
    const kec = s.kecamatan.trim().replace(/^Kec\.?\s*/i, '');
    parts.push(`Kec. ${kec}`);
  }
  return parts.join(', ') || '-';
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  const words = text.split(' ');
  let currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (doc.getTextWidth(testLine) > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

// ---------------------------------------------------------------------------
// Card dimensions (mm)
// ---------------------------------------------------------------------------

const CARD_W = 85.6;
const CARD_H = 128;

// Emerald colour palette
const EM_600: [number, number, number] = [5, 150, 105];
const EM_500: [number, number, number] = [16, 185, 129];
const EM_700: [number, number, number] = [4, 120, 87];

// ---------------------------------------------------------------------------
// PDF Generation — FRONT card (student data)
// ---------------------------------------------------------------------------

function drawFrontCard(
  doc: jsPDF,
  x: number,
  y: number,
  s: SiswaData,
  sekolah: SekolahData,
) {
  const w = CARD_W;
  const h = CARD_H;
  const headerH = 30;
  const pad = 5;

  // Card border
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  // Header band
  doc.setFillColor(...EM_600);
  doc.roundedRect(x, y, w, headerH, 2, 2, 'F');
  doc.setFillColor(...EM_500);
  doc.rect(x, y + 5, w, headerH - 5, 'F');
  doc.setFillColor(...EM_700);
  doc.rect(x, y + headerH - 1.5, w, 1.5, 'F');

  // Header text
  const schoolName = sekolah?.namaSekolah || 'SMA NEGERI 1 TELUK DALAM';
  const schoolAddr = sekolah?.alamat || 'Kec. Teluk Dalam, Kab. Nias Selatan';

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('KARTU PELAJAR', x + w / 2, y + 11, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(schoolName, x + w / 2, y + 17, { align: 'center' });

  doc.setFontSize(5.5);
  doc.text(schoolAddr, x + w / 2, y + 22.5, { align: 'center' });

  // ---- Photo area (left side) ----
  const photoX = x + pad;
  const photoY = y + headerH + pad;
  const photoW = 25;
  const photoH = 33;

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.setFillColor(245, 245, 245);
  doc.rect(photoX, photoY, photoW, photoH, 'FD');

  // Placeholder icon
  const cx = photoX + photoW / 2;
  const cy = photoY + photoH / 2 - 2;
  doc.setFillColor(210, 210, 210);
  doc.circle(cx, cy - 1.5, 5, 'F');
  doc.circle(cx, cy - 5.5, 2.5, 'F');
  doc.roundedRect(cx - 5, cy + 1.5, 10, 5, 2, 2, 'F');

  doc.setTextColor(160, 160, 160);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.text('FOTO', cx, photoY + photoH - 4, { align: 'center' });
  doc.setFontSize(4);
  doc.text('3x4', photoX + photoW - 1.5, photoY + photoH - 1.5, { align: 'right' });

  // ---- Student data (right of photo) ----
  const dataX = photoX + photoW + pad;
  const dataW = w - (dataX - x) - pad;
  let curY = photoY + 1;
  const lineH = 4.5;

  doc.setTextColor(30, 30, 30);
  const labelW = 24;

  function row(label: string, value: string) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 120, 120);
    doc.text(label, dataX, curY);
    doc.text(':', dataX + labelW, curY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 30, 30);
    const valX = dataX + labelW + 1.5;
    const maxValW = dataW - labelW - 1.5;
    const lines = wrapText(doc, value || '-', maxValW);
    doc.text(lines[0], valX, curY);
    if (lines.length > 1) {
      for (let i = 1; i < Math.min(lines.length, 3); i++) {
        curY += lineH * 0.7;
        doc.text(lines[i], valX, curY);
      }
    }
    curY += lineH;
  }

  // Nama (bold larger)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(10, 10, 10);
  const namaLines = wrapText(doc, s.nama || '-', dataW);
  doc.text(namaLines[0], dataX, curY);
  if (namaLines.length > 1) {
    curY += 5.5;
    doc.setFontSize(7);
    doc.text(namaLines[1], dataX, curY);
  }
  curY += 6;

  row('NIS / NIPD', s.nipd || '-');
  row('NISN', s.nisn || '-');
  row('Kelas', s.rombel || '-');
  row('TTL', buildTTL(s.tempatLahir, s.tanggalLahir));
  row('Jenis Kelamin', s.jenisKelamin || '-');
  row('Alamat', buildAlamat(s));
  row('Ortu / Wali', buildNamaOrtuTua(s));

  // ---- Separator ----
  const sepY = Math.min(curY + 1.5, y + h - 24);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.12);
  doc.line(x + pad, sepY, x + w - pad, sepY);

  // ---- Footer ----
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(140, 140, 140);
  doc.text(`Tahun Pelajaran: ${s.tahunPelajaran || '-'}`, x + pad, sepY + 4);

  // Signature columns
  const sigY = sepY + 5;
  const col1X = x + pad;
  const col2X = x + w - pad;
  const sigBottom = y + h - pad;

  doc.setFontSize(6);
  doc.setTextColor(50, 50, 50);
  doc.text('Kepala Sekolah', col1X + 15, sigY + 3.5, { align: 'center' });
  doc.text('Siswa', col2X - 15, sigY + 3.5, { align: 'center' });

  doc.setDrawColor(160, 160, 160);
  doc.setLineDashPattern([0.5, 0.5], 0);
  doc.setLineWidth(0.12);
  doc.line(col1X + 2, sigBottom - 4, col1X + 28, sigBottom - 4);
  doc.line(col2X - 28, sigBottom - 4, col2X - 2, sigBottom - 4);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.text('(..................................)', col1X + 15, sigBottom - 1.5, { align: 'center' });
  doc.text('(..................................)', col2X - 15, sigBottom - 1.5, { align: 'center' });
  doc.text('NIP. ................................', col1X + 15, sigBottom + 2.5, { align: 'center' });
}

// ---------------------------------------------------------------------------
// PDF Generation — BACK card (school identity)
// ---------------------------------------------------------------------------

function drawBackCard(
  doc: jsPDF,
  x: number,
  y: number,
  sekolah: SekolahData,
  logoImg: string | null,
  logoFormat: string,
  fotoImg: string | null,
  fotoFormat: string,
) {
  const w = CARD_W;
  const h = CARD_H;
  const pad = 5;

  // Card border
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);

  // Background image (school photo)
  if (fotoImg) {
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(x, y, w, h, 2, 2, 'FD');
    doc.addImage(fotoImg, fotoFormat, x, y, w, h, undefined, 'FAST');
    // Dark overlay for readability
    doc.setFillColor(0, 0, 0);
    const gState55 = new (doc as any).GState({ opacity: 0.55 });
    doc.setGState(gState55);
    doc.roundedRect(x, y, w, h, 2, 2, 'F');
    const gState1 = new (doc as any).GState({ opacity: 1 });
    doc.setGState(gState1);
  } else {
    // Fallback: emerald background
    doc.setFillColor(...EM_600);
    doc.roundedRect(x, y, w, h, 2, 2, 'FD');
  }

  // All text white when there's a photo, otherwise white on emerald too
  doc.setTextColor(255, 255, 255);

  // Logo
  const logoY = y + h / 2 - 30;
  if (logoImg) {
    try {
      doc.addImage(logoImg, logoFormat, x + w / 2 - 12, logoY, 24, 24, undefined, 'FAST');
    } catch {
      // If logo fails, draw placeholder
      doc.setFillColor(255, 255, 255);
      const gs = new (doc as any).GState({ opacity: 0.2 });
      doc.setGState(gs);
      doc.circle(x + w / 2, logoY + 12, 10, 'F');
      const gs1 = new (doc as any).GState({ opacity: 1 });
      doc.setGState(gs1);
    }
  } else {
    // Placeholder logo
    doc.setFillColor(255, 255, 255);
    const gs2 = new (doc as any).GState({ opacity: 0.2 });
    doc.setGState(gs2);
    doc.circle(x + w / 2, logoY + 12, 10, 'F');
    const gs3 = new (doc as any).GState({ opacity: 1 });
    doc.setGState(gs3);
  }

  // School name
  const textStartY = logoY + 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const schoolName = sekolah?.namaSekolah || 'SMA NEGERI 1 TELUK DALAM';
  const nameLines = wrapText(doc, schoolName.toUpperCase(), w - pad * 2);
  for (let i = 0; i < nameLines.length; i++) {
    doc.text(nameLines[i], x + w / 2, textStartY + i * 6, { align: 'center' });
  }

  // NPSN
  let infoY = textStartY + nameLines.length * 6 + 6;
  if (sekolah?.npsn) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`NPSN: ${sekolah.npsn}`, x + w / 2, infoY, { align: 'center' });
    infoY += 6;
  }

  // Alamat
  if (sekolah?.alamat) {
    doc.setFontSize(7);
    const addrLines = wrapText(doc, sekolah.alamat, w - pad * 2);
    for (let i = 0; i < addrLines.length; i++) {
      doc.text(addrLines[i], x + w / 2, infoY + i * 4.5, { align: 'center' });
    }
  }
}

// ---------------------------------------------------------------------------
// Full PDF generation
// ---------------------------------------------------------------------------

async function generatePDF(siswa: SiswaData, sekolah: SekolahData) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth(); // 297
  const pageH = doc.internal.pageSize.getHeight(); // 210

  const gap = 15;
  const totalW = CARD_W * 2 + gap;
  const offsetX = (pageW - totalW) / 2;
  const offsetY = (pageH - CARD_H) / 2;

  // Load images for back card
  let logoImg: string | null = null;
  let logoFormat: string = 'PNG';
  let fotoImg: string | null = null;
  let fotoFormat: string = 'JPEG';

  function dataUriToBase64(dataUri: string): { base64: string; format: string } {
    const [meta, b64] = dataUri.split(',');
    const mime = meta.match(/data:([^;]+)/)?.[1] || 'image/png';
    const format = mime.includes('png') ? 'PNG' : mime.includes('webp') ? 'PNG' : 'JPEG';
    return { base64: `data:${mime};base64,${b64}`, format };
  }

  function urlToBase64(url: string): { base64: string; format: string } | null {
    try { return dataUriToBase64(url); } catch { return null; }
  }

  try {
    if (sekolah?.logo) {
      // If already a data URI, use directly
      if (sekolah.logo.startsWith('data:')) {
        const parsed = dataUriToBase64(sekolah.logo);
        logoImg = parsed.base64;
        logoFormat = parsed.format;
      } else {
        // Fetch from URL
        const res = await fetch(sekolah.logo);
        const blob = await res.blob();
        const arrayBuf = await blob.arrayBuffer();
        const base64 = btoa(new Uint8Array(arrayBuf).reduce((d, b) => d + String.fromCharCode(b), ''));
        const mime = blob.type || 'image/png';
        logoFormat = mime.includes('png') ? 'PNG' : mime.includes('webp') ? 'PNG' : 'JPEG';
        logoImg = `data:${mime};base64,${base64}`;
      }
    }
  } catch { /* skip */ }

  try {
    if (sekolah?.fotoSekolah) {
      if (sekolah.fotoSekolah.startsWith('data:')) {
        const parsed = dataUriToBase64(sekolah.fotoSekolah);
        fotoImg = parsed.base64;
        fotoFormat = parsed.format;
      } else {
        const res = await fetch(sekolah.fotoSekolah);
        const blob = await res.blob();
        const arrayBuf = await blob.arrayBuffer();
        const base64 = btoa(new Uint8Array(arrayBuf).reduce((d, b) => d + String.fromCharCode(b), ''));
        const mime = blob.type || 'image/jpeg';
        fotoFormat = mime.includes('png') ? 'PNG' : mime.includes('webp') ? 'PNG' : 'JPEG';
        fotoImg = `data:${mime};base64,${base64}`;
      }
    }
  } catch { /* skip */ }

  // Page 1: Front cards (student data)
  drawFrontCard(doc, offsetX, offsetY, siswa, sekolah);
  drawFrontCard(doc, offsetX + CARD_W + gap, offsetY, siswa, sekolah);

  // Page 2: Back cards (school identity)
  doc.addPage();
  drawBackCard(doc, offsetX, offsetY, sekolah, logoImg, logoFormat, fotoImg, fotoFormat);
  drawBackCard(doc, offsetX + CARD_W + gap, offsetY, sekolah, logoImg, logoFormat, fotoImg, fotoFormat);

  doc.save(`Kartu_Pelajar_${siswa.nama.replace(/\s+/g, '_')}.pdf`);
}

// ---------------------------------------------------------------------------
// React Component
// ---------------------------------------------------------------------------

export default function KartuPelajarDialog({
  siswa,
  open,
  onOpenChange,
}: KartuPelajarDialogProps) {
  const [activeTab, setActiveTab] = useState<'depan' | 'belakang'>('depan');
  const cardsRef = useRef<HTMLDivElement>(null);

  const { data: sekolah, isLoading: loadingSekolah } = useQuery<SekolahData>({
    queryKey: ['identitas-sekolah'],
    queryFn: async () => {
      const res = await fetch('/api/identitas-sekolah');
      if (!res.ok) throw new Error('Gagal memuat');
      return res.json();
    },
    enabled: open,
  });

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadPDF = useCallback(() => {
    if (!siswa) return;
    const s: SekolahData = {
      namaSekolah: sekolah?.namaSekolah || 'SMA NEGERI 1 TELUK DALAM',
      npsn: sekolah?.npsn || '',
      alamat: sekolah?.alamat || 'Kec. Teluk Dalam, Kab. Nias Selatan',
      logo: sekolah?.logo || '',
      fotoSekolah: sekolah?.fotoSekolah || '',
    };
    generatePDF(siswa, s);
  }, [siswa, sekolah]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  if (!siswa) return null;

  const ttl = buildTTL(siswa.tempatLahir, siswa.tanggalLahir);
  const namaOrtu = buildNamaOrtuTua(siswa);
  const alamat = buildAlamat(siswa);
  const schoolName = sekolah?.namaSekolah || 'SMA NEGERI 1 TELUK DALAM';
  const schoolAddr = sekolah?.alamat || 'Kec. Teluk Dalam, Kab. Nias Selatan';
  const schoolNpsn = sekolah?.npsn || '';
  const schoolLogo = sekolah?.logo || '';
  const schoolFoto = sekolah?.fotoSekolah || '';

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #kartu-print-area, #kartu-print-area * { visibility: visible !important; }
          #kartu-print-area {
            position: absolute; left: 0; top: 0; width: 297mm;
            display: flex !important; justify-content: center; align-items: center;
            gap: 15mm; padding: 10mm;
          }
          .kartu-card { break-inside: avoid; page-break-inside: avoid; }
          @page { size: A4 landscape; margin: 0; }
        }
      `}</style>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-4xl print:hidden"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <User className="h-4 w-4" />
              </span>
              Kartu Pelajar
            </DialogTitle>
            <DialogDescription>
              Pratinjau kartu pelajar untuk <strong>{siswa.nama}</strong>
            </DialogDescription>
          </DialogHeader>

          {/* Tab switcher */}
          <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
            <button
              onClick={() => setActiveTab('depan')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'depan'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🎴 Halaman Depan
            </button>
            <button
              onClick={() => setActiveTab('belakang')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'belakang'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🏫 Halaman Belakang
            </button>
          </div>

          {/* Card preview area */}
          {loadingSekolah ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div
              id="kartu-print-area"
              ref={cardsRef}
              className="flex flex-col items-center gap-8 py-4 sm:flex-row sm:justify-center sm:gap-10"
            >
              {activeTab === 'depan' ? (
                <>
                  <FrontCard
                    siswa={siswa} ttl={ttl} namaOrtu={namaOrtu} alamat={alamat}
                    schoolName={schoolName} schoolAddr={schoolAddr}
                  />
                  <FrontCard
                    siswa={siswa} ttl={ttl} namaOrtu={namaOrtu} alamat={alamat}
                    schoolName={schoolName} schoolAddr={schoolAddr}
                  />
                </>
              ) : (
                <>
                  <BackCard
                    schoolName={schoolName} schoolNpsn={schoolNpsn}
                    schoolAddr={schoolAddr} schoolLogo={schoolLogo}
                    schoolFoto={schoolFoto}
                  />
                  <BackCard
                    schoolName={schoolName} schoolNpsn={schoolNpsn}
                    schoolAddr={schoolAddr} schoolLogo={schoolLogo}
                    schoolFoto={schoolFoto}
                  />
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={handleClose}>
              <X className="mr-1.5 h-4 w-4" />
              Tutup
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF} disabled={loadingSekolah}>
              <Download className="mr-1.5 h-4 w-4" />
              Download PDF (Depan + Belakang)
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handlePrint}>
              <Printer className="mr-1.5 h-4 w-4" />
              Cetak
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// FRONT Card — Student Data (CSS Preview)
// ---------------------------------------------------------------------------

function FrontCard({
  siswa, ttl, namaOrtu, alamat, schoolName, schoolAddr,
}: {
  siswa: SiswaData;
  ttl: string;
  namaOrtu: string;
  alamat: string;
  schoolName: string;
  schoolAddr: string;
}) {
  return (
    <div className="kartu-card w-[360px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-emerald-600 to-emerald-500 px-4 py-4 text-center text-white">
        <p className="text-sm font-bold uppercase tracking-wider">Kartu Pelajar</p>
        <p className="mt-0.5 text-[11px] font-medium">{schoolName}</p>
        <p className="text-[9px] opacity-90">{schoolAddr}</p>
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-emerald-700" />
      </div>

      {/* Body */}
      <div className="flex gap-4 p-4">
        {/* Photo placeholder */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <div className="flex h-[120px] w-[90px] flex-col items-center justify-center gap-1 rounded border border-gray-200 bg-gray-50">
            <User className="h-10 w-10 text-gray-300" />
            <span className="text-[10px] font-medium text-gray-400">FOTO</span>
            <span className="text-[8px] text-gray-300">3×4</span>
          </div>
        </div>

        {/* Data */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-[5px] text-[11px]">
          <p className="text-[14px] font-bold leading-tight text-gray-900 break-words">
            {siswa.nama || '-'}
          </p>
          <DataRow label="NIS / NIPD" value={siswa.nipd} />
          <DataRow label="NISN" value={siswa.nisn} />
          <DataRow label="Kelas" value={siswa.rombel} />
          <DataRow label="Tempat, Tgl Lahir" value={ttl} />
          <DataRow label="Jenis Kelamin" value={siswa.jenisKelamin} />
          <DataRow label="Alamat" value={alamat} />
          <DataRow label="Ortu / Wali" value={namaOrtu} />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 pb-3 pt-2">
        <p className="mb-3 text-center text-[9px] text-gray-400">
          Tahun Pelajaran: {siswa.tahunPelajaran || '-'}
        </p>
        <div className="flex justify-between text-[10px] text-gray-700">
          <div className="flex flex-col items-center min-w-0">
            <span className="font-medium whitespace-nowrap">Kepala Sekolah</span>
            <div className="my-3 border-b border-dashed border-gray-300 w-[90px]" />
            <span className="text-[8px] text-gray-400 truncate max-w-[100px]">(..................................)</span>
            <span className="mt-0.5 text-[8px] text-gray-400 whitespace-nowrap">NIP. ................................</span>
          </div>
          <div className="flex flex-col items-center min-w-0">
            <span className="font-medium whitespace-nowrap">Siswa</span>
            <div className="my-3 border-b border-dashed border-gray-300 w-[90px]" />
            <span className="text-[8px] text-gray-400 truncate max-w-[100px]">(..................................)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BACK Card — School Identity (CSS Preview)
// ---------------------------------------------------------------------------

function BackCard({
  schoolName, schoolNpsn, schoolAddr, schoolLogo, schoolFoto,
}: {
  schoolName: string;
  schoolNpsn: string;
  schoolAddr: string;
  schoolLogo: string;
  schoolFoto: string;
}) {
  const hasFoto = !!schoolFoto;
  const hasLogo = !!schoolLogo;

  return (
    <div className="kartu-card w-[360px] h-[504px] overflow-hidden rounded-lg border border-gray-200 shadow-lg relative">
      {/* Background image or fallback emerald */}
      {hasFoto ? (
        <>
          <img
            src={schoolFoto}
            alt="Foto Sekolah"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/55" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-600 to-emerald-800" />
      )}

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-white gap-4">
        {/* Logo */}
        <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
          {hasLogo ? (
            <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain p-1" />
          ) : (
            <Building2 className="h-12 w-12 text-white/60" />
          )}
        </div>

        {/* School name */}
        <h2 className="text-[16px] font-bold text-center leading-tight uppercase">
          {schoolName || 'Nama Sekolah Belum Diatur'}
        </h2>

        {/* NPSN */}
        {schoolNpsn && (
          <p className="text-sm font-medium opacity-90">
            NPSN: {schoolNpsn}
          </p>
        )}

        {/* Alamat */}
        {schoolAddr && (
          <p className="text-xs text-center opacity-80 leading-relaxed max-w-[280px]">
            {schoolAddr}
          </p>
        )}

        {!schoolName && (
          <p className="text-xs opacity-60 text-center mt-2">
            Buka menu &quot;Identitas Sekolah&quot; di sidebar untuk mengatur data sekolah.
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DataRow sub-component
// ---------------------------------------------------------------------------

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1 leading-tight min-w-0">
      <span className="w-[82px] shrink-0 text-gray-500">{label}</span>
      <span className="text-gray-500 shrink-0">:</span>
      <span className="min-w-0 break-words font-medium text-gray-800">{value || '-'}</span>
    </div>
  );
}