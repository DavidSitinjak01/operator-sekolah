"use client";

import { useRef } from "react";
import { Printer, School } from "lucide-react";
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
  jenisKelamin?: string;
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
  kecamatan: string;
  provinsi: string;
  kodePos: string;
  kepalaSekolah: string;
  nipKepsek: string;
  akreditasi: string;
}

// ── Cache & Fetch ────────────────────────────────────────────────────────────

let settingsCache: PengaturanSekolah | null = null;
let settingsCacheTime = 0;
const CACHE_TTL = 30_000;

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

export function invalidateSettingsCache() {
  settingsCache = null;
  settingsCacheTime = 0;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTglLahir(tempat: string, tgl: string): string {
  const parts: string[] = [];
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

// ── Kartu Pelajar Card ───────────────────────────────────────────────────────

function KartuPelajarCard({ siswa, sekolah }: { siswa: KartuPelajarSiswa; sekolah: PengaturanSekolah }) {
  return (
    <div
      className="kartu-pelajar-card bg-white mx-auto"
      style={{
        width: "320px",
        border: "2.5px solid #047857",
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
      }}
    >
      {/* ─── TOP: Logo & School Name ─── */}
      <div style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)", padding: "16px 12px 12px" }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
          {sekolah.logoSekolah ? (
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              border: "3px solid #047857", background: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "4px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}>
              <img src={sekolah.logoSekolah} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
          ) : (
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              border: "3px solid #047857", background: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}>
              <School style={{ width: "36px", height: "36px", color: "#047857" }} />
            </div>
          )}
        </div>

        {/* School Name */}
        <h1 style={{
          fontSize: "14px", fontWeight: 800, textAlign: "center", color: "#064e3b",
          letterSpacing: "0.08em", textTransform: "uppercase", lineHeight: 1.2,
        }}>
          {sekolah.namaSekolah || "—"}
        </h1>
        <p style={{ fontSize: "8px", textAlign: "center", color: "#047857", marginTop: "2px", fontWeight: 500 }}>
          NPSN: {sekolah.npsn || "—"}{sekolah.akreditasi ? ` | Akreditasi ${sekolah.akreditasi}` : ""}
        </p>
      </div>

      {/* ─── Decorative Divider ─── */}
      <div style={{ height: "4px", background: "linear-gradient(90deg, #047857, #10b981, #047857)" }} />

      {/* ─── Student Photo (Circular) ─── */}
      <div style={{ padding: "16px 12px 8px", display: "flex", justifyContent: "center" }}>
        <div style={{
          width: "110px", height: "110px", borderRadius: "50%",
          border: "3px solid #047857",
          background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", boxShadow: "0 2px 10px rgba(4,120,87,0.2)",
        }}>
          <svg style={{ width: "48px", height: "48px", color: "#6ee7b7" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
      </div>

      {/* ─── Student Name (Centered, Bold) ─── */}
      <div style={{ textAlign: "center", padding: "0 12px" }}>
        <p style={{
          fontSize: "15px", fontWeight: 800, color: "#111827",
          textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.2,
        }}>
          {siswa.nama || "—"}
        </p>
        <p style={{
          fontSize: "11px", fontWeight: 700, color: "#374151", marginTop: "2px",
          letterSpacing: "0.04em",
        }}>
          {siswa.nisn ? `NISN: ${siswa.nisn}` : `NIPD: ${siswa.nipd || "—"}`}
        </p>
      </div>

      {/* ─── Data Box (Bordered) ─── */}
      <div style={{ padding: "10px 14px" }}>
        <div style={{
          border: "1.5px solid #047857", borderRadius: "6px",
          padding: "10px 12px", background: "#f0fdf4",
        }}>
          <DataRow label="NISN / NIPD" value={siswa.nisn ? `${siswa.nisn} / ${siswa.nipd}` : siswa.nipd || "—"} />
          <DataRow label="Tempat, Tgl Lahir" value={formatTglLahir(siswa.tempatLahir, siswa.tanggalLahir)} />
          <DataRow label="Jenis Kelamin" value={siswa.jenisKelamin === "L" ? "Laki-Laki" : siswa.jenisKelamin === "P" ? "Perempuan" : siswa.jenisKelamin || "—"} />
          <DataRow label="Kelas" value={siswa.rombel || "—"} />
        </div>
      </div>

      {/* ─── Signature Section ─── */}
      <div style={{ padding: "4px 14px 6px", display: "flex", justifyContent: "flex-end" }}>
        <div style={{ textAlign: "center", width: "150px" }}>
          <p style={{ fontSize: "8px", color: "#6b7280" }}>{sekolah.kecamatan || "Gido"}, Juli 2025</p>
          <p style={{ fontSize: "8px", color: "#6b7280" }}>Kepala Sekolah</p>
          <div style={{ height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontSize: "7px", color: "#9ca3af", fontStyle: "italic" }}>(Tanda Tangan & Stempel)</p>
          </div>
          <div style={{ borderBottom: "1.5px solid #111827", width: "150px" }} />
          <p style={{ fontSize: "9px", fontWeight: 700, color: "#111827", marginTop: "2px", lineHeight: 1.2 }}>
            {sekolah.kepalaSekolah || "—"}
          </p>
          <p style={{ fontSize: "7px", color: "#6b7280" }}>NIP. {sekolah.nipKepsek || "—"}</p>
        </div>
      </div>

      {/* ─── Footer Bar: KARTU PELAJAR ─── */}
      <div style={{
        background: "linear-gradient(135deg, #047857, #065f46)",
        padding: "8px 12px",
        marginTop: "4px",
      }}>
        <p style={{
          fontSize: "11px", fontWeight: 800, color: "white",
          textAlign: "center", letterSpacing: "0.2em", textTransform: "uppercase",
        }}>
          Kartu Pelajar
        </p>
        <p style={{ fontSize: "7px", color: "#a7f3d0", textAlign: "center", marginTop: "2px" }}>
          Tahun Pelajaran {siswa.tahunPelajaran || "—"}
        </p>
      </div>
    </div>
  );
}

// ── Data Row for Box ─────────────────────────────────────────────────────────

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", padding: "3px 0" }}>
      <span style={{ fontSize: "10px", fontWeight: 600, color: "#374151", width: "110px", flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: "10px", color: "#6b7280" }}>: </span>
      <span style={{ fontSize: "10px", fontWeight: 500, color: "#111827", flex: 1 }}>
        {value}
      </span>
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

    const printWindow = window.open("", "_blank", "width=450,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kartu Pelajar - ${siswa?.nama || "Siswa"}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: auto; margin: 5mm; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex; justify-content: center; padding: 10px;
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
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden max-h-[95vh]">
        <DialogHeader className="sr-only">
          <DialogTitle>Kartu Pelajar</DialogTitle>
          <DialogDescription>Cetak kartu pelajar untuk {siswa.nama}</DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b no-print">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-gray-700">Kartu Pelajar</span>
          </div>
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