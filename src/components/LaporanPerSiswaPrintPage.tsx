"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Loader2, Printer, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

interface LaporanPerSiswaPrintPageProps {
  open: boolean;
  onClose: () => void;
  siswaId: string;
  siswaNama: string;
  nisn: string;
  rombel: string;
  tahunPelajaran: string;
  semester: string;
}

interface SiswaData {
  id: string;
  nama: string;
  nisn: string;
  rombel: string;
  jenisKelamin: string;
  no: string;
}

interface KehadiranData {
  H: number;
  S: number;
  I: number;
  A: number;
  totalHariEfektif: number;
  persentase: number;
}

interface DetailAbsensi {
  tanggal: string;
  kodeAbsensi: string;
  keterangan: string;
}

interface CatatanItem {
  id: string;
  tanggal: string;
  kategori: string;
  catatan: string;
  tindakan: string;
  dibuatOleh: string;
}

interface LaporanPerSiswaResponse {
  siswa: SiswaData;
  kehadiran: KehadiranData;
  detailAbsensi: DetailAbsensi[];
  catatan: CatatanItem[];
  tanggalCetak: string;
}

interface PengaturanData {
  namaSekolah: string;
  npsn: string;
  alamat: string;
  kabupaten: string;
  kecamatan: string;
  provinsi: string;
  kodePos: string;
  kepalaSekolah: string;
  nipKepsek: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const BULAN_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function formatTanggalIndo(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} ${BULAN_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function getKodeColor(kode: string): string {
  switch (kode) {
    case "H": return "#16a34a";
    case "S": return "#d97706";
    case "I": return "#2563eb";
    case "A": return "#dc2626";
    default: return "#64748b";
  }
}

// ─── Print Styles (injected once) ──────────────────────────────────────────

let printStylesInjected = false;

function injectPrintStyles() {
  if (printStylesInjected || typeof document === "undefined") return;
  printStylesInjected = true;
  const style = document.createElement("style");
  style.id = "laporan-per-siswa-print-styles";
  style.textContent = `
    @media print {
      body * {
        visibility: hidden !important;
      }
      #laporan-per-siswa-print-content,
      #laporan-per-siswa-print-content * {
        visibility: visible !important;
      }
      #laporan-per-siswa-print-content {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 15mm 15mm 20mm 20mm !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        overflow: visible !important;
        max-height: none !important;
        background: white !important;
      }
      [data-slot="dialog-overlay"],
      [data-slot="dialog-close"] {
        display: none !important;
      }
      .print\\:hidden {
        display: none !important;
      }
      @page {
        size: A4 portrait;
        margin: 10mm;
      }
      .print-avoid-break {
        break-inside: avoid;
      }
      table {
        border-collapse: collapse;
      }
    }
  `;
  document.head.appendChild(style);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function LaporanPerSiswaPrintPage({
  open,
  onClose,
  siswaId,
  siswaNama,
  nisn,
  rombel,
  tahunPelajaran,
  semester,
}: LaporanPerSiswaPrintPageProps) {
  const [data, setData] = useState<LaporanPerSiswaResponse | null>(null);
  const [pengaturan, setPengaturan] = useState<PengaturanData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!siswaId || !rombel) return;
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        tahunPelajaran,
        semester,
        rombel,
        siswaId,
      });

      // Fetch pengaturan
      const pengaturanRes = await fetch("/api/pengaturan");
      if (pengaturanRes.ok) {
        const p = await pengaturanRes.json();
        setPengaturan(p as PengaturanData);
      }

      // Fetch laporan per siswa
      const res = await fetch(`/api/laporan-per-siswa?${params}`);
      if (!res.ok) throw new Error("Gagal memuat data siswa");
      const d = await res.json();
      setData(d as LaporanPerSiswaResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  }, [siswaId, rombel, tahunPelajaran, semester]);

  useEffect(() => {
    if (open) {
      injectPrintStyles();
      fetchData();
    } else {
      setData(null);
      setError(null);
    }
  }, [open, fetchData]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const tanggalCetak = data?.tanggalCetak || new Date().toISOString();

  const alamatLengkap = [
    pengaturan?.alamat,
    pengaturan?.kecamatan,
    pengaturan?.kabupaten,
    pengaturan?.provinsi,
    pengaturan?.kodePos,
  ].filter(Boolean).join(", ");

  // ─── Loading ────────────────────────────────────────────────────────────
  const LoadingSkeleton = (
    <div className="space-y-5 p-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-6 w-64 mx-auto" />
        <Skeleton className="h-4 w-80 mx-auto" />
        <Skeleton className="h-3 w-48 mx-auto" />
        <Skeleton className="h-1 w-full mt-2" />
      </div>
      <Skeleton className="h-5 w-56 mx-auto" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-8 w-full" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-full" />
      ))}
      <Skeleton className="h-5 w-40 mx-auto mt-4" />
      <Skeleton className="h-8 w-full" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-full" />
      ))}
    </div>
  );

  const ErrorState = error ? (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-red-600 mb-4">{error}</p>
      <Button variant="outline" size="sm" onClick={fetchData}>
        <Loader2 className="h-3.5 w-3.5 mr-1.5" /> Coba Lagi
      </Button>
    </div>
  ) : null;

  // ─── Print Content ────────────────────────────────────────────────────────
  const PrintContent = data ? (
    <div
      id="laporan-per-siswa-print-content"
      className="bg-white text-black"
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: "11px",
        lineHeight: "1.5",
        color: "#000",
        padding: "20px 24px",
      }}
    >
      {/* ─── KOP SURAT ──────────────────────────────────────── */}
      <div className="text-center mb-1">
        <p style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "0.5px", margin: 0 }}>
          {pengaturan?.namaSekolah || "NAMA SEKOLAH"}
        </p>
        <p style={{ fontSize: "11px", margin: "2px 0 0 0" }}>
          {alamatLengkap || "Alamat Sekolah"}
        </p>
        <p style={{ fontSize: "11px", margin: "2px 0 0 0" }}>
          NPSN: {pengaturan?.npsn || "XXXX"}
        </p>
      </div>
      <div style={{ borderTop: "3px solid #000", borderBottom: "1px solid #000", margin: "8px 0 12px 0", lineHeight: 0 }} />

      {/* ─── JUDUL ──────────────────────────────────────────── */}
      <div className="text-center mb-4">
        <p style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "1px", margin: 0, textTransform: "uppercase" }}>
          LAPORAN PENILAIAN SISWA
        </p>
      </div>

      {/* ─── DATA SISWA ─────────────────────────────────────── */}
      <div style={{ border: "1px solid #000", padding: "8px 12px", marginBottom: "12px", fontSize: "11px" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <tbody>
            <tr>
              <td style={{ width: "120px", padding: "2px 4px" }}>Nama Siswa</td>
              <td style={{ width: "10px", padding: "2px 4px" }}>:</td>
              <td style={{ padding: "2px 4px", fontWeight: 700 }}>{data.siswa.nama}</td>
              <td style={{ width: "80px", padding: "2px 4px" }}>NISN</td>
              <td style={{ width: "10px", padding: "2px 4px" }}>:</td>
              <td style={{ padding: "2px 4px" }}>{data.siswa.nisn || "-"}</td>
            </tr>
            <tr>
              <td style={{ padding: "2px 4px" }}>Kelas / Rombel</td>
              <td style={{ padding: "2px 4px" }}>:</td>
              <td style={{ padding: "2px 4px", fontWeight: 700 }}>{data.siswa.rombel}</td>
              <td style={{ padding: "2px 4px" }}>L/P</td>
              <td style={{ padding: "2px 4px" }}>:</td>
              <td style={{ padding: "2px 4px" }}>{data.siswa.jenisKelamin || "-"}</td>
            </tr>
            <tr>
              <td style={{ padding: "2px 4px" }}>Tahun Pelajaran</td>
              <td style={{ padding: "2px 4px" }}>:</td>
              <td style={{ padding: "2px 4px" }}>{tahunPelajaran} — Semester {semester}</td>
              <td style={{ padding: "2px 4px" }}>Hari Efektif</td>
              <td style={{ padding: "2px 4px" }}>:</td>
              <td style={{ padding: "2px 4px" }}>{data.kehadiran.totalHariEfektif} hari</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  SECTION 1: REKAP KEHADIRAN                             */}
      {/* ═══════════════════════════════════════════════════════ */}
      <p style={{ fontSize: "12px", fontWeight: 700, marginBottom: "6px", textTransform: "uppercase" }}>
        A. Rekap Kehadiran
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "12px" }}>
        <thead>
          <tr style={{ backgroundColor: "#d4d4d4", fontWeight: 700 }}>
            <th style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "center", width: "50px" }}>Hadir (H)</th>
            <th style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "center", width: "50px" }}>Sakit (S)</th>
            <th style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "center", width: "50px" }}>Izin (I)</th>
            <th style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "center", width: "50px" }}>Alpa (A)</th>
            <th style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "center", width: "50px" }}>%</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "center", color: getKodeColor("H"), fontWeight: 700 }}>
              {data.kehadiran.H}
            </td>
            <td style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "center", color: getKodeColor("S"), fontWeight: 700 }}>
              {data.kehadiran.S}
            </td>
            <td style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "center", color: getKodeColor("I"), fontWeight: 700 }}>
              {data.kehadiran.I}
            </td>
            <td style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "center", color: getKodeColor("A"), fontWeight: 700 }}>
              {data.kehadiran.A}
            </td>
            <td style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "center", fontWeight: 700 }}>
              {data.kehadiran.persentase}%
            </td>
          </tr>
        </tbody>
      </table>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  SECTION 2: RINCIAN KEHADIRAN                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <p style={{ fontSize: "12px", fontWeight: 700, marginBottom: "6px", textTransform: "uppercase" }}>
        B. Rincian Kehadiran Harian
      </p>
      {data.detailAbsensi.length === 0 ? (
        <div style={{ border: "1px solid #000", padding: "10px", textAlign: "center", fontStyle: "italic", color: "#666", marginBottom: "12px" }}>
          Belum ada data kehadiran untuk siswa ini.
        </div>
      ) : (
        <div style={{ marginBottom: "12px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
            <thead>
              <tr style={{ backgroundColor: "#e8e8e8", fontWeight: 600 }}>
                <th style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center", width: "30px" }}>No</th>
                <th style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center", width: "80px" }}>Tanggal</th>
                <th style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center", width: "40px" }}>Kode</th>
                <th style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "left" }}>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {data.detailAbsensi.map((d, idx) => (
                <tr key={d.tanggal + d.kodeAbsensi} className="print-avoid-break" style={{ backgroundColor: idx % 2 === 0 ? "#fff" : "#f9f9f9" }}>
                  <td style={{ border: "1px solid #000", padding: "2px 6px", textAlign: "center" }}>{idx + 1}</td>
                  <td style={{ border: "1px solid #000", padding: "2px 6px", textAlign: "center", whiteSpace: "nowrap" }}>
                    {formatTanggalIndo(d.tanggal)}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "2px 6px", textAlign: "center", fontWeight: 700, color: getKodeColor(d.kodeAbsensi) }}>
                    {d.kodeAbsensi}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "2px 6px" }}>{d.keterangan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  SECTION 3: CATATAN SISWA                               */}
      {/* ═══════════════════════════════════════════════════════ */}
      <p style={{ fontSize: "12px", fontWeight: 700, marginBottom: "6px", textTransform: "uppercase" }}>
        C. Catatan Siswa
      </p>
      {data.catatan.length === 0 ? (
        <div style={{ border: "1px solid #000", padding: "10px", textAlign: "center", fontStyle: "italic", color: "#666", marginBottom: "12px" }}>
          Tidak ada catatan untuk siswa ini.
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", marginBottom: "12px" }}>
          <thead>
            <tr style={{ backgroundColor: "#e8e8e8", fontWeight: 600 }}>
              <th style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center", width: "30px" }}>No</th>
              <th style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center", width: "70px" }}>Tanggal</th>
              <th style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center", width: "90px" }}>Kategori</th>
              <th style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "left" }}>Catatan</th>
              <th style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "left", width: "120px" }}>Tindak Lanjut</th>
            </tr>
          </thead>
          <tbody>
            {data.catatan.map((c, idx) => (
              <tr key={c.id} className="print-avoid-break" style={{ backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center" }}>{idx + 1}</td>
                <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center", whiteSpace: "nowrap" }}>
                  {formatTanggalIndo(c.tanggal)}
                </td>
                <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center" }}>{c.kategori}</td>
                <td style={{ border: "1px solid #000", padding: "3px 6px" }}>{c.catatan}</td>
                <td style={{ border: "1px solid #000", padding: "3px 6px" }}>{c.tindakan || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ─── FOOTER / TANDA TANGAN ───────────────────────────── */}
      <div style={{ marginTop: "32px" }}>
        <div className="flex justify-between">
          <div style={{ textAlign: "center", width: "45%" }}>
            <p style={{ fontSize: "11px", margin: 0 }}>Mengetahui,</p>
            <p style={{ fontSize: "11px", fontWeight: 700, margin: 0 }}>Kepala Sekolah</p>
            <div style={{ height: "60px" }} />
            <p style={{ fontSize: "11px", fontWeight: 700, textDecoration: "underline", margin: 0 }}>
              {pengaturan?.kepalaSekolah || "____________________"}
            </p>
            <p style={{ fontSize: "10px", margin: "2px 0 0 0" }}>
              NIP. {pengaturan?.nipKepsek || "...................."}
            </p>
          </div>
          <div style={{ textAlign: "center", width: "45%" }}>
            <p style={{ fontSize: "11px", margin: 0 }}>{"\u00A0"}</p>
            <p style={{ fontSize: "11px", fontWeight: 700, margin: 0 }}>Guru Kelas</p>
            <div style={{ height: "60px" }} />
            <p style={{ fontSize: "11px", fontWeight: 700, textDecoration: "underline", margin: 0 }}>
              ____________________
            </p>
            <p style={{ fontSize: "10px", margin: "2px 0 0 0" }}>
              NIP. ....................
            </p>
          </div>
        </div>
      </div>

      {/* ─── TANGGAL CETAK ──────────────────────────────────── */}
      <div style={{ marginTop: "16px", fontSize: "9px", textAlign: "right", color: "#888" }}>
        Dicetak pada: {formatTanggalIndo(tanggalCetak)}
      </div>
    </div>
  ) : null;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent
        className="max-w-[210mm] w-full h-[90vh] overflow-y-auto"
        showCloseButton={false}
        style={{ maxWidth: "210mm", padding: "0" }}
      >
        {/* Screen toolbar */}
        <div className="print:hidden flex items-center justify-between gap-2 p-3 border-b bg-white sticky top-0 z-10 rounded-t-lg">
          <DialogHeader className="p-0 gap-1">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Laporan: {siswaNama}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {rombel} · {tahunPelajaran} — Semester {semester}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button size="sm" onClick={handlePrint} disabled={isLoading || !!error} className="gap-1.5">
              <Printer className="h-3.5 w-3.5" />
              Cetak
            </Button>
            <Button variant="outline" size="sm" onClick={onClose} className="gap-1.5">
              <X className="h-3.5 w-3.5" />
              Tutup
            </Button>
          </div>
        </div>

        <div className="p-0">
          {isLoading && LoadingSkeleton}
          {!isLoading && ErrorState}
          {!isLoading && !error && PrintContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}
