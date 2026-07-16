'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { useAppStore } from '@/store/app';
import { useToast } from '@/hooks/use-toast';

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Siswa {
  id: string;
  no: number;
  nama: string;
  nipd: string;
  jenisKelamin: string;
  nisn: string;
  tempatLahir: string;
  tanggalLahir: string;
  nik: string;
  agama: string;
  alamat: string;
  hp: string;
  email: string;
  rombel: string;
  kebutuhanKhusus: string;
  sekolahAsal: string;
  namaAyah: string;
  namaIbu: string;
  namaWali: string;
  status: string;
  tahunPelajaran: string;
  semester: string;
}

interface SiswaResponse {
  data: Siswa[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ROMBEL_OPTIONS = [
  'X Baluse',
  'X Bulusa',
  'X Kalabubu',
  'X Laeru',
  'X Lasara',
  'X Rai',
  'X Seubagoa',
  'X Toho',
  'X Tologu',
  'XI Baluse',
  'XI Bulusa',
  'XI Kalabubu',
  'XI Laeru',
  'XI Lasara',
  'XI Rai',
  'XI Seubagoa',
  'XI Toho',
  'XI Tutuhao',
  'XII Baluse',
  'XII Bulusa',
  'XII Kalabubu',
  'XII Lasara',
  'XII Rai',
];

const LIMIT = 10;

export default function SiswaPage() {
  const [search, setSearch] = useState('');
  const [rombel, setRombel] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { tahunPelajaran, semester } = useAppStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<SiswaResponse>({
    queryKey: ['siswa', search, rombel, page, tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (rombel) params.set('rombel', rombel);
      params.set('tahunPelajaran', tahunPelajaran);
      params.set('semester', semester);
      params.set('page', page.toString());
      params.set('limit', LIMIT.toString());

      const res = await fetch(`/api/siswa?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat data siswa');
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/siswa`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Gagal menghapus data siswa');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siswa'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Berhasil',
        description: 'Data siswa berhasil dihapus.',
      });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: 'Gagal',
        description: 'Gagal menghapus data siswa. Silakan coba lagi.',
        variant: 'destructive',
      });
      setDeleteId(null);
    },
  });

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRombelChange = (value: string) => {
    setRombel(value === '__all__' ? '' : value);
    setPage(1);
  };

  const siswaList = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const startItem = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const endItem = Math.min(page * LIMIT, total);

  const deleteTarget = siswaList.find((s) => s.id === deleteId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Data Siswa</h1>
            <p className="text-sm text-muted-foreground">
              Kelola data siswa {tahunPelajaran} — Semester {semester}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama, NIPD, NISN, atau NIK..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={rombel || '__all__'} onValueChange={handleRombelChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Semua Rombel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Semua Rombel</SelectItem>
                {ROMBEL_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-9 w-24" />
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-8 w-10" />
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-9" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead className="min-w-[180px]">Nama</TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[100px]">NIPD</TableHead>
                    <TableHead className="w-14 text-center">JK</TableHead>
                    <TableHead className="hidden sm:table-cell min-w-[130px]">NISN</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[120px]">Tempat Lahir</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[110px]">Tanggal Lahir</TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[140px]">NIK</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[100px]">Agama</TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[200px]">Alamat</TableHead>
                    <TableHead className="hidden sm:table-cell min-w-[120px]">HP</TableHead>
                    <TableHead className="hidden xl:table-cell min-w-[180px]">E-Mail</TableHead>
                    <TableHead className="min-w-[120px]">Rombel</TableHead>
                    <TableHead className="hidden xl:table-cell min-w-[140px]">Kebutuhan Khusus</TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[140px]">Sekolah Asal</TableHead>
                    <TableHead className="hidden xl:table-cell min-w-[120px]">Nama Ayah</TableHead>
                    <TableHead className="hidden xl:table-cell min-w-[120px]">Nama Ibu</TableHead>
                    <TableHead className="hidden xl:table-cell min-w-[120px]">Nama Wali</TableHead>
                    <TableHead className="w-20 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {siswaList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={19} className="h-32 text-center text-muted-foreground">
                        Tidak ada data siswa ditemukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    siswaList.map((siswa) => (
                      <TableRow key={siswa.id}>
                        <TableCell className="text-center font-medium">{siswa.no}</TableCell>
                        <TableCell className="font-medium">{siswa.nama}</TableCell>
                        <TableCell className="hidden lg:table-cell">{siswa.nipd || '-'}</TableCell>
                        <TableCell className="text-center">{siswa.jenisKelamin || '-'}</TableCell>
                        <TableCell className="hidden sm:table-cell">{siswa.nisn || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell">{siswa.tempatLahir || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell">{siswa.tanggalLahir || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell">{siswa.nik || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell">{siswa.agama || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell max-w-[200px] truncate">{siswa.alamat || '-'}</TableCell>
                        <TableCell className="hidden sm:table-cell">{siswa.hp || '-'}</TableCell>
                        <TableCell className="hidden xl:table-cell">{siswa.email || '-'}</TableCell>
                        <TableCell>{siswa.rombel || '-'}</TableCell>
                        <TableCell className="hidden xl:table-cell">{siswa.kebutuhanKhusus || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell">{siswa.sekolahAsal || '-'}</TableCell>
                        <TableCell className="hidden xl:table-cell">{siswa.namaAyah || '-'}</TableCell>
                        <TableCell className="hidden xl:table-cell">{siswa.namaIbu || '-'}</TableCell>
                        <TableCell className="hidden xl:table-cell">{siswa.namaWali || '-'}</TableCell>
                        <TableCell className="text-center">
                          <AlertDialog
                            open={deleteId === siswa.id}
                            onOpenChange={(open) => {
                              if (!open) setDeleteId(null);
                              else setDeleteId(siswa.id);
                            }}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Hapus {siswa.nama}</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Data Siswa</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus data siswa{' '}
                                  <span className="font-semibold">{deleteTarget?.nama}</span>? Tindakan
                                  ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDelete}
                                  disabled={deleteMutation.isPending}
                                  className="bg-destructive text-white hover:bg-destructive/90"
                                >
                                  {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && (
            <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Menampilkan <span className="font-medium">{startItem}</span>-<span className="font-medium">{endItem}</span> dari{' '}
                <span className="font-medium">{total}</span> siswa
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Halaman sebelumnya</span>
                </Button>
                <span className="text-sm font-medium">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Halaman berikutnya</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation AlertDialog (controlled via deleteId state) */}
      {/* Note: The AlertDialog is embedded per-row above for simplicity */}
    </div>
  );
}