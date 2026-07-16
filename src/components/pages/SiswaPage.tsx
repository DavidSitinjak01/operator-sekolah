'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, ChevronLeft, ChevronRight, Users, FileSpreadsheet, Pencil, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/app';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import ImportExcelDialog from '@/components/ImportExcelDialog';

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
  rt: string;
  rw: string;
  dusun: string;
  kelurahan: string;
  kecamatan: string;
  kodePos: string;
  jenisTinggal: string;
  alatTransportasi: string;
  telepon: string;
  hp: string;
  email: string;
  skhun: string;
  penerimaKPS: string;
  noKPS: string;
  namaAyah: string;
  ayahTahunLahir: string;
  ayahJenjangPendidikan: string;
  ayahPekerjaan: string;
  ayahPenghasilan: string;
  ayahNik: string;
  namaIbu: string;
  ibuTahunLahir: string;
  ibuJenjangPendidikan: string;
  ibuPekerjaan: string;
  ibuPenghasilan: string;
  ibuNik: string;
  namaWali: string;
  waliTahunLahir: string;
  waliJenjangPendidikan: string;
  waliPekerjaan: string;
  waliPenghasilan: string;
  waliNik: string;
  rombel: string;
  noPesertaUN: string;
  noSeriIjazah: string;
  penerimaKIP: string;
  nomorKIP: string;
  namaKIP: string;
  nomorKKS: string;
  noRegAktaLahir: string;
  bank: string;
  nomorRekeningBank: string;
  rekeningAtasNama: string;
  layakPIP: string;
  alasanLayakPIP: string;
  kebutuhanKhusus: string;
  sekolahAsal: string;
  anakKeBerapa: string;
  lintang: string;
  bujur: string;
  noKK: string;
  beratBadan: string;
  tinggiBadan: string;
  lingkarKepala: string;
  jmlSaudaraKandung: string;
  jarakRumahKeSekolah: string;
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

const AGAMA_OPTIONS = ['Islam', 'Kristen', 'Katholik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'];

const PAGE_SIZE_OPTIONS = [
  { label: '10', value: '10' },
  { label: '25', value: '25' },
  { label: '50', value: '50' },
  { label: '100', value: '100' },
  { label: 'Semua', value: '9999' },
];

// Total visible columns: 39 data + 1 Aksi = 40
const TOTAL_COLUMNS = 40;

export default function SiswaPage() {
  const [search, setSearch] = useState('');
  const [rombel, setRombel] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Siswa | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});

  const { tahunPelajaran, semester } = useAppStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleEditClick = (siswa: Siswa) => {
    const data: Record<string, string> = {};
    for (const [key, value] of Object.entries(siswa)) {
      if (key === 'no' || key === 'id') continue;
      data[key] = String(value ?? '');
    }
    setEditData(data);
    setEditTarget(siswa);
  };

  const handleChange = (key: string, value: string) => {
    setEditData((prev) => ({ ...prev, [key]: value }));
  };

  const { data, isLoading } = useQuery<SiswaResponse>({
    queryKey: ['siswa', search, rombel, page, limit, tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (rombel) params.set('rombel', rombel);
      params.set('tahunPelajaran', tahunPelajaran);
      params.set('semester', semester);
      params.set('page', page.toString());
      params.set('limit', limit.toString());

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

  const editMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/siswa`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editTarget!.id, ...editData }),
      });
      if (!res.ok) throw new Error('Gagal menyimpan data siswa');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siswa'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Berhasil',
        description: 'Data siswa berhasil diperbarui.',
      });
      setEditTarget(null);
    },
    onError: () => {
      toast({
        title: 'Gagal',
        description: 'Gagal menyimpan data siswa. Silakan coba lagi.',
        variant: 'destructive',
      });
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

  const handleLimitChange = (value: string) => {
    const newLimit = parseInt(value);
    setLimit(newLimit);
    setPage(1);
  };

  const showAll = limit >= 9999;

  const siswaList = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = showAll ? total : Math.min(page * limit, total);

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
        <ImportExcelDialog
          type="siswa"
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['siswa'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          }}
        >
          <Button variant="outline" size="sm" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Import Excel
          </Button>
        </ImportExcelDialog>
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
            <Select value={String(limit)} onValueChange={handleLimitChange}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label} per halaman
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
                    {/* 1. No — Always visible */}
                    <TableHead className="w-12 text-center whitespace-nowrap">No</TableHead>
                    {/* 2. Nama — Always visible */}
                    <TableHead className="min-w-[180px] whitespace-nowrap">Nama</TableHead>
                    {/* 3. NIPD — sm+ */}
                    <TableHead className="hidden sm:table-cell min-w-[100px] whitespace-nowrap">NIPD</TableHead>
                    {/* 4. JK — Always visible */}
                    <TableHead className="w-14 text-center whitespace-nowrap">JK</TableHead>
                    {/* 5. NISN — sm+ */}
                    <TableHead className="hidden sm:table-cell min-w-[130px] whitespace-nowrap">NISN</TableHead>
                    {/* 6. Tempat Lahir — md+ */}
                    <TableHead className="hidden md:table-cell min-w-[120px] whitespace-nowrap">Tempat Lahir</TableHead>
                    {/* 7. Tanggal Lahir — md+ */}
                    <TableHead className="hidden md:table-cell min-w-[110px] whitespace-nowrap">Tanggal Lahir</TableHead>
                    {/* 8. NIK — lg+ */}
                    <TableHead className="hidden lg:table-cell min-w-[140px] whitespace-nowrap">NIK</TableHead>
                    {/* 9. Agama — sm+ */}
                    <TableHead className="hidden sm:table-cell min-w-[100px] whitespace-nowrap">Agama</TableHead>
                    {/* 10. Alamat — lg+ */}
                    <TableHead className="hidden lg:table-cell min-w-[200px] whitespace-nowrap">Alamat</TableHead>
                    {/* 11. RT — xl+ */}
                    <TableHead className="hidden xl:table-cell min-w-[60px] whitespace-nowrap">RT</TableHead>
                    {/* 12. RW — xl+ */}
                    <TableHead className="hidden xl:table-cell min-w-[60px] whitespace-nowrap">RW</TableHead>
                    {/* 13. Dusun — xl+ */}
                    <TableHead className="hidden xl:table-cell min-w-[100px] whitespace-nowrap">Dusun</TableHead>
                    {/* 14. Kelurahan — lg+ */}
                    <TableHead className="hidden lg:table-cell min-w-[120px] whitespace-nowrap">Kelurahan</TableHead>
                    {/* 15. Kecamatan — lg+ */}
                    <TableHead className="hidden lg:table-cell min-w-[120px] whitespace-nowrap">Kecamatan</TableHead>
                    {/* 16. Kode Pos — xl+ */}
                    <TableHead className="hidden xl:table-cell min-w-[80px] whitespace-nowrap">Kode Pos</TableHead>
                    {/* 17. Jenis Tinggal — lg+ */}
                    <TableHead className="hidden lg:table-cell min-w-[120px] whitespace-nowrap">Jenis Tinggal</TableHead>
                    {/* 18. Alat Transportasi — lg+ */}
                    <TableHead className="hidden lg:table-cell min-w-[120px] whitespace-nowrap">Alat Transportasi</TableHead>
                    {/* 19. Telepon — xl+ */}
                    <TableHead className="hidden xl:table-cell min-w-[100px] whitespace-nowrap">Telepon</TableHead>
                    {/* 20. HP — sm+ */}
                    <TableHead className="hidden sm:table-cell min-w-[120px] whitespace-nowrap">HP</TableHead>
                    {/* 21. E-Mail — lg+ */}
                    <TableHead className="hidden lg:table-cell min-w-[180px] whitespace-nowrap">E-Mail</TableHead>
                    {/* 22. SKHUN — xl+ */}
                    <TableHead className="hidden xl:table-cell min-w-[100px] whitespace-nowrap">SKHUN</TableHead>
                    {/* 23. Penerima KPS — xl+ */}
                    <TableHead className="hidden xl:table-cell min-w-[100px] whitespace-nowrap">Penerima KPS</TableHead>
                    {/* 24. No. KPS — lg+ */}
                    <TableHead className="hidden lg:table-cell min-w-[120px] whitespace-nowrap">No. KPS</TableHead>
                    {/* 25. Nama Ayah — md+ */}
                    <TableHead className="hidden md:table-cell min-w-[130px] whitespace-nowrap">Nama Ayah</TableHead>
                    {/* 26. Ayah Tahun Lahir — xl+ */}
                    <TableHead className="hidden xl:table-cell min-w-[100px] whitespace-nowrap">Ayah Tahun Lahir</TableHead>
                    {/* 27. Ayah Jenjang Pendidikan — xl+ */}
                    <TableHead className="hidden xl:table-cell min-w-[120px] whitespace-nowrap">Ayah Jenjang</TableHead>
                    {/* 28. Ayah Pekerjaan — lg+ */}
                    <TableHead className="hidden lg:table-cell min-w-[120px] whitespace-nowrap">Ayah Pekerjaan</TableHead>
                    {/* 29. Nama Ibu — md+ */}
                    <TableHead className="hidden md:table-cell min-w-[130px] whitespace-nowrap">Nama Ibu</TableHead>
                    {/* 30. Ibu Tahun Lahir — xl+ */}
                    <TableHead className="hidden xl:table-cell min-w-[100px] whitespace-nowrap">Ibu Tahun Lahir</TableHead>
                    {/* 31. Ibu Jenjang Pendidikan — xl+ */}
                    <TableHead className="hidden xl:table-cell min-w-[120px] whitespace-nowrap">Ibu Jenjang</TableHead>
                    {/* 32. Ibu Pekerjaan — lg+ */}
                    <TableHead className="hidden lg:table-cell min-w-[120px] whitespace-nowrap">Ibu Pekerjaan</TableHead>
                    {/* 33. Nama Wali — md+ */}
                    <TableHead className="hidden md:table-cell min-w-[130px] whitespace-nowrap">Nama Wali</TableHead>
                    {/* 34. Wali Tahun Lahir — xl+ */}
                    <TableHead className="hidden xl:table-cell min-w-[100px] whitespace-nowrap">Wali Tahun Lahir</TableHead>
                    {/* 35. Wali Jenjang Pendidikan — xl+ */}
                    <TableHead className="hidden xl:table-cell min-w-[120px] whitespace-nowrap">Wali Jenjang</TableHead>
                    {/* 36. Wali Pekerjaan — xl+ */}
                    <TableHead className="hidden xl:table-cell min-w-[120px] whitespace-nowrap">Wali Pekerjaan</TableHead>
                    {/* 37. Rombel Saat Ini — Always visible */}
                    <TableHead className="min-w-[120px] whitespace-nowrap">Rombel</TableHead>
                    {/* 38. Kebutuhan Khusus — md+ */}
                    <TableHead className="hidden md:table-cell min-w-[140px] whitespace-nowrap">Kebutuhan Khusus</TableHead>
                    {/* 39. Sekolah Asal — md+ */}
                    <TableHead className="hidden md:table-cell min-w-[140px] whitespace-nowrap">Sekolah Asal</TableHead>
                    {/* 40. Aksi — Always visible */}
                    <TableHead className="w-[88px] text-center whitespace-nowrap">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {siswaList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={TOTAL_COLUMNS} className="h-32 text-center text-muted-foreground">
                        Tidak ada data siswa ditemukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    siswaList.map((siswa) => (
                      <TableRow key={siswa.id}>
                        {/* 1. No */}
                        <TableCell className="text-center font-medium whitespace-nowrap">{siswa.no}</TableCell>
                        {/* 2. Nama */}
                        <TableCell className="font-medium whitespace-nowrap">{siswa.nama}</TableCell>
                        {/* 3. NIPD — sm+ */}
                        <TableCell className="hidden sm:table-cell whitespace-nowrap">{siswa.nipd || '-'}</TableCell>
                        {/* 4. JK */}
                        <TableCell className="text-center whitespace-nowrap">{siswa.jenisKelamin || '-'}</TableCell>
                        {/* 5. NISN — sm+ */}
                        <TableCell className="hidden sm:table-cell whitespace-nowrap">{siswa.nisn || '-'}</TableCell>
                        {/* 6. Tempat Lahir — md+ */}
                        <TableCell className="hidden md:table-cell whitespace-nowrap">{siswa.tempatLahir || '-'}</TableCell>
                        {/* 7. Tanggal Lahir — md+ */}
                        <TableCell className="hidden md:table-cell whitespace-nowrap">{siswa.tanggalLahir || '-'}</TableCell>
                        {/* 8. NIK — lg+ */}
                        <TableCell className="hidden lg:table-cell whitespace-nowrap">{siswa.nik || '-'}</TableCell>
                        {/* 9. Agama — sm+ */}
                        <TableCell className="hidden sm:table-cell whitespace-nowrap">{siswa.agama || '-'}</TableCell>
                        {/* 10. Alamat — lg+ */}
                        <TableCell className="hidden lg:table-cell max-w-[200px] truncate whitespace-nowrap">{siswa.alamat || '-'}</TableCell>
                        {/* 11. RT — xl+ */}
                        <TableCell className="hidden xl:table-cell whitespace-nowrap">{siswa.rt || '-'}</TableCell>
                        {/* 12. RW — xl+ */}
                        <TableCell className="hidden xl:table-cell whitespace-nowrap">{siswa.rw || '-'}</TableCell>
                        {/* 13. Dusun — xl+ */}
                        <TableCell className="hidden xl:table-cell whitespace-nowrap">{siswa.dusun || '-'}</TableCell>
                        {/* 14. Kelurahan — lg+ */}
                        <TableCell className="hidden lg:table-cell whitespace-nowrap">{siswa.kelurahan || '-'}</TableCell>
                        {/* 15. Kecamatan — lg+ */}
                        <TableCell className="hidden lg:table-cell whitespace-nowrap">{siswa.kecamatan || '-'}</TableCell>
                        {/* 16. Kode Pos — xl+ */}
                        <TableCell className="hidden xl:table-cell whitespace-nowrap">{siswa.kodePos || '-'}</TableCell>
                        {/* 17. Jenis Tinggal — lg+ */}
                        <TableCell className="hidden lg:table-cell whitespace-nowrap">{siswa.jenisTinggal || '-'}</TableCell>
                        {/* 18. Alat Transportasi — lg+ */}
                        <TableCell className="hidden lg:table-cell whitespace-nowrap">{siswa.alatTransportasi || '-'}</TableCell>
                        {/* 19. Telepon — xl+ */}
                        <TableCell className="hidden xl:table-cell whitespace-nowrap">{siswa.telepon || '-'}</TableCell>
                        {/* 20. HP — sm+ */}
                        <TableCell className="hidden sm:table-cell whitespace-nowrap">{siswa.hp || '-'}</TableCell>
                        {/* 21. E-Mail — lg+ */}
                        <TableCell className="hidden lg:table-cell whitespace-nowrap">{siswa.email || '-'}</TableCell>
                        {/* 22. SKHUN — xl+ */}
                        <TableCell className="hidden xl:table-cell whitespace-nowrap">{siswa.skhun || '-'}</TableCell>
                        {/* 23. Penerima KPS — xl+ */}
                        <TableCell className="hidden xl:table-cell whitespace-nowrap">{siswa.penerimaKPS || '-'}</TableCell>
                        {/* 24. No. KPS — lg+ */}
                        <TableCell className="hidden lg:table-cell whitespace-nowrap">{siswa.noKPS || '-'}</TableCell>
                        {/* 25. Nama Ayah — md+ */}
                        <TableCell className="hidden md:table-cell whitespace-nowrap">{siswa.namaAyah || '-'}</TableCell>
                        {/* 26. Ayah Tahun Lahir — xl+ */}
                        <TableCell className="hidden xl:table-cell whitespace-nowrap">{siswa.ayahTahunLahir || '-'}</TableCell>
                        {/* 27. Ayah Jenjang Pendidikan — xl+ */}
                        <TableCell className="hidden xl:table-cell whitespace-nowrap">{siswa.ayahJenjangPendidikan || '-'}</TableCell>
                        {/* 28. Ayah Pekerjaan — lg+ */}
                        <TableCell className="hidden lg:table-cell whitespace-nowrap">{siswa.ayahPekerjaan || '-'}</TableCell>
                        {/* 29. Nama Ibu — md+ */}
                        <TableCell className="hidden md:table-cell whitespace-nowrap">{siswa.namaIbu || '-'}</TableCell>
                        {/* 30. Ibu Tahun Lahir — xl+ */}
                        <TableCell className="hidden xl:table-cell whitespace-nowrap">{siswa.ibuTahunLahir || '-'}</TableCell>
                        {/* 31. Ibu Jenjang Pendidikan — xl+ */}
                        <TableCell className="hidden xl:table-cell whitespace-nowrap">{siswa.ibuJenjangPendidikan || '-'}</TableCell>
                        {/* 32. Ibu Pekerjaan — lg+ */}
                        <TableCell className="hidden lg:table-cell whitespace-nowrap">{siswa.ibuPekerjaan || '-'}</TableCell>
                        {/* 33. Nama Wali — md+ */}
                        <TableCell className="hidden md:table-cell whitespace-nowrap">{siswa.namaWali || '-'}</TableCell>
                        {/* 34. Wali Tahun Lahir — xl+ */}
                        <TableCell className="hidden xl:table-cell whitespace-nowrap">{siswa.waliTahunLahir || '-'}</TableCell>
                        {/* 35. Wali Jenjang Pendidikan — xl+ */}
                        <TableCell className="hidden xl:table-cell whitespace-nowrap">{siswa.waliJenjangPendidikan || '-'}</TableCell>
                        {/* 36. Wali Pekerjaan — xl+ */}
                        <TableCell className="hidden xl:table-cell whitespace-nowrap">{siswa.waliPekerjaan || '-'}</TableCell>
                        {/* 37. Rombel */}
                        <TableCell className="whitespace-nowrap">{siswa.rombel || '-'}</TableCell>
                        {/* 38. Kebutuhan Khusus — md+ */}
                        <TableCell className="hidden md:table-cell whitespace-nowrap">{siswa.kebutuhanKhusus || '-'}</TableCell>
                        {/* 39. Sekolah Asal — md+ */}
                        <TableCell className="hidden md:table-cell whitespace-nowrap">{siswa.sekolahAsal || '-'}</TableCell>
                        {/* 40. Aksi */}
                        <TableCell className="text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                              onClick={() => handleEditClick(siswa)}
                              aria-label={`Edit ${siswa.nama}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && total > 0 && (
            <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Menampilkan <span className="font-medium">{showAll ? total : startItem}</span>
                {showAll ? '' : <>-<span className="font-medium">{endItem}</span></>} dari{' '}
                <span className="font-medium">{total}</span> siswa
              </p>
              {!showAll && (
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
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Data Siswa</DialogTitle>
            <DialogDescription>
              Perbarui data siswa <span className="font-semibold">{editTarget?.nama}</span>. Ubah sesuai kebutuhan lalu simpan.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6 pb-2">
              {/* Section 1: Data Pribadi */}
              <div>
                <h3 className="text-sm font-bold pb-2 border-b">Data Pribadi</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-nama">
                      Nama <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit-nama"
                      value={editData.nama || ''}
                      onChange={(e) => handleChange('nama', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-nipd">NIPD</Label>
                    <Input
                      id="edit-nipd"
                      value={editData.nipd || ''}
                      onChange={(e) => handleChange('nipd', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-jk">Jenis Kelamin</Label>
                    <Select value={editData.jenisKelamin || ''} onValueChange={(v) => handleChange('jenisKelamin', v)}>
                      <SelectTrigger id="edit-jk">
                        <SelectValue placeholder="Pilih JK" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Laki-laki</SelectItem>
                        <SelectItem value="P">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-nisn">NISN</Label>
                    <Input
                      id="edit-nisn"
                      value={editData.nisn || ''}
                      onChange={(e) => handleChange('nisn', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-tempatLahir">Tempat Lahir</Label>
                    <Input
                      id="edit-tempatLahir"
                      value={editData.tempatLahir || ''}
                      onChange={(e) => handleChange('tempatLahir', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-tanggalLahir">Tanggal Lahir</Label>
                    <Input
                      id="edit-tanggalLahir"
                      type="date"
                      value={editData.tanggalLahir || ''}
                      onChange={(e) => handleChange('tanggalLahir', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-nik">NIK</Label>
                    <Input
                      id="edit-nik"
                      value={editData.nik || ''}
                      onChange={(e) => handleChange('nik', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-agama">Agama</Label>
                    <Select value={editData.agama || ''} onValueChange={(v) => handleChange('agama', v)}>
                      <SelectTrigger id="edit-agama">
                        <SelectValue placeholder="Pilih Agama" />
                      </SelectTrigger>
                      <SelectContent>
                        {AGAMA_OPTIONS.map((a) => (
                          <SelectItem key={a} value={a}>
                            {a}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 2: Alamat & Kontak */}
              <div>
                <h3 className="text-sm font-bold pb-2 border-b">Alamat & Kontak</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="edit-alamat">Alamat</Label>
                    <Input
                      id="edit-alamat"
                      value={editData.alamat || ''}
                      onChange={(e) => handleChange('alamat', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-rt">RT</Label>
                    <Input
                      id="edit-rt"
                      value={editData.rt || ''}
                      onChange={(e) => handleChange('rt', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-rw">RW</Label>
                    <Input
                      id="edit-rw"
                      value={editData.rw || ''}
                      onChange={(e) => handleChange('rw', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-dusun">Dusun</Label>
                    <Input
                      id="edit-dusun"
                      value={editData.dusun || ''}
                      onChange={(e) => handleChange('dusun', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-kelurahan">Kelurahan</Label>
                    <Input
                      id="edit-kelurahan"
                      value={editData.kelurahan || ''}
                      onChange={(e) => handleChange('kelurahan', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-kecamatan">Kecamatan</Label>
                    <Input
                      id="edit-kecamatan"
                      value={editData.kecamatan || ''}
                      onChange={(e) => handleChange('kecamatan', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-kodePos">Kode Pos</Label>
                    <Input
                      id="edit-kodePos"
                      value={editData.kodePos || ''}
                      onChange={(e) => handleChange('kodePos', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-jenisTinggal">Jenis Tinggal</Label>
                    <Input
                      id="edit-jenisTinggal"
                      value={editData.jenisTinggal || ''}
                      onChange={(e) => handleChange('jenisTinggal', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-alatTransportasi">Alat Transportasi</Label>
                    <Input
                      id="edit-alatTransportasi"
                      value={editData.alatTransportasi || ''}
                      onChange={(e) => handleChange('alatTransportasi', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-telepon">Telepon</Label>
                    <Input
                      id="edit-telepon"
                      value={editData.telepon || ''}
                      onChange={(e) => handleChange('telepon', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-hp">HP</Label>
                    <Input
                      id="edit-hp"
                      value={editData.hp || ''}
                      onChange={(e) => handleChange('hp', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editData.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Data Orang Tua */}
              <div>
                <h3 className="text-sm font-bold pb-2 border-b">Data Orang Tua</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-namaAyah">Nama Ayah</Label>
                    <Input
                      id="edit-namaAyah"
                      value={editData.namaAyah || ''}
                      onChange={(e) => handleChange('namaAyah', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-ayahTahunLahir">Ayah Tahun Lahir</Label>
                    <Input
                      id="edit-ayahTahunLahir"
                      value={editData.ayahTahunLahir || ''}
                      onChange={(e) => handleChange('ayahTahunLahir', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-ayahJenjangPendidikan">Ayah Jenjang Pendidikan</Label>
                    <Input
                      id="edit-ayahJenjangPendidikan"
                      value={editData.ayahJenjangPendidikan || ''}
                      onChange={(e) => handleChange('ayahJenjangPendidikan', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-ayahPekerjaan">Ayah Pekerjaan</Label>
                    <Input
                      id="edit-ayahPekerjaan"
                      value={editData.ayahPekerjaan || ''}
                      onChange={(e) => handleChange('ayahPekerjaan', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-namaIbu">Nama Ibu</Label>
                    <Input
                      id="edit-namaIbu"
                      value={editData.namaIbu || ''}
                      onChange={(e) => handleChange('namaIbu', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-ibuTahunLahir">Ibu Tahun Lahir</Label>
                    <Input
                      id="edit-ibuTahunLahir"
                      value={editData.ibuTahunLahir || ''}
                      onChange={(e) => handleChange('ibuTahunLahir', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-ibuJenjangPendidikan">Ibu Jenjang Pendidikan</Label>
                    <Input
                      id="edit-ibuJenjangPendidikan"
                      value={editData.ibuJenjangPendidikan || ''}
                      onChange={(e) => handleChange('ibuJenjangPendidikan', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-ibuPekerjaan">Ibu Pekerjaan</Label>
                    <Input
                      id="edit-ibuPekerjaan"
                      value={editData.ibuPekerjaan || ''}
                      onChange={(e) => handleChange('ibuPekerjaan', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-namaWali">Nama Wali</Label>
                    <Input
                      id="edit-namaWali"
                      value={editData.namaWali || ''}
                      onChange={(e) => handleChange('namaWali', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-waliTahunLahir">Wali Tahun Lahir</Label>
                    <Input
                      id="edit-waliTahunLahir"
                      value={editData.waliTahunLahir || ''}
                      onChange={(e) => handleChange('waliTahunLahir', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-waliJenjangPendidikan">Wali Jenjang Pendidikan</Label>
                    <Input
                      id="edit-waliJenjangPendidikan"
                      value={editData.waliJenjangPendidikan || ''}
                      onChange={(e) => handleChange('waliJenjangPendidikan', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-waliPekerjaan">Wali Pekerjaan</Label>
                    <Input
                      id="edit-waliPekerjaan"
                      value={editData.waliPekerjaan || ''}
                      onChange={(e) => handleChange('waliPekerjaan', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Data Sekolah */}
              <div>
                <h3 className="text-sm font-bold pb-2 border-b">Data Sekolah</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-rombel">Rombel</Label>
                    <Select value={editData.rombel || ''} onValueChange={(v) => handleChange('rombel', v)}>
                      <SelectTrigger id="edit-rombel">
                        <SelectValue placeholder="Pilih Rombel" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROMBEL_OPTIONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-kebutuhanKhusus">Kebutuhan Khusus</Label>
                    <Input
                      id="edit-kebutuhanKhusus"
                      value={editData.kebutuhanKhusus || ''}
                      onChange={(e) => handleChange('kebutuhanKhusus', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-sekolahAsal">Sekolah Asal</Label>
                    <Input
                      id="edit-sekolahAsal"
                      value={editData.sekolahAsal || ''}
                      onChange={(e) => handleChange('sekolahAsal', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select value={editData.status || ''} onValueChange={(v) => handleChange('status', v)}>
                      <SelectTrigger id="edit-status">
                        <SelectValue placeholder="Pilih Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aktif">Aktif</SelectItem>
                        <SelectItem value="Tidak Aktif">Tidak Aktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
              disabled={editMutation.isPending}
            >
              Batal
            </Button>
            <Button
              onClick={() => editMutation.mutate()}
              disabled={editMutation.isPending || !editData.nama?.trim()}
            >
              {editMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}