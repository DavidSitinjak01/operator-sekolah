'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/app';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MutasiMasuk {
  id: string;
  nama: string;
  nis: string;
  asalSekolah: string;
  kelas: string;
  tanggalMasuk: string;
  alasanMutasi: string;
  noSurat: string;
  tahunPelajaran: string;
  semester: string;
}

interface MutasiMasukResponse {
  data: MutasiMasuk[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FormState {
  id?: string;
  nama: string;
  nis: string;
  asalSekolah: string;
  kelas: string;
  tanggalMasuk: string;
  alasanMutasi: string;
  noSurat: string;
  tahunPelajaran: string;
  semester: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const KELAS_OPTIONS = ['VII-A', 'VII-B', 'VIII-A', 'VIII-B', 'IX-A', 'IX-B'];

const INITIAL_FORM: FormState = {
  nama: '',
  nis: '',
  asalSekolah: '',
  kelas: '',
  tanggalMasuk: '',
  alasanMutasi: '',
  noSurat: '',
  tahunPelajaran: '2025/2026',
  semester: 'Ganjil',
};

const PAGE_SIZE = 10;

// ─── Component ───────────────────────────────────────────────────────────────

export default function MutasiMasukPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { tahunPelajaran, semester } = useAppStore();

  // State: search & pagination
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  // State: dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  // State: alert dialog
  const [deleteTarget, setDeleteTarget] = useState<MutasiMasuk | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);

  // ─── Query: Fetch data ──────────────────────────────────────────────────

  const { data, isLoading, isError } = useQuery<MutasiMasukResponse>({
    queryKey: ['mutasi-masuk', search, page, tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      params.set('tahunPelajaran', tahunPelajaran);
      params.set('semester', semester);
      const res = await fetch(`/api/mutasi-masuk?${params}`);
      if (!res.ok) {
        throw new Error('Gagal memuat data mutasi masuk');
      }
      return res.json();
    },
  });

  // ─── Mutation: Create / Update ──────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async (payload: FormState) => {
      const isEdit = !!payload.id;
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? payload : { ...payload, id: undefined };
      const res = await fetch('/api/mutasi-masuk', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Gagal menyimpan data');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mutasi-masuk'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: isEditing ? 'Berhasil Diperbarui' : 'Berhasil Ditambahkan',
        description: isEditing
          ? 'Data mutasi masuk berhasil diperbarui.'
          : 'Data mutasi masuk berhasil ditambahkan.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal Menyimpan',
        description: error.message || 'Terjadi kesalahan saat menyimpan data.',
        variant: 'destructive',
      });
    },
  });

  // ─── Mutation: Delete ───────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/mutasi-masuk?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Gagal menghapus data');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mutasi-masuk'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDeleteAlertOpen(false);
      setDeleteTarget(null);
      toast({
        title: 'Berhasil Dihapus',
        description: 'Data mutasi masuk berhasil dihapus.',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal Menghapus',
        description: error.message || 'Terjadi kesalahan saat menghapus data.',
        variant: 'destructive',
      });
    },
  });

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const openAddDialog = () => {
    setForm({
      ...INITIAL_FORM,
      tahunPelajaran: useAppStore.getState().tahunPelajaran,
      semester: useAppStore.getState().semester,
    });
    setIsEditing(false);
    setDialogOpen(true);
  };

  const openEditDialog = (item: MutasiMasuk) => {
    setForm({
      id: item.id,
      nama: item.nama,
      nis: item.nis,
      asalSekolah: item.asalSekolah,
      kelas: item.kelas,
      tanggalMasuk: item.tanggalMasuk,
      alasanMutasi: item.alasanMutasi,
      noSurat: item.noSurat,
      tahunPelajaran: item.tahunPelajaran,
      semester: item.semester,
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const openDeleteAlert = (item: MutasiMasuk) => {
    setDeleteTarget(item);
    setDeleteAlertOpen(true);
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setIsEditing(false);
  };

  const handleFormChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (
      !form.nama.trim() ||
      !form.nis.trim() ||
      !form.asalSekolah.trim() ||
      !form.kelas ||
      !form.tanggalMasuk ||
      !form.alasanMutasi.trim() ||
      !form.noSurat.trim()
    ) {
      toast({
        title: 'Formulir Tidak Lengkap',
        description: 'Harap isi semua field yang wajib diisi.',
        variant: 'destructive',
      });
      return;
    }
    saveMutation.mutate(form);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (data?.totalPages ?? 1)) {
      setPage(newPage);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const rowNumber = (index: number) => (page - 1) * PAGE_SIZE + index + 1;

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <section className="space-y-6" aria-label="Mutasi Masuk">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Mutasi Masuk</CardTitle>
          <CardAction>
            <Button onClick={openAddDialog}>
              <UserPlus />
              <span className="hidden sm:inline">Tambah Mutasi Masuk</span>
              <span className="sm:hidden">Tambah</span>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama, NIS, atau asal sekolah..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={handleSearch}>
              <Search />
              <span>Cari</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <p className="text-muted-foreground">
                Gagal memuat data. Silakan coba lagi.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: ['mutasi-masuk'],
                  })
                }
              >
                Coba Lagi
              </Button>
            </div>
          ) : data && data.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <p className="text-muted-foreground">Belum ada data mutasi masuk.</p>
              <Button className="mt-4" onClick={openAddDialog}>
                <UserPlus />
                <span>Tambah Data Pertama</span>
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">No</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>NIS</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Asal Sekolah
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Kelas
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Tgl Masuk
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        No. Surat
                      </TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center">
                          {rowNumber(idx)}
                        </TableCell>
                        <TableCell className="font-medium">{item.nama}</TableCell>
                        <TableCell>{item.nis}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {item.asalSekolah}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {item.kelas}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {formatDate(item.tanggalMasuk)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {item.noSurat}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(item)}
                              aria-label={`Edit ${item.nama}`}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteAlert(item)}
                              aria-label={`Hapus ${item.nama}`}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Halaman {data.page} dari {data.totalPages}{' '}
                    <span className="hidden sm:inline">
                      &middot; Total {data.total} data
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page <= 1}
                      onClick={() => handlePageChange(page - 1)}
                      aria-label="Halaman sebelumnya"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {generatePageNumbers(page, data.totalPages).map(
                        (p, i) =>
                          p === '...' ? (
                            <span
                              key={`ellipsis-${i}`}
                              className="px-2 text-muted-foreground"
                            >
                              ...
                            </span>
                          ) : (
                            <Button
                              key={p}
                              variant={p === page ? 'default' : 'outline'}
                              size="icon"
                              className="size-9"
                              onClick={() => handlePageChange(p as number)}
                              aria-label={`Halaman ${p}`}
                            >
                              {p}
                            </Button>
                          )
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page >= data.totalPages}
                      onClick={() => handlePageChange(page + 1)}
                      aria-label="Halaman berikutnya"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Mutasi Masuk' : 'Tambah Mutasi Masuk'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Perbarui data mutasi masuk siswa.'
                : 'Isi data mutasi masuk siswa baru.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Nama Siswa */}
            <div className="grid gap-2">
              <Label htmlFor="nama">
                Nama Siswa <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nama"
                placeholder="Masukkan nama siswa"
                value={form.nama}
                onChange={(e) => handleFormChange('nama', e.target.value)}
              />
            </div>

            {/* NIS */}
            <div className="grid gap-2">
              <Label htmlFor="nis">
                NIS <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nis"
                placeholder="Masukkan NIS"
                value={form.nis}
                onChange={(e) => handleFormChange('nis', e.target.value)}
              />
            </div>

            {/* Asal Sekolah */}
            <div className="grid gap-2">
              <Label htmlFor="asalSekolah">
                Asal Sekolah <span className="text-destructive">*</span>
              </Label>
              <Input
                id="asalSekolah"
                placeholder="Masukkan asal sekolah"
                value={form.asalSekolah}
                onChange={(e) => handleFormChange('asalSekolah', e.target.value)}
              />
            </div>

            {/* Kelas */}
            <div className="grid gap-2">
              <Label htmlFor="kelas">
                Kelas <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.kelas}
                onValueChange={(val) => handleFormChange('kelas', val)}
              >
                <SelectTrigger id="kelas" className="w-full">
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {KELAS_OPTIONS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tanggal Masuk */}
            <div className="grid gap-2">
              <Label htmlFor="tanggalMasuk">
                Tanggal Masuk <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tanggalMasuk"
                type="date"
                value={form.tanggalMasuk}
                onChange={(e) =>
                  handleFormChange('tanggalMasuk', e.target.value)
                }
              />
            </div>

            {/* Alasan Mutasi */}
            <div className="grid gap-2">
              <Label htmlFor="alasanMutasi">
                Alasan Mutasi <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="alasanMutasi"
                placeholder="Masukkan alasan mutasi"
                value={form.alasanMutasi}
                onChange={(e) => handleFormChange('alasanMutasi', e.target.value)}
                rows={3}
              />
            </div>

            {/* No. Surat Mutasi */}
            <div className="grid gap-2">
              <Label htmlFor="noSurat">
                No. Surat Mutasi <span className="text-destructive">*</span>
              </Label>
              <Input
                id="noSurat"
                placeholder="Masukkan nomor surat mutasi"
                value={form.noSurat}
                onChange={(e) => handleFormChange('noSurat', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setDialogOpen(false);
              }}
              disabled={saveMutation.isPending}
            >
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {isEditing ? 'Simpan Perubahan' : 'Tambah Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Mutasi Masuk?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data mutasi masuk dari{' '}
              <strong>{deleteTarget?.nama}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              onClick={() => {
                setDeleteTarget(null);
              }}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {/* Header row skeleton */}
      <div className="flex gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Data row skeletons */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          {Array.from({ length: 8 }).map((_, j) => (
            <Skeleton key={j} className="h-9 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Pagination Helper ───────────────────────────────────────────────────────

function generatePageNumbers(
  current: number,
  total: number
): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [1];

  if (current > 3) {
    pages.push('...');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('...');
  }

  pages.push(total);

  return pages;
}