"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Brain, Palette, LogIn, LogOut, ChevronRight, ChevronLeft,
  CheckCircle2, AlertCircle, Clock, User, BarChart3,
  Eye, Ear, BookOpen, Hand, RotateCcw, Loader2, GraduationCap,
  FileCheck2, Sparkles, ArrowLeft, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/app";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────

interface SiswaInfo {
  id: string;
  nama: string;
  nisn: string;
  nipd: string;
  jenisKelamin: string;
  rombel: string;
  tahunPelajaran: string;
  semester: string;
  tempatLahir: string;
  tanggalLahir: string;
}

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

interface HasilMinatBakat {
  id: string;
  siswaId: string;
  siswaNama: string;
  nisn: string;
  rombel: string;
  jenisKelamin: string;
  skorR: number;
  skorI: number;
  skorA: number;
  skorS: number;
  skorE: number;
  skorC: number;
  dominan1: string;
  dominan2: string;
  dominan3: string;
  kodeRIASEC: string;
  rekomendasiJurusan: string;
  deskripsi: string;
  totalPoin: number;
  totalSoal: number;
  waktuKerja: number;
  dibuatOleh: string;
  createdAt: string;
}

interface HasilGayaBelajar {
  id: string;
  siswaId: string;
  siswaNama: string;
  nisn: string;
  rombel: string;
  jenisKelamin: string;
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

// ─── RIASEC Color Map ───────────────────────────────────────────────────

const riasecColors: Record<string, string> = {
  R: "bg-red-100 text-red-700 border-red-200",
  I: "bg-amber-100 text-amber-700 border-amber-200",
  A: "bg-emerald-100 text-emerald-700 border-emerald-200",
  S: "bg-sky-100 text-sky-700 border-sky-200",
  E: "bg-rose-100 text-rose-700 border-rose-200",
  C: "bg-violet-100 text-violet-700 border-violet-200",
};

const riasecLabels: Record<string, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

const varkColors: Record<string, string> = {
  V: "bg-pink-100 text-pink-700 border-pink-200",
  A: "bg-cyan-100 text-cyan-700 border-cyan-200",
  R: "bg-orange-100 text-orange-700 border-orange-200",
  K: "bg-teal-100 text-teal-700 border-teal-200",
};

const varkLabels: Record<string, string> = {
  V: "Visual",
  A: "Auditory",
  R: "Read/Write",
  K: "Kinestetik",
};

const varkIcons: Record<string, React.ElementType> = {
  V: Eye,
  A: Ear,
  R: BookOpen,
  K: Hand,
};

// ─── Main Component ────────────────────────────────────────────────────

export default function SiswaPortalPage() {
  const { tahunPelajaran, semester, setActivePage } = useAppStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  // State
  const [nisnInput, setNisnInput] = useState("");
  const [siswa, setSiswa] = useState<SiswaInfo | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedTest, setSelectedTest] = useState<"minat-bakat" | "gaya-belajar" | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: async (nisn: string) => {
      const res = await fetch("/api/siswa-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nisn }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal verifikasi");
      return data.siswa as SiswaInfo;
    },
    onSuccess: (siswaData) => {
      setSiswa(siswaData);
      toast({
        title: "Selamat datang!",
        description: `Halo, ${siswaData.nama}`,
      });
    },
    onError: (err) => {
      toast({
        title: "Verifikasi gagal",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // ─── Logout ──────────────────────────────────────────────────────
  const handleLogout = () => {
    setSiswa(null);
    setNisnInput("");
    setActiveTab("dashboard");
    setSelectedTest(null);
    setConfirmLogout(false);
    qc.clear();
  };

  // ─── Login screen ────────────────────────────────────────────────
  if (!siswa) {
    return <LoginScreen />;
  }

  // ─── Login Screen Component ────────────────────────────────────────
  function LoginScreen() {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        <div className="w-full max-w-md px-4">
          <Card className="border-0 shadow-xl shadow-slate-200/50">
            <CardHeader className="text-center pb-2 pt-8">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-800">Portal Siswa</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Masukkan NISN kamu untuk mengakses tes</p>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nisn">NISN</Label>
                  <Input
                    id="nisn"
                    type="text"
                    placeholder="Masukkan NISN kamu"
                    value={nisnInput}
                    onChange={(e) => setNisnInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && nisnInput.trim()) {
                        verifyMutation.mutate(nisnInput.trim());
                      }
                    }}
                    className="h-12 text-center text-lg tracking-wider"
                  />
                </div>
                <Button
                  className="w-full h-12 text-base font-medium bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  onClick={() => {
                    if (nisnInput.trim()) {
                      verifyMutation.mutate(nisnInput.trim());
                    }
                  }}
                  disabled={verifyMutation.isPending || !nisnInput.trim()}
                >
                  {verifyMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      Masuk
                    </>
                  )}
                </Button>
                <div className="flex items-center gap-2 justify-center text-xs text-slate-400 mt-2">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Data kamu aman dan terenkripsi</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Test Taking Component (shared for both tests) ─────────────────
  function TestTakingView({ testType }: { testType: "minat-bakat" | "gaya-belajar" }) {
    const [jawaban, setJawaban] = useState<Record<string, string>>({});
    const [currentSoal, setCurrentSoal] = useState(0);
    const [waktuMulai] = useState(Date.now());
    const [confirmSubmit, setConfirmSubmit] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [finished, setFinished] = useState(false);
    const finishDialogRef = useRef<HTMLDivElement>(null);

    const isMinatBakat = testType === "minat-bakat";

    // Fetch questions
    const { data: soalData, isLoading: loadingSoal } = useQuery({
      queryKey: [`siswa-soal-${testType}`, tahunPelajaran],
      queryFn: async () => {
        const endpoint = isMinatBakat ? "/api/siswa-portal/soal-minat-bakat" : "/api/siswa-portal/soal-gaya-belajar";
        const res = await fetch(`${endpoint}?tahunPelajaran=${tahunPelajaran}`);
        if (!res.ok) throw new Error("Gagal memuat soal");
        return res.json();
      },
      enabled: !finished,
    });

    const soalList: SoalItem[] = soalData?.questions || [];
    const totalSoal = soalList.length;
    const soalSekarang = soalList[currentSoal];
    const totalDijawab = Object.keys(jawaban).length;
    const progressPercent = totalSoal > 0 ? (totalDijawab / totalSoal) * 100 : 0;

    // Check if already has result
    const { data: existingResult } = useQuery({
      queryKey: [`siswa-hasil-${testType}`, siswa.id, tahunPelajaran, semester],
      queryFn: async () => {
        const endpoint = isMinatBakat ? "/api/siswa-portal/hasil-minat-bakat" : "/api/siswa-portal/hasil-gaya-belajar";
        const res = await fetch(`${endpoint}?siswaId=${siswa.id}&tahunPelajaran=${tahunPelajaran}&semester=${semester}`);
        if (!res.ok) throw new Error("Gagal memuat hasil");
        return res.json();
      },
    });

    // Submit mutation
    const submitMutation = useMutation({
      mutationFn: async () => {
        const endpoint = isMinatBakat ? "/api/siswa-portal/submit-minat-bakat" : "/api/siswa-portal/submit-gaya-belajar";
        const waktuKerja = Math.floor((Date.now() - waktuMulai) / 1000);

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siswaId: siswa.id,
            siswaNama: siswa.nama,
            nisn: siswa.nisn,
            rombel: siswa.rombel,
            jenisKelamin: siswa.jenisKelamin,
            tahunPelajaran,
            semester,
            jawaban,
            waktuKerja,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
        return data;
      },
      onSuccess: () => {
        setFinished(true);
        setConfirmSubmit(false);
        qc.invalidateQueries({ queryKey: [`siswa-hasil-${testType}`] });
        toast({
          title: "Tes berhasil disubmit!",
          description: "Hasil tes kamu sudah tersimpan.",
        });
      },
      onError: (err) => {
        toast({
          title: "Gagal submit",
          description: err.message,
          variant: "destructive",
        });
      },
    });

    const handleJawab = (nomor: number, answer: string) => {
      setJawaban((prev) => ({ ...prev, [String(nomor)]: answer }));
    };

    const handleSubmit = () => {
      setSubmitting(true);
      submitMutation.mutate();
      setTimeout(() => setSubmitting(false), 2000);
    };

    // ─── Finished State ───────────────────────────────────────────
    if (finished && existingResult?.data) {
      return (
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Tes Berhasil Diselesaikan!</h2>
              <p className="text-slate-500 mb-6">Hasil tes kamu sudah tersimpan. Kamu bisa melihat hasilnya di tab Hasil.</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setSelectedTest(null)} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali
                </Button>
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" onClick={() => { setSelectedTest(null); setActiveTab("hasil"); }}>
                  <FileCheck2 className="w-4 h-4 mr-2" />
                  Lihat Hasil
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // ─── Loading Questions ────────────────────────────────────────
    if (loadingSoal) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
            <p className="text-slate-500">Memuat soal...</p>
          </div>
        </div>
      );
    }

    // ─── No Questions ───────────────────────────────────────────────
    if (soalList.length === 0) {
      return (
        <div className="max-w-md mx-auto text-center py-12">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Belum Ada Soal</h3>
          <p className="text-slate-500 mb-6">Soal untuk tahun pelajaran {tahunPelajaran} belum tersedia. Silakan hubungi operator sekolah.</p>
          <Button onClick={() => setSelectedTest(null)} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </div>
      );
    }

    // ─── Already Completed (show option to retake) ─────────────────
    if (existingResult?.data && !finished) {
      return (
        <div className="max-w-md mx-auto text-center py-12">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Kamu Sudah Mengerjakan Tes Ini</h3>
          <p className="text-slate-500 mb-6">Kamu sudah menyelesaikan {isMinatBakat ? "Tes Minat Bakat" : "Tes Gaya Belajar"} untuk tahun pelajaran ini. Apakah kamu ingin mengerjakan ulang?</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setSelectedTest(null)} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" onClick={() => {
              setJawaban({});
              setCurrentSoal(0);
              qc.invalidateQueries({ queryKey: [`siswa-hasil-${testType}`] });
            }}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Kerjakan Ulang
            </Button>
          </div>
        </div>
      );
    }

    // ─── Timer ─────────────────────────────────────────────────────
    const formatWaktu = (ms: number) => {
      const detik = Math.floor(ms / 1000);
      const menit = Math.floor(detik / 60);
      const sisaDetik = detik % 60;
      return `${String(menit).padStart(2, "0")}:${String(sisaDetik).padStart(2, "0")}`;
    };

    const waktuBerjalan = Date.now() - waktuMulai;

    return (
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">{totalDijawab} / {totalSoal} dijawab</span>
            <span className="text-sm text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatWaktu(waktuBerjalan)}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Question Card */}
        {soalSekarang && (
          <Card className="border-0 shadow-lg mb-4">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="bg-slate-50 font-medium">
                  Soal {soalSekarang.nomor}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {isMinatBakat
                    ? `Dimensi: ${soalSekarang.dimensi}`
                    : `VARK: ${soalSekarang.dimensi}`}
                </Badge>
              </div>
              <h3 className="text-base font-medium text-slate-800 leading-relaxed">
                {soalSekarang.pertanyaan}
              </h3>
            </CardContent>
          </Card>
        )}

        {/* Answer Options */}
        {soalSekarang && (
          <div className="space-y-3 mb-6">
            {[
              { key: "A", label: soalSekarang.poinA },
              { key: "B", label: soalSekarang.poinB },
            ].map((opt) => {
              const isSelected = jawaban[String(soalSekarang.nomor)] === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => handleJawab(soalSekarang.nomor, opt.key)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border-2 transition-all duration-200",
                    isSelected
                      ? "border-emerald-500 bg-emerald-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors",
                        isSelected
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {opt.key}
                    </div>
                    <span className={cn(
                      "text-sm leading-relaxed pt-1",
                      isSelected ? "text-emerald-800 font-medium" : "text-slate-700"
                    )}>
                      {opt.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Question Navigation Grid */}
        <Card className="border-0 shadow-sm mb-4">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-slate-400 mb-3">Navigasi soal:</p>
            <div className="grid grid-cols-10 gap-1.5">
              {soalList.map((s) => {
                const isJawab = String(s.nomor) in jawaban;
                const isCurrent = s.nomor - 1 === currentSoal;
                return (
                  <button
                    key={s.id}
                    onClick={() => setCurrentSoal(s.nomor - 1)}
                    className={cn(
                      "w-full aspect-square rounded-lg text-xs font-medium transition-all",
                      isCurrent
                        ? "bg-emerald-500 text-white shadow-md"
                        : isJawab
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    )}
                  >
                    {s.nomor}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentSoal((prev) => Math.max(0, prev - 1))}
            disabled={currentSoal === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Sebelumnya
          </Button>

          {currentSoal < totalSoal - 1 ? (
            <Button
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              onClick={() => setCurrentSoal((prev) => prev + 1)}
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={() => {
                if (totalDijawab < totalSoal) {
                  toast({
                    title: "Belum semua soal dijawab",
                    description: `Kamu sudah menjawab ${totalDijawab} dari ${totalSoal} soal. Lanjutkan atau submit sekarang.`,
                  });
                  setConfirmSubmit(true);
                } else {
                  setConfirmSubmit(true);
                }
              }}
              disabled={totalDijawab === 0}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Selesai
            </Button>
          )}
        </div>

        {/* Submit Confirmation Dialog */}
        <Dialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kirim Jawaban?</DialogTitle>
              <DialogDescription>
                {totalDijawab < totalSoal ? (
                  <>
                    Kamu sudah menjawab <strong>{totalDijawab}</strong> dari <strong>{totalSoal}</strong> soal.
                    Soal yang belum dijawab akan dianggap kosong.
                  </>
                ) : (
                  <>Semua {totalSoal} soal sudah dijawab. Yakin ingin mengirim?</>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmSubmit(false)}>Batal</Button>
              <Button
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Kirim"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── Results View ──────────────────────────────────────────────────
  function ResultsView() {
    const { data: hasilMB, isLoading: loadingMB } = useQuery({
      queryKey: ["siswa-hasil-minat-bakat", siswa.id, tahunPelajaran, semester],
      queryFn: async () => {
        const res = await fetch(`/api/siswa-portal/hasil-minat-bakat?siswaId=${siswa.id}&tahunPelajaran=${tahunPelajaran}&semester=${semester}`);
        if (!res.ok) throw new Error("Gagal memuat");
        return res.json();
      },
    });

    const { data: hasilGB, isLoading: loadingGB } = useQuery({
      queryKey: ["siswa-hasil-gaya-belajar", siswa.id, tahunPelajaran, semester],
      queryFn: async () => {
        const res = await fetch(`/api/siswa-portal/hasil-gaya-belajar?siswaId=${siswa.id}&tahunPelajaran=${tahunPelajaran}&semester=${semester}`);
        if (!res.ok) throw new Error("Gagal memuat");
        return res.json();
      },
    });

    const mb: HasilMinatBakat | null = hasilMB?.data || null;
    const gb: HasilGayaBelajar | null = hasilGB?.data || null;

    const isLoading = loadingMB || loadingGB;

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      );
    }

    if (!mb && !gb) {
      return (
        <div className="max-w-md mx-auto text-center py-12">
          <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">Belum Ada Hasil Tes</h3>
          <p className="text-slate-400">Kamu belum mengerjakan tes apapun. Mulai mengerjakan tes di tab "Kerjakan Tes".</p>
        </div>
      );
    }

    const formatWaktu = (detik: number) => {
      const m = Math.floor(detik / 60);
      const s = detik % 60;
      if (m > 0) return `${m} menit ${s} detik`;
      return `${s} detik`;
    };

    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Tes Minat Bakat Result */}
        {mb && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Tes Minat Bakat (RIASEC)</CardTitle>
                  <p className="text-xs text-slate-400">{mb.kodeRIASEC} &middot; {formatWaktu(mb.waktuKerja)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Top 3 */}
              <div className="flex items-center gap-3">
                {[mb.dominan1, mb.dominan2, mb.dominan3].map((d, i) => (
                  <Badge
                    key={d}
                    className={cn(
                      "text-sm px-3 py-1 border",
                      riasecColors[d] || "bg-slate-100 text-slate-600 border-slate-200"
                    )}
                  >
                    {d} - {riasecLabels[d]}
                  </Badge>
                ))}
              </div>

              {/* Score Chart */}
              <div className="space-y-2">
                {(["R", "I", "A", "S", "E", "C"] as const).map((dim) => {
                  const skor = mb[`skor${dim}` as keyof HasilMinatBakat] as number;
                  const maxSkor = Math.max(mb.skorR, mb.skorI, mb.skorA, mb.skorS, mb.skorE, mb.skorC, 1);
                  const pct = (skor / mb.totalSoal) * 100;
                  return (
                    <div key={dim} className="flex items-center gap-3">
                      <span className="text-xs font-bold w-6 text-slate-500">{dim}</span>
                      <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            dim === "R" ? "bg-red-400" :
                            dim === "I" ? "bg-amber-400" :
                            dim === "A" ? "bg-emerald-400" :
                            dim === "S" ? "bg-sky-400" :
                            dim === "E" ? "bg-rose-400" : "bg-violet-400"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right text-slate-600">{skor}</span>
                    </div>
                  );
                })}
              </div>

              {/* Description */}
              {mb.deskripsi && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-700 leading-relaxed">{mb.deskripsi}</p>
                </div>
              )}

              {/* Recommendations */}
              {mb.rekomendasiJurusan && (
                <div className="bg-emerald-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-emerald-800 mb-2">Rekomendasi Jurusan</h4>
                  <p className="text-sm text-emerald-700 leading-relaxed whitespace-pre-line">{mb.rekomendasiJurusan}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Gaya Belajar Result */}
        {gb && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Tes Gaya Belajar (VARK)</CardTitle>
                  <p className="text-xs text-slate-400">{gb.kodeVARK} &middot; {formatWaktu(gb.waktuKerja)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dominant Badge */}
              <div className="flex items-center gap-3">
                {gb.kodeVARK.split("").map((d) => {
                  const VarkIcon = varkIcons[d] || Eye;
                  return (
                    <Badge
                      key={d}
                      className={cn(
                        "text-sm px-3 py-1 border gap-1",
                        varkColors[d] || "bg-slate-100 text-slate-600 border-slate-200"
                      )}
                    >
                      <VarkIcon className="w-3.5 h-3.5" />
                      {varkLabels[d]}
                    </Badge>
                  );
                })}
              </div>

              {/* Score Chart */}
              <div className="space-y-2">
                {(["V", "A", "R", "K"] as const).map((dim) => {
                  const skor = gb[`skor${dim}` as keyof HasilGayaBelajar] as number;
                  const pct = (skor / gb.totalSoal) * 100;
                  return (
                    <div key={dim} className="flex items-center gap-3">
                      <span className="text-xs font-bold w-6 text-slate-500">{dim}</span>
                      <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            dim === "V" ? "bg-pink-400" :
                            dim === "A" ? "bg-cyan-400" :
                            dim === "R" ? "bg-orange-400" : "bg-teal-400"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right text-slate-600">{skor}</span>
                    </div>
                  );
                })}
              </div>

              {/* Description */}
              {gb.deskripsi && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Gaya Belajar Dominan: {varkLabels[gb.dominan]}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{gb.deskripsi}</p>
                </div>
              )}

              {/* Saran */}
              {gb.saranBelajar && (
                <div className="bg-violet-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-violet-800 mb-2">Saran Belajar</h4>
                  <p className="text-sm text-violet-700 leading-relaxed">{gb.saranBelajar}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ─── Main Portal Layout ────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-800">Portal Siswa</h1>
              <p className="text-xs text-slate-400">{siswa.nama} &middot; {siswa.rombel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs hidden sm:flex">
              {tahunPelajaran} - {semester}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setConfirmLogout(true)} className="text-slate-500 hover:text-red-600">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Taking a Test */}
        {selectedTest && (
          <TestTakingView testType={selectedTest} />
        )}

        {/* Normal View */}
        {!selectedTest && (
          <>
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="bg-white border border-slate-200 shadow-sm p-1 h-auto">
                <TabsTrigger value="dashboard" className="text-sm data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 px-4 py-2 rounded-lg">
                  Beranda
                </TabsTrigger>
                <TabsTrigger value="kerjakan" className="text-sm data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 px-4 py-2 rounded-lg">
                  Kerjakan Tes
                </TabsTrigger>
                <TabsTrigger value="hasil" className="text-sm data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 px-4 py-2 rounded-lg">
                  Hasil Tes
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {/* Student Info Card */}
                <Card className="border-0 shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-slate-800">{siswa.nama}</h2>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="text-slate-400">NISN:</span>
                            <span className="font-medium text-slate-700">{siswa.nisn}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="text-slate-400">NIPD:</span>
                            <span className="font-medium text-slate-700">{siswa.nipd || "-"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="text-slate-400">Kelas:</span>
                            <span className="font-medium text-slate-700">{siswa.rombel}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="text-slate-400">L/P:</span>
                            <span className="font-medium text-slate-700">{siswa.jenisKelamin || "-"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Test Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card
                    className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => setSelectedTest("minat-bakat")}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                          <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800">Tes Minat Bakat</h3>
                          <p className="text-sm text-slate-500 mt-1">Temukan minat dan bakatmu berdasarkan model RIASEC</p>
                          <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium mt-3 group-hover:gap-2 transition-all">
                            Mulai Tes
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => setSelectedTest("gaya-belajar")}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                          <Palette className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800">Tes Gaya Belajar</h3>
                          <p className="text-sm text-slate-500 mt-1">Ketahui gaya belajarmu berdasarkan model VARK</p>
                          <div className="flex items-center gap-1 text-violet-600 text-sm font-medium mt-3 group-hover:gap-2 transition-all">
                            Mulai Tes
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Kerjakan Tes Tab */}
            {activeTab === "kerjakan" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card
                    className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
                    onClick={() => setSelectedTest("minat-bakat")}
                  >
                    <CardContent className="pt-8 pb-8">
                      <div className="text-center">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-rose-200">
                          <Brain className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">Tes Minat Bakat</h3>
                        <p className="text-sm text-slate-500 mt-1 mb-1">Model RIASEC &middot; 40 Soal</p>
                        <p className="text-xs text-slate-400">Waktu: ±10-15 menit</p>
                        <Button className="mt-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Mulai Tes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
                    onClick={() => setSelectedTest("gaya-belajar")}
                  >
                    <CardContent className="pt-8 pb-8">
                      <div className="text-center">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-violet-200">
                          <Palette className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">Tes Gaya Belajar</h3>
                        <p className="text-sm text-slate-500 mt-1 mb-1">Model VARK &middot; 30 Soal</p>
                        <p className="text-xs text-slate-400">Waktu: ±8-10 menit</p>
                        <Button className="mt-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Mulai Tes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Hasil Tes Tab */}
            {activeTab === "hasil" && <ResultsView />}
          </>
        )}
      </div>

      {/* Logout Confirmation */}
      <Dialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keluar dari Portal?</DialogTitle>
            <DialogDescription>
              Kamu akan keluar dari portal siswa. Progres tes yang belum selesai akan hilang.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmLogout(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
