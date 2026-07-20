"use client";

import { useRef } from "react";
import { Printer, X, School, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// ── Types ────────────────────────────────────────────────────────────────────

export interface KartuPelajarSiswa {
  id: string;
  nama: string;
  nipd: string;
  nisn: string;
  tempatLahir: string;
  tanggalLahir: string;
  rombel: string;
  tahunPelajaran: string;
}

interface KartuPelajarDialogProps {
  open: boolean;
  onClose: () => void;
  siswa: KartuPelajarSiswa | null;
}

// ── School Config ────────────────────────────────────────────────────────────

const SEKOLAH = {
  nama: "SMA NEGERI 1 GIDO",
  npsn: "10200955",
  alamat: "Jl. Pelajar No. 1, Desa Bawodesolo, Kec. Gido",
  kabupaten: "Kabupaten Nias",
  provinsi: "Provinsi Sumatera Utara",
  kodePos: "22862",
  kepalaSekolah: "Drs. YAFETI HIA, M.Pd",
  nipKepsek: "196805151993031007",
  akreditasi: "A",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTglLahir(tempat: string, tgl: string): string {
  const parts = [];
  if (tempat) parts.push(tempat);
  if (tgl) {
    try {
      const d = new Date(tgl);
      if (!isNaN(d.getTime())) {
        const bulan = [
          "Januari", "Februari", "Maret", "April", "Mei", "Juni",
          "Juli", "Agustus", "September", "Oktober", "November", "Desember",
        ];
        parts.push(`${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`);
      } else {
        parts.push(tgl);
      }
    } catch {
      parts.push(tgl);
    }
  }
  return parts.join(", ");
}

// ── Info Row Helper ──────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <span className="font-medium text-[11px] text-gray-700 w-[110px] shrink-0">{label}</span>
      <span className="text-[11px] text-gray-600">: </span>
      <span className="text-[11px] text-gray-800 flex-1">{value || "-"}</span>
    </div>
  );
}

// ── Kartu Pelajar Card (Printable) ──────────────────────────────────────────

function KartuPelajarCard({ siswa }: { siswa: KartuPelajarSiswa }) {
  return (
    <div className="kartu-pelajar-card bg-white border border-gray-300 shadow-lg mx-auto" style={{ width: "340px" }}>
      {/* ─── OUTER BORDER ─── */}
      <div className="border-2 border-emerald-700 m-[6px] p-0">
        {/* ─── HEADER: School Identity ─── */}
        <div className="bg-emerald-700 px-4 py-2.5 text-center">
          <p className="text-[10px] text-emerald-100 tracking-wide uppercase">Yayasan Pendidikan Daerah</p>
          <h1 className="text-[16px] font-bold text-white tracking-wide leading-tight mt-0.5">{SEKOLAH.nama}</h1>
          <div className="flex items-center justify-center gap-3 mt-1 text-[9px] text-emerald-200">
            <span>NPSN: {SEKOLAH.npsn}</span>
            <span>|</span>
            <span>Akreditasi: <strong className="text-white">{SEKOLAH.akreditasi}</strong></span>
          </div>
          <p className="text-[8px] text-emerald-200 mt-0.5">{SEKOLAH.alamat}</p>
          <p className="text-[8px] text-emerald-200">{SEKOLAH.kabupaten}, {SEKOLAH.provinsi} {SEKOLAH.kodePos}</p>
        </div>

        {/* ─── TITLE: Kartu Pelajar ─── */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 py-1.5 text-center border-b-2 border-amber-400">
          <div className="flex items-center justify-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-300" />
            <h2 className="text-[14px] font-extrabold text-white tracking-[0.15em] uppercase">Kartu Pelajar</h2>
            <CreditCard className="w-4 h-4 text-amber-300" />
          </div>
          <p className="text-[8px] text-emerald-100 -mt-0.5">Tahun Pelajaran {siswa.tahunPelajaran || "-"}</p>
        </div>

        {/* ─── BODY: Student Data ─── */}
        <div className="p-5 space-y-[5px]">
          {/* Nama (bold, larger) */}
          <div className="mb-1.5">
            <p className="text-[9px] text-gray-500 uppercase tracking-wide">Nama Lengkap</p>
            <p className="text-[14px] font-bold text-gray-900 leading-tight uppercase tracking-wide">{siswa.nama || "-"}</p>
          </div>

          <InfoRow label="NISN / NIPD" value={siswa.nisn ? `${siswa.nisn} / ${siswa.nipd}` : siswa.nipd || "-"} />
          <InfoRow label="TTL" value={formatTglLahir(siswa.tempatLahir, siswa.tanggalLahir)} />
          <InfoRow label="Kelas" value={siswa.rombel || "-"} />
        </div>

        {/* ─── FOOTER: Kepala Sekolah Signature ─── */}
        <div className="px-5 pb-4 pt-2">
          <div className="flex justify-end">
            <div className="text-center">
              <p className="text-[8px] text-gray-500">Gido, Juli 2025</p>
              <p className="text-[8px] text-gray-500">Kepala Sekolah</p>
              <div className="w-[130px] h-[45px] flex items-center justify-center mt-1">
                <p className="text-[8px] text-gray-400 italic">(Tanda Tangan & Stempel)</p>
              </div>
              <div className="border-b border-gray-800 w-[130px] mx-auto" />
              <p className="text-[9px] font-bold text-gray-800 mt-0.5 leading-tight">{SEKOLAH.kepalaSekolah}</p>
              <p className="text-[7px] text-gray-500">NIP. {SEKOLAH.nipKepsek}</p>
            </div>
          </div>
        </div>

        {/* ─── BOTTOM BAR ─── */}
        <div className="bg-emerald-700 px-4 py-1.5 text-center">
          <p className="text-[7px] text-emerald-200">{SEKOLAH.nama} — {SEKOLAH.alamat}</p>
        </div>
      </div>
    </div>
  );
}

// ── Dialog Wrapper ───────────────────────────────────────────────────────────

export default function KartuPelajarDialog({ open, onClose, siswa }: KartuPelajarDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = cardRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank", "width=450,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kartu Pelajar - ${siswa?.nama || "Siswa"}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page {
            size: auto;
            margin: 5mm;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            padding: 10px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 300);
          };
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!siswa) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden max-h-[95vh]">
        <DialogHeader className="sr-only">
          <DialogTitle>Kartu Pelajar</DialogTitle>
          <DialogDescription>
            Cetak kartu pelajar untuk {siswa.nama}
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b no-print">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-gray-700">Kartu Pelajar</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
              onClick={handlePrint}
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak
            </Button>
          </div>
        </div>

        {/* Card Preview */}
        <div className="p-4 overflow-y-auto max-h-[calc(95vh-120px)] flex justify-center">
          <div ref={cardRef}>
            <KartuPelajarCard siswa={siswa} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}