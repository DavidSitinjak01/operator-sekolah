'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, ChevronLeft, ChevronRight, GraduationCap, FileSpreadsheet, Pencil, Loader2 } from 'lucide-react';

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/app';
import ImportExcelDialog from '@/components/ImportExcelDialog';
import ExportButton from '@/components/ExportButton';
import { GURU_COLUMNS } from '@/lib/export-utils';

// ---------- Types ----------
interface Guru {
  id: string;
  no: string;
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
  rt: string;
  rw: string;
  namaDusun: string;
  desaKelurahan: string;
  kecamatan: string;
  kodePos: string;
  telepon: string;
  hp: string;
  email: string;
  tugasTambahan: string;
  skCPNS: string;
  tanggalCPNS: string;
  skPengangkatan: string;
  tmtPengangkatan: string;
  lembagaPengangkatan: string;
  pangkatGolongan: string;
  sumberGaji: string;
  namaIbuKandung: string;
  statusPerkawinan: string;
  namaSuamiIstri: string;
  nipSuamiIstri: string;
  pekerjaanSuamiIstri: string;
  kewarganegaraan: string;
  nik: string;
  noKK: string;
  karpeg: string;
  karisKarsu: string;
  lintang: string;
  bujur: string;
  nuks: string;
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

// ---------- Helper: convert Guru to flat Record<string, string> ----------
function guruToRecord(guru: Guru): Record<string, string> {
  return {
    no: guru.no ?? '',
    nama: guru.nama ?? '',
    nuptk: guru.nuptk ?? '',
    jenisKelamin: guru.jenisKelamin ?? '',
    tempatLahir: guru.tempatLahir ?? '',
    tanggalLahir: guru.tanggalLahir ?? '',
    nip: guru.nip ?? '',
    nik: guru.nik ?? '',
    agama: guru.agama ?? '',
    status: guru.status ?? '',
    kewarganegaraan: guru.kewarganegaraan ?? '',
    alamat: guru.alamat ?? '',
    rt: guru.rt ?? '',
    rw: guru.rw ?? '',
    namaDusun: guru.namaDusun ?? '',
    desaKelurahan: guru.desaKelurahan ?? '',
    kecamatan: guru.kecamatan ?? '',
    kodePos: guru.kodePos ?? '',
    telepon: guru.telepon ?? '',
    hp: guru.hp ?? '',
    email: guru.email ?? '',
    statusKepegawaian: guru.statusKepegawaian ?? '',
    jenisPTK: guru.jenisPTK ?? '',
    tugasTambahan: guru.tugasTambahan ?? '',
    pangkatGolongan: guru.pangkatGolongan ?? '',
    sumberGaji: guru.sumberGaji ?? '',
    skCPNS: guru.skCPNS ?? '',
    tanggalCPNS: guru.tanggalCPNS ?? '',
    skPengangkatan: guru.skPengangkatan ?? '',
    tmtPengangkatan: guru.tmtPengangkatan ?? '',
    lembagaPengangkatan: guru.lembagaPengangkatan ?? '',
    tmtPNS: guru.tahunPelajaran ?? '',
    namaIbuKandung: guru.namaIbuKandung ?? '',
    statusPerkawinan: guru.statusPerkawinan ?? '',
    namaSuamiIstri: guru.namaSuamiIstri ?? '',
    nipSuamiIstri: guru.nipSuamiIstri ?? '',
    pekerjaanSuamiIstri: guru.pekerjaanSuamiIstri ?? '',
  };
}

// ---------- Component ----------
export default function GuruPage() {
  const { tahunPelajaran, semester } = useAppStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rombelFilter, setRombelFilter] = useState<string>('all');
  const limit = 10;

  const [deleteTarget, setDeleteTarget] = useState<Guru | null>(null);
  const [editTarget, setEditTarget] = useState<Guru | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // ---------- Sync editData when editTarget changes ----------
  useEffect(() => {
    if (editTarget) {
      setEditData(guruToRecord(editTarget));
    }
  }, [editTarget]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ---------- Fetch guru data ----------
  const { data, isLoading, isError } = useQuery<GuruResponse>({
    queryKey: ['guru', debouncedSearch, page, tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      params.set('tahunPelajaran', tahunPelajaran);
      params.set('semester', semester);
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      const res = await fetch(`/api/guru?${params}`);
      if (!res.ok) throw new Error('Gagal memuat data guru');
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  // ---------- Fetch unique rombel values (lightweight endpoint) ----------
  const { data: rombelOptions } = useQuery<string[]>({
    queryKey: ['rombel', tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams({ tahunPelajaran, semester });
      const res = await fetch(`/api/siswa/rombel?${params}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60_000, // rombel values rarely change
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

  // ---------- Generic edit change handler ----------
  const handleChange = (key: string, value: string) =>
    setEditData((prev) => ({ ...prev, [key]: value }));

  // ---------- Save handler ----------
  const handleSave = async () => {
    if (!editTarget) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/guru', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editTarget.id, ...editData }),
      });
      if (!res.ok) throw new Error('Gagal menyimpan data guru');
      toast({ title: 'Berhasil', description: 'Data guru berhasil diperbarui.' });
      queryClient.invalidateQueries({ queryKey: ['guru'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setEditTarget(null);
    } catch {
      toast({
        title: 'Gagal',
        description: 'Terjadi kesalahan saat menyimpan data guru.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ---------- Render helpers for edit form fields ----------
  const renderInput = (label: string, key: string, required?: boolean) => (
    <div className="space-y-1.5">
      <Label htmlFor={`edit-${key}`} className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={`edit-${key}`}
        value={editData[key] ?? ''}
        onChange={(e) => handleChange(key, e.target.value)}
        className="h-9 text-sm"
      />
    </div>
  );

  const renderSelect = (label: string, key: string, options: string[]) => (
    <div className="space-y-1.5">
      <Label htmlFor={`edit-${key}`} className="text-sm font-medium">
        {label}
      </Label>
      <Select
        value={editData[key] ?? ''}
        onValueChange={(val) => handleChange(key, val)}
      >
        <SelectTrigger id={`edit-${key}`} className="h-9 text-sm">
          <SelectValue placeholder={`Pilih ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderSection = (title: string, children: React.ReactNode) => (
    <div className="space-y-3">
      <h3 className="text-sm font-bold border-b pb-1.5">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="flex items-center gap-2">
          <ExportButton
            title="Laporan Data Guru"
            subtitle={`Tahun Pelajaran ${tahunPelajaran} — Semester ${semester}`}
            columns={GURU_COLUMNS}
            apiUrl="/api/guru"
            filename={`Data-Guru-${tahunPelajaran}-${semester}`}
          />
          <ImportExcelDialog
            type="guru"
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['guru'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            }}
          >
            <Button variant="outline" size="sm" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Import Excel
            </Button>
          </ImportExcelDialog>
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
                    {/* 1. No — always */}
                    <TableHead className="w-12 text-center whitespace-nowrap">No</TableHead>
                    {/* 2. Nama — always */}
                    <TableHead className="min-w-[160px] whitespace-nowrap">Nama</TableHead>
                    {/* 3. NUPTK — md+ */}
                    <TableHead className="hidden min-w-[140px] md:table-cell whitespace-nowrap">NUPTK</TableHead>
                    {/* 4. JK — always */}
                    <TableHead className="w-16 text-center whitespace-nowrap">JK</TableHead>
                    {/* 5. Tempat Lahir — md+ */}
                    <TableHead className="hidden min-w-[130px] md:table-cell whitespace-nowrap">Tempat Lahir</TableHead>
                    {/* 6. Tanggal Lahir — md+ */}
                    <TableHead className="hidden min-w-[110px] md:table-cell whitespace-nowrap">Tanggal Lahir</TableHead>
                    {/* 7. NIP — sm+ */}
                    <TableHead className="hidden min-w-[140px] sm:table-cell whitespace-nowrap">NIP</TableHead>
                    {/* 8. Status Kepegawaian — md+ */}
                    <TableHead className="hidden min-w-[140px] md:table-cell whitespace-nowrap">Status Kepegawaian</TableHead>
                    {/* 9. Jenis PTK — md+ */}
                    <TableHead className="hidden min-w-[120px] md:table-cell whitespace-nowrap">Jenis PTK</TableHead>
                    {/* 10. Agama — sm+ */}
                    <TableHead className="hidden min-w-[80px] sm:table-cell whitespace-nowrap">Agama</TableHead>
                    {/* 11. Alamat — lg+ */}
                    <TableHead className="hidden min-w-[180px] lg:table-cell whitespace-nowrap">Alamat</TableHead>
                    {/* 12. RT — xl+ */}
                    <TableHead className="hidden min-w-[50px] xl:table-cell whitespace-nowrap">RT</TableHead>
                    {/* 13. RW — xl+ */}
                    <TableHead className="hidden min-w-[50px] xl:table-cell whitespace-nowrap">RW</TableHead>
                    {/* 14. Nama Dusun — xl+ */}
                    <TableHead className="hidden min-w-[120px] xl:table-cell whitespace-nowrap">Nama Dusun</TableHead>
                    {/* 15. Desa/Kelurahan — lg+ */}
                    <TableHead className="hidden min-w-[140px] lg:table-cell whitespace-nowrap">Desa/Kelurahan</TableHead>
                    {/* 16. Kecamatan — lg+ */}
                    <TableHead className="hidden min-w-[130px] lg:table-cell whitespace-nowrap">Kecamatan</TableHead>
                    {/* 17. Kode Pos — xl+ */}
                    <TableHead className="hidden min-w-[80px] xl:table-cell whitespace-nowrap">Kode Pos</TableHead>
                    {/* 18. Telepon — xl+ */}
                    <TableHead className="hidden min-w-[110px] xl:table-cell whitespace-nowrap">Telepon</TableHead>
                    {/* 19. HP — sm+ */}
                    <TableHead className="hidden min-w-[120px] sm:table-cell whitespace-nowrap">HP</TableHead>
                    {/* 20. Email — lg+ */}
                    <TableHead className="hidden min-w-[160px] lg:table-cell whitespace-nowrap">Email</TableHead>
                    {/* 21. Tugas Tambahan — md+ */}
                    <TableHead className="hidden min-w-[180px] md:table-cell whitespace-nowrap">Tugas Tambahan</TableHead>
                    {/* 22. SK CPNS — xl+ */}
                    <TableHead className="hidden min-w-[140px] xl:table-cell whitespace-nowrap">SK CPNS</TableHead>
                    {/* 23. Tanggal CPNS — xl+ */}
                    <TableHead className="hidden min-w-[110px] xl:table-cell whitespace-nowrap">Tanggal CPNS</TableHead>
                    {/* 24. SK Pengangkatan — xl+ */}
                    <TableHead className="hidden min-w-[140px] xl:table-cell whitespace-nowrap">SK Pengangkatan</TableHead>
                    {/* 25. TMT Pengangkatan — xl+ */}
                    <TableHead className="hidden min-w-[130px] xl:table-cell whitespace-nowrap">TMT Pengangkatan</TableHead>
                    {/* 26. Lembaga Pengangkatan — xl+ */}
                    <TableHead className="hidden min-w-[160px] xl:table-cell whitespace-nowrap">Lembaga Pengangkatan</TableHead>
                    {/* 27. Pangkat/Golongan — lg+ */}
                    <TableHead className="hidden min-w-[130px] lg:table-cell whitespace-nowrap">Pangkat/Golongan</TableHead>
                    {/* 28. Sumber Gaji — lg+ */}
                    <TableHead className="hidden min-w-[120px] lg:table-cell whitespace-nowrap">Sumber Gaji</TableHead>
                    {/* 29. Nama Ibu Kandung — xl+ */}
                    <TableHead className="hidden min-w-[160px] xl:table-cell whitespace-nowrap">Nama Ibu Kandung</TableHead>
                    {/* 30. Status Perkawinan — lg+ */}
                    <TableHead className="hidden min-w-[130px] lg:table-cell whitespace-nowrap">Status Perkawinan</TableHead>
                    {/* 31. Nama Suami/Istri — xl+ */}
                    <TableHead className="hidden min-w-[160px] xl:table-cell whitespace-nowrap">Nama Suami/Istri</TableHead>
                    {/* 32. NIP Suami/Istri — xl+ */}
                    <TableHead className="hidden min-w-[140px] xl:table-cell whitespace-nowrap">NIP Suami/Istri</TableHead>
                    {/* 33. Pekerjaan Suami/Istri — xl+ */}
                    <TableHead className="hidden min-w-[160px] xl:table-cell whitespace-nowrap">Pekerjaan Suami/Istri</TableHead>
                    {/* 34. Kewarganegaraan — lg+ */}
                    <TableHead className="hidden min-w-[120px] lg:table-cell whitespace-nowrap">Kewarganegaraan</TableHead>
                    {/* 35. NIK — lg+ */}
                    <TableHead className="hidden min-w-[160px] lg:table-cell whitespace-nowrap">NIK</TableHead>

                    {/* Aksi — always */}
                    <TableHead className="w-[88px] text-center whitespace-nowrap">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGurus.map((guru) => (
                    <TableRow key={guru.id}>
                      {/* 1. No — always */}
                      <TableCell className="text-center text-sm text-muted-foreground whitespace-nowrap">
                        {guru.no}
                      </TableCell>
                      {/* 2. Nama — always */}
                      <TableCell className="font-medium whitespace-nowrap">{guru.nama}</TableCell>
                      {/* 3. NUPTK — md+ */}
                      <TableCell className="hidden text-sm md:table-cell whitespace-nowrap">{guru.nuptk || '-'}</TableCell>
                      {/* 4. JK — always */}
                      <TableCell className="text-center whitespace-nowrap">{guru.jenisKelamin}</TableCell>
                      {/* 5. Tempat Lahir — md+ */}
                      <TableCell className="hidden text-sm md:table-cell whitespace-nowrap">{guru.tempatLahir || '-'}</TableCell>
                      {/* 6. Tanggal Lahir — md+ */}
                      <TableCell className="hidden text-sm md:table-cell whitespace-nowrap">{guru.tanggalLahir || '-'}</TableCell>
                      {/* 7. NIP — sm+ */}
                      <TableCell className="hidden text-sm sm:table-cell whitespace-nowrap">{guru.nip || '-'}</TableCell>
                      {/* 8. Status Kepegawaian — md+ */}
                      <TableCell className="hidden text-sm md:table-cell whitespace-nowrap">
                        {guru.statusKepegawaian || '-'}
                      </TableCell>
                      {/* 9. Jenis PTK — md+ */}
                      <TableCell className="hidden text-sm md:table-cell whitespace-nowrap">
                        {guru.jenisPTK || '-'}
                      </TableCell>
                      {/* 10. Agama — sm+ */}
                      <TableCell className="hidden text-sm sm:table-cell whitespace-nowrap">{guru.agama || '-'}</TableCell>
                      {/* 11. Alamat — lg+ */}
                      <TableCell className="hidden text-sm lg:table-cell whitespace-nowrap">
                        {guru.alamat || '-'}
                      </TableCell>
                      {/* 12. RT — xl+ */}
                      <TableCell className="hidden text-sm xl:table-cell whitespace-nowrap">{guru.rt || '-'}</TableCell>
                      {/* 13. RW — xl+ */}
                      <TableCell className="hidden text-sm xl:table-cell whitespace-nowrap">{guru.rw || '-'}</TableCell>
                      {/* 14. Nama Dusun — xl+ */}
                      <TableCell className="hidden text-sm xl:table-cell whitespace-nowrap">{guru.namaDusun || '-'}</TableCell>
                      {/* 15. Desa/Kelurahan — lg+ */}
                      <TableCell className="hidden text-sm lg:table-cell whitespace-nowrap">{guru.desaKelurahan || '-'}</TableCell>
                      {/* 16. Kecamatan — lg+ */}
                      <TableCell className="hidden text-sm lg:table-cell whitespace-nowrap">{guru.kecamatan || '-'}</TableCell>
                      {/* 17. Kode Pos — xl+ */}
                      <TableCell className="hidden text-sm xl:table-cell whitespace-nowrap">{guru.kodePos || '-'}</TableCell>
                      {/* 18. Telepon — xl+ */}
                      <TableCell className="hidden text-sm xl:table-cell whitespace-nowrap">{guru.telepon || '-'}</TableCell>
                      {/* 19. HP — sm+ */}
                      <TableCell className="hidden text-sm sm:table-cell whitespace-nowrap">{guru.hp || '-'}</TableCell>
                      {/* 20. Email — lg+ */}
                      <TableCell className="hidden text-sm lg:table-cell whitespace-nowrap">{guru.email || '-'}</TableCell>
                      {/* 21. Tugas Tambahan — md+ */}
                      <TableCell className="hidden text-sm md:table-cell whitespace-nowrap">
                        {guru.tugasTambahan || '-'}
                      </TableCell>
                      {/* 22. SK CPNS — xl+ */}
                      <TableCell className="hidden text-sm xl:table-cell whitespace-nowrap">{guru.skCPNS || '-'}</TableCell>
                      {/* 23. Tanggal CPNS — xl+ */}
                      <TableCell className="hidden text-sm xl:table-cell whitespace-nowrap">{guru.tanggalCPNS || '-'}</TableCell>
                      {/* 24. SK Pengangkatan — xl+ */}
                      <TableCell className="hidden text-sm xl:table-cell whitespace-nowrap">{guru.skPengangkatan || '-'}</TableCell>
                      {/* 25. TMT Pengangkatan — xl+ */}
                      <TableCell className="hidden text-sm xl:table-cell whitespace-nowrap">{guru.tmtPengangkatan || '-'}</TableCell>
                      {/* 26. Lembaga Pengangkatan — xl+ */}
                      <TableCell className="hidden text-sm xl:table-cell whitespace-nowrap">{guru.lembagaPengangkatan || '-'}</TableCell>
                      {/* 27. Pangkat/Golongan — lg+ */}
                      <TableCell className="hidden text-sm lg:table-cell whitespace-nowrap">
                        {guru.pangkatGolongan || '-'}
                      </TableCell>
                      {/* 28. Sumber Gaji — lg+ */}
                      <TableCell className="hidden text-sm lg:table-cell whitespace-nowrap">
                        {guru.sumberGaji || '-'}
                      </TableCell>
                      {/* 29. Nama Ibu Kandung — xl+ */}
                      <TableCell className="hidden text-sm xl:table-cell whitespace-nowrap">{guru.namaIbuKandung || '-'}</TableCell>
                      {/* 30. Status Perkawinan — lg+ */}
                      <TableCell className="hidden text-sm lg:table-cell whitespace-nowrap">
                        {guru.statusPerkawinan || '-'}
                      </TableCell>
                      {/* 31. Nama Suami/Istri — xl+ */}
                      <TableCell className="hidden text-sm xl:table-cell whitespace-nowrap">{guru.namaSuamiIstri || '-'}</TableCell>
                      {/* 32. NIP Suami/Istri — xl+ */}
                      <TableCell className="hidden text-sm xl:table-cell whitespace-nowrap">{guru.nipSuamiIstri || '-'}</TableCell>
                      {/* 33. Pekerjaan Suami/Istri — xl+ */}
                      <TableCell className="hidden text-sm xl:table-cell whitespace-nowrap">{guru.pekerjaanSuamiIstri || '-'}</TableCell>
                      {/* 34. Kewarganegaraan — lg+ */}
                      <TableCell className="hidden text-sm lg:table-cell whitespace-nowrap">
                        {guru.kewarganegaraan || '-'}
                      </TableCell>
                      {/* 35. NIK — lg+ */}
                      <TableCell className="hidden text-sm lg:table-cell whitespace-nowrap">{guru.nik || '-'}</TableCell>

                      {/* Aksi — always */}
                      <TableCell className="text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                            onClick={() => setEditTarget(guru)}
                            aria-label={`Edit ${guru.nama}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeleteTarget(guru)}
                            aria-label={`Hapus ${guru.nama}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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

      {/* ---------- Edit Dialog ---------- */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Data Guru</DialogTitle>
            <DialogDescription>
              Perbarui informasi data guru di bawah ini.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pe-2">
            <div className="space-y-6 pr-4">
              {/* Section 1: Data Pribadi */}
              {renderSection('Data Pribadi', (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderInput('No', 'no')}
                  {renderInput('Nama', 'nama', true)}
                  {renderInput('NUPTK', 'nuptk')}
                  {renderSelect('JK', 'jenisKelamin', ['L', 'P'])}
                  {renderInput('Tempat Lahir', 'tempatLahir')}
                  {renderInput('Tanggal Lahir', 'tanggalLahir')}
                  {renderInput('NIP', 'nip')}
                  {renderInput('NIK', 'nik')}
                  {renderSelect('Agama', 'agama', ['Islam', 'Kristen', 'Katholik', 'Hindu', 'Buddha', 'Konghucu', 'lainnya'])}
                  {renderSelect('Status', 'status', ['Aktif', 'Tidak Aktif'])}
                  {renderInput('Kewarganegaraan', 'kewarganegaraan')}
                </div>
              ))}

              {/* Section 2: Alamat & Kontak */}
              {renderSection('Alamat & Kontak', (
                <div className="space-y-4">
                  <div className="sm:col-span-2">
                    {renderInput('Alamat', 'alamat')}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {renderInput('RT', 'rt')}
                    {renderInput('RW', 'rw')}
                    {renderInput('Nama Dusun', 'namaDusun')}
                    {renderInput('Desa/Kelurahan', 'desaKelurahan')}
                    {renderInput('Kecamatan', 'kecamatan')}
                    {renderInput('Kode Pos', 'kodePos')}
                    {renderInput('Telepon', 'telepon')}
                    {renderInput('HP', 'hp')}
                    {renderInput('Email', 'email')}
                  </div>
                </div>
              ))}

              {/* Section 3: Kepegawaian */}
              {renderSection('Kepegawaian', (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderInput('Status Kepegawaian', 'statusKepegawaian')}
                  {renderInput('Jenis PTK', 'jenisPTK')}
                  {renderInput('Tugas Tambahan', 'tugasTambahan')}
                  {renderInput('Pangkat/Golongan', 'pangkatGolongan')}
                  {renderInput('Sumber Gaji', 'sumberGaji')}
                  {renderInput('SK CPNS', 'skCPNS')}
                  {renderInput('Tanggal CPNS', 'tanggalCPNS')}
                  {renderInput('SK Pengangkatan', 'skPengangkatan')}
                  {renderInput('TMT Pengangkatan', 'tmtPengangkatan')}
                  {renderInput('Lembaga Pengangkatan', 'lembagaPengangkatan')}
                  {renderInput('TMT PNS', 'tmtPNS')}
                </div>
              ))}

              {/* Section 4: Data Keluarga */}
              {renderSection('Data Keluarga', (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderInput('Nama Ibu Kandung', 'namaIbuKandung')}
                  {renderSelect('Status Perkawinan', 'statusPerkawinan', ['Kawin', 'Belum Kawin', 'Cerai Hidup', 'Cerai Mati'])}
                  {renderInput('Nama Suami/Istri', 'namaSuamiIstri')}
                  {renderInput('NIP Suami/Istri', 'nipSuamiIstri')}
                  {renderInput('Pekerjaan Suami/Istri', 'pekerjaanSuamiIstri')}
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}