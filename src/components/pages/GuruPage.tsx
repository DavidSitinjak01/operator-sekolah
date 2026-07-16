'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

// ---------- Types ----------
interface Guru {
  id: string;
  nip: string;
  nama: string;
  jenisKelamin: string;
  mataPelajaran: string;
  alamat: string;
  noTelp: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface GuruResponse {
  data: Guru[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface GuruFormData {
  id?: string;
  nip: string;
  nama: string;
  jenisKelamin: string;
  mataPelajaran: string;
  alamat: string;
  noTelp: string;
  status: string;
}

// ---------- Constants ----------
const EMPTY_FORM: GuruFormData = {
  nip: '',
  nama: '',
  jenisKelamin: 'Laki-laki',
  mataPelajaran: '',
  alamat: '',
  noTelp: '',
  status: 'Aktif',
};

const PAGE_SIZE = 10;

// ---------- Component ----------
export default function GuruPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Search & filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<GuruFormData>(EMPTY_FORM);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Guru | null>(null);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filter changes
  React.useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // ---------- Query ----------
  const queryKey = ['guru', debouncedSearch, statusFilter, page];

  const { data, isLoading, isError } = useQuery<GuruResponse>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page.toString());
      params.set('limit', PAGE_SIZE.toString());
      const res = await fetch(`/api/guru?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat data guru');
      return res.json();
    },
  });

  const guruList = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  // ---------- Mutations ----------
  const createMutation = useMutation({
    mutationFn: async (payload: GuruFormData) => {
      const res = await fetch('/api/guru', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menambah guru');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guru'] });
      toast({ title: 'Berhasil', description: 'Data guru berhasil ditambahkan' });
      closeDialog();
    },
    onError: (err) => {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: GuruFormData) => {
      const res = await fetch('/api/guru', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mengupdate guru');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guru'] });
      toast({ title: 'Berhasil', description: 'Data guru berhasil diperbarui' });
      closeDialog();
    },
    onError: (err) => {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/guru?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus guru');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guru'] });
      toast({ title: 'Berhasil', description: 'Data guru berhasil dihapus' });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    },
  });

  // ---------- Handlers ----------
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const openCreateDialog = useCallback(() => {
    setFormData(EMPTY_FORM);
    setIsEditing(false);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((guru: Guru) => {
    setFormData({
      id: guru.id,
      nip: guru.nip,
      nama: guru.nama,
      jenisKelamin: guru.jenisKelamin,
      mataPelajaran: guru.mataPelajaran,
      alamat: guru.alamat,
      noTelp: guru.noTelp,
      status: guru.status,
    });
    setIsEditing(true);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setFormData(EMPTY_FORM);
    setIsEditing(false);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.nip.trim() || !formData.nama.trim() || !formData.mataPelajaran.trim()) {
        toast({
          title: 'Validasi gagal',
          description: 'NIP, Nama Lengkap, dan Mata Pelajaran wajib diisi',
          variant: 'destructive',
        });
        return;
      }
      if (isEditing && formData.id) {
        updateMutation.mutate(formData);
      } else {
        createMutation.mutate(formData);
      }
    },
    [formData, isEditing, createMutation, updateMutation, toast],
  );

  const handleDeleteClick = useCallback((guru: Guru) => {
    setDeleteTarget(guru);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  }, [deleteTarget, deleteMutation]);

  // ---------- Helpers ----------
  const updateField = useCallback(
    (field: keyof GuruFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const goToPage = useCallback(
    (p: number) => {
      if (p >= 1 && p <= totalPages) setPage(p);
    },
    [totalPages],
  );

  const getPageNumbers = useCallback(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, page]);

  // ---------- Render ----------
  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Guru</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola data guru sekolah
          </p>
        </div>
        <Button onClick={openCreateDialog} className="w-full sm:w-auto">
          <UserPlus className="mr-2 size-4" />
          Tambah Guru
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="Cari nama atau NIP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Semua Status</SelectItem>
                <SelectItem value="Aktif">Aktif</SelectItem>
                <SelectItem value="Nonaktif">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>NIP</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="hidden md:table-cell">Jenis Kelamin</TableHead>
                  <TableHead className="hidden lg:table-cell">Mata Pelajaran</TableHead>
                  <TableHead className="hidden xl:table-cell">No. Telepon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-center">
                        <Skeleton className="mx-auto h-4 w-6" />
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center">
                      <p className="text-destructive font-medium">Gagal memuat data</p>
                      <p className="text-muted-foreground text-sm mt-1">
                        Terjadi kesalahan saat mengambil data guru
                      </p>
                    </TableCell>
                  </TableRow>
                ) : guruList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center">
                      <p className="text-muted-foreground font-medium">Tidak ada data</p>
                      <p className="text-muted-foreground/70 text-sm mt-1">
                        {search || statusFilter
                          ? 'Coba ubah filter pencarian'
                          : 'Belum ada data guru yang terdaftar'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  guruList.map((guru, idx) => (
                    <TableRow key={guru.id}>
                      <TableCell className="text-center">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{guru.nip}</TableCell>
                      <TableCell className="font-medium">{guru.nama}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {guru.jenisKelamin}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {guru.mataPelajaran}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">{guru.noTelp || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            guru.status === 'Aktif'
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-red-100 text-red-700 hover:bg-red-100'
                          }
                        >
                          {guru.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openEditDialog(guru)}
                            aria-label={`Edit ${guru.nama}`}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(guru)}
                            aria-label={`Hapus ${guru.nama}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!isLoading && !isError && guruList.length > 0 && (
            <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                Menampilkan {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, total)} dari {total} guru
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={page <= 1}
                  onClick={() => goToPage(1)}
                  aria-label="Halaman pertama"
                >
                  <ChevronsLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {getPageNumbers().map((p, i) =>
                  p === '...' ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="text-muted-foreground px-1 text-sm"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={p}
                      variant={page === p ? 'default' : 'outline'}
                      size="icon"
                      className="size-8"
                      onClick={() => goToPage(p)}
                      aria-label={`Halaman ${p}`}
                    >
                      {p}
                    </Button>
                  ),
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={page >= totalPages}
                  onClick={() => goToPage(totalPages)}
                  aria-label="Halaman terakhir"
                >
                  <ChevronsRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Guru' : 'Tambah Guru'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Perbarui informasi data guru di bawah ini.'
                : 'Isi form berikut untuk menambahkan guru baru.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NIP */}
            <div className="space-y-2">
              <Label htmlFor="nip">
                NIP <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nip"
                placeholder="Masukkan NIP"
                value={formData.nip}
                onChange={(e) => updateField('nip', e.target.value)}
                required
              />
            </div>

            {/* Nama Lengkap */}
            <div className="space-y-2">
              <Label htmlFor="nama">
                Nama Lengkap <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nama"
                placeholder="Masukkan nama lengkap"
                value={formData.nama}
                onChange={(e) => updateField('nama', e.target.value)}
                required
              />
            </div>

            {/* Jenis Kelamin */}
            <div className="space-y-2">
              <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
              <Select
                value={formData.jenisKelamin}
                onValueChange={(v) => updateField('jenisKelamin', v)}
              >
                <SelectTrigger className="w-full" id="jenisKelamin">
                  <SelectValue placeholder="Pilih jenis kelamin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                  <SelectItem value="Perempuan">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mata Pelajaran */}
            <div className="space-y-2">
              <Label htmlFor="mataPelajaran">
                Mata Pelajaran <span className="text-destructive">*</span>
              </Label>
              <Input
                id="mataPelajaran"
                placeholder="Masukkan mata pelajaran"
                value={formData.mataPelajaran}
                onChange={(e) => updateField('mataPelajaran', e.target.value)}
                required
              />
            </div>

            {/* Alamat */}
            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Textarea
                id="alamat"
                placeholder="Masukkan alamat lengkap"
                value={formData.alamat}
                onChange={(e) => updateField('alamat', e.target.value)}
                rows={3}
              />
            </div>

            {/* No. Telepon */}
            <div className="space-y-2">
              <Label htmlFor="noTelp">No. Telepon</Label>
              <Input
                id="noTelp"
                placeholder="Masukkan nomor telepon"
                value={formData.noTelp}
                onChange={(e) => updateField('noTelp', e.target.value)}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => updateField('status', v)}
              >
                <SelectTrigger className="w-full" id="status">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Menyimpan...'
                  : isEditing
                    ? 'Simpan Perubahan'
                    : 'Tambah Guru'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Guru</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data guru{' '}
              <span className="font-semibold text-foreground">
                {deleteTarget?.nama}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}