"use client";

import { useRef, useEffect, useState } from "react";
import { Printer, School, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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

interface PengaturanSekolah {
  logoSekolah: string;
  namaSekolah: string;
  npsn: string;
  alamat: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
  kepalaSekolah: string;
  nipKepsek: string;
  akreditasi: string;
}

// ── Cache & Fetch ────────────────────────────────────────────────────────────

let settingsCache: PengaturanSekolah | null = null;
let settingsCacheTime = 0;
const CACHE_TTL = 30_000; // 30s

async function fetchSettings(): Promise<PengaturanSekolah> {
  const now = Date.now();
  if (settingsCache && now - settingsCacheTime < CACHE_TTL) {
    return settingsCache;
  }
  const res = await fetch("/api/pengaturan");
  if (!res.ok) throw new Error("Gagal memuat pengaturan");
  settingsCache = await res.json();
  settingsCacheTime = now;
  return settingsCache!;
}

/** Call this when settings are updated so the cache is cleared */
export function invalidateSettingsCache() {
  settingsCache = null;
  settingsCacheTime = 0;
}

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

function KartuPelajarCard({ siswa, sekolah }: { siswa: KartuPelajarSiswa; sekolah: PengaturanSekolah }) {
  const fullAlamat = [sekolah.alamat, sekolah.kabupaten, sekolah.provinsi, sekolah.kodePos]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="kartu-pelajar-card bg-white border border-gray-300 shadow-lg mx-auto" style={{ width: "340px" }}>
      {/* ─── OUTER BORDER ─── */}
      <div className="border-2 border-emerald-700 m-[6px] p-0">
        {/* ─── HEADER: School Identity ─── */}
        <div className="bg-emerald-700 px-4 py-2.5 text-center">
          {sekolah.logoSekolah && (
            <div className="flex justify-center mb-1.5">
              <img src={sekolah.logoSekolah} alt="Logo" className="h-[40px] w-auto object-contain" />
            </div>
          )}
          <h1 className="text-[16px] font-bold text-white tracking-wide leading-tight">{sekolah.namaSekolah || "—"}</h1>
          <div className="flex items-center justify-center gap-3 mt-1 text-[9px] text-emerald-200">
            <span>NPSN: {sekolah.npsn || "—"}</span>
            {sekolah.akreditasi && (
              <>
                <span>|</span>
                <span>Akreditasi: <strong className="text-white">{sekolah.akreditasi}</strong></span>
              </>
            )}
          </div>
          <p className="text-[8px] text-emerald-200 mt-0.5">{fullAlamat}</p>
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
              <p className="text-[9px] font-bold text-gray-800 mt-0.5 leading-tight">{sekolah.kepalaSekolah || "—"}</p>
              <p className="text-[7px] text-gray-500">NIP. {sekolah.nipKepsek || "—"}</p>
            </div>
          </div>
        </div>

        {/* ─── BOTTOM BAR ─── */}
        <div className="bg-emerald-700 px-4 py-1.5 text-center">
          <p className="text-[7px] text-emerald-200">{sekolah.namaSekolah || "—"} — {sekolah.alamat || "—"}</p>
        </div>
      </div>
    </div>
  );
}

// ── Dialog Wrapper ───────────────────────────────────────────────────────────

export default function KartuPelajarDialog({ open, onClose, siswa }: KartuPelajarDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const { data: sekolah, isLoading } = useQuery<PengaturanSekolah>({
    queryKey: ["pengaturan"],
    queryFn: fetchSettings,
    enabled: open && !!siswa,
  });

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
              disabled={isLoading}
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak
            </Button>
          </div>
        </div>

        {/* Card Preview */}
        <div className="p-4 overflow-y-auto max-h-[calc(95vh-120px)] flex justify-center">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div ref={cardRef}>
              <KartuPelajarCard siswa={siswa} sekolah={sekolah!} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}