"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Palette, Plus, Search, Loader2, ChevronRight, ChevronLeft,
  CheckCircle2, AlertCircle, BarChart3, Users, Eye, Ear,
  BookOpen, Hand, Trash2, Play, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/app";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────
interface SoalItem {
  id: string;
  nomor: number;
  pertanyaan: string;
  dimensi: string;
  poinA: string;
  poinB: string;
  skorA: string;
  skorB: string;
}

interface HasilItem {
  id: string;
  siswaId: string;
  siswaNama: string;
  nisn: string;
  rombel: string;
  jenisKelamin: string;
  tahunPelajaran: string;
  semester: string;
  skorV: number;
  skorA: number;
  skorR: number;
  skorK: number;
  dominan: string;
  kodeVARK: string;
  deskripsi: string;
  saranBelajar: string;
  totalPoin: number;
  totalSoal: number;
  waktuKerja: number;
  dibuatOleh: string;
  createdAt: string;
}

interface SiswaItem {
  id: string;
  nama: string;
  nisn: string;
  rombel: string;
  jenisKelamin: string;
}

// ─── VARK Dimension Config ──────────────────────────────────────────────────
const VARK_DIM = {
  V: { label: "Visual", color: "emerald", icon: Eye, desc: "Belajar melalui gambar, diagram, visual" },
  A: { label: "Auditory", color: "blue", icon: Ear, desc: "Belajar melalui mendengarkan, diskusi" },
  R: { label: "Read/Write", color: "amber", icon: BookOpen, desc: "Belajar melalui membaca dan menulis" },
  K: { label: "Kinestetik", color: "violet", icon: Hand, desc: "Belajar melalui praktik dan aktivitas" },
} as const;

type VARKKey = keyof typeof VARK_DIM;

const VARK_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  V: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-800" },
  A: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", badge: "bg-blue-100 text-blue-800" },
  R: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", badge: "bg-amber-100 text-amber-800" },
  K: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", badge: "bg-violet-100 text-violet-800" },
};

const getVARKColor = (k: string) => VARK_COLORS[k] || VARK_COLORS.V;

function formatWaktu(detik: number): string {
  if (detik < 60) return `${detik} detik`;
  const m = Math.floor(detik / 60);
  const s = detik % 60;
  return `${m} menit ${s} detik`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function GayaBelajarPage() {
  const { tahunPelajaran, semester } = useAppStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Tab & State ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filterRombel, setFilterRombel] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<HasilItem | null>(null);

  // ── Test state ────────────────────────────────────────────────────────────
  const [selectedSiswa, setSelectedSiswa] = useState<SiswaItem | null>(null);
  const [currentSoal, setCurrentSoal] = useState(0);
  const [jawaban, setJawaban] = useState<Record<string, "A" | "B">>({});
  const [testActive, setTestActive] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [detailItem, setDetailItem] = useState<HasilItem | null>(null);

  // ── Siswa Search ──────────────────────────────────────────────────────────
  const [siswaSearch, setSiswaSearch] = useState("");

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: soalData, isLoading: soalLoading } = useQuery({
    queryKey: ["gaya-belajar-soal", tahunPelajaran],
    queryFn: async () => {
      const res = await fetch(`/api/gaya-belajar?tahunPelajaran=${tahunPelajaran}&semester=${semester}`);
      if (!res.ok) throw new Error("Gagal memuat soal");
      return res.json();
    },
  });

  const { data: hasilData, isLoading: hasilLoading } = useQuery({
    queryKey: ["gaya-belajar-hasil", tahunPelajaran, semester, filterRombel],
    queryFn: async () => {
      const params = new URLSearchParams({
        tahunPelajaran,
        semester,
        ...(filterRombel ? { rombel: filterRombel } : {}),
      });
      const res = await fetch(`/api/gaya-belajar/hasil?${params}`);
      if (!res.ok) throw new Error("Gagal memuat hasil");
      return res.json();
    },
  });

  const { data: rombelList = [] } = useQuery({
    queryKey: ["gaya-belajar-rombel", tahunPelajaran, semester],
    queryFn: async () => {
      const res = await fetch(`/api/siswa/rombel?tahunPelajaran=${tahunPelajaran}&semester=${semester}`);
      if (!res.ok) return [];
      return res.json() as Promise<string[]>;
    },
    enabled: !!tahunPelajaran,
  });

  const { data: siswaList = [], isLoading: siswaLoading } = useQuery({
    queryKey: ["gaya-belajar-siswa", tahunPelajaran, semester, selectedSiswa?.rombel],
    queryFn: async () => {
      if (!selectedSiswa?.rombel) return [];
      const params = new URLSearchParams({
        tahunPelajaran,
        semester,
        rombel: selectedSiswa.rombel,
      });
      const res = await fetch(`/api/siswa/list?${params}`);
      if (!res.ok) return [];
      return res.json() as Promise<SiswaItem[]>;
    },
    enabled: !!selectedSiswa?.rombel,
  });

  const questions: SoalItem[] = soalData?.questions || [];
  const results: HasilItem[] = hasilData?.results || [];
  const stats = hasilData?.statistics || { totalSiswaDites: 0, distribusi: { V: 0, A: 0, R: 0, K: 0 } };

  const filteredSiswa = useMemo(() => {
    if (!siswaSearch) return siswaList;
    const q = siswaSearch.toLowerCase();
    return siswaList.filter(
      (s) => s.nama.toLowerCase().includes(q) || s.nisn.includes(q)
    );
  }, [siswaList, siswaSearch]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/gaya-belajar/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tahunPelajaran }),
      });
      if (!res.ok) throw new Error("Gagal menambahkan soal");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Berhasil", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["gaya-belajar-soal"] });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const res = await fetch("/api/gaya-belajar/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siswaId: selectedSiswa!.id,
          siswaNama: selectedSiswa!.nama,
          nisn: selectedSiswa!.nisn,
          rombel: selectedSiswa!.rombel,
          jenisKelamin: selectedSiswa!.jenisKelamin,
          tahunPelajaran,
          semester,
          jawaban,
          waktuKerja: elapsed,
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan hasil");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Tes selesai!", description: "Hasil gaya belajar berhasil disimpan." });
      setTestActive(false);
      setCurrentSoal(0);
      setJawaban({});
      setSelectedSiswa(null);
      setActiveTab("hasil");
      queryClient.invalidateQueries({ queryKey: ["gaya-belajar-hasil"] });
      queryClient.invalidateQueries({ queryKey: ["gaya-belajar-soal"] });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/gaya-belajar/hasil?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Hasil tes berhasil dihapus" });
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["gaya-belajar-hasil"] });
      queryClient.invalidateQueries({ queryKey: ["gaya-belajar-soal"] });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal menghapus hasil tes", variant: "destructive" });
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStartTest = useCallback(() => {
    if (questions.length === 0) {
      toast({ title: "Belum ada soal", description: "Silakan seed soal terlebih dahulu", variant: "destructive" });
      return;
    }
    setTestActive(true);
    setCurrentSoal(0);
    setJawaban({});
    setStartTime(Date.now());
  }, [questions.length, toast]);

  const handleAnswer = useCallback((value: "A" | "B") => {
    setJawaban((prev) => ({ ...prev, [String(currentSoal + 1)]: value }));
    if (currentSoal < questions.length - 1) {
      setCurrentSoal((prev) => prev + 1);
    }
  }, [currentSoal, questions.length]);

  const handleFinish = useCallback(() => {
    const answered = Object.keys(jawaban).length;
    if (answered < questions.length) {
      toast({ title: "Belum selesai", description: `Jawab semua ${questions.length} soal terlebih dahulu (${answered}/${questions.length})`, variant: "destructive" });
      return;
    }
    submitMutation.mutate();
  }, [jawaban, questions.length, submitMutation, toast]);

  const handleResetTest = useCallback(() => {
    setTestActive(false);
    setCurrentSoal(0);
    setJawaban({});
    setSelectedSiswa(null);
  }, []);

  const answeredCount = Object.keys(jawaban).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Palette className="h-6 w-6 text-primary" />
          Tes Gaya Belajar (VARK)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Identifikasi gaya belajar siswa berdasarkan model VARK — Visual, Auditory, Read/Write, Kinestetik
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="kerja" className="gap-1.5">
            <Play className="h-3.5 w-3.5" /> Kerjakan Tes
          </TabsTrigger>
          <TabsTrigger value="hasil" className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> Hasil Tes
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: DASHBOARD                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card className="border-border/60">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-primary">{questions.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Soal</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-primary">{stats.totalSiswaDites}</p>
                <p className="text-xs text-muted-foreground mt-1">Siswa Dites</p>
              </CardContent>
            </Card>
            <Card className="border-border/60 col-span-2 sm:col-span-1">
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center gap-2">
                  {questions.length === 0 ? (
                    <>
                      <p className="text-lg font-bold text-amber-600">0</p>
                      <p className="text-xs text-muted-foreground">Soal belum ada</p>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <p className="text-lg font-bold text-emerald-600">Siap</p>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Status Soal</p>
              </CardContent>
            </Card>
          </div>

          {/* Seed button */}
          {questions.length === 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="flex items-center justify-between gap-4 pt-6">
                <div>
                  <p className="text-sm font-medium text-amber-800">Belum ada soal untuk tahun pelajaran ini</p>
                  <p className="text-xs text-amber-600 mt-0.5">Klik tombol untuk mengisi 30 soal VARK</p>
                </div>
                <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} className="gap-2 shrink-0">
                  {seedMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Isi Soal VARK
                </Button>
              </CardContent>
            </Card>
          )}

          {/* VARK Distribution Grid */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Distribusi Gaya Belajar Siswa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(Object.keys(VARK_DIM) as VARKKey[]).map((key) => {
                  const dim = VARK_DIM[key];
                  const col = VARK_COLORS[key];
                  const count = stats.distribusi[key] || 0;
                  const total = stats.totalSiswaDites || 1;
                  const pct = Math.round((count / total) * 100);
                  const IconComp = dim.icon;
                  return (
                    <div key={key} className={cn("p-4 rounded-xl border text-center", col.bg, col.border)}>
                      <IconComp className={cn("h-6 w-6 mx-auto", col.text)} />
                      <p className="text-xs font-bold mt-2" style={{ color: `var(--color-${dim.color}-700)` }}>{dim.label}</p>
                      <p className="text-2xl font-bold mt-1" style={{ color: `var(--color-${dim.color}-700)` }}>{count}</p>
                      <p className="text-[10px] text-muted-foreground">{pct}% siswa</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Dimension Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(VARK_DIM) as VARKKey[]).map((key) => {
              const dim = VARK_DIM[key];
              const col = VARK_COLORS[key];
              const IconComp = dim.icon;
              return (
                <Card key={key} className="border-border/60">
                  <CardContent className="flex items-start gap-3 pt-4">
                    <div className={cn("p-2 rounded-lg", col.badge)}>
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{key} — {dim.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{dim.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: KERJAKAN TES                                                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "kerja" && (
        <div className="space-y-6">
          {/* Reset button if test active */}
          {testActive && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Mengerjakan: <span className="font-bold">{selectedSiswa?.nama}</span>
                </p>
                <p className="text-xs text-muted-foreground">{selectedSiswa?.rombel} · NISN: {selectedSiswa?.nisn || "-"}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleResetTest} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Batal
              </Button>
            </div>
          )}

          {!testActive && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Mulai Tes Gaya Belajar</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Pilih siswa yang akan mengerjakan tes. Operator akan membimbing siswa dalam menjawab soal.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rombel selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Pilih Kelas (Rombel)</Label>
                  <Select value={selectedSiswa?.rombel || ""} onValueChange={(v) => setSelectedSiswa((prev) => prev ? { ...prev, rombel: v } : { id: "", nama: "", nisn: "", rombel: v, jenisKelamin: "" })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih kelas..." />
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

                {/* Student list */}
                {selectedSiswa?.rombel && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Pilih Siswa</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari nama atau NISN..."
                        className="pl-9"
                        value={siswaSearch}
                        onChange={(e) => setSiswaSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-72 overflow-y-auto border rounded-lg">
                      {siswaLoading ? (
                        <div className="p-4 space-y-2">
                          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                        </div>
                      ) : filteredSiswa.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">Tidak ada siswa</div>
                      ) : (
                        filteredSiswa.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setSelectedSiswa(s)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors border-b last:border-b-0",
                              selectedSiswa?.id === s.id && "bg-primary/5 border-l-2 border-l-primary"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{s.nama}</p>
                              <p className="text-[10px] text-muted-foreground">NISN: {s.nisn || "-"}</p>
                            </div>
                            {selectedSiswa?.id === s.id && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Start button */}
                {selectedSiswa?.id && (
                  <Button onClick={handleStartTest} className="w-full gap-2" size="lg">
                    <Play className="h-4 w-4" />
                    Mulai Tes ({questions.length} Soal)
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Active test */}
          {testActive && questions.length > 0 && (
            <div className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Soal {currentSoal + 1} dari {questions.length}</span>
                  <span>{answeredCount} / {questions.length} dijawab</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Question card */}
              <Card className="border-primary/30 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">
                      Soal #{currentSoal + 1}
                    </Badge>
                    {questions[currentSoal] && (
                      <Badge variant="outline" className={cn("text-[10px]", getVARKColor(questions[currentSoal].dimensi.charAt(0)).badge)}>
                        {questions[currentSoal].dimensi}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base mt-3 leading-relaxed">
                    {questions[currentSoal]?.pertanyaan}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <button
                    onClick={() => handleAnswer("A")}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-sm",
                      jawaban[String(currentSoal + 1)] === "A"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                        jawaban[String(currentSoal + 1)] === "A"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}>
                        A
                      </span>
                      <p className="text-sm leading-relaxed pt-1">{questions[currentSoal]?.poinA}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleAnswer("B")}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-sm",
                      jawaban[String(currentSoal + 1)] === "B"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                        jawaban[String(currentSoal + 1)] === "B"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}>
                        B
                      </span>
                      <p className="text-sm leading-relaxed pt-1">{questions[currentSoal]?.poinB}</p>
                    </div>
                  </button>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentSoal((prev) => Math.max(0, prev - 1))}
                  disabled={currentSoal === 0}
                  className="gap-1.5"
                >
                  <ChevronLeft className="h-4 w-4" /> Sebelumnya
                </Button>
                <div className="flex items-center gap-1">
                  {answeredCount === questions.length && (
                    <Button onClick={handleFinish} disabled={submitMutation.isPending} className="gap-1.5 mr-2">
                      {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Selesai
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentSoal((prev) => Math.min(questions.length - 1, prev + 1))}
                    disabled={currentSoal === questions.length - 1}
                    className="gap-1.5"
                  >
                    Berikutnya <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Quick Navigation */}
              <Card className="border-border/60">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground mb-2">Navigasi cepat:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {questions.map((q, idx) => {
                      const isAnswered = !!jawaban[String(idx + 1)];
                      const isCurrent = idx === currentSoal;
                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentSoal(idx)}
                          className={cn(
                            "w-8 h-8 rounded-md text-xs font-medium transition-all",
                            isCurrent && "bg-primary text-primary-foreground shadow-sm scale-110",
                            !isCurrent && isAnswered && "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
                            !isCurrent && !isAnswered && "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: HASIL TES                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "hasil" && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-3">
            <Select value={filterRombel} onValueChange={(v) => setFilterRombel(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Semua kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Semua Kelas</SelectItem>
                {rombelList.map((r: string) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-xs">
              {results.length} hasil
            </Badge>
          </div>

          {/* Results table */}
          {hasilLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-xl">
              <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-sm text-muted-foreground">Belum ada hasil tes</p>
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-xs">No</th>
                      <th className="text-left px-4 py-3 font-medium text-xs">Nama Siswa</th>
                      <th className="text-left px-4 py-3 font-medium text-xs">Kelas</th>
                      <th className="text-center px-4 py-3 font-medium text-xs">VARK</th>
                      <th className="text-center px-4 py-3 font-medium text-xs">Skor</th>
                      <th className="text-center px-4 py-3 font-medium text-xs">Waktu</th>
                      <th className="text-center px-4 py-3 font-medium text-xs">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r: HasilItem, idx: number) => {
                      const col = getVARKColor(r.dominan);
                      return (
                        <tr key={r.id} className="border-t hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-xs text-muted-foreground">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium truncate max-w-[200px]">{r.siswaNama}</p>
                            <p className="text-[10px] text-muted-foreground">{r.nisn || "-"}</p>
                          </td>
                          <td className="px-4 py-3 text-xs">{r.rombel}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {r.kodeVARK.split("").map((k, ki) => (
                                <span key={ki} className={cn("inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold", getVARKColor(k).badge)}>
                                  {k}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-[10px]">
                              <span className="text-emerald-600">{r.skorV}</span>
                              <span className="text-blue-600">{r.skorA}</span>
                              <span className="text-amber-600">{r.skorR}</span>
                              <span className="text-violet-600">{r.skorK}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-muted-foreground">{formatWaktu(r.waktuKerja)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailItem(r)} title="Detail">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => setDeleteTarget(r)} title="Hapus">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Detail Dialog ────────────────────────────────────────────────── */}
      {detailItem && (
        <Dialog open={!!detailItem} onOpenChange={() => setDetailItem(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Hasil Gaya Belajar
              </DialogTitle>
              <DialogDescription>{detailItem.siswaNama} — {detailItem.rombel}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* VARK Code */}
              <div className="flex items-center justify-center gap-2 py-3">
                {detailItem.kodeVARK.split("").map((k, i) => {
                  const dim = VARK_DIM[k as VARKKey];
                  const col = VARK_COLORS[k];
                  const IconComp = dim?.icon || Eye;
                  return (
                    <div key={i} className={cn("flex flex-col items-center gap-1 p-3 rounded-xl border-2 min-w-[70px]", col.bg, col.border)}>
                      <IconComp className={cn("h-5 w-5", col.text)} />
                      <span className={cn("text-lg font-bold", col.text)}>{k}</span>
                      <span className="text-[10px] text-muted-foreground">{dim?.label}</span>
                      <span className={cn("text-xl font-bold", col.text)}>
                        {k === "V" ? detailItem.skorV : k === "A" ? detailItem.skorA : k === "R" ? detailItem.skorR : detailItem.skorK}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Dominant */}
              <div className={cn("p-4 rounded-xl border", getVARKColor(detailItem.dominan).bg, getVARKColor(detailItem.dominan).border)}>
                <p className={cn("text-sm font-bold", getVARKColor(detailItem.dominan).text)}>
                  Gaya Belajar Dominan: {VARK_DIM[detailItem.dominan as VARKKey]?.label}
                </p>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Deskripsi:</p>
                <p className="text-sm leading-relaxed">{detailItem.deskripsi}</p>
              </div>

              {/* Tips */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Saran Belajar:</p>
                <p className="text-sm leading-relaxed">{detailItem.saranBelajar}</p>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-2 border-t">
                <span>Waktu: {formatWaktu(detailItem.waktuKerja)}</span>
                <span>Soal: {detailItem.totalSoal}</span>
                <span>Dikerjakan: {new Date(detailItem.createdAt).toLocaleDateString("id-ID")}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── Delete Dialog ────────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Hasil Tes?</AlertDialogTitle>
            <AlertDialogDescription>
              Hasil tes untuk <strong>{deleteTarget?.siswaNama}</strong> akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
