"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardCheck, ChevronLeft, ChevronRight, Save, Printer,
  Download, Trash2, Settings2, Loader2, Users, BookOpenCheck,
  RotateCcw, X, Check, CalendarOff, Plus, Pencil, Upload, UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/app";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────
interface SiswaListItem {
  id: string;
  no: string;
  nama: string;
  nisn: string;
  rombel: string;
  jenisKelamin: string;
}

interface AbsensiItem {
  id: string;
  siswaId: string;
  siswaNama: string;
  nisn: string;
  rombel: string;
  tanggal: string;
  kodeAbsensi: string;
  tahunPelajaran: string;
  semester: string;
}

interface HariLiburItem {
  id: string;
  tanggal: string;
  label: string;
  kategori: string;
  tahunPelajaran: string;
}

// Color per holiday category — sesuai legend Kalender Pendidikan (10 warna)
const KATEGORI_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Libur Nasional":          { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" },   // 1. 🔴 Merah — Libur umum & nasional
  "Libur Semester":          { bg: "#FFF7ED", text: "#9A3412", border: "#FED7AA" },   // 2. 🟠 Oranye Muda — Libur semester
  "Asesmen":                 { bg: "#DCFCE7", text: "#166534", border: "#86EFAC" },   // 3. 🟢 Hijau — Asesmen / Ujian
  "Hari Pertama Masuk":      { bg: "#DBEAFE", text: "#1E3A5F", border: "#93C5FD" },   // 4. 🔵 Biru Tua — Hari pertama masuk sekolah
  "Penyerahan Rapor":        { bg: "#FEF08A", text: "#854D0E", border: "#FDE047" },   // 5. 🟡 Kuning — Penyerahan rapor & kelulusan
  "Weekend":                 { bg: "#FED7AA", text: "#78350F", border: "#FDBA74" },   // 6. 🟤 Oranye/Coklat — Tidak termasuk 5 hari kerja
  "Perkiraan TKA":           { bg: "#CFFAFE", text: "#155E75", border: "#67E8F9" },   // 7. 🩵 Cyan/Biru Muda — Perkiraan pelaksanaan TKA
  "Hari Pendidikan Nasional":{ bg: "#E9D5FF", text: "#581C87", border: "#C084FC" },   // 8. 🟣 Ungu — Hari Pendidikan Nasional
  "Libur Khusus":            { bg: "#FCE7F3", text: "#9D174D", border: "#F9A8D4" },   // 9. 🩷 Pink — Libur khusus
  "Hari Guru":               { bg: "#FEF9C3", text: "#A16207", border: "#FDE68A" },   // 10. 🟨 Kuning Muda — Hari Guru (tidak libur)
};

// Kategori yang BLOK input absensi (hari tidak efektif)
const BLOCK_CATEGORIES = ["Libur Nasional", "Libur Khusus", "Libur Semester", "Penyerahan Rapor", "Hari Pendidikan Nasional", "Weekend"];

// Kategori yang TIDAK BLOK (masih bisa input, tapi ditandai warna khusus)
const NON_BLOCK_CATEGORIES = ["Asesmen", "Perkiraan TKA", "Hari Pertama Masuk", "Hari Guru"];

// Legend items for display
const KALENDER_LEGEND: { kategori: string; label: string; colorKey: string }[] = [
  { kategori: "Libur Nasional", label: "Libur Umum & Nasional", colorKey: "Libur Nasional" },
  { kategori: "Libur Semester", label: "Libur Semester", colorKey: "Libur Semester" },
  { kategori: "Asesmen", label: "Asesmen / Ujian", colorKey: "Asesmen" },
  { kategori: "Hari Pertama Masuk", label: "Hari Pertama Masuk Sekolah", colorKey: "Hari Pertama Masuk" },
  { kategori: "Penyerahan Rapor", label: "Penyerahan Rapor & Kelulusan", colorKey: "Penyerahan Rapor" },
  { kategori: "Weekend", label: "Tidak Termasuk 5 Hari Kerja", colorKey: "Weekend" },
  { kategori: "Perkiraan TKA", label: "Perkiraan Pelaksanaan TKA", colorKey: "Perkiraan TKA" },
  { kategori: "Hari Pendidikan Nasional", label: "Hari Pendidikan Nasional", colorKey: "Hari Pendidikan Nasional" },
  { kategori: "Libur Khusus", label: "Libur Khusus", colorKey: "Libur Khusus" },
  { kategori: "Hari Guru", label: "Hari Guru (Tidak Libur)", colorKey: "Hari Guru" },
];

function getLiburColor(kategori: string) {
  return KATEGORI_COLORS[kategori] || { bg: "#F5F3FF", text: "#5B21B6", border: "#DDD6FE" };
}

function isBlockedCategory(kategori: string): boolean {
  return BLOCK_CATEGORIES.includes(kategori);
}

function isNonBlockedCategory(kategori: string): boolean {
  return NON_BLOCK_CATEGORIES.includes(kategori);
}

interface KodeAbsensiItem {
  kode: string;
  label: string;
  color: string;
  bgColor: string;
}

const DEFAULT_KODE_ABSENSI: KodeAbsensiItem[] = [
  { kode: "H", label: "Hadir", color: "#16A34A", bgColor: "#F0FDF4" },
  { kode: "S", label: "Sakit", color: "#D97706", bgColor: "#FFFBEB" },
  { kode: "I", label: "Izin", color: "#2563EB", bgColor: "#EFF6FF" },
  { kode: "A", label: "Alpa", color: "#DC2626", bgColor: "#FEF2F2" },
];

const BULAN_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const HARI_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay();
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function AbsensiPage() {
  const { tahunPelajaran, semester } = useAppStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  // ─── Month/Year selector (early so queries can use bulanStr) ────────────
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedRombel, setSelectedRombel] = useState("");
  const [namaSekolah, setNamaSekolah] = useState("");
  const bulanStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

  // ─── Fetch hari libur for selected month ────────────────────────────────
  const { data: hariLiburList = [] } = useQuery({
    queryKey: ["hari-libur", tahunPelajaran, bulanStr],
    queryFn: async () => {
      const p = new URLSearchParams({ tahunPelajaran, bulan: bulanStr });
      const r = await fetch(`/api/absensi/libur?${p}`);
      if (!r.ok) throw new Error("Gagal");
      return r.json();
    },
    enabled: !!tahunPelajaran && !!bulanStr,
  });

  const hariLiburMap = useMemo(() => {
    const map: Record<string, HariLiburItem> = {};
    for (const h of hariLiburList as HariLiburItem[]) {
      map[h.tanggal] = h;
    }
    return map;
  }, [hariLiburList]);

  // ─── Libur form state ────────────────────────────────────────────────────
  const [liburFormOpen, setLiburFormOpen] = useState(false);
  const [liburTanggal, setLiburTanggal] = useState("");
  const [liburLabel, setLiburLabel] = useState("");
  const [liburKategori, setLiburKategori] = useState("Libur Nasional");

  // ─── Seed kalender mutation ─────────────────────────────────────────────
  const seedKalenderMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/absensi/libur/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tahunPelajaran }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      return d;
    },
    onSuccess: (data) => {
      toast({ title: "Kalender Pendidikan berhasil dimuat", description: data.message });
      qc.invalidateQueries({ queryKey: ["hari-libur"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const liburMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/absensi/libur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tanggal: liburTanggal, label: liburLabel, kategori: liburKategori, tahunPelajaran }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      return d;
    },
    onSuccess: () => {
      toast({ title: "Hari libur ditambahkan" });
      setLiburFormOpen(false);
      setLiburTanggal("");
      setLiburLabel("");
      setLiburKategori("Libur Nasional");
      qc.invalidateQueries({ queryKey: ["hari-libur"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteLiburMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/absensi/libur?id=${id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      return d;
    },
    onSuccess: () => {
      toast({ title: "Hari libur dihapus" });
      qc.invalidateQueries({ queryKey: ["hari-libur"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // ─── Attendance Code Config ─────────────────────────────────────────────
  const [kodeConfig, setKodeConfig] = useState<KodeAbsensiItem[]>(DEFAULT_KODE_ABSENSI);
  const [configOpen, setConfigOpen] = useState(false);

  // ─── Config mutation ───────────────────────────────────────────────────
  const kodeMutation = useMutation({
    mutationFn: async (newConfig: KodeAbsensiItem[]) => {
      const r = await fetch("/api/pengaturan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode_absensi: JSON.stringify(newConfig) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      return d;
    },
    onSuccess: () => {
      toast({ title: "Kode absensi disimpan" });
      setConfigOpen(false);
      qc.invalidateQueries({ queryKey: ["kode-absensi"] });
      qc.invalidateQueries({ queryKey: ["pengaturan"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Load config from pengaturan
  const { data: savedConfig } = useQuery({
    queryKey: ["kode-absensi"],
    queryFn: async () => {
      const r = await fetch("/api/pengaturan");
      if (!r.ok) return null;
      const d = await r.json();
      setNamaSekolah(d.namaSekolah || "");
      return d.kode_absensi || null;
    },
    onSuccess: (val) => {
      if (val) {
        try {
          const parsed = JSON.parse(val as string);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setKodeConfig(parsed);
          }
        } catch {}
      }
    },
  });

  // ─── Fetch rombel list (from AbsensiSiswa — INDEPENDEN dari data utama) ─
  const { data: rombelList = [] } = useQuery({
    queryKey: ["absensi-rombel", tahunPelajaran, semester],
    queryFn: async () => {
      const p = new URLSearchParams({ tahunPelajaran, semester });
      const r = await fetch(`/api/absensi/rombel?${p}`);
      if (!r.ok) throw new Error("Gagal");
      return r.json();
    },
    enabled: !!tahunPelajaran,
  });

  // Set default rombel (computed, not useEffect)
  const effectiveRombel = selectedRombel || (rombelList.length > 0 ? rombelList[0] as string : "");
  // Auto-set if user hasn't chosen yet
  React.useEffect(() => {
    if (!selectedRombel && rombelList.length > 0) {
      setSelectedRombel(rombelList[0] as string);
    }
  }, [rombelList.length, selectedRombel]);

  // ─── Fetch siswa by rombel (from AbsensiSiswa — INDEPENDEN dari data utama) ─
  const { data: siswaList = [], isLoading: isLoadingSiswa } = useQuery({
    queryKey: ["absensi-siswa", tahunPelajaran, semester, selectedRombel],
    queryFn: async () => {
      const p = new URLSearchParams({ tahunPelajaran, semester, rombel: selectedRombel });
      const r = await fetch(`/api/absensi/siswa?${p}`);
      if (!r.ok) throw new Error("Gagal");
      const d = await r.json();
      // Already sorted by numeric no on the server side
      const list: SiswaListItem[] = Array.isArray(d) ? d : [];
      return list.sort((a, b) => (parseInt(a.no) || 0) - (parseInt(b.no) || 0));
    },
    enabled: !!tahunPelajaran && !!selectedRombel,
  });

  // ─── Fetch absensi for selected month ───────────────────────────────────
  const { data: absensiList = [], isLoading: isLoadingAbsensi } = useQuery({
    queryKey: ["absensi-data", tahunPelajaran, semester, selectedRombel, bulanStr],
    queryFn: async () => {
      const p = new URLSearchParams({ tahunPelajaran, semester, rombel: selectedRombel, bulan: bulanStr });
      const r = await fetch(`/api/absensi?${p}`);
      if (!r.ok) throw new Error("Gagal");
      return r.json();
    },
    enabled: !!tahunPelajaran && !!selectedRombel && !!bulanStr,
  });

  // ─── Build absensi lookup map ────────────────────────────────────────────
  const absensiMap = useMemo(() => {
    const map: Record<string, AbsensiItem> = {};
    for (const a of absensiList as AbsensiItem[]) {
      map[`${a.siswaId}|${a.tanggal}`] = a;
    }
    return map;
  }, [absensiList]);

  // ─── Build days for the month ───────────────────────────────────────────
  const daysInMonth = useMemo(() => getDaysInMonth(selectedYear, selectedMonth), [selectedYear, selectedMonth]);

  // ─── Local changes state (unsaved) ─────────────────────────────────────
  const [localChanges, setLocalChanges] = useState<Record<string, string>>({});

  const getCellKode = useCallback((siswaId: string, tanggal: string): string => {
    const localKey = `${siswaId}|${tanggal}`;
    if (localKey in localChanges) return localChanges[localKey];
    const existing = absensiMap[localKey];
    return existing?.kodeAbsensi || "";
  }, [absensiMap, localChanges]);

  // ─── Cell selection dialog state ──────────────────────────────────────
  const [selectedCell, setSelectedCell] = useState<{ siswaId: string; siswaNama: string; tanggal: string; currentKode: string } | null>(null);

  const handleCellClick = useCallback((siswaId: string, tanggal: string, currentKode: string) => {
    const dow = getDayOfWeek(selectedYear, selectedMonth, parseInt(tanggal.split("-")[2]));
    if (dow === 0 || dow === 6) return;
    const siswa = (siswaList as SiswaListItem[]).find((s) => s.id === siswaId);
    setSelectedCell({
      siswaId,
      siswaNama: siswa?.nama || "",
      tanggal,
      currentKode,
    });
  }, [selectedYear, selectedMonth, siswaList]);

  const handleSelectKode = useCallback((kode: string) => {
    if (!selectedCell) return;
    setLocalChanges((prev) => {
      const next = { ...prev };
      if (kode === "") {
        const localKey = `${selectedCell.siswaId}|${selectedCell.tanggal}`;
        delete next[localKey];
      } else {
        next[`${selectedCell.siswaId}|${selectedCell.tanggal}`] = kode;
      }
      return next;
    });
    setSelectedCell(null);
  }, [selectedCell]);

  // ─── Save mutation ─────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const items = Object.entries(localChanges).map(([key, kodeAbsensi]) => {
        const [siswaId, tanggal] = key.split("|");
        const siswa = (siswaList as SiswaListItem[]).find((s) => s.id === siswaId);
        return {
          siswaId,
          siswaNama: siswa?.nama || "",
          nisn: siswa?.nisn || "",
          rombel: selectedRombel,
          tanggal,
          kodeAbsensi,
        };
      });

      const r = await fetch("/api/absensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, tahunPelajaran, semester }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      return d;
    },
    onSuccess: (data) => {
      toast({ title: "Absensi tersimpan", description: `${data.count} data disimpan` });
      setLocalChanges({});
      qc.invalidateQueries({ queryKey: ["absensi-data"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // ─── Fill all visible as "H" ─────────────────────────────────────────────
  const fillAllMutation = useMutation({
    mutationFn: async (kode: string) => {
      const items: { siswaId: string; siswaNama: string; nisn: string; rombel: string; tanggal: string; kodeAbsensi: string }[] = [];
      for (const siswa of siswaList as SiswaListItem[]) {
        for (let d = 1; d <= daysInMonth; d++) {
          const tanggal = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          // Skip Sundays (0) and Saturdays (6)
          const dowFill = getDayOfWeek(selectedYear, selectedMonth, d);
          if (dowFill === 0 || dowFill === 6) continue;
          // Skip blocked holiday categories
          const liburInfo = hariLiburMap[tanggal];
          if (liburInfo && isBlockedCategory(liburInfo.kategori)) continue;
          items.push({
            siswaId: siswa.id,
            siswaNama: siswa.nama,
            nisn: siswa.nisn,
            rombel: selectedRombel,
            tanggal,
            kodeAbsensi: kode,
          });
        }
      }
      const r = await fetch("/api/absensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, tahunPelajaran, semester }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      return d;
    },
    onSuccess: (data) => {
      toast({ title: "Semua diisi Hadir", description: `${data.count} data disimpan` });
      setLocalChanges({});
      qc.invalidateQueries({ queryKey: ["absensi-data"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // ─── Summary per siswa ─────────────────────────────────────────────────
  const summaryPerSiswa = useMemo(() => {
    const summary: Record<string, Record<string, number>> = {};
    for (const siswa of siswaList as SiswaListItem[]) {
      summary[siswa.id] = {};
      for (const k of kodeConfig) {
        summary[siswa.id][k.kode] = 0;
      }
    }
    for (const a of absensiList as AbsensiItem[]) {
      if (summary[a.siswaId] && a.kodeAbsensi in summary[a.siswaId]) {
        summary[a.siswaId][a.kodeAbsensi]++;
      }
    }
    // Also count local changes
    for (const [key, kode] of Object.entries(localChanges)) {
      const [siswaId] = key.split("|");
      if (summary[siswaId] && kode in summary[siswaId]) {
        summary[siswaId][kode]++;
      }
    }
    return summary;
  }, [absensiList, siswaList, localChanges, kodeConfig]);

  // ─── Student gender counts (for print & info) ─────────────────────────
  const siswaCounts = useMemo(() => {
    const list = siswaList as SiswaListItem[];
    const l = list.filter((s) => s.jenisKelamin === "L").length;
    const p = list.filter((s) => s.jenisKelamin === "P").length;
    return { l, p, total: l + p };
  }, [siswaList]);

  // ─── Print handler ─────────────────────────────────────────────────────
  const handlePrint = () => window.print();

  // ─── Excel export handler ──────────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false);
  const handleExportExcel = useCallback(async () => {
    if (!tahunPelajaran || !selectedRombel || !bulanStr) return;
    setIsExporting(true);
    try {
      const p = new URLSearchParams({ tahunPelajaran, semester, rombel: selectedRombel, bulan: bulanStr });
      const r = await fetch(`/api/absensi/export?${p}`);
      if (!r.ok) throw new Error("Gagal mengekspor");
      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = r.headers.get("Content-Disposition") || "";
      const match = cd.match(/filename="(.+?)"/);
      a.download = match ? match[1] : `Absensi_${selectedRombel}_${bulanStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Excel berhasil diunduh" });
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal export", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }, [tahunPelajaran, semester, selectedRombel, bulanStr, toast]);

  // ─── Upload Excel siswa → AbsensiSiswa (INDEPENDEN dari data utama) ─────
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    total: number;
    matched: number;
    updated: number;
    created: number;
    notFound: string[];
    errors: string[];
    kelasList: string[];
  } | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("tahunPelajaran", tahunPelajaran);
      fd.append("semester", semester);
      const r = await fetch("/api/absensi/upload-siswa", {
        method: "POST",
        body: fd,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail ? `${d.error}: ${d.detail}` : d.error || `Error ${r.status}`);
      return d;
    },
    onSuccess: (data) => {
      setUploadResult(data);
      setUploadDialogOpen(true);
      toast({ title: "Upload siswa absensi selesai", description: data.message });
      qc.invalidateQueries({ queryKey: ["absensi-siswa"] });
      qc.invalidateQueries({ queryKey: ["absensi-rombel"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
      e.target.value = "";
    }
  };

  const hasChanges = Object.keys(localChanges).length > 0;

  // ─── Auto-save with debounce (3 detik setelah perubahan terakhir) ─────
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoSavingRef = useRef(false);

  // Effect: trigger auto-save 3 seconds after last local change
  useEffect(() => {
    if (!hasChanges || isAutoSavingRef.current) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      isAutoSavingRef.current = true;
      saveMutation.mutate(undefined, {
        onSuccess: () => { isAutoSavingRef.current = false; },
        onError: () => { isAutoSavingRef.current = false; },
      });
    }, 3000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [localChanges]);

  // ─── beforeunload: peringatkan jika ada perubahan yang belum tersimpan ──
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges]);

  // Status auto-save
  const autoSaveStatus = hasChanges ? (saveMutation.isPending ? 'Menyimpan...' : 'Auto-save 3 detik') : null;

  if (isLoadingSiswa) return <Skeleton className="h-96 w-full" />;
  if (!tahunPelajaran) return <div className="text-center py-16 text-muted-foreground">Pilih Tahun Pelajaran terlebih dahulu</div>;

  return (
    <div className="space-y-4">
      {/* ─── Header & Controls ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold">Lembar Absensi Siswa</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setConfigOpen(true)}>
            <Settings2 className="h-3.5 w-3.5" /> Kode Absensi
          </Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
          <Button
            variant="outline" size="sm" className="gap-1.5 text-blue-600 border-blue-300 hover:bg-blue-50"
            onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Upload Siswa
          </Button>
          <Button
            variant="outline" size="sm" className="gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
            onClick={handleExportExcel} disabled={isExporting || !selectedRombel}
          >
            {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" /> Cetak
          </Button>
        </div>
      </div>

      {/* ─── Filters ─────────────────────────────────────────────────────── */}
      <Card className="print:hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Rombel */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium whitespace-nowrap">Rombel</Label>
              <Select value={selectedRombel} onValueChange={(v) => { setSelectedRombel(v); setLocalChanges({}); }}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder="Pilih Kelas" />
                </SelectTrigger>
                <SelectContent>
                  {(rombelList as string[]).map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Navigator */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium whitespace-nowrap">Bulan</Label>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="icon" className="h-9 w-9"
                  onClick={() => {
                    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(selectedYear - 1); }
                    else setSelectedMonth(selectedMonth - 1);
                    setLocalChanges({});
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1.5 px-3 h-9 border rounded-md bg-background min-w-[180px] justify-center">
                  <span className="font-semibold text-sm">{BULAN_NAMES[selectedMonth - 1]}</span>
                  <span className="text-muted-foreground text-sm">{selectedYear}</span>
                </div>
                <Button
                  variant="outline" size="icon" className="h-9 w-9"
                  onClick={() => {
                    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(selectedYear + 1); }
                    else setSelectedMonth(selectedMonth + 1);
                    setLocalChanges({});
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick Year Select */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Tahun</Label>
              <Input
                type="number"
                min={2020} max={2030}
                value={selectedYear}
                onChange={(e) => { setSelectedYear(parseInt(e.target.value) || now.getFullYear()); setLocalChanges({}); }}
                className="w-24 h-9"
              />
            </div>

            <div className="flex-1" />

            {/* Auto-save indicator */}
            {autoSaveStatus && (
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                saveMutation.isPending
                  ? "bg-blue-50 text-blue-600"
                  : "bg-amber-50 text-amber-600"
              )}>
                {saveMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
                {autoSaveStatus}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm" className="gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                onClick={() => fillAllMutation.mutate("H")}
                disabled={fillAllMutation.isPending || !selectedRombel}
              >
                {fillAllMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Isi Semua H
              </Button>
              {hasChanges && (
                <Button size="sm" className="gap-1.5" onClick={() => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); saveMutation.mutate(); }} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Simpan Sekarang ({Object.keys(localChanges).length})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Attendance Legend ────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 print:hidden">
        {kodeConfig.map((k) => (
          <div
            key={k.kode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium"
            style={{ backgroundColor: k.bgColor, color: k.color, borderColor: k.color + "40" }}
          >
            <span className="font-bold">{k.kode}</span>
            <span className="opacity-70">= {k.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 text-xs text-slate-400">
          <span className="font-bold">-</span>
          <span>= Belum diisi</span>
        </div>
      </div>

      {/* ─── Kalender Pendidikan Legend (10 warna) ────────────────────────── */}
      <Card className="print:hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <BookOpenCheck className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-600">Keterangan Kalender Pendidikan</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {KALENDER_LEGEND.map((item) => {
              const c = KATEGORI_COLORS[item.colorKey];
              return (
                <div
                  key={item.kategori}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-medium"
                  style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.text }} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ─── Print Header (visible only on print) ──────────────────────────── */}
      <div className="hidden print:block print:mb-2">
        <div className="text-center mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wide">{namaSekolah || "Nama Sekolah"}</h2>
          <p className="text-[11px] mt-0.5">LEMBAR ABSENSI SISWA</p>
        </div>
        <div className="flex justify-between text-[10px] mb-1">
          <div className="space-y-0.5">
            <p><span className="font-semibold">Kelas</span> : {selectedRombel}</p>
            <p><span className="font-semibold">Tahun Pelajaran</span> : {tahunPelajaran} — Semester {semester}</p>
            <p><span className="font-semibold">Bulan</span> : {BULAN_NAMES[selectedMonth - 1]} {selectedYear}</p>
          </div>
          <div className="text-right space-y-0.5">
            <p>Jumlah Siswa : <span className="font-semibold">{siswaCounts.total}</span> orang</p>
            <p>Laki-laki : <span className="font-semibold">{siswaCounts.l}</span> orang</p>
            <p>Perempuan : <span className="font-semibold">{siswaCounts.p}</span> orang</p>
          </div>
        </div>
        <hr className="border-t-2 border-black/60 mt-2" />
      </div>

      {/* ─── Attendance Spreadsheet ───────────────────────────────────────── */}
      {selectedRombel && (siswaList as SiswaListItem[]).length > 0 ? (
        <>
        <div className="border rounded-lg bg-white print:overflow-visible print:border-none print:rounded-none overflow-x-auto">
            <div className="min-w-max">
              <table className="w-full border-collapse text-xs">
                {/* ── Header Row 1: Day names ── */}
                <thead>
                  <tr className="bg-gradient-to-b from-slate-100 to-slate-50 print:bg-gray-200">
                    <th
                      rowSpan={3}
                      className="border border-slate-200 bg-slate-100 px-2 py-1 text-left font-bold text-slate-700 min-w-[50px] sticky left-0 z-20 print:sticky print:left-0 print:bg-gray-200"
                      style={{ top: 0 }}
                    >
                      No
                    </th>
                    <th
                      rowSpan={3}
                      className="border border-slate-200 bg-slate-100 px-3 py-1 text-left font-bold text-slate-700 min-w-[160px] sticky left-[50px] z-20 print:sticky print:left-[50px] print:bg-gray-200"
                      style={{ top: 0 }}
                    >
                      Nama Siswa
                    </th>
                    {kodeConfig.map((k, ki) => (
                      <th
                        key={k.kode}
                        colSpan={1}
                        className="border border-slate-200 px-2 py-1 text-center font-bold print:hidden"
                        style={{ backgroundColor: k.bgColor, color: k.color }}
                      >
                        {k.label}
                      </th>
                    ))}
                  </tr>
                  {/* ── Header Row 2: Dates ── */}
                  <tr className="bg-slate-50 print:bg-gray-100">
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                      const dow = getDayOfWeek(selectedYear, selectedMonth, day);
                      const isWeekend = dow === 0 || dow === 6;
                      const tanggal = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const liburInfo = hariLiburMap[tanggal];
                      const wkndColor = KATEGORI_COLORS["Weekend"];
                      const liburColor = liburInfo ? getLiburColor(liburInfo.kategori) : null;
                      const headerBg = isWeekend ? wkndColor.bg : liburColor ? liburColor.bg : "";
                      const headerText = isWeekend ? wkndColor.text : liburColor ? liburColor.text : "";
                      return (
                        <th
                          key={day}
                          className="border border-slate-200 px-0.5 py-0.5 text-center font-medium min-w-[28px]"
                          style={headerBg ? { backgroundColor: headerBg, color: headerText } : { color: "" }}
                        >
                          <span className={isWeekend || liburInfo ? "line-through opacity-80" : ""}>{day}</span>
                        </th>
                      );
                    })}
                  </tr>
                  {/* ── Header Row 3: Day names ── */}
                  <tr className="bg-slate-50 print:bg-gray-100">
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                      const dow = getDayOfWeek(selectedYear, selectedMonth, day);
                      const isWeekend = dow === 0 || dow === 6;
                      const tanggal = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const liburInfo = hariLiburMap[tanggal];
                      const wkndColor = KATEGORI_COLORS["Weekend"];
                      const liburColor = liburInfo ? getLiburColor(liburInfo.kategori) : null;
                      const headerBg = isWeekend ? wkndColor.bg : liburColor ? liburColor.bg : "";
                      const headerText = isWeekend ? wkndColor.text : liburColor ? liburColor.text : "";
                      return (
                        <th
                          key={day}
                          className="border border-slate-200 px-0.5 py-0 text-[9px] text-center"
                          style={headerBg ? { backgroundColor: headerBg, color: headerText } : { color: "" }}
                        >
                          {liburInfo && !isWeekend ? (
                            <span className="truncate" title={liburInfo.label}>{liburInfo.label.length > 3 ? liburInfo.label.slice(0, 3) : liburInfo.label}</span>
                          ) : (
                            HARI_NAMES[dow]
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* ── Body ── */}
                <tbody>
                  {(siswaList as SiswaListItem[]).map((siswa, rowIdx) => {
                    const summary = summaryPerSiswa[siswa.id] || {};
                    const isRowSelected = selectedCell?.siswaId === siswa.id;
                    return (
                      <tr
                        key={siswa.id}
                        className={cn(
                          rowIdx % 2 === 1 ? "bg-slate-50/30" : "",
                          isRowSelected && "bg-blue-50/80 ring-1 ring-blue-300/50"
                        )}
                      >
                        <td className={cn(
                          "border border-slate-200 px-2 py-0.5 text-center text-slate-500 sticky left-0 z-10 print:sticky print:left-0",
                          isRowSelected ? "bg-blue-50/80 text-blue-700 font-semibold" : "bg-white print:bg-white"
                        )}>
                          {rowIdx + 1}
                        </td>
                        <td className={cn(
                          "border border-slate-200 px-3 py-0.5 font-medium sticky left-[50px] z-10 print:sticky print:left-[50px] text-xs whitespace-nowrap",
                          isRowSelected ? "bg-blue-100/90 text-blue-900 font-bold" : "text-slate-700 bg-white print:bg-white"
                        )}>
                          {siswa.nama}
                        </td>
                        {/* Date cells */}
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                          const dow = getDayOfWeek(selectedYear, selectedMonth, day);
                          const isWeekend = dow === 0 || dow === 6;
                          const tanggal = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                          const liburInfo = hariLiburMap[tanggal];
                          const isLibur = !!liburInfo;
                          const isBlockedLibur = isLibur && isBlockedCategory(liburInfo.kategori);
                          const isSpecialLibur = isLibur && isNonBlockedCategory(liburInfo.kategori);
                          const wkndColor = KATEGORI_COLORS["Weekend"];
                          const liburColor = liburInfo ? getLiburColor(liburInfo.kategori) : null;
                          const kode = getCellKode(siswa.id, tanggal);
                          const isLocalChanged = `${siswa.id}|${tanggal}` in localChanges;
                          const kodeInfo = kode ? kodeConfig.find((k) => k.kode === kode) : null;
                          const isBlocked = isWeekend || isBlockedLibur;

                          return (
                            <td
                              key={day}
                              className={`border text-center select-none transition-colors print:cursor-default ${
                                isBlocked ? "" : isSpecialLibur ? "cursor-pointer hover:opacity-80" : isLocalChanged ? "cursor-pointer hover:bg-slate-50" : "cursor-pointer hover:bg-slate-50"
                              }`}
                              style={{
                                backgroundColor: isWeekend ? wkndColor.bg
                                  : isBlockedLibur && liburColor ? liburColor.bg
                                  : isSpecialLibur && liburColor ? liburColor.bg
                                  : kodeInfo && isLocalChanged ? kodeInfo.bgColor
                                  : undefined,
                                borderColor: isBlockedLibur && liburColor ? liburColor.border
                                  : isSpecialLibur && liburColor ? liburColor.border
                                  : undefined,
                              }}
                              onClick={() => {
                                if (isBlocked) return;
                                handleCellClick(siswa.id, tanggal, kode);
                              }}
                              title={liburInfo ? `${liburInfo.label} (${liburInfo.kategori})` : isWeekend ? "Weekend" : undefined}
                            >
                              <span
                                className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold leading-none ${
                                  isWeekend ? "" : isBlockedLibur && liburColor ? "" : isSpecialLibur && liburColor ? "" : kodeInfo ? "" : "text-slate-200"
                                }`}
                                style={{
                                  color: isWeekend ? wkndColor.text
                                    : isBlockedLibur && liburColor ? liburColor.text
                                    : isSpecialLibur && liburColor ? liburColor.text
                                    : kodeInfo ? kodeInfo.color
                                    : undefined,
                                }}
                              >
                                {isWeekend ? (
                                  <span className="opacity-40 text-[9px]">✕</span>
                                ) : isBlockedLibur && liburColor ? (
                                  <span className="text-[7px] font-medium leading-tight opacity-70" title={liburInfo.label}>{liburInfo.label.length > 3 ? liburInfo.label.slice(0, 2) + "…" : liburInfo.label}</span>
                                ) : isSpecialLibur && liburColor ? (
                                  <span className="relative">
                                    {kode ? (
                                      <span className="font-bold">{kode}</span>
                                    ) : null}
                                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: liburColor.text }} title={liburInfo.label} />
                                  </span>
                                ) : kode || ""}
                              </span>
                            </td>
                          );
                        })}
                        {/* Summary cells */}
                        {kodeConfig.map((k) => (
                          <td
                            key={k.kode}
                            className="border border-slate-200 text-center print:hidden"
                            style={{ backgroundColor: k.bgColor }}
                          >
                            <span className="font-bold text-xs" style={{ color: k.color }}>
                              {summary[k.kode] || 0}
                            </span>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
        </div>

        {/* ─── Print-only Signature Block ──────────────────────────────────── */}
        <div className="hidden print:block print:mt-8 print:mb-4">
          <div className="flex justify-between text-[10px]">
            <div className="text-center">
              <p className="font-semibold">Mengetahui,</p>
              <p className="mb-1">Kepala Sekolah</p>
              <div className="h-16 border-b border-black/40"></div>
              <p className="font-semibold mt-1">{namaSekolah ? namaSekolah.split(" ").slice(-1).join(" ") : ".............................."}</p>
              <p>NIP. ................................</p>
            </div>
            <div className="text-center">
              <p className="font-semibold">........................, ........................ {selectedYear}</p>
              <p className="mb-1">Wali Kelas</p>
              <div className="h-16 border-b border-black/40"></div>
              <p className="font-semibold mt-1">........................................</p>
              <p>NIP. ................................</p>
            </div>
          </div>
        </div>
        </>
      ) : selectedRombel ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="mb-1">Belum ada siswa di rombel ini</p>
            <p className="text-xs opacity-70">Upload file Excel untuk menambahkan daftar siswa ke absensi</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <ClipboardCheck className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="mb-1">Belum ada data rombel</p>
            <p className="text-xs opacity-70">Upload file Excel yang berisi kolom KELAS terlebih dahulu</p>
          </CardContent>
        </Card>
      )}

      {/* ─── Hari Libur Management ────────────────────────────────────────── */}
      <Card className="print:hidden mb-4">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarOff className="h-4 w-4 text-orange-500" />
              Hari Libur & Non-Efektif — {BULAN_NAMES[selectedMonth - 1]} {selectedYear}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm" className="gap-1.5 h-7 text-xs border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                onClick={() => seedKalenderMutation.mutate()}
                disabled={seedKalenderMutation.isPending}
              >
                {seedKalenderMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <BookOpenCheck className="h-3 w-3" />}
                Muat Kalender Pendidikan
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => setLiburFormOpen(true)}>
                <Plus className="h-3 w-3" /> Tambah
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {(hariLiburList as HariLiburItem[]).length === 0 ? (
            <p className="text-xs text-muted-foreground py-3 text-center">Belum ada hari libur untuk bulan ini</p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {(hariLiburList as HariLiburItem[]).map((h) => {
                const c = getLiburColor(h.kategori);
                return (
                  <div
                    key={h.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium"
                    style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}
                  >
                    <span className="font-mono font-bold">{h.tanggal.split("-")[2]}</span>
                    <span className="opacity-80">{h.label}</span>
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-0.5">{h.kategori}</Badge>
                    <button
                      className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                      onClick={() => deleteLiburMutation.mutate(h.id)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Libur Form Dialog ────────────────────────────────────────────── */}
      <Dialog open={liburFormOpen} onOpenChange={setLiburFormOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah Hari Libur</DialogTitle>
            <DialogDescription>Tambah hari libur atau non-efektif di bulan ini</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Tanggal</Label>
              <Input type="date" value={liburTanggal} onChange={(e) => setLiburTanggal(e.target.value)} className="h-9" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Keterangan</Label>
              <Input placeholder="cth: Kemerdekaan RI" value={liburLabel} onChange={(e) => setLiburLabel(e.target.value)} className="h-9" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Kategori</Label>
              <Select value={liburKategori} onValueChange={setLiburKategori}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Libur Nasional">🔴 Libur Nasional</SelectItem>
                  <SelectItem value="Libur Semester">🟠 Libur Semester</SelectItem>
                  <SelectItem value="Asesmen">🟢 Asesmen / Ujian</SelectItem>
                  <SelectItem value="Hari Pertama Masuk">🔵 Hari Pertama Masuk Sekolah</SelectItem>
                  <SelectItem value="Penyerahan Rapor">🟡 Penyerahan Rapor & Kelulusan</SelectItem>
                  <SelectItem value="Perkiraan TKA">🩵 Perkiraan Pelaksanaan TKA</SelectItem>
                  <SelectItem value="Hari Pendidikan Nasional">🟣 Hari Pendidikan Nasional</SelectItem>
                  <SelectItem value="Libur Khusus">🩷 Libur Khusus</SelectItem>
                  <SelectItem value="Hari Guru">🟨 Hari Guru (Tidak Libur)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setLiburFormOpen(false)}>Batal</Button>
            <Button size="sm" onClick={() => liburMutation.mutate()} disabled={liburMutation.isPending || !liburTanggal}>
              {liburMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Cell Kode Picker Dialog ──────────────────────────────────────── */}
      <Dialog open={!!selectedCell} onOpenChange={(open) => !open && setSelectedCell(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base">Pilih Keterangan Absensi</DialogTitle>
            <DialogDescription className="text-xs">
              {selectedCell?.siswaNama} — {selectedCell?.tanggal}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-2">
            {/* Hapus / Kosongkan */}
            <button
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 ${
                !selectedCell?.currentKode
                  ? "border-slate-400 bg-slate-100 text-slate-600 ring-2 ring-slate-300"
                  : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50"
              }`}
              onClick={() => handleSelectKode("")}
            >
              <span className="text-lg">—</span>
              <span>Kosong</span>
            </button>
            {/* Kode options */}
            {kodeConfig.map((k) => {
              const isSelected = selectedCell?.currentKode === k.kode;
              const isExisting = absensiMap[`${selectedCell?.siswaId}-${selectedCell?.tanggal}`]?.kodeAbsensi === k.kode;
              const isActive = isSelected || (!selectedCell?.currentKode && isExisting);
              return (
                <button
                  key={k.kode}
                  className={`flex flex-col items-center justify-center gap-0.5 px-3 py-3 rounded-lg border-2 text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 ${
                    isActive
                      ? "ring-2"
                      : "hover:opacity-90"
                  }`}
                  style={{
                    backgroundColor: isActive ? k.bgColor : "white",
                    borderColor: k.color,
                    color: k.color,
                    ringColor: k.color,
                    boxShadow: isActive ? `0 0 0 2px ${k.color}40` : undefined,
                  }}
                  onClick={() => handleSelectKode(k.kode)}
                >
                  <span className="text-xl leading-none">{k.kode}</span>
                  <span className="text-[10px] font-medium opacity-80">{k.label}</span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Kode Absensi Config Dialog ────────────────────────────────────── */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Konfigurasi Kode Absensi</DialogTitle>
            <DialogDescription>Atur kode dan label untuk status kehadiran siswa</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {kodeConfig.map((k, idx) => (
              <div key={k.kode} className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-md border-2 flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: k.bgColor, borderColor: k.color, color: k.color }}
                >
                  {k.kode}
                </div>
                <Input
                  value={k.kode}
                  onChange={(e) => {
                    const next = [...kodeConfig];
                    next[idx] = { ...next[idx], kode: e.target.value.toUpperCase() };
                    setKodeConfig(next);
                  }}
                  className="w-16 h-9 text-center font-bold uppercase"
                  maxLength={2}
                  placeholder="K"
                />
                <Input
                  value={k.label}
                  onChange={(e) => {
                    const next = [...kodeConfig];
                    next[idx] = { ...next[idx], label: e.target.value };
                    setKodeConfig(next);
                  }}
                  className="flex-1 h-9"
                  placeholder="Label"
                />
                <Input
                  type="color"
                  value={k.color}
                  onChange={(e) => {
                    const next = [...kodeConfig];
                    // Generate lighter bg
                    const hex = e.target.value;
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    const bgColor = `rgba(${r},${g},${b},0.08)`;
                    next[idx] = { ...next[idx], color: hex, bgColor };
                    setKodeConfig(next);
                  }}
                  className="w-10 h-9 p-1 cursor-pointer"
                />
                <Button
                  variant="ghost" size="icon" className="h-9 w-9 text-destructive flex-shrink-0"
                  onClick={() => {
                    if (kodeConfig.length > 1) {
                      setKodeConfig(kodeConfig.filter((_, i) => i !== idx));
                    }
                  }}
                  disabled={kodeConfig.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline" size="sm" className="gap-1.5 mt-1"
              onClick={() => {
                const codes = ["H", "S", "I", "A", "T", "DL"];
                const nextCode = codes.find((c) => !kodeConfig.some((k) => k.kode === c)) || String(kodeConfig.length + 1);
                setKodeConfig([
                  ...kodeConfig,
                  { kode: nextCode, label: "Baru", color: "#6B7280", bgColor: "#F9FAFB" },
                ]);
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Tambah Kode
            </Button>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfigOpen(false)}>Batal</Button>
            <Button onClick={() => kodeMutation.mutate(kodeConfig)} disabled={kodeMutation.isPending}>
              {kodeMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Simpan Konfigurasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Upload Siswa Result Dialog ───────────────────────────────────── */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              Hasil Upload Siswa Absensi
            </DialogTitle>
            <DialogDescription>Data siswa absensi diperbarui (tidak mengubah data utama siswa)</DialogDescription>
          </DialogHeader>
          {uploadResult && (
            <div className="space-y-4 py-2">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-2xl font-bold text-blue-700">{uploadResult.total}</p>
                  <p className="text-[10px] text-blue-600 font-medium">Total Data</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-2xl font-bold text-emerald-700">{uploadResult.matched}</p>
                  <p className="text-[10px] text-emerald-600 font-medium">Cocok (NISN/Nama)</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-2xl font-bold text-amber-700">{uploadResult.updated}</p>
                  <p className="text-[10px] text-amber-600 font-medium">Diperbarui</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-violet-50 border border-violet-200">
                  <p className="text-2xl font-bold text-violet-700">{uploadResult.created}</p>
                  <p className="text-[10px] text-violet-600 font-medium">Siswa Baru Ditambahkan</p>
                </div>
              </div>

              {/* Kelas detected */}
              {uploadResult.kelasList.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1.5">Kelas Terdeteksi:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {uploadResult.kelasList.map((k) => (
                      <Badge key={k} variant="secondary" className="text-xs">{k}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {uploadResult.errors.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-orange-600 mb-1.5">Error ({uploadResult.errors.length})</p>
                  <div className="max-h-24 overflow-y-auto rounded-md border border-orange-200 bg-orange-50/50 p-2 space-y-0.5">
                    {uploadResult.errors.map((err, i) => (
                      <p key={i} className="text-[10px] text-orange-700">{err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setUploadDialogOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
