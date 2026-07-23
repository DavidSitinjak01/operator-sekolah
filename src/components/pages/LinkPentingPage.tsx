"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Link, Plus, Pencil, Trash2, Search, Loader2,
  ExternalLink, Globe, GraduationCap, BookOpen, Briefcase,
  Database, ClipboardList, FolderOpen, BarChart3,
  ShieldCheck, FileSpreadsheet, Monitor, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────
interface LinkPentingItem {
  id: string;
  judul: string;
  url: string;
  deskripsi: string;
  kategori: string;
  icon: string;
  dibuatOleh: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Icon mapping ──────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Link: Link,
  Globe: Globe,
  GraduationCap: GraduationCap,
  BookOpen: BookOpen,
  Briefcase: Briefcase,
  Database: Database,
  ClipboardList: ClipboardList,
  FolderOpen: FolderOpen,
  BarChart3: BarChart3,
  ShieldCheck: ShieldCheck,
  FileSpreadsheet: FileSpreadsheet,
  Monitor: Monitor,
  Mail: Mail,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

const KATEGORI_OPTIONS = [
  "Dapodik",
  "Kemdikbud",
  "Pendidikan",
  "Administrasi",
  "Akademik",
  "Lainnya",
];

const KATEGORI_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Dapodik:        { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Kemdikbud:      { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Pendidikan:     { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  Administrasi:   { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Akademik:       { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  Lainnya:        { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
};

// ─── Filter tab items ──────────────────────────────────────────────────────
const FILTER_TABS = [
  { key: "", label: "Semua" },
  ...KATEGORI_OPTIONS.map(k => ({ key: k, label: k })),
];

export default function LinkPentingPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // ── State ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LinkPentingItem | null>(null);
  const [editItem, setEditItem] = useState<LinkPentingItem | null>(null);

  // Form state
  const [formJudul, setFormJudul] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formDeskripsi, setFormDeskripsi] = useState("");
  const [formKategori, setFormKategori] = useState("Lainnya");
  const [formIcon, setFormIcon] = useState("Link");

  // ── Queries ────────────────────────────────────────────────────────────
  const { data: links = [], isLoading } = useQuery<LinkPentingItem[]>({
    queryKey: ["link-penting"],
    queryFn: async () => {
      const res = await fetch("/api/link-penting");
      if (!res.ok) throw new Error("Gagal memuat");
      return res.json();
    },
  });

  // ── Filtered data ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = links;
    if (filterKategori) {
      result = result.filter(l => l.kategori.trim() === filterKategori);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        l =>
          l.judul.toLowerCase().includes(q) ||
          l.url.toLowerCase().includes(q) ||
          l.deskripsi.toLowerCase().includes(q)
      );
    }
    return result;
  }, [links, filterKategori, search]);

  // Group by kategori
  const grouped = useMemo(() => {
    const map: Record<string, LinkPentingItem[]> = {};
    for (const item of filtered) {
      const kat = item.kategori.trim() || "Lainnya";
      if (!map[kat]) map[kat] = [];
      map[kat].push(item);
    }
    return map;
  }, [filtered]);

  const kategoriOrder = useMemo(() => {
    return Object.keys(KATEGORI_COLORS).filter(k => grouped[k]?.length);
  }, [grouped]);

  // ── Mutations ────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (data: { judul: string; url: string; deskripsi: string; kategori: string; icon: string }) => {
      const payload = { ...data };
      const endpoint = editItem ? `/api/link-penting` : `/api/link-penting`;
      const method = editItem ? "PUT" : "POST";
      const body = editItem ? { ...payload, id: editItem.id } : payload;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan");
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["link-penting"] });
      toast({
        title: "Berhasil",
        description: editItem ? "Link berhasil diperbarui" : "Link berhasil ditambahkan",
      });
      closeDialog();
    },
    onError: (err) => toast({ title: "Gagal", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/link-penting", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["link-penting"] });
      toast({ title: "Berhasil", description: "Link berhasil dihapus" });
      setDeleteTarget(null);
    },
    onError: (err) => toast({ title: "Gagal", description: err.message, variant: "destructive" }),
  });

  // ── Helpers ─────────────────────────────────────────────────────────────
  const openCreateDialog = () => {
    setEditItem(null);
    setFormJudul("");
    setFormUrl("");
    setFormDeskripsi("");
    setFormKategori("Lainnya");
    setFormIcon("Link");
    setDialogOpen(true);
  };

  const openEditDialog = (item: LinkPentingItem) => {
    setEditItem(item);
    setFormJudul(item.judul);
    setFormUrl(item.url);
    setFormDeskripsi(item.deskripsi);
    setFormKategori(item.kategori.trim() || "Lainnya");
    setFormIcon(item.icon || "Link");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditItem(null);
    setFormJudul("");
    setFormUrl("");
    setFormDeskripsi("");
    setFormKategori("Lainnya");
    setFormIcon("Link");
  };

  const handleSave = () => {
    if (!formJudul.trim() || !formUrl.trim()) {
      toast({ title: "Perhatian", description: "Judul dan URL wajib diisi", variant: "destructive" });
      return;
    }
    saveMutation.mutate({
      judul: formJudul,
      url: formUrl,
      deskripsi: formDeskripsi,
      kategori: formKategori,
      icon: formIcon,
    });
  };

  const handleOpenLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const getDomainName = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Link className="h-6 w-6" />
            Link Penting
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Simpan dan kelola link jalan pintas untuk akses cepat pekerjaan operator
          </p>
        </div>
        <Button onClick={openCreateDialog} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Link
        </Button>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Link</p>
            <p className="text-2xl font-bold">{links.length}</p>
          </CardContent>
        </Card>
        {KATEGORI_OPTIONS.slice(0, 3).map(kat => {
          const count = links.filter(l => l.kategori.trim() === kat.trim()).length;
          return (
            <Card key={kat}>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{kat.trim()}</p>
                <p className="text-2xl font-bold">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Search & Filter ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari link..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* ── Category filter chips ────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterKategori(tab.key)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full border transition-all",
              filterKategori === tab.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-accent"
            )}
          >
            {tab.label}
            {tab.key && (
              <span className="ml-1.5 text-xs opacity-70">
                ({links.filter(l => l.kategori.trim() === tab.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Links by category ────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Link className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              {search || filterKategori ? "Tidak ada link ditemukan" : "Belum ada link penting"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search || filterKategori
                ? "Coba ubah filter atau kata kunci pencarian"
                : 'Klik "Tambah Link" untuk menyimpan link penting pertama Anda'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {kategoriOrder.map(kat => (
            <div key={kat}>
              <div className="flex items-center gap-2 mb-3">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-medium",
                    KATEGORI_COLORS[kat]?.bg,
                    KATEGORI_COLORS[kat]?.text,
                    KATEGORI_COLORS[kat]?.border
                  )}
                >
                  {kat}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {grouped[kat].length} link
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {grouped[kat].map((item) => {
                  const IconComp = ICON_MAP[item.icon] || Link;
                  const colors = KATEGORI_COLORS[item.kategori.trim()] || KATEGORI_COLORS.Lainnya;

                  return (
                    <Card
                      key={item.id}
                      className={cn(
                        "group relative transition-all hover:shadow-md",
                        colors.bg, colors.border
                      )}
                    >
                      <CardContent className="p-4">
                        {/* Actions */}
                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(item)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Icon + Title */}
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "flex-shrink-0 rounded-lg p-2.5 transition-colors",
                            colors.bg,
                            "group-hover:bg-primary/10"
                          )}>
                            <IconComp className={cn("h-5 w-5", colors.text)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm leading-tight truncate">
                              {item.judul}
                            </h3>
                            {item.deskripsi && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {item.deskripsi}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground/70 mt-1.5 truncate">
                              {getDomainName(item.url)}
                            </p>
                          </div>
                        </div>

                        {/* Open button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-3 h-8 text-xs gap-1.5"
                          onClick={() => handleOpenLink(item.url)}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Buka Link
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add/Edit Dialog ──────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Link" : "Tambah Link Baru"}</DialogTitle>
            <DialogDescription>
              {editItem ? "Perbarui informasi link penting" : "Simpan link sebagai jalan pintas akses pekerjaan"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Icon picker */}
            <div>
              <Label className="text-sm font-medium">Ikon</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ICON_OPTIONS.map(name => {
                  const IconComp = ICON_MAP[name];
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setFormIcon(name)}
                      className={cn(
                        "rounded-lg p-2 border transition-all",
                        formIcon === name
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-accent"
                      )}
                      title={name}
                    >
                      <IconComp className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Judul</Label>
              <Input
                placeholder="Contoh: Dapodik Login"
                value={formJudul}
                onChange={(e) => setFormJudul(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">URL</Label>
              <Input
                placeholder="https://..."
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Deskripsi (opsional)</Label>
              <Textarea
                placeholder="Deskripsi singkat link ini..."
                value={formDeskripsi}
                onChange={(e) => setFormDeskripsi(e.target.value)}
                className="mt-1.5"
                rows={2}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Kategori</Label>
              <Select value={formKategori} onValueChange={setFormKategori}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KATEGORI_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : editItem ? (
                "Perbarui"
              ) : (
                "Simpan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ──────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Link?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus link <strong>{deleteTarget?.judul}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
