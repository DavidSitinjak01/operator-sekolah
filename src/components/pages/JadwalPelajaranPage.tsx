"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock, Plus, Trash2, Pencil, Save, BookOpen, Clock,
  Users, Eye, Shield, X, Check, ChevronDown, Loader2, Copy,
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

// ─── Types ─────────────────────────────────────────────────────────────────────
interface MapelItem {
  id: string;
  kode: string;
  nama: string;
  tahunPelajaran: string;
  semester: string;
}

interface JamItem {
  id: string;
  jamKe: number;
  jamMulai: string;
  jamSelesai: string;
  tahunPelajaran: string;
  semester: string;
}

interface JadwalItem {
  id: string;
  hari: string;
  jamKe: number;
  mapelId: string;
  mapelKode: string;
  mapelNama: string;
  guruId: string;
  guruNama: string;
  rombel: string;
  tahunPelajaran: string;
  semester: string;
}

interface GuruItem {
  id: string;
  nama: string;
  no: string;
}

interface AksesItem {
  id: string;
  userId: string;
  rombel: string;
  tahunPelajaran: string;
  semester: string;
  createdAt: string;
  user: { id: string; username: string; nama: string };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: Mata Pelajaran CRUD
// ═══════════════════════════════════════════════════════════════════════════════
function MapelManager() {
  const { toast } = useToast();
  const { tahunPelajaran, semester } = useAppStore();
  const qc = useQueryClient();

  const { data: mapelList = [], isLoading } = useQuery({
    queryKey: ["jadwal-mapel", tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams({ tahunPelajaran, semester });
      const res = await fetch(`/api/jadwal/mapel?${params}`);
      if (!res.ok) throw new Error("Gagal memuat");
      return res.json();
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
        const res = await fetch("/api/jadwal/mapel", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editItem.id, ...body }),
        });
        const d = await res.json(); if (!res.ok) throw new Error(d.error); return d;
      } else {
        const res = await fetch("/api/jadwal/mapel", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const d = await res.json(); if (!res.ok) throw new Error(d.error); return d;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jadwal-mapel"] });
      toast({ title: editItem ? "Mapel diperbarui" : "Mapel ditambahkan" });
      setFormOpen(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/jadwal/mapel?id=${id}`, { method: "DELETE" });
      const d = await res.json(); if (!res.ok) throw new Error(d.error); return d;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jadwal-mapel"] });
      toast({ title: "Mapel dihapus" });
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Mata Pelajaran</h3>
          <p className="text-sm text-muted-foreground">Kelola daftar mata pelajaran dan kode mapel</p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Tambah Mapel
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">No</TableHead>
                <TableHead>Kode Mapel</TableHead>
                <TableHead>Nama Mata Pelajaran</TableHead>
                <TableHead className="w-24 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mapelList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Belum ada data mata pelajaran
                  </TableCell>
                </TableRow>
              ) : (
                mapelList.map((m: MapelItem, i: number) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-center">{i + 1}</TableCell>
                    <TableCell><Badge variant="secondary">{m.kode}</Badge></TableCell>
                    <TableCell>{m.nama}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(m)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit" : "Tambah"} Mata Pelajaran</DialogTitle>
            <DialogDescription>
              Masukkan kode dan nama mata pelajaran
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Kode Mapel</Label>
              <Input placeholder="cth: MTK, B.IND, IPA" value={kode} onChange={(e) => setKode(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Nama Mata Pelajaran</Label>
              <Input placeholder="cth: Matematika" value={nama} onChange={(e) => setNama(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !kode || !nama}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Mata Pelajaran</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{deleteTarget?.nama}</strong> ({deleteTarget?.kode})?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: Jam Pelajaran CRUD
// ═══════════════════════════════════════════════════════════════════════════════
function JamManager() {
  const { toast } = useToast();
  const { tahunPelajaran, semester } = useAppStore();
  const qc = useQueryClient();

  const { data: jamList = [], isLoading } = useQuery({
    queryKey: ["jadwal-jam", tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams({ tahunPelajaran, semester });
      const res = await fetch(`/api/jadwal/jam?${params}`);
      if (!res.ok) throw new Error("Gagal memuat");
      return res.json();
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
  const openEdit = (item: JamItem) => {
    setEditItem(item); setJamKe(String(item.jamKe));
    setJamMulai(item.jamMulai); setJamSelesai(item.jamSelesai); setFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = { jamKe: parseInt(jamKe), jamMulai, jamSelesai, tahunPelajaran, semester };
      if (editItem) {
        const res = await fetch("/api/jadwal/jam", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editItem.id, ...body }),
        });
        const d = await res.json(); if (!res.ok) throw new Error(d.error); return d;
      } else {
        const res = await fetch("/api/jadwal/jam", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const d = await res.json(); if (!res.ok) throw new Error(d.error); return d;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jadwal-jam"] });
      toast({ title: editItem ? "Jam diperbarui" : "Jam ditambahkan" });
      setFormOpen(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const params = new URLSearchParams({ id, tahunPelajaran, semester });
      const res = await fetch(`/api/jadwal/jam?${params}`, { method: "DELETE" });
      const d = await res.json(); if (!res.ok) throw new Error(d.error); return d;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jadwal-jam"] });
      toast({ title: "Jam dihapus" });
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Jam Pelajaran</h3>
          <p className="text-sm text-muted-foreground">Atur format jam pelajaran sesuai kebutuhan</p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Tambah Jam
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">No</TableHead>
                <TableHead className="w-24">Jam ke</TableHead>
                <TableHead>Jam Mulai</TableHead>
                <TableHead>Jam Selesai</TableHead>
                <TableHead className="w-24 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jamList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Belum ada data jam pelajaran
                  </TableCell>
                </TableRow>
              ) : (
                jamList.map((j: JamItem, i: number) => (
                  <TableRow key={j.id}>
                    <TableCell className="text-center">{i + 1}</TableCell>
                    <TableCell><Badge variant="outline">{j.jamKe}</Badge></TableCell>
                    <TableCell>{j.jamMulai}</TableCell>
                    <TableCell>{j.jamSelesai}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(j)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(j)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit" : "Tambah"} Jam Pelajaran</DialogTitle>
            <DialogDescription>Atur nomor jam dan waktu mulai/selesai</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Jam ke-</Label>
              <Input type="number" min={1} placeholder="1" value={jamKe} onChange={(e) => setJamKe(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Jam Mulai</Label>
                <Input type="time" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Jam Selesai</Label>
                <Input type="time" value={jamSelesai} onChange={(e) => setJamSelesai(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !jamKe || !jamMulai || !jamSelesai}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jam Pelajaran</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus Jam ke-{deleteTarget?.jamKe} ({deleteTarget?.jamMulai} - {deleteTarget?.jamSelesai})?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: Input Jadwal (Timetable Grid)
// ═══════════════════════════════════════════════════════════════════════════════
function InputJadwal() {
  const { toast } = useToast();
  const { tahunPelajaran, semester } = useAppStore();
  const qc = useQueryClient();
  const session = useSession();

  const { data: mapelList = [] } = useQuery({
    queryKey: ["jadwal-mapel", tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams({ tahunPelajaran, semester });
      const res = await fetch(`/api/jadwal/mapel?${params}`);
      if (!res.ok) throw new Error("Gagal memuat");
      return res.json();
    },
    enabled: !!tahunPelajaran,
  });

  const { data: jamList = [] } = useQuery({
    queryKey: ["jadwal-jam", tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams({ tahunPelajaran, semester });
      const res = await fetch(`/api/jadwal/jam?${params}`);
      if (!res.ok) throw new Error("Gagal memuat");
      return res.json();
    },
    enabled: !!tahunPelajaran,
  });

  const { data: guruList = [] } = useQuery({
    queryKey: ["jadwal-guru", tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams({ tahunPelajaran, semester });
      const res = await fetch(`/api/guru/list?${params}`);
      if (!res.ok) throw new Error("Gagal memuat");
      return res.json();
    },
    enabled: !!tahunPelajaran,
  });

  // Rombel list from siswa
  const { data: rombelList = [] } = useQuery({
    queryKey: ["jadwal-rombel", tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams({ tahunPelajaran, semester });
      const res = await fetch(`/api/siswa/rombel?${params}`);
      if (!res.ok) throw new Error("Gagal memuat");
      return res.json();
    },
    enabled: !!tahunPelajaran,
  });

  // For non-admin: get accessible rombel
  const { data: aksesList = [] } = useQuery({
    queryKey: ["jadwal-akses-me", tahunPelajaran, semester],
    queryFn: async () => {
      if (session.data?.user?.role === "admin") return [];
      const params = new URLSearchParams({ tahunPelajaran, semester });
      const res = await fetch(`/api/jadwal/akses?${params}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!tahunPelajaran && session.data?.user?.role !== "admin",
  });

  const [selectedRombel, setSelectedRombel] = useState("");

  // Filter rombel for non-admin
  const accessibleRombel = useMemo(() => {
    if (session.data?.user?.role === "admin") return rombelList;
    const allowed = new Set(aksesList.map((a: AksesItem) => a.rombel));
    return rombelList.filter((r: string) => allowed.has(r));
  }, [rombelList, aksesList, session.data?.user?.role]);

  React.useEffect(() => {
    if (accessibleRombel.length > 0 && !selectedRombel) {
      setSelectedRombel(accessibleRombel[0]);
    }
  }, [accessibleRombel, selectedRombel]);

  // Fetch jadwal for selected rombel
  const { data: jadwalData = [], isLoading: jadwalLoading } = useQuery({
    queryKey: ["jadwal-kelas", tahunPelajaran, semester, selectedRombel],
    queryFn: async () => {
      if (!selectedRombel) return [];
      const params = new URLSearchParams({ tahunPelajaran, semester, rombel: selectedRombel });
      const res = await fetch(`/api/jadwal/kelas?${params}`);
      if (!res.ok) throw new Error("Gagal memuat");
      return res.json();
    },
    enabled: !!selectedRombel && !!tahunPelajaran,
  });

  // Build lookup map: "hari-jamKe" -> jadwal item
  const jadwalMap = useMemo(() => {
    const map: Record<string, JadwalItem> = {};
    for (const j of jadwalData) {
      map[`${j.hari}-${j.jamKe}`] = j;
    }
    return map;
  }, [jadwalData]);

  const saveMutation = useMutation({
    mutationFn: async (data: {
      hari: string; jamKe: number; mapelId: string; mapelKode: string;
      mapelNama: string; guruId: string; guruNama: string; rombel: string;
    }) => {
      const res = await fetch("/api/jadwal/kelas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tahunPelajaran, semester }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      return d;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jadwal-kelas"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCellMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/jadwal/kelas?id=${id}`, { method: "DELETE" });
      const d = await res.json(); if (!res.ok) throw new Error(d.error); return d;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jadwal-kelas"] });
    },
  });

  const handleCellChange = useCallback((hari: string, jamKe: number, field: "mapel" | "guru", value: string) => {
    const key = `${hari}-${jamKe}`;
    const existing = jadwalMap[key];

    if (field === "mapel") {
      const mapel = (mapelList as MapelItem[]).find((m) => m.id === value);
      if (!mapel) return;
      saveMutation.mutate({
        hari, jamKe,
        mapelId: mapel.id, mapelKode: mapel.kode, mapelNama: mapel.nama,
        guruId: existing?.guruId || "", guruNama: existing?.guruNama || "",
        rombel: selectedRombel,
      });
    } else {
      const guru = (guruList as GuruItem[]).find((g) => g.id === value);
      saveMutation.mutate({
        hari, jamKe,
        mapelId: existing?.mapelId || "", mapelKode: existing?.mapelKode || "", mapelNama: existing?.mapelNama || "",
        guruId: guru?.id || "", guruNama: guru?.nama || "",
        rombel: selectedRombel,
      });
    }
  }, [jadwalMap, mapelList, guruList, selectedRombel, tahunPelajaran, semester, saveMutation]);

  if (!tahunPelajaran) return <div className="text-center py-8 text-muted-foreground">Pilih Tahun Pelajaran terlebih dahulu</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Input Jadwal Pelajaran</h3>
          <p className="text-sm text-muted-foreground">Pilih rombel, lalu isi mata pelajaran dan guru per jam</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Rombel:</Label>
          <Select value={selectedRombel} onValueChange={setSelectedRombel}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Pilih Rombel" />
            </SelectTrigger>
            <SelectContent>
              {accessibleRombel.map((r: string) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedRombel ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <CalendarClock className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Pilih rombel untuk mulai mengisi jadwal</p>
          </CardContent>
        </Card>
      ) : jamList.length === 0 || mapelList.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <p>Lengkapi data Jam Pelajaran dan Mata Pelajaran terlebih dahulu di tab &quot;Kelola Data&quot;</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="w-full">
          <div className="min-w-[800px]">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28 sticky left-0 bg-card z-10 border-r">Hari / Jam</TableHead>
                    {HARI.map((h) => (
                      <TableHead key={h} className="text-center min-w-[160px]">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jadwalLoading ? (
                    <TableRow>
                      <TableCell colSpan={HARI.length + 1} className="py-8 text-center">
                        <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    (jamList as JamItem[]).map((jam) => (
                      <TableRow key={jam.jamKe}>
                        <TableCell className="sticky left-0 bg-card z-10 border-r font-medium">
                          <div className="text-sm">
                            <div>Jam ke-{jam.jamKe}</div>
                            <div className="text-xs text-muted-foreground">{jam.jamMulai} - {jam.jamSelesai}</div>
                          </div>
                        </TableCell>
                        {HARI.map((hari) => {
                          const key = `${hari}-${jam.jamKe}`;
                          const j = jadwalMap[key];
                          return (
                            <TableCell key={hari} className="p-1">
                              <div className="space-y-1">
                                <Select
                                  value={j?.mapelId || ""}
                                  onValueChange={(v) => handleCellChange(hari, jam.jamKe, "mapel", v)}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Pilih Mapel" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(mapelList as MapelItem[]).map((m) => (
                                      <SelectItem key={m.id} value={m.id}>{m.kode} - {m.nama}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={j?.guruId || ""}
                                  onValueChange={(v) => handleCellChange(hari, jam.jamKe, "guru", v)}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Pilih Guru" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(guruList as GuruItem[]).map((g) => (
                                      <SelectItem key={g.id} value={g.id}>{g.nama}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {j && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 mx-auto text-destructive"
                                    onClick={() => deleteCellMutation.mutate(j.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: Roster Per Kelas
// ═══════════════════════════════════════════════════════════════════════════════
function RosterPerKelas() {
  const { tahunPelajaran, semester } = useAppStore();

  const { data: rombelList = [] } = useQuery({
    queryKey: ["jadwal-rombel", tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams({ tahunPelajaran, semester });
      const res = await fetch(`/api/siswa/rombel?${params}`);
      if (!res.ok) throw new Error("Gagal memuat");
      return res.json();
    },
    enabled: !!tahunPelajaran,
  });

  const { data: jamList = [] } = useQuery({
    queryKey: ["jadwal-jam", tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams({ tahunPelajaran, semester });
      const res = await fetch(`/api/jadwal/jam?${params}`);
      if (!res.ok) throw new Error("Gagal memuat");
      return res.json();
    },
    enabled: !!tahunPelajaran,
  });

  const [selectedRombel, setSelectedRombel] = useState("");

  React.useEffect(() => {
    if (rombelList.length > 0 && !selectedRombel) setSelectedRombel(rombelList[0]);
  }, [rombelList, selectedRombel]);

  const { data: jadwalData = [], isLoading } = useQuery({
    queryKey: ["jadwal-roster-kelas", tahunPelajaran, semester, selectedRombel],
    queryFn: async () => {
      if (!selectedRombel) return [];
      const params = new URLSearchParams({ tahunPelajaran, semester, rombel: selectedRombel });
      const res = await fetch(`/api/jadwal/kelas?${params}`);
      if (!res.ok) throw new Error("Gagal memuat");
      return res.json();
    },
    enabled: !!selectedRombel && !!tahunPelajaran,
  });

  const jadwalMap = useMemo(() => {
    const map: Record<string, JadwalItem> = {};
    for (const j of jadwalData) {
      map[`${j.hari}-${j.jamKe}`] = j;
    }
    return map;
  }, [jadwalData]);

  const getCellClass = (hari: string, jamKe: number) => {
    const key = `${hari}-${jamKe}`;
    const j = jadwalMap[key];
    if (!j) return "";
    // Generate consistent color from mapelId
    const colors = [
      "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
      "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
      "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
      "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
      "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    ];
    const hash = j.mapelId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Roster Per Kelas</h3>
          <p className="text-sm text-muted-foreground">Lihat jadwal pelajaran berdasarkan kelas</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Kelas:</Label>
          <Select value={selectedRombel} onValueChange={setSelectedRombel}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Pilih Kelas" />
            </SelectTrigger>
            <SelectContent>
              {rombelList.map((r: string) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedRombel ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">Pilih kelas untuk melihat roster</CardContent></Card>
      ) : isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : jadwalData.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">Belum ada jadwal untuk kelas ini</CardContent></Card>
      ) : (
        <ScrollArea className="w-full">
          <div className="min-w-[800px]">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Jadwal Pelajaran — {selectedRombel}</CardTitle>
                <p className="text-xs text-muted-foreground">Tahun Pelajaran {tahunPelajaran} — Semester {semester}</p>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28 sticky left-0 bg-card z-10 border-r">Hari / Jam</TableHead>
                    {HARI.map((h) => (
                      <TableHead key={h} className="text-center min-w-[140px]">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(jamList as JamItem[]).map((jam) => (
                    <TableRow key={jam.jamKe}>
                      <TableCell className="sticky left-0 bg-card z-10 border-r font-medium">
                        <div className="text-sm">
                          <div>Jam ke-{jam.jamKe}</div>
                          <div className="text-xs text-muted-foreground">{jam.jamMulai} - {jam.jamSelesai}</div>
                        </div>
                      </TableCell>
                      {HARI.map((hari) => {
                        const key = `${hari}-${jam.jamKe}`;
                        const j = jadwalMap[key];
                        return (
                          <TableCell key={hari} className="p-1 text-center">
                            {j ? (
                              <div className={`rounded-md p-2 text-xs ${getCellClass(hari, jam.jamKe)}`}>
                                <div className="font-semibold">{j.mapelNama}</div>
                                <div className="opacity-75 mt-0.5">{j.mapelKode}</div>
                                {j.guruNama && (
                                  <div className="opacity-60 mt-0.5 text-[10px]">({j.guruNama})</div>
                                )}
                              </div>
                            ) : (
                              <div className="h-16 flex items-center justify-center text-muted-foreground text-xs">
                                —
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: Roster Per Guru
// ═══════════════════════════════════════════════════════════════════════════════
function RosterPerGuru() {
  const { tahunPelajaran, semester } = useAppStore();

  const { data: guruList = [] } = useQuery({
    queryKey: ["jadwal-guru", tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams({ tahunPelajaran, semester });
      const res = await fetch(`/api/guru/list?${params}`);
      if (!res.ok) throw new Error("Gagal memuat");
      return res.json();
    },
    enabled: !!tahunPelajaran,
  });

  const { data: jamList = [] } = useQuery({
    queryKey: ["jadwal-jam", tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams({ tahunPelajaran, semester });
      const res = await fetch(`/api/jadwal/jam?${params}`);
      if (!res.ok) throw new Error("Gagal memuat");
      return res.json();
    },
    enabled: !!tahunPelajaran,
  });

  const [selectedGuru, setSelectedGuru] = useState("");

  React.useEffect(() => {
    if (guruList.length > 0 && !selectedGuru) setSelectedGuru(guruList[0]?.id || "");
  }, [guruList, selectedGuru]);

  const { data: jadwalData = [], isLoading } = useQuery({
    queryKey: ["jadwal-roster-guru", tahunPelajaran, semester, selectedGuru],
    queryFn: async () => {
      if (!selectedGuru) return [];
      const params = new URLSearchParams({ tahunPelajaran, semester, guruId: selectedGuru });
      const res = await fetch(`/api/jadwal/kelas?${params}`);
      if (!res.ok) throw new Error("Gagal memuat");
      return res.json();
    },
    enabled: !!selectedGuru && !!tahunPelajaran,
  });

  const jadwalMap = useMemo(() => {
    const map: Record<string, JadwalItem> = {};
    for (const j of jadwalData) {
      map[`${j.hari}-${j.jamKe}`] = j;
    }
    return map;
  }, [jadwalData]);

  const getCellClass = (hari: string, jamKe: number) => {
    const key = `${hari}-${jamKe}`;
    const j = jadwalMap[key];
    if (!j) return "";
    const colors = [
      "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
      "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
      "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
      "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
      "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    ];
    const hash = j.rombel.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const selectedGuruName = useMemo(() => {
    const g = (guruList as GuruItem[]).find((g) => g.id === selectedGuru);
    return g?.nama || "";
  }, [guruList, selectedGuru]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Roster Per Guru</h3>
          <p className="text-sm text-muted-foreground">Lihat jadwal mengajar berdasarkan guru</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Guru:</Label>
          <Select value={selectedGuru} onValueChange={setSelectedGuru}>
            <SelectTrigger className="w-56">
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

      {!selectedGuru ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">Pilih guru untuk melihat roster</CardContent></Card>
      ) : isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : jadwalData.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">Belum ada jadwal untuk guru ini</CardContent></Card>
      ) : (
        <ScrollArea className="w-full">
          <div className="min-w-[800px]">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Jadwal Mengajar — {selectedGuruName}</CardTitle>
                <p className="text-xs text-muted-foreground">Tahun Pelajaran {tahunPelajaran} — Semester {semester}</p>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28 sticky left-0 bg-card z-10 border-r">Hari / Jam</TableHead>
                    {HARI.map((h) => (
                      <TableHead key={h} className="text-center min-w-[140px]">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(jamList as JamItem[]).map((jam) => (
                    <TableRow key={jam.jamKe}>
                      <TableCell className="sticky left-0 bg-card z-10 border-r font-medium">
                        <div className="text-sm">
                          <div>Jam ke-{jam.jamKe}</div>
                          <div className="text-xs text-muted-foreground">{jam.jamMulai} - {jam.jamSelesai}</div>
                        </div>
                      </TableCell>
                      {HARI.map((hari) => {
                        const key = `${hari}-${jam.jamKe}`;
                        const j = jadwalMap[key];
                        return (
                          <TableCell key={hari} className="p-1 text-center">
                            {j ? (
                              <div className={`rounded-md p-2 text-xs ${getCellClass(hari, jam.jamKe)}`}>
                                <div className="font-semibold">{j.mapelNama}</div>
                                <div className="opacity-75 mt-0.5">{j.mapelKode}</div>
                                <div className="opacity-60 mt-0.5 text-[10px]">({j.rombel})</div>
                              </div>
                            ) : (
                              <div className="h-16 flex items-center justify-center text-muted-foreground text-xs">
                                —
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: Akses Management (Admin Only)
// ═══════════════════════════════════════════════════════════════════════════════
function AksesManager() {
  const { toast } = useToast();
  const { tahunPelajaran, semester } = useAppStore();
  const qc = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ["jadwal-users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Gagal memuat");
      return res.json();
    },
  });

  const { data: rombelList = [] } = useQuery({
    queryKey: ["jadwal-rombel", tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams({ tahunPelajaran, semester });
      const res = await fetch(`/api/siswa/rombel?${params}`);
      if (!res.ok) throw new Error("Gagal memuat");
      return res.json();
    },
    enabled: !!tahunPelajaran,
  });

  const { data: aksesList = [], isLoading } = useQuery({
    queryKey: ["jadwal-akses", tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams({ tahunPelajaran, semester });
      const res = await fetch(`/api/jadwal/akses?${params}`);
      if (!res.ok) throw new Error("Gagal memuat");
      return res.json();
    },
    enabled: !!tahunPelajaran,
  });

  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRombel, setSelectedRombel] = useState("");

  const grantMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/jadwal/akses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser, rombel: selectedRombel, tahunPelajaran, semester }),
      });
      const d = await res.json(); if (!res.ok) throw new Error(d.error); return d;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jadwal-akses"] });
      toast({ title: "Akses diberikan" });
      setSelectedRombel("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/jadwal/akses?id=${id}`, { method: "DELETE" });
      const d = await res.json(); if (!res.ok) throw new Error(d.error); return d;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jadwal-akses"] });
      toast({ title: "Akses dicabut" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Akses Edit Jadwal</h3>
          <p className="text-sm text-muted-foreground">Berikan akses kepada user untuk mengisi jadwal per rombel</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Berikan Akses Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label className="text-xs">User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih User" />
                </SelectTrigger>
                <SelectContent>
                  {(users as { id: string; username: string; nama: string; role: string }[]).map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.nama || u.username} ({u.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-xs">Rombel</Label>
              <Select value={selectedRombel} onValueChange={setSelectedRombel}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Rombel" />
                </SelectTrigger>
                <SelectContent>
                  {(rombelList as string[]).map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => grantMutation.mutate()}
              disabled={grantMutation.isPending || !selectedUser || !selectedRombel}
              className="gap-1.5"
            >
              {grantMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              Berikan Akses
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">No</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Rombel</TableHead>
                <TableHead>Tahun Pelajaran</TableHead>
                <TableHead className="w-24 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center"><Loader2 className="h-6 w-6 mx-auto animate-spin" /></TableCell></TableRow>
              ) : (aksesList as AksesItem[]).length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Belum ada akses yang diberikan</TableCell></TableRow>
              ) : (
                (aksesList as AksesItem[]).map((a, i) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-center">{i + 1}</TableCell>
                    <TableCell>{a.user?.nama || a.user?.username || a.userId}</TableCell>
                    <TableCell><Badge variant="secondary">{a.rombel}</Badge></TableCell>
                    <TableCell>{a.tahunPelajaran} — {a.semester}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                        onClick={() => revokeMutation.mutate(a.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function JadwalPelajaranPage() {
  const { tahunPelajaran, semester } = useAppStore();
  const session = useSession();
  const isAdmin = session.data?.user?.role === "admin";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400">
            <CalendarClock className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Jadwal Pelajaran</h2>
            <p className="text-sm text-muted-foreground">
              Kelola jadwal pelajaran, jam pelajaran, dan mata pelajaran
            </p>
          </div>
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
        <Tabs defaultValue="input" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-5">
            <TabsTrigger value="data" className="gap-1.5">
              <BookOpen className="h-4 w-4 hidden sm:block" />
              <span>Kelola Data</span>
            </TabsTrigger>
            <TabsTrigger value="input" className="gap-1.5">
              <Pencil className="h-4 w-4 hidden sm:block" />
              <span>Input Jadwal</span>
            </TabsTrigger>
            <TabsTrigger value="roster-kelas" className="gap-1.5">
              <Users className="h-4 w-4 hidden sm:block" />
              <span>Roster Kelas</span>
            </TabsTrigger>
            <TabsTrigger value="roster-guru" className="gap-1.5">
              <Eye className="h-4 w-4 hidden sm:block" />
              <span>Roster Guru</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="akses" className="gap-1.5">
                <Shield className="h-4 w-4 hidden sm:block" />
                <span>Akses</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="data" className="mt-6">
            <Tabs defaultValue="mapel">
              <TabsList>
                <TabsTrigger value="mapel">Mata Pelajaran</TabsTrigger>
                <TabsTrigger value="jam">Jam Pelajaran</TabsTrigger>
              </TabsList>
              <TabsContent value="mapel" className="mt-4">
                <MapelManager />
              </TabsContent>
              <TabsContent value="jam" className="mt-4">
                <JamManager />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="input" className="mt-6">
            <InputJadwal />
          </TabsContent>

          <TabsContent value="roster-kelas" className="mt-6">
            <RosterPerKelas />
          </TabsContent>

          <TabsContent value="roster-guru" className="mt-6">
            <RosterPerGuru />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="akses" className="mt-6">
              <AksesManager />
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}
