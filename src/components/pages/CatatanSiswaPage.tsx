"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText, Plus, Pencil, Trash2, Search, Loader2,
  User, Calendar, AlertTriangle, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/app";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────
interface CatatanSiswaItem {
  id: string;
  siswaId: string;
  siswaNama: string;
  nisn: string;
  rombel: string;
  tanggal: string;
  kategori: string;
  catatan: string;
  tindakan: string;
  tahunPelajaran: string;
  semester: string;
  dibuatOleh: string;
  createdAt: string;
  updatedAt: string;
}

interface SiswaOption {
  id: string;
  nama: string;
  nisn: string;
  rombel: string;
}

// ─── Category config ───────────────────────────────────────────────────────
const KATEGORI_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  "Perilaku Positif": { label: "Perilaku Positif", color: "#16A34A", bgColor: "#F0FDF4", icon: "\u{1F44D}" },
  "Perilaku Negatif": { label: "Perilaku Negatif", color: "#DC2626", bgColor: "#FEF2F2", icon: "\u{1F44E}" },
  "Akademik":          { label: "Akademik",          color: "#2563EB", bgColor: "#EFF6FF", icon: "\u{1F4D6}" },
  "Kedisiplinan":      { label: "Kedisiplinan",      color: "#D97706", bgColor: "#FFFBEB", icon: "\u26A0\uFE0F" },
  "Prestasi":          { label: "Prestasi",          color: "#7C3AED", bgColor: "#FAF5FF", icon: "\u{1F3C6}" },
  "Lainnya":           { label: "Lainnya",           color: "#6B7280", bgColor: "#F9FAFB", icon: "\u{1F4DD}" },
};

const KATEGORI_KEYS = Object.keys(KATEGORI_CONFIG);

const TAB_ITEMS = [
  { key: "", label: "Semua" },
  { key: "Perilaku Positif", label: "Perilaku Positif" },
  { key: "Perilaku Negatif", label: "Perilaku Negatif" },
  { key: "Akademik", label: "Akademik" },
  { key: "Kedisiplinan", label: "Kedisiplinan" },
  { key: "Prestasi", label: "Prestasi" },
  { key: "Lainnya", label: "Lainnya" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────
function formatTanggal(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return `${hari[d.getDay()]}, ${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

function getKategoriConfig(kategori: string) {
  return KATEGORI_CONFIG[kategori] || KATEGORI_CONFIG["Lainnya"];
}

function getTabColor(key: string): { activeColor: string; countBg: string } {
  switch (key) {
    case "Perilaku Positif": return { activeColor: "#16A34A", countBg: "#F0FDF4" };
    case "Perilaku Negatif": return { activeColor: "#DC2626", countBg: "#FEF2F2" };
    case "Akademik":          return { activeColor: "#2563EB", countBg: "#EFF6FF" };
    case "Kedisiplinan":      return { activeColor: "#D97706", countBg: "#FFFBEB" };
    case "Prestasi":          return { activeColor: "#7C3AED", countBg: "#FAF5FF" };
    case "Lainnya":           return { activeColor: "#6B7280", countBg: "#F9FAFB" };
    default:                  return { activeColor: "#0F172A", countBg: "#F1F5F9" };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function CatatanSiswaPage() {
  const { tahunPelajaran, semester } = useAppStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  // ─── State ──────────────────────────────────────────────────────────────
  const [selectedRombel, setSelectedRombel] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeKategori, setActiveKategori] = useState("");

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [formRombel, setFormRombel] = useState("");
  const [formSiswaId, setFormSiswaId] = useState("");
  const [formTanggal, setFormTanggal] = useState("");
  const [formKategori, setFormKategori] = useState("Lainnya");
  const [formCatatan, setFormCatatan] = useState("");
  const [formTindakan, setFormTindakan] = useState("");

  // ─── Fetch rombel list ──────────────────────────────────────────────────
  const { data: rombelList = [] } = useQuery({
    queryKey: ["catatan-rombel", tahunPelajaran, semester],
    queryFn: async () => {
      const p = new URLSearchParams({ tahunPelajaran, semester });
      const r = await fetch(`/api/absensi/rombel?${p}`);
      if (!r.ok) throw new Error("Gagal");
      return r.json();
    },
    enabled: !!tahunPelajaran,
  });

  // Compute effective rombel (user selection or first available)
  const effectiveRombel = selectedRombel || (rombelList.length > 0 ? rombelList[0] as string : "");

  // ─── Fetch catatan siswa ────────────────────────────────────────────────
  const { data: catatanList = [], isLoading: isLoadingCatatan } = useQuery({
    queryKey: ["catatan-siswa", tahunPelajaran, semester, effectiveRombel, activeKategori, searchQuery],
    queryFn: async () => {
      const p = new URLSearchParams({ tahunPelajaran, semester });
      if (effectiveRombel) p.set("rombel", effectiveRombel);
      if (activeKategori) p.set("kategori", activeKategori);
      if (searchQuery) p.set("search", searchQuery);
      const r = await fetch(`/api/catatan-siswa?${p}`);
      if (!r.ok) throw new Error("Gagal");
      return r.json();
    },
    enabled: !!tahunPelajaran,
  });

  // ─── Fetch siswa per rombel (for form dropdown) ─────────────────────────
  const { data: siswaOptions = [] } = useQuery({
    queryKey: ["catatan-siswa-list", tahunPelajaran, semester, formRombel],
    queryFn: async () => {
      const p = new URLSearchParams({ tahunPelajaran, semester, rombel: formRombel });
      const r = await fetch(`/api/absensi/siswa?${p}`);
      if (!r.ok) throw new Error("Gagal");
      return r.json();
    },
    enabled: !!formRombel && !!tahunPelajaran,
  });

  // ─── Category counts ────────────────────────────────────────────────────
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { "": (catatanList as CatatanSiswaItem[]).length };
    for (const item of catatanList as CatatanSiswaItem[]) {
      counts[item.kategori] = (counts[item.kategori] || 0) + 1;
    }
    return counts;
  }, [catatanList]);

  // ─── Mutations ──────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const isEdit = !!editingId;
      const selectedSiswa = (siswaOptions as SiswaOption[]).find(s => s.id === formSiswaId);

      if (isEdit) {
        const r = await fetch("/api/catatan-siswa", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            tanggal: formTanggal,
            kategori: formKategori,
            catatan: formCatatan,
            tindakan: formTindakan,
          }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return d;
      } else {
        const r = await fetch("/api/catatan-siswa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siswaId: formSiswaId,
            siswaNama: selectedSiswa?.nama || "",
            nisn: selectedSiswa?.nisn || "",
            rombel: formRombel,
            tanggal: formTanggal,
            kategori: formKategori,
            catatan: formCatatan,
            tindakan: formTindakan,
            tahunPelajaran,
            semester,
          }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return d;
      }
    },
    onSuccess: () => {
      toast({
        title: editingId ? "Catatan diperbarui" : "Catatan ditambahkan",
        description: editingId ? "Catatan siswa berhasil diperbarui." : "Catatan siswa baru berhasil disimpan.",
      });
      closeForm();
      qc.invalidateQueries({ queryKey: ["catatan-siswa"] });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/catatan-siswa?id=${id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      return d;
    },
    onSuccess: () => {
      toast({ title: "Catatan dihapus", description: "Catatan siswa berhasil dihapus." });
      setDeleteOpen(false);
      setDeletingId(null);
      qc.invalidateQueries({ queryKey: ["catatan-siswa"] });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  // ─── Form helpers ───────────────────────────────────────────────────────
  function openAddForm() {
    setEditingId(null);
    setFormRombel(effectiveRombel);
    setFormSiswaId("");
    setFormTanggal(new Date().toISOString().split("T")[0]);
    setFormKategori("Lainnya");
    setFormCatatan("");
    setFormTindakan("");
    setFormOpen(true);
  }

  function openEditForm(item: CatatanSiswaItem) {
    setEditingId(item.id);
    setFormRombel(item.rombel);
    setFormSiswaId(item.siswaId);
    setFormTanggal(item.tanggal);
    setFormKategori(item.kategori);
    setFormCatatan(item.catatan);
    setFormTindakan(item.tindakan || "");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setFormSiswaId("");
    setFormCatatan("");
    setFormTindakan("");
  }

  function handleSave() {
    if (!editingId && !formSiswaId) {
      toast({ title: "Perhatian", description: "Pilih siswa terlebih dahulu.", variant: "destructive" });
      return;
    }
    if (!formCatatan.trim()) {
      toast({ title: "Perhatian", description: "Catatan wajib diisi.", variant: "destructive" });
      return;
    }
    if (!formTanggal) {
      toast({ title: "Perhatian", description: "Tanggal wajib diisi.", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  }

  function handleDelete() {
    if (deletingId) deleteMutation.mutate(deletingId);
  }

  // ─── Selected siswa info ────────────────────────────────────────────────
  const selectedSiswaInfo = useMemo(() => {
    return (siswaOptions as SiswaOption[]).find(s => s.id === formSiswaId) || null;
  }, [formSiswaId, siswaOptions]);

  // ─── Custom scrollbar style ─────────────────────────────────────────────
  const scrollbarStyle = `
    .catatan-scroll::-webkit-scrollbar { width: 6px; }
    .catatan-scroll::-webkit-scrollbar-track { background: transparent; }
    .catatan-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
    .catatan-scroll::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
  `;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-4">
      <style>{scrollbarStyle}</style>

      {/* ─── Header Card ──────────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl">Catatan Siswa</CardTitle>
            </div>
            <Button onClick={openAddForm} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Tambah Catatan</span>
              <span className="sm:hidden">Tambah</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Rombel filter */}
            <div className="w-full sm:w-56">
              <Select value={effectiveRombel} onValueChange={setSelectedRombel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={rombelList.length === 0 ? "Tidak ada rombel" : "Pilih Rombel"} />
                </SelectTrigger>
                <SelectContent>
                  {(rombelList as string[]).map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama, NISN, atau catatan..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Category Filter Tabs ─────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <Tabs value={activeKategori} onValueChange={setActiveKategori}>
            <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
              {TAB_ITEMS.map((tab) => {
                const tc = getTabColor(tab.key);
                const count = categoryCounts[tab.key] || 0;
                const isActive = activeKategori === tab.key;
                return (
                  <TabsTrigger
                    key={tab.key || "all"}
                    value={tab.key || ""}
                    className={cn(
                      "gap-1.5 text-xs sm:text-sm px-3 py-1.5 data-[state=active]:shadow-sm transition-all",
                      isActive && tab.key && "text-white"
                    )}
                    style={
                      isActive && tab.key
                        ? { backgroundColor: tc.activeColor, color: "white" }
                        : undefined
                    }
                  >
                    {tab.key && <span>{getKategoriConfig(tab.key).icon}</span>}
                    {!tab.key && <ClipboardList className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span
                      className={cn(
                        "ml-1 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                        isActive && !tab.key && "bg-primary-foreground/20"
                      )}
                      style={
                        isActive && tab.key
                          ? { backgroundColor: "rgba(255,255,255,0.25)", color: "white" }
                          : !isActive && tab.key
                            ? { backgroundColor: tc.countBg, color: tc.activeColor }
                            : undefined
                      }
                    >
                      {count}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* ─── Notes List ────────────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          {isLoadingCatatan ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : (catatanList as CatatanSiswaItem[]).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground">
                Belum Ada Catatan
              </h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground/70">
                {searchQuery || activeKategori
                  ? "Tidak ada catatan yang cocok dengan filter saat ini."
                  : "Catatan siswa akan tampil di sini setelah ditambahkan."}
              </p>
              {!searchQuery && !activeKategori && (
                <Button
                  variant="outline"
                  className="mt-4 gap-2"
                  onClick={openAddForm}
                >
                  <Plus className="h-4 w-4" />
                  Tambah Catatan Pertama
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="max-h-[640px] catatan-scroll">
              <div className="space-y-3">
                {(catatanList as CatatanSiswaItem[]).map((item) => {
                  const kConfig = getKategoriConfig(item.kategori);
                  return (
                    <div
                      key={item.id}
                      className="group rounded-lg border bg-card p-4 transition-all hover:shadow-md"
                      style={{ borderLeftWidth: "4px", borderLeftColor: kConfig.color }}
                    >
                      {/* Top row: name + badge + actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ backgroundColor: kConfig.color }}
                          >
                            {item.siswaNama?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {item.siswaNama || "-"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.rombel}{item.nisn ? ` \u00B7 NISN ${item.nisn}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className="text-xs font-medium gap-1"
                            style={{
                              borderColor: kConfig.color,
                              color: kConfig.color,
                              backgroundColor: kConfig.bgColor,
                            }}
                          >
                            <span>{kConfig.icon}</span>
                            {kConfig.label}
                          </Badge>
                          {/* Desktop actions: show on hover */}
                          <div className="hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditForm(item)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeletingId(item.id);
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          {/* Mobile actions: always visible */}
                          <div className="flex gap-1 sm:hidden">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditForm(item)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeletingId(item.id);
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatTanggal(item.tanggal)}</span>
                      </div>

                      {/* Catatan */}
                      <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                        {item.catatan}
                      </p>

                      {/* Tindakan */}
                      {item.tindakan && (
                        <div className="mt-3 rounded-md bg-muted/50 border border-border/50 p-3">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Tindak Lanjut
                          </div>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {item.tindakan}
                          </p>
                        </div>
                      )}

                      {/* Footer: dibuat oleh */}
                      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{item.dibuatOleh || "-"}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60">
                          {item.updatedAt
                            ? `diperbarui ${new Date(item.updatedAt).toLocaleDateString("id-ID")}`
                            : item.createdAt
                              ? `dibuat ${new Date(item.createdAt).toLocaleDateString("id-ID")}`
                              : ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* ─── Add/Edit Dialog ───────────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) closeForm(); else setFormOpen(true); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingId ? (
                <>
                  <Pencil className="h-5 w-5" />
                  Edit Catatan
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Tambah Catatan
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Perbarui catatan siswa berikut."
                : "Isi data catatan siswa yang ingin ditambahkan."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Rombel (add mode only) */}
            {!editingId && (
              <div className="space-y-2">
                <Label htmlFor="form-rombel">Rombel</Label>
                <Select
                  value={formRombel}
                  onValueChange={(val) => {
                    setFormRombel(val);
                    setFormSiswaId("");
                  }}
                >
                  <SelectTrigger id="form-rombel">
                    <SelectValue placeholder="Pilih Rombel" />
                  </SelectTrigger>
                  <SelectContent>
                    {(rombelList as string[]).map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Siswa (add mode only) */}
            {!editingId && (
              <div className="space-y-2">
                <Label htmlFor="form-siswa">Siswa</Label>
                <Select value={formSiswaId} onValueChange={setFormSiswaId}>
                  <SelectTrigger id="form-siswa">
                    <SelectValue placeholder={formRombel ? "Pilih Siswa" : "Pilih rombel terlebih dahulu"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(siswaOptions as SiswaOption[]).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nama} — {s.nisn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSiswaInfo && (
                  <p className="text-xs text-muted-foreground">
                    {selectedSiswaInfo.nama} \u00B7 NISN {selectedSiswaInfo.nisn} \u00B7 {selectedSiswaInfo.rombel}
                  </p>
                )}
              </div>
            )}

            {/* Siswa info (edit mode — read-only) */}
            {editingId && (
              <div className="space-y-2">
                <Label>Siswa</Label>
                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{selectedSiswaInfo?.nama || "Memuat..."}</span>
                  {selectedSiswaInfo?.nisn && (
                    <span className="text-xs text-muted-foreground">\u00B7 NISN {selectedSiswaInfo.nisn}</span>
                  )}
                </div>
              </div>
            )}

            {/* Tanggal */}
            <div className="space-y-2">
              <Label htmlFor="form-tanggal">Tanggal</Label>
              <Input
                id="form-tanggal"
                type="date"
                value={formTanggal}
                onChange={(e) => setFormTanggal(e.target.value)}
              />
            </div>

            {/* Kategori */}
            <div className="space-y-2">
              <Label htmlFor="form-kategori">Kategori</Label>
              <Select value={formKategori} onValueChange={setFormKategori}>
                <SelectTrigger id="form-kategori">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KATEGORI_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      <span className="mr-2">{KATEGORI_CONFIG[k].icon}</span>
                      {KATEGORI_CONFIG[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Catatan */}
            <div className="space-y-2">
              <Label htmlFor="form-catatan">
                Catatan <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="form-catatan"
                placeholder="Tuliskan catatan tentang siswa..."
                rows={4}
                value={formCatatan}
                onChange={(e) => setFormCatatan(e.target.value)}
              />
            </div>

            {/* Tindakan */}
            <div className="space-y-2">
              <Label htmlFor="form-tindakan">
                Tindak Lanjut {" "}
                <span className="text-muted-foreground font-normal">(opsional)</span>
              </Label>
              <Textarea
                id="form-tindakan"
                placeholder="Tuliskan tindak lanjut yang akan dilakukan..."
                rows={3}
                value={formTindakan}
                onChange={(e) => setFormTindakan(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeForm}>
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="gap-2"
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Simpan Perubahan" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete AlertDialog ─────────────────────────────────────────── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Catatan?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Catatan siswa yang dihapus tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90 gap-2"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
