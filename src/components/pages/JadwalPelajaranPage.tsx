"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock, Plus, Trash2, Pencil, Save, BookOpen, Clock,
  Users, Eye, Shield, X, Check, Loader2, Printer, GraduationCap,
  Search, LayoutGrid, List, ChevronDown, School, TableProperties,
  Settings2, UserCheck, Filter, ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/app";
import { useSession } from "next-auth/react";

// ─── Constants ─────────────────────────────────────────────────────────────────
const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// aSc Timetables-inspired color palette for mapel
const MAPEL_PALETTE = [
  { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B" },  // amber
  { bg: "#FCE7F3", text: "#9D174D", border: "#EC4899" },  // pink
  { bg: "#DBEAFE", text: "#1E40AF", border: "#3B82F6" },  // blue
  { bg: "#D1FAE5", text: "#065F46", border: "#10B981" },  // emerald
  { bg: "#EDE9FE", text: "#5B21B6", border: "#8B5CF6" },  // violet
  { bg: "#FFEDD5", text: "#9A3412", border: "#F97316" },  // orange
  { bg: "#FEE2E2", text: "#991B1B", border: "#EF4444" },  // red
  { bg: "#CCFBF1", text: "#115E59", border: "#14B8A6" },  // teal
  { bg: "#FEF9C3", text: "#854D0E", border: "#EAB308" },  // yellow
  { bg: "#E0E7FF", text: "#3730A3", border: "#6366F1" },  // indigo
  { bg: "#F3E8FF", text: "#6B21A8", border: "#A855F7" },  // purple
  { bg: "#DCFCE7", text: "#166534", border: "#22C55E" },  // green
  { bg: "#CFFAFE", text: "#155E75", border: "#06B6D4" },  // cyan
  { bg: "#FFE4E6", text: "#9F1239", border: "#F43F5E" },  // rose
  { bg: "#F0FDF4", text: "#14532D", border: "#4ADE80" },  // lime-green
  { bg: "#FDF4FF", text: "#86198F", border: "#D946EF" },  // fuchsia
  { bg: "#FFF7ED", text: "#9A3412", border: "#FB923C" },  // light-orange
  { bg: "#EFF6FF", text: "#1E3A5F", border: "#2563EB" },  // sky
  { bg: "#F5F3FF", text: "#4C1D95", border: "#7C3AED" },  // deep-violet
  { bg: "#ECFDF5", text: "#064E3B", border: "#059669" },  // deep-emerald
];

function getMapelColor(mapelId: string, mapelList: MapelItem[]): { bg: string; text: string; border: string } {
  const idx = mapelList.findIndex((m) => m.id === mapelId);
  if (idx === -1) return { bg: "#F3F4F6", text: "#6B7280", border: "#D1D5DB" };
  return MAPEL_PALETTE[idx % MAPEL_PALETTE.length];
}

// ─── Types ─────────────────────────────────────────────────────────────────────
interface MapelItem {
  id: string; kode: string; nama: string;
  tahunPelajaran: string; semester: string;
}

interface JamItem {
  id: string; jamKe: number; jamMulai: string; jamSelesai: string;
  tahunPelajaran: string; semester: string;
}

interface JadwalItem {
  id: string; hari: string; jamKe: number;
  mapelId: string; mapelKode: string; mapelNama: string;
  guruId: string; guruNama: string; rombel: string;
  tahunPelajaran: string; semester: string;
}

interface GuruItem { id: string; nama: string; no: string; }

interface AksesItem {
  id: string; userId: string; rombel: string;
  tahunPelajaran: string; semester: string; createdAt: string;
  user: { id: string; username: string; nama: string };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIMETABLE VIEW — aSc Timetables Style Grid
// ═══════════════════════════════════════════════════════════════════════════════
interface EditCell {
  rombel: string; hari: string; jamKe: number;
  existing?: JadwalItem;
}

function TimetableView() {
  const { toast } = useToast();
  const { tahunPelajaran, semester } = useAppStore();
  const qc = useQueryClient();
  const session = useSession();
  const isAdmin = session.data?.user?.role === "admin";

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  const { data: mapelList = [] } = useQuery({
    queryKey: ["jadwal-mapel", tahunPelajaran, semester],
    queryFn: async () => {
      const p = new URLSearchParams({ tahunPelajaran, semester });
      const r = await fetch(`/api/jadwal/mapel?${p}`);
      if (!r.ok) throw new Error("Gagal");
      return r.json();
    },
    enabled: !!tahunPelajaran,
  });

  const { data: jamList = [] } = useQuery({
    queryKey: ["jadwal-jam", tahunPelajaran, semester],
    queryFn: async () => {
      const p = new URLSearchParams({ tahunPelajaran, semester });
      const r = await fetch(`/api/jadwal/jam?${p}`);
      if (!r.ok) throw new Error("Gagal");
      return r.json();
    },
    enabled: !!tahunPelajaran,
  });

  const { data: guruList = [] } = useQuery({
    queryKey: ["jadwal-guru", tahunPelajaran, semester],
    queryFn: async () => {
      const p = new URLSearchParams({ tahunPelajaran, semester });
      const r = await fetch(`/api/guru/list?${p}`);
      if (!r.ok) throw new Error("Gagal");
      return r.json();
    },
    enabled: !!tahunPelajaran,
  });

  const { data: rombelList = [] } = useQuery({
    queryKey: ["jadwal-rombel", tahunPelajaran, semester],
    queryFn: async () => {
      const p = new URLSearchParams({ tahunPelajaran, semester });
      const r = await fetch(`/api/siswa/rombel?${p}`);
      if (!r.ok) throw new Error("Gagal");
      return r.json();
    },
    enabled: !!tahunPelajaran,
  });

  // Fetch ALL jadwal for the current TP/semester
  const { data: allJadwal = [], isLoading } = useQuery({
    queryKey: ["jadwal-all", tahunPelajaran, semester],
    queryFn: async () => {
      const p = new URLSearchParams({ tahunPelajaran, semester });
      const r = await fetch(`/api/jadwal/kelas?${p}`);
      if (!r.ok) throw new Error("Gagal");
      return r.json();
    },
    enabled: !!tahunPelajaran,
  });

  // ─── Build Lookup Maps ──────────────────────────────────────────────────────
  const jadwalMap = useMemo(() => {
    const map: Record<string, JadwalItem> = {};
    for (const j of allJadwal) {
      map[`${j.rombel}-${j.hari}-${j.jamKe}`] = j;
    }
    return map;
  }, [allJadwal]);

  // ─── Filter State ───────────────────────────────────────────────────────────
  const [filterRombel, setFilterRombel] = useState("Semua");

  const filteredRombels = useMemo(() => {
    if (filterRombel === "Semua") return rombelList as string[];
    return (rombelList as string[]).filter((r) => r === filterRombel);
  }, [rombelList, filterRombel]);

  // ─── Edit Cell State ────────────────────────────────────────────────────────
  const [editCell, setEditCell] = useState<EditCell | null>(null);
  const [editMapelId, setEditMapelId] = useState("");
  const [editGuruId, setEditGuruId] = useState("");

  const openEditCell = useCallback((cell: EditCell) => {
    setEditCell(cell);
    setEditMapelId(cell.existing?.mapelId || "");
    setEditGuruId(cell.existing?.guruId || "");
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editCell) return;
      const mapel = (mapelList as MapelItem[]).find((m) => m.id === editMapelId);
      const guru = (guruList as GuruItem[]).find((g) => g.id === editGuruId);
      const body = {
        hari: editCell.hari, jamKe: editCell.jamKe, rombel: editCell.rombel,
        mapelId: editMapelId, mapelKode: mapel?.kode || "", mapelNama: mapel?.nama || "",
        guruId: editGuruId || "", guruNama: guru?.nama || "",
        tahunPelajaran, semester,
      };
      const res = await fetch("/api/jadwal/kelas", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const d = await res.json(); if (!res.ok) throw new Error(d.error); return d;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jadwal-all"] });
      qc.invalidateQueries({ queryKey: ["jadwal-kelas"] });
      toast({ title: "Jadwal disimpan" });
      setEditCell(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCellMutation = useMutation({
    mutationFn: async () => {
      if (!editCell?.existing?.id) return;
      const res = await fetch(`/api/jadwal/kelas?id=${editCell.existing.id}`, { method: "DELETE" });
      const d = await res.json(); if (!res.ok) throw new Error(d.error); return d;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jadwal-all"] });
      qc.invalidateQueries({ queryKey: ["jadwal-kelas"] });
      toast({ title: "Jadwal dihapus" });
      setEditCell(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // ─── Print Handler ──────────────────────────────────────────────────────────
  const handlePrint = () => window.print();

  if (isLoading) return <Skeleton className="h-[600px] w-full" />;
  if (!tahunPelajaran) return <div className="text-center py-16 text-muted-foreground">Pilih Tahun Pelajaran terlebih dahulu</div>;

  return (
    <div className="space-y-3 print:space-y-0">
      {/* ─── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
        <div className="flex items-center gap-2">
          <Select value={filterRombel} onValueChange={setFilterRombel}>
            <SelectTrigger className="w-48 h-9">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Semua">Semua Kelas</SelectItem>
              {(rombelList as string[]).map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" /> Cetak
          </Button>
        </div>
      </div>

      {/* ─── Legend ──────────────────────────────────────────────────────────── */}
      {(mapelList as MapelItem[]).length > 0 && (
        <div className="flex flex-wrap gap-1.5 print:hidden">
          {(mapelList as MapelItem[]).map((m) => {
            const color = getMapelColor(m.id, mapelList as MapelItem[]);
            return (
              <span
                key={m.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border"
                style={{ backgroundColor: color.bg, color: color.text, borderColor: color.border }}
              >
                {m.kode}
              </span>
            );
          })}
        </div>
      )}

      {/* ─── Grid ─────────────────────────────────────────────────────────────── */}
      <div className="border rounded-lg overflow-hidden bg-white print:border-1">
        <ScrollArea className="w-full print:overflow-visible">
          <div className="min-w-max">
            <table className="w-full border-collapse text-xs">
              {/* ── Header Row 1: Hari ── */}
              <thead>
                <tr className="bg-gradient-to-b from-slate-100 to-slate-50 print:bg-gray-200">
                  <th
                    rowSpan={2}
                    className="border border-slate-200 bg-slate-100 px-3 py-2 text-left font-bold text-slate-700 min-w-[120px] sticky left-0 z-20 print:bg-gray-200 print:sticky print:left-0"
                    style={{ top: 0 }}
                  >
                    Kelas
                  </th>
                  {HARI.map((hari) => {
                    const span = (jamList as JamItem[]).length || 1;
                    return (
                      <th
                        key={hari}
                        colSpan={span}
                        className="border border-slate-200 px-3 py-2 text-center font-bold text-slate-700 uppercase tracking-wider bg-gradient-to-b from-slate-200 to-slate-100"
                      >
                        {hari}
                      </th>
                    );
                  })}
                  <th
                    rowSpan={2}
                    className="border border-slate-200 bg-slate-100 px-2 py-1 text-center text-slate-400 w-8 print:hidden"
                    title="Hapus"
                  >
                    <Trash2 className="h-3 w-3 mx-auto" />
                  </th>
                </tr>
                {/* ── Header Row 2: Jam ── */}
                <tr className="bg-slate-50 print:bg-gray-100">
                  {(jamList as JamItem[]).length > 0
                    ? HARI.flatMap((hari) =>
                        (jamList as JamItem[]).map((jam) => (
                          <th
                            key={`${hari}-${jam.jamKe}`}
                            className="border border-slate-200 px-1 py-1 text-center font-medium text-slate-500 min-w-[60px]"
                          >
                            <div>{jam.jamKe}</div>
                            <div className="text-[9px] text-slate-400">{jam.jamMulai}-{jam.jamSelesai}</div>
                          </th>
                        ))
                      )
                    : HARI.map((hari) => (
                        <th key={hari} className="border border-slate-200 px-2 py-1 text-center text-slate-400">
                          -
                        </th>
                      ))}
                </tr>
              </thead>

              {/* ── Body ── */}
              <tbody>
                {filteredRombels.length === 0 ? (
                  <tr>
                    <td colSpan={100} className="py-12 text-center text-muted-foreground">
                      <School className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p>Belum ada data. Lengkapi Mata Pelajaran &amp; Jam Pelajaran di tab &quot;Master Data&quot;</p>
                    </td>
                  </tr>
                ) : (
                  filteredRombels.map((rombel, rowIdx) => (
                    <tr key={rombel} className={rowIdx % 2 === 1 ? "bg-slate-50/50" : ""}>
                      <td className="border border-slate-200 px-3 py-1 font-bold text-slate-700 sticky left-0 z-10 bg-white text-sm print:bg-white print:sticky print:left-0">
                        {rombel}
                      </td>
                      {HARI.flatMap((hari) =>
                        (jamList as JamItem[]).length > 0
                          ? (jamList as JamItem[]).map((jam) => {
                              const key = `${rombel}-${hari}-${jam.jamKe}`;
                              const entry = jadwalMap[key];
                              const color = entry ? getMapelColor(entry.mapelId, mapelList as MapelItem[]) : null;
                              return (
                                <td
                                  key={`${hari}-${jam.jamKe}`}
                                  className="border border-slate-200 p-0 cursor-pointer hover:brightness-95 transition-all print:cursor-default print:hover:brightness-100"
                                  style={{
                                    backgroundColor: color?.bg || "transparent",
                                    borderColor: color?.border || "#E2E8F0",
                                  }}
                                  onClick={() => openEditCell({ rombel, hari, jamKe: jam.jamKe, existing: entry })}
                                >
                                  {entry ? (
                                    <div className="flex flex-col items-center justify-center py-1 px-0.5 min-h-[32px]">
                                      <span
                                        className="font-bold leading-tight"
                                        style={{ color: color?.text || "#374151", fontSize: "10px" }}
                                      >
                                        {entry.mapelKode}
                                      </span>
                                      <span
                                        className="opacity-60 truncate max-w-[55px] w-full text-center"
                                        style={{ color: color?.text || "#374151", fontSize: "8px" }}
                                      >
                                        {entry.guruNama}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="min-h-[32px] flex items-center justify-center print:hidden">
                                      <span className="text-slate-300 text-lg leading-none">·</span>
                                    </div>
                                  )}
                                </td>
                              );
                            })
                          : [<td key={hari} className="border border-slate-200" />]
                      )}
                      <td className="border border-slate-200 text-center print:hidden">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-400 hover:text-destructive"
                          onClick={() => {
                            const rombelJadwal = (allJadwal as JadwalItem[]).filter((j) => j.rombel === rombel);
                            Promise.all(
                              rombelJadwal.map((j) =>
                                fetch(`/api/jadwal/kelas?id=${j.id}`, { method: "DELETE" })
                              )
                            ).then(() => {
                              qc.invalidateQueries({ queryKey: ["jadwal-all"] });
                              toast({ title: `Jadwal ${rombel} dihapus` });
                            });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </div>

      {/* ─── Edit Cell Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={!!editCell} onOpenChange={(open) => !open && setEditCell(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Jadwal</DialogTitle>
            <DialogDescription>
              {editCell?.rombel} — {editCell?.hari}, Jam ke-{editCell?.jamKe}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Mata Pelajaran</Label>
              <Select value={editMapelId} onValueChange={setEditMapelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Mapel" />
                </SelectTrigger>
                <SelectContent>
                  {(mapelList as MapelItem[]).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="font-medium">{m.kode}</span> — {m.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Guru</Label>
              <Select value={editGuruId} onValueChange={setEditGuruId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Guru" />
                </SelectTrigger>
                <SelectContent>
                  {(guruList as GuruItem[]).map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editCell?.existing && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteCellMutation.mutate()}
                disabled={deleteCellMutation.isPending}
              >
                {deleteCellMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                Hapus
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setEditCell(null)}>Batal</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !editMapelId}
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROSTER PER GURU — Guru Schedule View
// ═══════════════════════════════════════════════════════════════════════════════
function RosterPerGuru() {
  const { tahunPelajaran, semester } = useAppStore();

  const { data: guruList = [] } = useQuery({
    queryKey: ["jadwal-guru", tahunPelajaran, semester],
    queryFn: async () => {
      const p = new URLSearchParams({ tahunPelajaran, semester });
      const r = await fetch(`/api/guru/list?${p}`); if (!r.ok) throw new Error("Gagal"); return r.json();
    },
    enabled: !!tahunPelajaran,
  });

  const { data: jamList = [] } = useQuery({
    queryKey: ["jadwal-jam", tahunPelajaran, semester],
    queryFn: async () => {
      const p = new URLSearchParams({ tahunPelajaran, semester });
      const r = await fetch(`/api/jadwal/jam?${p}`); if (!r.ok) throw new Error("Gagal"); return r.json();
    },
    enabled: !!tahunPelajaran,
  });

  const { data: mapelList = [] } = useQuery({
    queryKey: ["jadwal-mapel", tahunPelajaran, semester],
    queryFn: async () => {
      const p = new URLSearchParams({ tahunPelajaran, semester });
      const r = await fetch(`/api/jadwal/mapel?${p}`); if (!r.ok) throw new Error("Gagal"); return r.json();
    },
    enabled: !!tahunPelajaran,
  });

  const [selectedGuru, setSelectedGuru] = useState("");
  const effectiveGuru = selectedGuru || (guruList.length > 0 ? guruList[0]?.id || "" : "");

  const { data: jadwalData = [], isLoading } = useQuery({
    queryKey: ["jadwal-roster-guru", tahunPelajaran, semester, effectiveGuru],
    queryFn: async () => {
      if (!effectiveGuru) return [];
      const p = new URLSearchParams({ tahunPelajaran, semester, guruId: effectiveGuru });
      const r = await fetch(`/api/jadwal/kelas?${p}`); if (!r.ok) throw new Error("Gagal"); return r.json();
    },
    enabled: !!effectiveGuru && !!tahunPelajaran,
  });

  const jadwalMap = useMemo(() => {
    const map: Record<string, JadwalItem> = {};
    for (const j of jadwalData) map[`${j.hari}-${j.jamKe}`] = j;
    return map;
  }, [jadwalData]);

  const selectedGuruName = useMemo(() => {
    const g = (guruList as GuruItem[]).find((g) => g.id === effectiveGuru);
    return g?.nama || "";
  }, [guruList, effectiveGuru]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedGuru} onValueChange={setSelectedGuru}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Pilih Guru" /></SelectTrigger>
            <SelectContent>
              {(guruList as GuruItem[]).map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.nama}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!effectiveGuru ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">Pilih guru</CardContent></Card>
      ) : isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : jadwalData.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">Belum ada jadwal</CardContent></Card>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white print:overflow-visible">
          <ScrollArea className="w-full">
            <div className="min-w-max">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gradient-to-b from-slate-100 to-slate-50">
                    <th rowSpan={2} className="border border-slate-200 bg-slate-100 px-3 py-2 text-left font-bold text-slate-700 sticky left-0 z-20 min-w-[120px]" style={{top:0}}>
                      Hari / Jam
                    </th>
                    {HARI.map((h) => (
                      <th key={h} className="border border-slate-200 px-3 py-2 text-center font-bold text-slate-700 uppercase tracking-wider bg-gradient-to-b from-slate-200 to-slate-100 min-w-[60px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(jamList as JamItem[]).map((jam) => (
                    <tr key={jam.jamKe}>
                      <td className="border border-slate-200 px-3 py-1 font-medium text-slate-700 sticky left-0 z-10 bg-white" style={{top:0}}>
                        <div>Jam ke-{jam.jamKe}</div>
                        <div className="text-[9px] text-slate-400">{jam.jamMulai}-{jam.jamSelesai}</div>
                      </td>
                      {HARI.map((hari) => {
                        const key = `${hari}-${jam.jamKe}`;
                        const j = jadwalMap[key];
                        const color = j ? getMapelColor(j.mapelId, mapelList as MapelItem[]) : null;
                        return (
                          <td key={hari} className="border border-slate-200 p-0 text-center" style={{backgroundColor: color?.bg || "transparent"}}>
                            {j ? (
                              <div className="py-1 px-0.5">
                                <span className="font-bold" style={{color: color?.text, fontSize:"10px"}}>{j.mapelKode}</span>
                                <div className="opacity-60 truncate max-w-[55px] mx-auto" style={{color: color?.text, fontSize:"8px"}}>({j.rombel})</div>
                              </div>
                            ) : <div className="min-h-[28px]"><span className="text-slate-300">·</span></div>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAPEL CRUD
// ═══════════════════════════════════════════════════════════════════════════════
function MapelManager() {
  const { toast } = useToast();
  const { tahunPelajaran, semester } = useAppStore();
  const qc = useQueryClient();
  const { data: mapelList = [], isLoading } = useQuery({
    queryKey: ["jadwal-mapel", tahunPelajaran, semester],
    queryFn: async () => {
      const p = new URLSearchParams({ tahunPelajaran, semester });
      const r = await fetch(`/api/jadwal/mapel?${p}`); if (!r.ok) throw new Error(); return r.json();
    },
    enabled: !!tahunPelajaran,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<MapelItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MapelItem | null>(null);
  const [kode, setKode] = useState("");
  const [nama, setNama] = useState("");
  const openCreate = () => { setEditItem(null); setKode(""); setNama(""); setFormOpen(true); };
  const openEdit = (item: MapelItem) => { setEditItem(item); setKode(item.kode); setNama(item.nama); setFormOpen(true); };
  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = { kode, nama, tahunPelajaran, semester };
      if (editItem) {
        const r = await fetch("/api/jadwal/mapel", { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify({id:editItem.id,...body}) });
        const d = await r.json(); if (!r.ok) throw new Error(d.error);
      } else {
        const r = await fetch("/api/jadwal/mapel", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body) });
        const d = await r.json(); if (!r.ok) throw new Error(d.error);
      }
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:["jadwal-mapel"]}); toast({title: editItem ? "Mapel diperbarui" : "Mapel ditambahkan"}); setFormOpen(false); },
    onError: (e: Error) => toast({title:"Error", description:e.message, variant:"destructive"}),
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/jadwal/mapel?id=${id}`, {method:"DELETE"}); const d = await r.json(); if (!r.ok) throw new Error(d.error);
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:["jadwal-mapel"]}); toast({title:"Mapel dihapus"}); setDeleteTarget(null); },
    onError: (e: Error) => toast({title:"Error", description:e.message, variant:"destructive"}),
  });
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  return (<>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">Mata Pelajaran</h3>
      <Button onClick={openCreate} size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Tambah Mapel</Button>
    </div>
    <Card>
      <CardContent className="p-0">
        <Table><TableHeader><TableRow>
          <TableHead className="w-16">No</TableHead><TableHead>Kode</TableHead><TableHead>Nama</TableHead><TableHead className="w-24 text-center">Aksi</TableHead>
        </TableRow></TableHeader><TableBody>
          {mapelList.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Belum ada data</TableCell></TableRow>
          ) : mapelList.map((m: MapelItem, i: number) => (
            <TableRow key={m.id}>
              <TableCell className="text-center">{i+1}</TableCell>
              <TableCell><Badge variant="secondary">{m.kode}</Badge></TableCell>
              <TableCell>{m.nama}</TableCell>
              <TableCell className="text-center">
                <div className="flex gap-1 justify-center">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>openEdit(m)}><Pencil className="h-3.5 w-3.5"/></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={()=>setDeleteTarget(m)}><Trash2 className="h-3.5 w-3.5"/></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      </CardContent>
    </Card>
    <Dialog open={formOpen} onOpenChange={setFormOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editItem?"Edit":"Tambah"} Mata Pelajaran</DialogTitle><DialogDescription>Masukkan kode dan nama</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2"><Label>Kode Mapel</Label><Input placeholder="cth: MTK, B.IND" value={kode} onChange={e=>setKode(e.target.value)}/></div>
          <div className="grid gap-2"><Label>Nama Mata Pelajaran</Label><Input placeholder="cth: Matematika" value={nama} onChange={e=>setNama(e.target.value)}/></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={()=>setFormOpen(false)}>Batal</Button>
          <Button onClick={()=>saveMutation.mutate()} disabled={saveMutation.isPending||!kode||!nama}>
            {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin"/>} Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <AlertDialog open={!!deleteTarget} onOpenChange={()=>setDeleteTarget(null)}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus Mapel</AlertDialogTitle><AlertDialogDescription>Hapus <strong>{deleteTarget?.nama}</strong>?</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={()=>deleteTarget&&deleteMutation.mutate(deleteTarget.id)}>Hapus</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>);
}

// ═══════════════════════════════════════════════════════════════════════════════
// JAM PELAJARAN CRUD
// ═══════════════════════════════════════════════════════════════════════════════
function JamManager() {
  const { toast } = useToast();
  const { tahunPelajaran, semester } = useAppStore();
  const qc = useQueryClient();
  const { data: jamList = [], isLoading } = useQuery({
    queryKey: ["jadwal-jam", tahunPelajaran, semester],
    queryFn: async () => {
      const p = new URLSearchParams({ tahunPelajaran, semester });
      const r = await fetch(`/api/jadwal/jam?${p}`); if (!r.ok) throw new Error(); return r.json();
    },
    enabled: !!tahunPelajaran,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<JamItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JamItem | null>(null);
  const [jamKe, setJamKe] = useState("");
  const [jamMulai, setJamMulai] = useState("");
  const [jamSelesai, setJamSelesai] = useState("");
  const openCreate = () => { setEditItem(null); setJamKe(""); setJamMulai(""); setJamSelesai(""); setFormOpen(true); };
  const openEdit = (item: JamItem) => { setEditItem(item); setJamKe(String(item.jamKe)); setJamMulai(item.jamMulai); setJamSelesai(item.jamSelesai); setFormOpen(true); };
  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {jamKe:parseInt(jamKe), jamMulai, jamSelesai, tahunPelajaran, semester};
      if (editItem) {
        const r = await fetch("/api/jadwal/jam", {method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id:editItem.id,...body})});
        const d = await r.json(); if (!r.ok) throw new Error(d.error);
      } else {
        const r = await fetch("/api/jadwal/jam", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)});
        const d = await r.json(); if (!r.ok) throw new Error(d.error);
      }
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:["jadwal-jam"]}); toast({title: editItem ? "Jam diperbarui" : "Jam ditambahkan"}); setFormOpen(false); },
    onError: (e: Error) => toast({title:"Error", description:e.message, variant:"destructive"}),
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const p = new URLSearchParams({id, tahunPelajaran, semester});
      const r = await fetch(`/api/jadwal/jam?${p}`, {method:"DELETE"}); const d = await r.json(); if (!r.ok) throw new Error(d.error);
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:["jadwal-jam"]}); toast({title:"Jam dihapus"}); setDeleteTarget(null); },
    onError: (e: Error) => toast({title:"Error", description:e.message, variant:"destructive"}),
  });
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  return (<>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">Jam Pelajaran</h3>
      <Button onClick={openCreate} size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Tambah Jam</Button>
    </div>
    <Card>
      <CardContent className="p-0">
        <Table><TableHeader><TableRow>
          <TableHead className="w-16">No</TableHead><TableHead className="w-24">Jam ke</TableHead><TableHead>Jam Mulai</TableHead><TableHead>Jam Selesai</TableHead><TableHead className="w-24 text-center">Aksi</TableHead>
        </TableRow></TableHeader><TableBody>
          {jamList.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Belum ada data</TableCell></TableRow>
          ) : jamList.map((j: JamItem, i: number) => (
            <TableRow key={j.id}>
              <TableCell className="text-center">{i+1}</TableCell>
              <TableCell><Badge variant="outline">{j.jamKe}</Badge></TableCell>
              <TableCell>{j.jamMulai}</TableCell>
              <TableCell>{j.jamSelesai}</TableCell>
              <TableCell className="text-center">
                <div className="flex gap-1 justify-center">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>openEdit(j)}><Pencil className="h-3.5 w-3.5"/></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={()=>setDeleteTarget(j)}><Trash2 className="h-3.5 w-3.5"/></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
      </CardContent>
    </Card>
    <Dialog open={formOpen} onOpenChange={setFormOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editItem?"Edit":"Tambah"} Jam Pelajaran</DialogTitle><DialogDescription>Atur nomor jam dan waktu</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2"><Label>Jam ke-</Label><Input type="number" min={1} placeholder="1" value={jamKe} onChange={e=>setJamKe(e.target.value)}/></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Jam Mulai</Label><Input type="time" value={jamMulai} onChange={e=>setJamMulai(e.target.value)}/></div>
            <div className="grid gap-2"><Label>Jam Selesai</Label><Input type="time" value={jamSelesai} onChange={e=>setJamSelesai(e.target.value)}/></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={()=>setFormOpen(false)}>Batal</Button>
          <Button onClick={()=>saveMutation.mutate()} disabled={saveMutation.isPending||!jamKe||!jamMulai||!jamSelesai}>
            {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin"/>} Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <AlertDialog open={!!deleteTarget} onOpenChange={()=>setDeleteTarget(null)}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus Jam</AlertDialogTitle><AlertDialogDescription>Hapus Jam ke-{deleteTarget?.jamKe}?</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={()=>deleteTarget&&deleteMutation.mutate(deleteTarget.id)}>Hapus</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>);
}

// ═══════════════════════════════════════════════════════════════════════════════
// AKSES MANAGEMENT (Admin)
// ═══════════════════════════════════════════════════════════════════════════════
function AksesManager() {
  const { toast } = useToast();
  const { tahunPelajaran, semester } = useAppStore();
  const qc = useQueryClient();
  const { data: users = [] } = useQuery({
    queryKey: ["jadwal-users"],
    queryFn: async () => { const r = await fetch("/api/users"); if (!r.ok) throw new Error(); return r.json(); },
  });
  const { data: rombelList = [] } = useQuery({
    queryKey: ["jadwal-rombel", tahunPelajaran, semester],
    queryFn: async () => {
      const p = new URLSearchParams({ tahunPelajaran, semester });
      const r = await fetch(`/api/siswa/rombel?${p}`); if (!r.ok) throw new Error(); return r.json();
    },
    enabled: !!tahunPelajaran,
  });
  const { data: aksesList = [], isLoading } = useQuery({
    queryKey: ["jadwal-akses", tahunPelajaran, semester],
    queryFn: async () => {
      const p = new URLSearchParams({ tahunPelajaran, semester });
      const r = await fetch(`/api/jadwal/akses?${p}`); if (!r.ok) throw new Error(); return r.json();
    },
    enabled: !!tahunPelajaran,
  });
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRombel, setSelectedRombel] = useState("");
  const grantMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/jadwal/akses", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({userId:selectedUser, rombel:selectedRombel, tahunPelajaran, semester})});
      const d = await r.json(); if (!r.ok) throw new Error(d.error);
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:["jadwal-akses"]}); toast({title:"Akses diberikan"}); setSelectedRombel(""); },
    onError: (e: Error) => toast({title:"Error", description:e.message, variant:"destructive"}),
  });
  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/jadwal/akses?id=${id}`, {method:"DELETE"}); const d = await r.json(); if (!r.ok) throw new Error(d.error);
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:["jadwal-akses"]}); toast({title:"Akses dicabut"}); },
    onError: (e: Error) => toast({title:"Error", description:e.message, variant:"destructive"}),
  });
  return (<div>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">Akses Edit Jadwal</h3>
    </div>
    <Card className="mb-6">
      <CardHeader className="pb-3"><CardTitle className="text-sm">Berikan Akses Baru</CardTitle></CardHeader>
      <CardContent>
        <div className="flex items-end gap-3">
          <div className="flex-1"><Label className="text-xs">User</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger><SelectValue placeholder="Pilih User" /></SelectTrigger>
              <SelectContent>
                {(users as {id:string;username:string;nama:string;role:string}[]).map((u)=>(<SelectItem key={u.id} value={u.id}>{u.nama||u.username} ({u.role})</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1"><Label className="text-xs">Rombel</Label>
            <Select value={selectedRombel} onValueChange={setSelectedRombel}>
              <SelectTrigger><SelectValue placeholder="Pilih Rombel" /></SelectTrigger>
              <SelectContent>
                {(rombelList as string[]).map((r)=>(<SelectItem key={r} value={r}>{r}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={()=>grantMutation.mutate()} disabled={grantMutation.isPending||!selectedUser||!selectedRombel} className="gap-1.5">
            {grantMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Shield className="h-4 w-4"/>} Berikan Akses
          </Button>
        </div>
      </CardContent>
    </Card>
    <Card><CardContent className="p-0">
      <Table><TableHeader><TableRow>
        <TableHead className="w-16">No</TableHead><TableHead>User</TableHead><TableHead>Rombel</TableHead><TableHead>Tahun Pelajaran</TableHead><TableHead className="w-24 text-center">Aksi</TableHead>
      </TableRow></TableHeader><TableBody>
        {isLoading ? (
          <TableRow><TableCell colSpan={5} className="py-8 text-center"><Loader2 className="h-6 w-6 mx-auto animate-spin"/></TableCell></TableRow>
        ) : (aksesList as AksesItem[]).length === 0 ? (
          <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Belum ada akses</TableCell></TableRow>
        ) : (aksesList as AksesItem[]).map((a,i)=>(
          <TableRow key={a.id}>
            <TableCell className="text-center">{i+1}</TableCell>
            <TableCell>{a.user?.nama||a.user?.username||a.userId}</TableCell>
            <TableCell><Badge variant="secondary">{a.rombel}</Badge></TableCell>
            <TableCell>{a.tahunPelajaran} — {a.semester}</TableCell>
            <TableCell className="text-center">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={()=>revokeMutation.mutate(a.id)}><Trash2 className="h-3.5 w-3.5"/></Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody></Table>
    </CardContent></Card>
  </div>);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function JadwalPelajaranPage() {
  const { tahunPelajaran, semester } = useAppStore();
  const session = useSession();
  const isAdmin = session.data?.user?.role === "admin";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400">
          <CalendarClock className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Jadwal Pelajaran</h2>
          <p className="text-sm text-muted-foreground">
            Kelola jadwal pelajaran sekolah
          </p>
        </div>
      </div>

      {!tahunPelajaran ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <CalendarClock className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Pilih Tahun Pelajaran terlebih dahulu di bagian atas</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="jadwal" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 lg:grid-cols-5">
            <TabsTrigger value="jadwal" className="gap-1.5">
              <LayoutGrid className="h-4 w-4 hidden sm:block" />
              <span>Jadwal</span>
            </TabsTrigger>
            <TabsTrigger value="roster-guru" className="gap-1.5">
              <GraduationCap className="h-4 w-4 hidden sm:block" />
              <span>Roster Guru</span>
            </TabsTrigger>
            <TabsTrigger value="master" className="gap-1.5">
              <BookOpen className="h-4 w-4 hidden sm:block" />
              <span>Master Data</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="akses" className="gap-1.5">
                <UserCheck className="h-4 w-4 hidden sm:block" />
                <span>Akses</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="jadwal" className="mt-4">
            <TimetableView />
          </TabsContent>

          <TabsContent value="roster-guru" className="mt-4">
            <RosterPerGuru />
          </TabsContent>

          <TabsContent value="master" className="mt-4">
            <Tabs defaultValue="mapel">
              <TabsList>
                <TabsTrigger value="mapel"><BookOpen className="h-3.5 w-3.5 mr-1.5"/> Mata Pelajaran</TabsTrigger>
                <TabsTrigger value="jam"><Clock className="h-3.5 w-3.5 mr-1.5"/> Jam Pelajaran</TabsTrigger>
              </TabsList>
              <TabsContent value="mapel" className="mt-4"><MapelManager /></TabsContent>
              <TabsContent value="jam" className="mt-4"><JamManager /></TabsContent>
            </Tabs>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="akses" className="mt-4">
              <AksesManager />
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}
