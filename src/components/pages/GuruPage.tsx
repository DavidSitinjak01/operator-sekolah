'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useAppStore } from '@/store/app';

// ---------- Types ----------
interface Guru {
  id: string;
  no: number;
  nama: string;
  nuptk: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  nip: string;
  statusKepegawaian: string;
  jenisPTK: string;
  agama: string;
  alamat: string;
  hp: string;
  email: string;
  tugasTambahan: string;
  pangkatGolongan: string;
  sumberGaji: string;
  statusPerkawinan: string;
  kewarganegaraan: string;
  status: string;
  tahunPelajaran: string;
  semester: string;
}

interface GuruResponse {
  data: Guru[];
  total: number;
  page: number;
  limit: number;
}

// ---------- Component ----------
export default function GuruPage() {
  const { tahunPelajaran, semester } = useAppStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rombelFilter, setRombelFilter] = useState<string>('all');
  const limit = 10;

  const [deleteTarget, setDeleteTarget] = useState<Guru | null>(null);

  // ---------- Fetch guru data ----------
  const { data, isLoading, isError } = useQuery<GuruResponse>({
    queryKey: ['guru', search, page, tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        tahunPelajaran,
        semester,
        page: page.toString(),
        limit: limit.toString(),
      });
      const res = await fetch(`/api/guru?${params}`);
      if (!res.ok) throw new Error('Gagal memuat data guru');
      return res.json();
    },
  });

  // ---------- Fetch unique rombel values ----------
  const { data: rombelOptions } = useQuery<string[]>({
    queryKey: ['guru-rombel', tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams({
        tahunPelajaran,
        semester,
        page: '1',
        limit: '9999',
      });
      const res = await fetch(`/api/guru?${params}`);
      if (!res.ok) return [];
      const json: GuruResponse = await res.json();
      const rombelSet = new Set<string>();
      json.data.forEach((g) => {
        if (g.tugasTambahan) rombelSet.add(g.tugasTambahan);
      });
      return Array.from(rombelSet).sort();
    },
  });

  // ---------- Delete mutation ----------
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/guru`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Gagal menghapus data guru');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Berhasil', description: 'Data guru berhasil dihapus.' });
      queryClient.invalidateQueries({ queryKey: ['guru'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({
        title: 'Gagal',
        description: 'Terjadi kesalahan saat menghapus data guru.',
        variant: 'destructive',
      });
    },
  });

  // ---------- Filtered data by rombel ----------
  const gurus = data?.data ?? [];
  const total = data?.total ?? 0;
  const filteredGurus =
    rombelFilter === 'all'
      ? gurus
      : gurus.filter((g) => g.tugasTambahan === rombelFilter);

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, filteredGurus.length > 0 ? (page - 1) * limit + filteredGurus.length : 0);
  const totalPages = Math.ceil(total / limit);

  // ---------- Skeleton rows ----------
  const skeletonRows = Array.from({ length: 5 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Guru & Tenaga Pendidik</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data guru — {tahunPelajaran} Semester {semester}
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama, NIP, atau NUPTK..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Rombel filter */}
            <div className="w-full sm:w-56">
              <Select
                value={rombelFilter}
                onValueChange={(val) => {
                  setRombelFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter Rombel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Rombel</SelectItem>
                  {rombelOptions?.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold">Daftar Guru</CardTitle>
            {!isLoading && !isError && (
              <p className="text-sm text-muted-foreground">
                Menampilkan {total > 0 ? startItem : 0}-{endItem} dari {total} guru
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {isLoading ? (
              /* ---------- Skeleton ---------- */
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                {skeletonRows.map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <GraduationCap className="mb-4 h-12 w-12 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  Gagal memuat data guru
                </p>
              </div>
            ) : filteredGurus.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="mb-4 h-12 w-12 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  Tidak ada data guru yang ditemukan
                </p>
                {search && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Coba ubah kata kunci pencarian
                  </p>
                )}
              </div>
            ) : (
              /* ---------- Table ---------- */
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    {/* Always visible */}
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead className="min-w-[160px]">Nama</TableHead>
                    <TableHead className="w-16 text-center">JK</TableHead>

                    {/* sm+ */}
                    <TableHead className="hidden min-w-[140px] sm:table-cell">NIP</TableHead>
                    <TableHead className="hidden min-w-[120px] sm:table-cell">HP</TableHead>

                    {/* md+ */}
                    <TableHead className="hidden min-w-[130px] md:table-cell">Tempat Lahir</TableHead>
                    <TableHead className="hidden min-w-[110px] md:table-cell">Tgl Lahir</TableHead>
                    <TableHead className="hidden min-w-[80px] md:table-cell">Agama</TableHead>

                    {/* lg+ */}
                    <TableHead className="hidden min-w-[140px] lg:table-cell">Status Kepegawaian</TableHead>
                    <TableHead className="hidden min-w-[120px] lg:table-cell">Jenis PTK</TableHead>
                    <TableHead className="hidden min-w-[180px] lg:table-cell">Alamat</TableHead>
                    <TableHead className="hidden min-w-[160px] lg:table-cell">Email</TableHead>
                    <TableHead className="hidden min-w-[120px] lg:table-cell">Sumber Gaji</TableHead>

                    {/* xl+ */}
                    <TableHead className="hidden min-w-[140px] xl:table-cell">NUPTK</TableHead>
                    <TableHead className="hidden min-w-[140px] xl:table-cell">Tugas Tambahan</TableHead>
                    <TableHead className="hidden min-w-[130px] xl:table-cell">Pangkat/Golongan</TableHead>
                    <TableHead className="hidden min-w-[120px] xl:table-cell">Status Perkawinan</TableHead>
                    <TableHead className="hidden min-w-[120px] xl:table-cell">Kewarganegaraan</TableHead>

                    {/* Aksi - always visible */}
                    <TableHead className="w-16 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGurus.map((guru) => (
                    <TableRow key={guru.id}>
                      {/* Always */}
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {guru.no}
                      </TableCell>
                      <TableCell className="font-medium">{guru.nama}</TableCell>
                      <TableCell className="text-center">{guru.jenisKelamin}</TableCell>

                      {/* sm+ */}
                      <TableCell className="hidden text-sm sm:table-cell">{guru.nip || '-'}</TableCell>
                      <TableCell className="hidden text-sm sm:table-cell">{guru.hp || '-'}</TableCell>

                      {/* md+ */}
                      <TableCell className="hidden text-sm md:table-cell">{guru.tempatLahir || '-'}</TableCell>
                      <TableCell className="hidden text-sm md:table-cell">{guru.tanggalLahir || '-'}</TableCell>
                      <TableCell className="hidden text-sm md:table-cell">{guru.agama || '-'}</TableCell>

                      {/* lg+ */}
                      <TableCell className="hidden text-sm lg:table-cell">
                        {guru.statusKepegawaian || '-'}
                      </TableCell>
                      <TableCell className="hidden text-sm lg:table-cell">
                        {guru.jenisPTK || '-'}
                      </TableCell>
                      <TableCell className="hidden max-w-[200px] truncate text-sm lg:table-cell">
                        {guru.alamat || '-'}
                      </TableCell>
                      <TableCell className="hidden text-sm lg:table-cell">{guru.email || '-'}</TableCell>
                      <TableCell className="hidden text-sm lg:table-cell">
                        {guru.sumberGaji || '-'}
                      </TableCell>

                      {/* xl+ */}
                      <TableCell className="hidden text-sm xl:table-cell">{guru.nuptk || '-'}</TableCell>
                      <TableCell className="hidden text-sm xl:table-cell">
                        {guru.tugasTambahan || '-'}
                      </TableCell>
                      <TableCell className="hidden text-sm xl:table-cell">
                        {guru.pangkatGolongan || '-'}
                      </TableCell>
                      <TableCell className="hidden text-sm xl:table-cell">
                        {guru.statusPerkawinan || '-'}
                      </TableCell>
                      <TableCell className="hidden text-sm xl:table-cell">
                        {guru.kewarganegaraan || '-'}
                      </TableCell>

                      {/* Aksi */}
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteTarget(guru)}
                          aria-label={`Hapus ${guru.nama}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* ---------- Pagination ---------- */}
          {!isLoading && !isError && filteredGurus.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Halaman {page} dari {totalPages || 1}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------- Delete Confirmation Dialog ---------- */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Guru</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data{' '}
              <span className="font-semibold">{deleteTarget?.nama}</span>? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}