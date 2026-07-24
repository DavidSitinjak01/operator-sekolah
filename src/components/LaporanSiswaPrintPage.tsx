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

interface LaporanSiswaPrintPageProps {
  open: boolean;
  onClose: () => void;
  rombel: string;
  tahunPelajaran: string;
  semester: string;
  mode: "kehadiran" | "catatan" | "lengkap";
}

interface KehadiranItem {
  siswaId: string;
  siswaNama: string;
  nisn: string;
  rombel: string;
  jenisKelamin: string;
  totalHariEfektif: number;
  H: number;
  S: number;
  I: number;
  A: number;
  persentase: number;
}

interface KehadiranResponse {
  rombel: string;
  tahunPelajaran: string;
  semester: string;
  tanggalCetak: string;
  totalHariEfektif: number;
  totalSiswa: number;
  totalLaki: number;
  totalPerempuan: number;
  avgPersentase: number;
  summary: KehadiranItem[];
}

interface CatatanDetail {
  id: string;
  tanggal: string;
  kategori: string;
  catatan: string;
  tindakan: string;
  dibuatOleh: string;
  createdAt: string;
}

interface CatatanSiswaItem {
  siswaId: string;
  siswaNama: string;
  nisn: string;
  rombel: string;
  catatan: CatatanDetail[];
}

interface CatatanResponse {
  rombel: string;
  tahunPelajaran: string;
  semester: string;
  tanggalCetak: string;
  totalCatatan: number;
  totalSiswaDenganCatatan: number;
  kategoriCount: Record<string, number>;
  summary: CatatanSiswaItem[];
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
  const hari = d.getDate();
  const bulan = BULAN_NAMES[d.getMonth()];
  const tahun = d.getFullYear();
  return `${hari} ${bulan} ${tahun}`;
}

function formatTanggalShort(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const hari = d.getDate();
  const bulan = BULAN_NAMES[d.getMonth()];
  const tahun = d.getFullYear();
  return `${hari} ${bulan} ${tahun}`;
}

function getReportTitle(mode: "kehadiran" | "catatan" | "lengkap"): string {
  switch (mode) {
    case "kehadiran":
      return "LAPORAN KEHADIRAN SISWA";
    case "catatan":
      return "LAPORAN CATATAN SISWA";
    case "lengkap":
      return "LAPORAN KENAIKAN KELAS";
  }
}

// Kategori style for print — monochrome, using bold/italic
function getKategoriPrintStyle(kategori: string): React.CSSProperties {
  switch (kategori) {
    case "Perilaku Positif":
      return { fontWeight: 700 };
    case "Perilaku Negatif":
      return { fontWeight: 700, fontStyle: "italic" };
    case "Akademik":
      return { textDecoration: "underline" };
    case "Kedisiplinan":
      return { fontWeight: 700 };
    case "Prestasi":
      return { fontWeight: 700, fontStyle: "italic" };
    default:
      return {};
  }
}

// ─── Print Styles (injected once) ──────────────────────────────────────────

let printStylesInjected = false;

function injectPrintStyles() {
  if (printStylesInjected || typeof document === "undefined") return;
  printStylesInjected = true;
  const style = document.createElement("style");
  style.id = "laporan-print-styles";
  style.textContent = `
    @media print {
      /* Hide everything except the print content */
      body * {
        visibility: hidden !important;
      }
      #laporan-print-content,
      #laporan-print-content * {
        visibility: visible !important;
      }
      #laporan-print-content {
        position: static !important;
        left: auto !important;
        top: auto !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 10mm !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        overflow: visible !important;
        max-height: none !important;
        background: white !important;
      }
      /* Remove dialog overlay */
      [data-slot="dialog-overlay"],
      [data-slot="dialog-close"] {
        display: none !important;
      }
      /* Remove non-print controls */
      .print\\:hidden {
        display: none !important;
      }
      /* Page setup */
      @page {
        size: A4 portrait;
        margin: 15mm 15mm 20mm 20mm;
      }
      /* Avoid breaking inside rows */
      .print-avoid-break {
        break-inside: avoid;
      }
      /* Table borders in print */
      table {
        border-collapse: collapse;
      }
      /* Ensure no overlap for catatan sections */
      .print-avoid-break + .print-avoid-break {
        page-break-inside: avoid;
      }
      /* Force display:block on flex children inside print area */
      #laporan-print-content .flex {
        display: block !important;
      }
      #laporan-print-content .space-y-4 > * {
        display: block !important;
        page-break-inside: avoid;
      }
    }
  `;
  document.head.appendChild(style);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function LaporanSiswaPrintPage({
  open,
  onClose,
  rombel,
  tahunPelajaran,
  semester,
  mode,
}: LaporanSiswaPrintPageProps) {
  // ─── State ──────────────────────────────────────────────────────────────
  const [kehadiranData, setKehadiranData] = useState<KehadiranResponse | null>(null);
  const [catatanData, setCatatanData] = useState<CatatanResponse | null>(null);
  const [pengaturan, setPengaturan] = useState<PengaturanData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showKehadiran = mode === "kehadiran" || mode === "lengkap";
  const showCatatan = mode === "catatan" || mode === "lengkap";

  // ─── Fetch data when dialog opens ──────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!rombel) return;
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        tahunPelajaran,
        semester,
        rombel,
      });

      // Always fetch pengaturan
      const pengaturanRes = await fetch("/api/pengaturan");
      if (pengaturanRes.ok) {
        const p = await pengaturanRes.json();
        setPengaturan(p as PengaturanData);
      }

      // Fetch kehadiran if needed
      if (showKehadiran) {
        const kehadiranRes = await fetch(`/api/catatan-siswa/laporan?${params}`);
        if (!kehadiranRes.ok) throw new Error("Gagal memuat data kehadiran");
        const kd = await kehadiranRes.json();
        setKehadiranData(kd as KehadiranResponse);
      }

      // Fetch catatan if needed
      if (showCatatan) {
        const catatanRes = await fetch(`/api/laporan-catatan?${params}`);
        if (!catatanRes.ok) throw new Error("Gagal memuat data catatan");
        const cd = await catatanRes.json();
        setCatatanData(cd as CatatanResponse);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  }, [rombel, tahunPelajaran, semester, showKehadiran, showCatatan]);

  useEffect(() => {
    if (open) {
      injectPrintStyles();
      fetchData();
    } else {
      // Reset data when closed
      setKehadiranData(null);
      setCatatanData(null);
      setError(null);
    }
  }, [open, fetchData]);

  // ─── Print handler ──────────────────────────────────────────────────────
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ─── Compute values ────────────────────────────────────────────────────
  const tanggalCetak =
    kehadiranData?.tanggalCetak ||
    catatanData?.tanggalCetak ||
    new Date().toISOString();

  const totalSiswa = kehadiranData?.totalSiswa ?? 0;
  const totalLaki = kehadiranData?.totalLaki ?? 0;
  const totalPerempuan = kehadiranData?.totalPerempuan ?? 0;
  const avgPersentase = kehadiranData?.avgPersentase ?? 0;

  const alamatLengkap = [
    pengaturan?.alamat,
    pengaturan?.kecamatan,
    pengaturan?.kabupaten,
    pengaturan?.provinsi,
    pengaturan?.kodePos,
  ]
    .filter(Boolean)
    .join(", ");

  // ─── Loading Skeleton ──────────────────────────────────────────────────
  const LoadingSkeleton = (
    <div className="space-y-6 p-6" aria-busy="true" aria-label="Memuat laporan...">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-64 mx-auto" />
        <Skeleton className="h-4 w-80 mx-auto" />
        <Skeleton className="h-3 w-48 mx-auto" />
        <Skeleton className="h-1 w-full mt-2" />
      </div>
      {/* Title skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-56 mx-auto" />
        <Skeleton className="h-4 w-72 mx-auto" />
      </div>
      {/* Table skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-full" />
        ))}
        <Skeleton className="h-8 w-full" />
      </div>
      {/* Footer skeleton */}
      <div className="flex justify-between mt-8">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-40 mt-4" />
          <Skeleton className="h-3 w-36" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-40 mt-4" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
    </div>
  );

  // ─── Error State ───────────────────────────────────────────────────────
  const ErrorState = error ? (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-red-600 mb-4">{error}</p>
      <Button variant="outline" size="sm" onClick={fetchData}>
        <Loader2 className="h-3.5 w-3.5 mr-1.5" /> Coba Lagi
      </Button>
    </div>
  ) : null;

  // ═════════════════════════════════════════════════════════════════════════
  // PRINT CONTENT
  // ═════════════════════════════════════════════════════════════════════════
  const PrintContent = (
    <div
      id="laporan-print-content"
      className="bg-white text-black"
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: "11px",
        lineHeight: "1.5",
        color: "#000",
        padding: "20px 24px",
      }}
    >
      {/* ─── KOP SURAT ──────────────────────────────────────────────── */}
      <div className="text-center mb-1">
        <p
          style={{
            fontSize: "16px",
            fontWeight: 700,
            letterSpacing: "0.5px",
            margin: 0,
          }}
        >
          {pengaturan?.namaSekolah || "NAMA SEKOLAH"}
        </p>
        <p
          style={{
            fontSize: "11px",
            margin: "2px 0 0 0",
          }}
        >
          {alamatLengkap || "Alamat Sekolah"}
        </p>
        <p
          style={{
            fontSize: "11px",
            margin: "2px 0 0 0",
          }}
        >
          NPSN: {pengaturan?.npsn || "XXXX"}
        </p>
      </div>
      {/* Double line separator */}
      <div
        style={{
          borderTop: "3px solid #000",
          borderBottom: "1px solid #000",
          margin: "8px 0 12px 0",
          lineHeight: 0,
        }}
      />

      {/* ─── JUDUL ──────────────────────────────────────────────────── */}
      <div className="text-center mb-4">
        <p
          style={{
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "1px",
            margin: 0,
            textTransform: "uppercase",
          }}
        >
          {getReportTitle(mode)}
        </p>
        <p style={{ fontSize: "12px", margin: "6px 0 2px 0" }}>
          Kelas: <strong>{rombel}</strong>
        </p>
        <p style={{ fontSize: "12px", margin: 0 }}>
          Tahun Pelajaran: <strong>{tahunPelajaran}</strong>{"  —  "}
          Semester: <strong>{semester}</strong>
        </p>
      </div>

      {/* ─── INFO SINGKAT (for lengkap mode) ─────────────────────────── */}
      {mode === "lengkap" && kehadiranData && (
        <div
          className="mb-3"
          style={{
            fontSize: "10px",
            border: "1px solid #000",
            padding: "6px 10px",
          }}
        >
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <tbody>
              <tr>
                <td style={{ width: "45%", padding: "1px 0" }}>
                  Total Siswa: <strong>{totalSiswa}</strong>{" "}
                  (L: {totalLaki}, P: {totalPerempuan})
                </td>
                <td style={{ width: "55%", padding: "1px 0" }}>
                  Total Hari Efektif: <strong>{kehadiranData.totalHariEfektif}</strong>{"  |  "}
                  Rata-rata Kehadiran: <strong>{avgPersentase}%</strong>
                </td>
              </tr>
              {catatanData && (
                <tr>
                  <td style={{ padding: "1px 0" }} colSpan={2}>
                    Total Catatan: <strong>{catatanData.totalCatatan}</strong>{" "}
                    (Siswa dengan catatan: <strong>{catatanData.totalSiswaDenganCatatan}</strong>)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  KEHADIRAN SECTION                                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showKehadiran && kehadiranData && (
        <div className={cn(mode === "lengkap" && "mb-6")}>
          {/* Section title for non-lengkap mode */}
          {mode === "kehadiran" && (
            <div className="mb-2" style={{ fontSize: "10px" }}>
              Total Siswa: {totalSiswa} (L: {totalLaki}, P: {totalPerempuan}){"  |  "}
              Hari Efektif: {kehadiranData.totalHariEfektif}
            </div>
          )}

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "10px",
            }}
          >
            {/* Header */}
            <thead>
              <tr style={{ backgroundColor: "#d4d4d4", fontWeight: 700 }}>
                <th style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center", width: "30px" }}>No</th>
                <th style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "left" }}>Nama Siswa</th>
                <th style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center", width: "24px" }}>L</th>
                <th style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center", width: "24px" }}>P</th>
                <th style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center", width: "30px" }}>H</th>
                <th style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center", width: "30px" }}>S</th>
                <th style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center", width: "30px" }}>I</th>
                <th style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center", width: "30px" }}>A</th>
                <th style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center", width: "40px" }}>%</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {kehadiranData.summary.map((siswa, idx) => (
                <tr
                  key={siswa.siswaId}
                  className="print-avoid-break"
                  style={{ backgroundColor: idx % 2 === 0 ? "#fff" : "#f9f9f9" }}
                >
                  <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center" }}>{idx + 1}</td>
                  <td style={{ border: "1px solid #000", padding: "3px 6px", height: "18px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "180px" }}>{siswa.siswaNama}</td>
                  <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center" }}>{siswa.jenisKelamin === "L" ? "\u2713" : ""}</td>
                  <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center" }}>{siswa.jenisKelamin === "P" ? "\u2713" : ""}</td>
                  <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center" }}>{siswa.H}</td>
                  <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center" }}>{siswa.S}</td>
                  <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center" }}>{siswa.I}</td>
                  <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center" }}>{siswa.A}</td>
                  <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center", fontWeight: 600 }}>{siswa.persentase}</td>
                </tr>
              ))}
            </tbody>

            {/* Summary row */}
            <tfoot>
              <tr style={{ backgroundColor: "#e5e5e5", fontWeight: 700 }}>
                <td colSpan={4} style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "right" }}>Rata-rata</td>
                <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center" }}>
                  {kehadiranData.summary.length > 0
                    ? Math.round(kehadiranData.summary.reduce((a, b) => a + b.H, 0) / kehadiranData.summary.length)
                    : 0}
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center" }}>
                  {kehadiranData.summary.length > 0
                    ? Math.round(kehadiranData.summary.reduce((a, b) => a + b.S, 0) / kehadiranData.summary.length)
                    : 0}
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center" }}>
                  {kehadiranData.summary.length > 0
                    ? Math.round(kehadiranData.summary.reduce((a, b) => a + b.I, 0) / kehadiranData.summary.length)
                    : 0}
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center" }}>
                  {kehadiranData.summary.length > 0
                    ? Math.round(kehadiranData.summary.reduce((a, b) => a + b.A, 0) / kehadiranData.summary.length)
                    : 0}
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center" }}>{kehadiranData.avgPersentase}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  CATATAN SISWA SECTION                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showCatatan && catatanData && (
        <div>
          {/* Section title for non-lengkap mode */}
          {mode === "catatan" && (
            <div className="mb-2" style={{ fontSize: "10px" }}>
              Total Catatan: {catatanData.totalCatatan}{"  |  "}
              Siswa dengan Catatan: {catatanData.totalSiswaDenganCatatan}
            </div>
          )}

          {/* Section divider for lengkap mode */}
          {mode === "lengkap" && (
            <div style={{ borderTop: "2px solid #000", margin: "12px 0 10px 0" }} />
          )}

          {/* Section sub-heading for lengkap mode */}
          {mode === "lengkap" && (
            <p style={{ fontSize: "12px", fontWeight: 700, marginBottom: "8px", textAlign: "center", textTransform: "uppercase" }}>
              Catatan Siswa
            </p>
          )}

          {catatanData.summary.length === 0 ? (
            <div style={{ border: "1px solid #000", padding: "12px", textAlign: "center", fontStyle: "italic", color: "#666" }}>
              Tidak ada catatan untuk siswa di kelas ini.
            </div>
          ) : (
            <div style={{ display: "block" }}>
              {catatanData.summary.map((siswa, sIdx) => (
                <div key={siswa.siswaId || sIdx} className="print-avoid-break" style={{ marginBottom: "12px" }}>
                  {/* Student name sub-header */}
                  <div
                    style={{
                      backgroundColor: "#f0f0f0",
                      border: "1px solid #000",
                      borderBottom: "none",
                      padding: "4px 8px",
                      fontWeight: 700,
                      fontSize: "11px",
                    }}
                  >
                    {siswa.siswaNama}
                    {siswa.nisn && (
                      <span style={{ fontWeight: 400, marginLeft: "8px", fontSize: "10px", color: "#555" }}>
                        NISN: {siswa.nisn}
                      </span>
                    )}
                  </div>

                  {siswa.catatan.length === 0 ? (
                    <div style={{ border: "1px solid #000", borderTop: "none", padding: "8px", fontStyle: "italic", color: "#666", fontSize: "10px" }}>
                      Tidak ada catatan untuk siswa ini.
                    </div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
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
                        {siswa.catatan.map((c, idx) => (
                          <tr
                            key={c.id}
                            className="print-avoid-break"
                            style={{ backgroundColor: idx % 2 === 0 ? "#fff" : "fafafa" }}
                          >
                            <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center" }}>{idx + 1}</td>
                            <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center", whiteSpace: "nowrap" }}>{formatTanggalShort(c.tanggal)}</td>
                            <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center", ...getKategoriPrintStyle(c.kategori) }}>{c.kategori}</td>
                            <td style={{ border: "1px solid #000", padding: "3px 6px" }}>{c.catatan}</td>
                            <td style={{ border: "1px solid #000", padding: "3px 6px" }}>{c.tindakan || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── FOOTER / TANDA TANGAN ───────────────────────────────────── */}
      <div style={{ marginTop: "32px" }}>
        <div className="flex justify-between" style={{ display: "flex" }}>
          {/* Kepala Sekolah */}
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

          {/* Guru Kelas */}
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

      {/* ─── TANGGAL CETAK ──────────────────────────────────────────── */}
      <div style={{ marginTop: "16px", fontSize: "9px", textAlign: "right", color: "#888" }}>
        Dicetak pada: {formatTanggalIndo(tanggalCetak)}
      </div>
    </div>
  );

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) onClose();
      }}
    >
      <DialogContent
        className="max-w-[210mm] w-full h-[90vh] overflow-y-auto"
        showCloseButton={false}
        style={{
          maxWidth: "210mm",
          padding: "0",
        }}
      >
        {/* Screen-only toolbar */}
        <div className="print:hidden flex items-center justify-between gap-2 p-3 border-b bg-white sticky top-0 z-10 rounded-t-lg">
          <DialogHeader className="p-0 gap-1">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Printer className="h-4 w-4" />
              {getReportTitle(mode)} — {rombel}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Pratinjau laporan sebelum mencetak
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              onClick={handlePrint}
              disabled={isLoading || !!error}
              className="gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              Cetak
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Tutup
            </Button>
          </div>
        </div>

        {/* Content area */}
        <div className="p-0">
          {isLoading && LoadingSkeleton}
          {!isLoading && ErrorState}
          {!isLoading && !error && PrintContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}
