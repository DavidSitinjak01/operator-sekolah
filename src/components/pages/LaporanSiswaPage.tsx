"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, Printer, ClipboardCheck, BookOpenCheck, ChevronDown,
  Users, Loader2, AlertCircle, UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/app";
import { cn } from "@/lib/utils";
import LaporanSiswaPrintPage from "@/components/LaporanSiswaPrintPage";
import LaporanPerSiswaPrintPage from "@/components/LaporanPerSiswaPrintPage";

// ─── Types ─────────────────────────────────────────────────────────────────
type ReportMode = "kehadiran" | "catatan" | "lengkap";

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

// ─── Helpers ───────────────────────────────────────────────────────────────
function getPersentaseColor(pct: number): string {
  if (pct >= 90) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (pct >= 75) return "text-amber-600 bg-amber-50 border-amber-200";
  if (pct >= 50) return "text-orange-600 bg-orange-50 border-orange-200";
  return "text-red-600 bg-red-50 border-red-200";
}

const KATEGORI_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Perilaku Positif": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "Perilaku Negatif": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  "Akademik": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  "Kedisiplinan": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "Prestasi": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  "Lainnya": { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
};

function getKategoriColor(kategori: string) {
  return KATEGORI_COLORS[kategori] || KATEGORI_COLORS["Lainnya"];
}

// ─── Student List Card with per-student print ────────────────────────────────
function DaftarSiswaCard({
  kehadiranData,
  catatanData,
  onPrintSiswa,
}: {
  kehadiranData: KehadiranResponse | null;
  catatanData: CatatanResponse | null;
  onPrintSiswa: (siswaId: string, siswaNama: string, nisn: string) => void;
}) {
  if (!kehadiranData) return null;

  // Build catatan count map
  const catatanCountMap = new Map<string, number>();
  if (catatanData) {
    for (const s of catatanData.summary) {
      catatanCountMap.set(s.siswaId, s.catatan.length);
    }
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-violet-600" />
            Daftar Siswa — Cetak Per Siswa
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {kehadiranData.summary.length} siswa
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Klik ikon cetak untuk mencetak laporan individual siswa (kehadiran + catatan)
        </p>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-1">
            {kehadiranData.summary.map((siswa, idx) => {
              const catatanCount = catatanCountMap.get(siswa.siswaId) || 0;
              return (
                <div
                  key={siswa.siswaId}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors group"
                >
                  <span className="text-xs font-medium text-muted-foreground w-6 text-center">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{siswa.siswaNama}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-emerald-600">H:{siswa.H}</span>
                      <span className="text-[10px] text-amber-600">S:{siswa.S}</span>
                      <span className="text-[10px] text-blue-600">I:{siswa.I}</span>
                      <span className="text-[10px] text-red-600">A:{siswa.A}</span>
                      {catatanCount > 0 && (
                        <span className="text-[10px] text-violet-600">Catatan:{catatanCount}</span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] font-semibold px-1.5 py-0 shrink-0", getPersentaseColor(siswa.persentase))}
                  >
                    {siswa.persentase}%
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
                    onClick={() => onPrintSiswa(siswa.siswaId, siswa.siswaNama, siswa.nisn)}
                    title={`Cetak laporan ${siswa.siswaNama}`}
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Kehadiran Summary Card ────────────────────────────────────────────────
function KehadiranSummaryCard({ data }: { data: KehadiranResponse | null }) {
  if (!data) return null;
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-emerald-600" />
          Rekap Kehadiran
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
            <p className="text-2xl font-bold text-emerald-700">{data.totalSiswa}</p>
            <p className="text-[11px] text-emerald-600">Total Siswa</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-sky-50 border border-sky-100">
            <p className="text-2xl font-bold text-sky-700">{data.totalHariEfektif}</p>
            <p className="text-[11px] text-sky-600">Hari Efektif</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-violet-50 border border-violet-100">
            <p className="text-2xl font-bold text-violet-700">{data.avgPersentase}%</p>
            <p className="text-[11px] text-violet-600">Rata-rata Hadir</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex justify-center gap-3 text-xs">
              <span className="text-slate-500">L: <strong>{data.totalLaki}</strong></span>
              <span className="text-slate-500">P: <strong>{data.totalPerempuan}</strong></span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Jenis Kelamin</p>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto">
          <div className="space-y-1.5">
            {data.summary.map((siswa, idx) => (
              <div
                key={siswa.siswaId}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
              >
                <span className="text-xs font-medium text-muted-foreground w-6 text-center">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{siswa.siswaNama}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-emerald-600">H:{siswa.H}</span>
                    <span className="text-[10px] text-amber-600">S:{siswa.S}</span>
                    <span className="text-[10px] text-blue-600">I:{siswa.I}</span>
                    <span className="text-[10px] text-red-600">A:{siswa.A}</span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn("text-xs font-semibold px-2 py-0.5 shrink-0", getPersentaseColor(siswa.persentase))}
                >
                  {siswa.persentase}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Catatan Siswa Summary Card ────────────────────────────────────────────
function CatatanSummaryCard({ data }: { data: CatatanResponse | null }) {
  if (!data) return null;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            Catatan Siswa
          </CardTitle>
          <div className="flex items-center gap-1.5 flex-wrap">
            {Object.entries(data.kategoriCount).map(([kat, count]) => {
              const color = getKategoriColor(kat);
              return (
                <Badge key={kat} variant="outline" className={cn("text-[10px] px-1.5 py-0", color.bg, color.text, color.border)}>
                  {kat}: {count}
                </Badge>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-100">
            <p className="text-2xl font-bold text-blue-700">{data.totalCatatan}</p>
            <p className="text-[11px] text-blue-600">Total Catatan</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-violet-50 border border-violet-100">
            <p className="text-2xl font-bold text-violet-700">{data.totalSiswaDenganCatatan}</p>
            <p className="text-[11px] text-violet-600">Siswa dengan Catatan</p>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto">
          <div className="space-y-2">
            {data.summary.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Tidak ada catatan untuk siswa di kelas ini.
              </div>
            ) : (
              data.summary.map((siswa) => (
                <div key={siswa.siswaId} className="rounded-lg border border-border/50 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
                    <span className="text-sm font-medium">{siswa.siswaNama}</span>
                    {siswa.nisn && (
                      <span className="text-[10px] text-muted-foreground">NISN: {siswa.nisn}</span>
                    )}
                    <Badge variant="outline" className="ml-auto text-[10px]">
                      {siswa.catatan.length} catatan
                    </Badge>
                  </div>
                  <div className="px-3 py-1.5 space-y-1">
                    {siswa.catatan.map((c) => {
                      const catColor = getKategoriColor(c.kategori);
                      return (
                        <div key={c.id} className="flex items-start gap-2 py-1">
                          <Badge variant="outline" className={cn("text-[9px] px-1 py-0 shrink-0 mt-0.5", catColor.bg, catColor.text, catColor.border)}>
                            {c.kategori}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs leading-relaxed">{c.catatan}</p>
                            {c.tindakan && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Tindak lanjut: {c.tindakan}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function LaporanSiswaPage() {
  const { tahunPelajaran, semester } = useAppStore();
  // ─── State ──────────────────────────────────────────────────────────────
  const [selectedRombel, setSelectedRombel] = useState("");
  const [reportMode, setReportMode] = useState<ReportMode>("lengkap");
  const [laporanOpen, setLaporanOpen] = useState(false);

  // Per-student print state
  const [printSiswa, setPrintSiswa] = useState<{
    siswaId: string;
    siswaNama: string;
    nisn: string;
  } | null>(null);

  // ─── Fetch rombel list ──────────────────────────────────────────────────
  const { data: rombelList = [], isLoading: rombelLoading } = useQuery({
    queryKey: ["absensi-rombel", tahunPelajaran, semester],
    queryFn: async () => {
      const res = await fetch(`/api/siswa/rombel?tahunPelajaran=${tahunPelajaran}&semester=${semester}`);
      if (!res.ok) return [];
      return res.json() as Promise<string[]>;
    },
    enabled: !!tahunPelajaran,
  });

  // ─── Fetch kehadiran data for preview ────────────────────────────────────
  const { data: kehadiranData, isLoading: kehadiranLoading, error: kehadiranError } = useQuery({
    queryKey: ["laporan-kehadiran", tahunPelajaran, semester, selectedRombel],
    queryFn: async () => {
      const params = new URLSearchParams({ tahunPelajaran, semester, rombel: selectedRombel });
      const res = await fetch(`/api/catatan-siswa/laporan?${params}`);
      if (!res.ok) throw new Error("Gagal memuat data kehadiran");
      return res.json() as Promise<KehadiranResponse>;
    },
    enabled: !!selectedRombel,
  });

  // ─── Fetch catatan data for preview ───────────────────────────────────────
  const { data: catatanData, isLoading: catatanLoading, error: catatanError } = useQuery({
    queryKey: ["laporan-catatan", tahunPelajaran, semester, selectedRombel],
    queryFn: async () => {
      const params = new URLSearchParams({ tahunPelajaran, semester, rombel: selectedRombel });
      const res = await fetch(`/api/laporan-catatan?${params}`);
      if (!res.ok) throw new Error("Gagal memuat data catatan");
      return res.json() as Promise<CatatanResponse>;
    },
    enabled: !!selectedRombel,
  });

  const showKehadiran = reportMode === "kehadiran" || reportMode === "lengkap";
  const showCatatan = reportMode === "catatan" || reportMode === "lengkap";

  const isLoading = kehadiranLoading || catatanLoading;

  const effectiveRombel = selectedRombel;

  // ─── Report mode config ──────────────────────────────────────────────────
  const reportModeConfig: Record<ReportMode, { label: string; description: string; icon: React.ReactNode }> = {
    kehadiran: {
      label: "Kehadiran",
      description: "Rekap absensi H, S, I, A per siswa",
      icon: <ClipboardCheck className="h-4 w-4" />,
    },
    catatan: {
      label: "Catatan Siswa",
      description: "Perilaku, akademik, kedisiplinan",
      icon: <FileText className="h-4 w-4" />,
    },
    lengkap: {
      label: "Laporan Kenaikan Kelas",
      description: "Kehadiran + Catatan lengkap",
      icon: <BookOpenCheck className="h-4 w-4" />,
    },
  };

  const handlePrintSiswa = (siswaId: string, siswaNama: string, nisn: string) => {
    setPrintSiswa({ siswaId, siswaNama, nisn });
  };

  return (
    <div className="space-y-6">
      {/* ─── Page Header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <BookOpenCheck className="h-6 w-6 text-primary" />
          Laporan Penilaian Siswa
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cetak laporan gabungan kehadiran dan catatan siswa — per kelas atau per siswa individual
        </p>
      </div>

      {/* ─── Filters ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
        <div className="flex-1 w-full sm:w-auto space-y-1.5">
          <Label className="text-xs font-medium">Pilih Rombel / Kelas</Label>
          <Select value={selectedRombel} onValueChange={setSelectedRombel}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={rombelLoading ? "Memuat..." : "Pilih kelas..."} />
            </SelectTrigger>
            <SelectContent>
              {rombelList.map((r: string) => (
                <SelectItem key={r} value={r}>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    {r}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Jenis Laporan</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 min-w-[200px] justify-between">
                <span className="flex items-center gap-2">
                  {reportModeConfig[reportMode].icon}
                  <span className="text-sm">{reportModeConfig[reportMode].label}</span>
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {(Object.keys(reportModeConfig) as ReportMode[]).map((mode) => {
                const config = reportModeConfig[mode];
                const isActive = reportMode === mode;
                return (
                  <DropdownMenuItem
                    key={mode}
                    onClick={() => setReportMode(mode)}
                    className={cn("gap-3 p-3", isActive && "bg-accent")}
                  >
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-lg",
                      mode === "kehadiran" && "bg-emerald-50 text-emerald-600",
                      mode === "catatan" && "bg-blue-50 text-blue-600",
                      mode === "lengkap" && "bg-purple-50 text-purple-600",
                    )}>
                      {config.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{config.label}</p>
                      <p className="text-[10px] text-muted-foreground">{config.description}</p>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button
          onClick={() => setLaporanOpen(true)}
          disabled={!selectedRombel || isLoading}
          className="gap-2 shrink-0"
        >
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">Cetak Per Kelas</span>
          <span className="sm:hidden">Cetak</span>
        </Button>
      </div>

      {/* ─── Quick info for selected rombel ─────────────────────────── */}
      {!selectedRombel && (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-xl">
          <BookOpenCheck className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-base font-semibold text-muted-foreground">Pilih Kelas</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Silakan pilih rombel/kelas untuk melihat pratinjau laporan penilaian siswa
          </p>
        </div>
      )}

      {/* ─── Loading State ───────────────────────────────────────────── */}
      {isLoading && selectedRombel && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      )}

      {/* ─── Error State ─────────────────────────────────────────────── */}
      {!isLoading && selectedRombel && (kehadiranError || catatanError) && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">Gagal memuat data</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {kehadiranError?.message || catatanError?.message || "Terjadi kesalahan"}
            </p>
          </div>
        </div>
      )}

      {/* ─── Daftar Siswa with per-student print ───────────────────────── */}
      {!isLoading && selectedRombel && kehadiranData && (
        <DaftarSiswaCard
          kehadiranData={kehadiranData}
          catatanData={catatanData ?? null}
          onPrintSiswa={handlePrintSiswa}
        />
      )}

      {/* ─── Kehadiran Preview ───────────────────────────────────────── */}
      {!isLoading && selectedRombel && showKehadiran && (
        <KehadiranSummaryCard data={kehadiranData ?? null} />
      )}

      {/* ─── Catatan Preview ─────────────────────────────────────────── */}
      {!isLoading && selectedRombel && showCatatan && (
        <CatatanSummaryCard data={catatanData ?? null} />
      )}

      {/* ─── Legend ────────────────────────────────────────────────────── */}
      {selectedRombel && showKehadiran && kehadiranData && !isLoading && (
        <div className="flex items-center gap-4 flex-wrap px-1">
          <span className="text-xs text-muted-foreground">Keterangan:</span>
          {[
            { pct: 95, label: "Sangat Baik" },
            { pct: 80, label: "Baik" },
            { pct: 60, label: "Cukup" },
            { pct: 30, label: "Kurang" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", getPersentaseColor(item.pct))}>
                {item.pct}%
              </Badge>
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ─── Print Dialog (per kelas) ────────────────────────────────── */}
      <LaporanSiswaPrintPage
        open={laporanOpen}
        onClose={() => setLaporanOpen(false)}
        rombel={effectiveRombel}
        tahunPelajaran={tahunPelajaran}
        semester={semester}
        mode={reportMode}
      />

      {/* ─── Print Dialog (per siswa) ────────────────────────────────── */}
      {printSiswa && (
        <LaporanPerSiswaPrintPage
          open={!!printSiswa}
          onClose={() => setPrintSiswa(null)}
          siswaId={printSiswa.siswaId}
          siswaNama={printSiswa.siswaNama}
          nisn={printSiswa.nisn}
          rombel={effectiveRombel}
          tahunPelajaran={tahunPelajaran}
          semester={semester}
        />
      )}
    </div>
  );
}
