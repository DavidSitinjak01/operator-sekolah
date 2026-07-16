'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/store/app'

// --- Types ---
interface Siswa {
  id: string
  nis: string
  nama: string
  kelas: string
  jenisKelamin: string
  tempatLahir: string
  tanggalLahir: string
  alamat: string
  namaOrtu: string
  noTelpOrtu: string
  status: string
  tahunPelajaran: string
  semester: string
}

interface SiswaResponse {
  data: Siswa[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// --- Constants ---
const KELAS_OPTIONS = ['VII-A', 'VII-B', 'VIII-A', 'VIII-B', 'IX-A', 'IX-B'] as const
const STATUS_OPTIONS = ['Aktif', 'Nonaktif'] as const
const ITEMS_PER_PAGE = 10

const QUERY_KEY = ['siswa']

const initialFormState = {
  id: '',
  nis: '',
  nama: '',
  kelas: '',
  jenisKelamin: '',
  tempatLahir: '',
  tanggalLahir: '',
  alamat: '',
  namaOrtu: '',
  noTelpOrtu: '',
  status: 'Aktif',
  tahunPelajaran: '2025/2026',
  semester: 'Ganjil',
}

// --- Helper: format date ---
function formatTanggal(dateStr: string): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// --- Skeleton Table ---
function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}

// --- Main Component ---
export default function SiswaPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { tahunPelajaran, semester } = useAppStore()

  // Filter states
  const [search, setSearch] = React.useState('')
  const [filterKelas, setFilterKelas] = React.useState('')
  const [filterStatus, setFilterStatus] = React.useState('')
  const [page, setPage] = React.useState(1)

  // Dialog states
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Siswa | null>(null)
  const [isEditing, setIsEditing] = React.useState(false)

  // Form state
  const [form, setForm] = React.useState({ ...initialFormState })

  // --- Query: Fetch students ---
  const { data, isLoading, isError } = useQuery<SiswaResponse>({
    queryKey: [...QUERY_KEY, search, filterKelas, filterStatus, page, tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterKelas) params.set('kelas', filterKelas)
      if (filterStatus) params.set('status', filterStatus)
      params.set('page', page.toString())
      params.set('limit', ITEMS_PER_PAGE.toString())
      params.set('tahunPelajaran', tahunPelajaran)
      params.set('semester', semester)

      const res = await fetch(`/api/siswa?${params.toString()}`)
      if (!res.ok) throw new Error('Gagal memuat data siswa')
      return res.json()
    },
  })

  // --- Mutation: Create / Update ---
  const saveMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const isUpdate = !!payload.id
      const res = await fetch('/api/siswa', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(isUpdate ? 'Gagal mengupdate siswa' : 'Gagal menambah siswa')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({
        title: isEditing ? 'Berhasil Diupdate' : 'Berhasil Ditambahkan',
        description: isEditing
          ? 'Data siswa berhasil diperbarui.'
          : 'Siswa baru berhasil ditambahkan.',
      })
      closeFormDialog()
    },
    onError: () => {
      toast({
        title: 'Terjadi Kesalahan',
        description: isEditing
          ? 'Gagal mengupdate data siswa. Silakan coba lagi.'
          : 'Gagal menambah siswa baru. Silakan coba lagi.',
        variant: 'destructive',
      })
    },
  })

  // --- Mutation: Delete ---
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/siswa?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus siswa')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({
        title: 'Berhasil Dihapus',
        description: 'Data siswa berhasil dihapus.',
      })
      setIsDeleteOpen(false)
      setDeleteTarget(null)
    },
    onError: () => {
      toast({
        title: 'Terjadi Kesalahan',
        description: 'Gagal menghapus siswa. Silakan coba lagi.',
        variant: 'destructive',
      })
    },
  })

  // --- Handlers ---
  function openAddDialog() {
    setForm({
      ...initialFormState,
      tahunPelajaran: useAppStore.getState().tahunPelajaran,
      semester: useAppStore.getState().semester,
    })
    setIsEditing(false)
    setIsFormOpen(true)
  }

  function openEditDialog(siswa: Siswa) {
    setForm({
      id: siswa.id,
      nis: siswa.nis,
      nama: siswa.nama,
      kelas: siswa.kelas,
      jenisKelamin: siswa.jenisKelamin,
      tempatLahir: siswa.tempatLahir || '',
      tanggalLahir: siswa.tanggalLahir ? siswa.tanggalLahir.split('T')[0] : '',
      alamat: siswa.alamat || '',
      namaOrtu: siswa.namaOrtu || '',
      noTelpOrtu: siswa.noTelpOrtu || '',
      status: siswa.status,
      tahunPelajaran: siswa.tahunPelajaran || '',
      semester: siswa.semester || '',
    })
    setIsEditing(true)
    setIsFormOpen(true)
  }

  function openDeleteDialog(siswa: Siswa) {
    setDeleteTarget(siswa)
    setIsDeleteOpen(true)
  }

  function closeFormDialog() {
    setIsFormOpen(false)
    setForm({ ...initialFormState })
    setIsEditing(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nis.trim() || !form.nama.trim()) {
      toast({
        title: 'Validasi Gagal',
        description: 'NIS dan Nama Lengkap wajib diisi.',
        variant: 'destructive',
      })
      return
    }
    saveMutation.mutate(form)
  }

  function handleDelete() {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id)
    }
  }

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1)
  }, [search, filterKelas, filterStatus])

  const siswaList = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <section className="w-full max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Siswa</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola data siswa sekolah
          </p>
        </div>
        <Button onClick={openAddDialog} className="w-full sm:w-auto">
          <UserPlus className="size-4 mr-2" />
          Tambah Siswa
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama atau NIS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterKelas} onValueChange={(val) => setFilterKelas(val === '__all__' ? '' : val)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Semua Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Semua Kelas</SelectItem>
                {KELAS_OPTIONS.map((k) => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val === '__all__' ? '' : val)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Semua Status</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : isError ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Gagal memuat data siswa. Silakan coba lagi.</p>
            </div>
          ) : siswaList.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Belum ada data siswa.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead>NIS</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Jenis Kelamin</TableHead>
                    <TableHead>Tempat/Tgl Lahir</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {siswaList.map((siswa, idx) => (
                    <TableRow key={siswa.id}>
                      <TableCell className="text-center">
                        {(page - 1) * ITEMS_PER_PAGE + idx + 1}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{siswa.nis}</TableCell>
                      <TableCell className="font-medium">{siswa.nama}</TableCell>
                      <TableCell>{siswa.kelas}</TableCell>
                      <TableCell>{siswa.jenisKelamin}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {siswa.tempatLahir && siswa.tanggalLahir
                          ? `${siswa.tempatLahir}, ${formatTanggal(siswa.tanggalLahir)}`
                          : siswa.tempatLahir || siswa.tanggalLahir
                            ? siswa.tempatLahir || formatTanggal(siswa.tanggalLahir)
                            : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            'border-transparent font-medium',
                            siswa.status === 'Aktif'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          )}
                        >
                          {siswa.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openEditDialog(siswa)}
                            title="Edit"
                          >
                            <Pencil className="size-4" />
                            <span className="sr-only">Edit {siswa.nama}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(siswa)}
                            title="Hapus"
                          >
                            <Trash2 className="size-4" />
                            <span className="sr-only">Hapus {siswa.nama}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Menampilkan {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, data.total)} dari {data.total} siswa
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4 mr-1" />
                Sebelumnya
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Halaman {page} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Selanjutnya
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ===== Add / Edit Dialog ===== */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) closeFormDialog() }}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Siswa' : 'Tambah Siswa Baru'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Ubah data siswa di bawah ini.'
                : 'Isi data siswa baru di bawah ini.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row: NIS + Nama */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nis">
                  NIS <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nis"
                  placeholder="Masukkan NIS"
                  value={form.nis}
                  onChange={(e) => setForm((f) => ({ ...f, nis: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama">
                  Nama Lengkap <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nama"
                  placeholder="Masukkan nama lengkap"
                  value={form.nama}
                  onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Row: Kelas + Jenis Kelamin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select value={form.kelas} onValueChange={(val) => setForm((f) => ({ ...f, kelas: val }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {KELAS_OPTIONS.map((k) => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jenis Kelamin</Label>
                <Select value={form.jenisKelamin} onValueChange={(val) => setForm((f) => ({ ...f, jenisKelamin: val }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row: Tempat Lahir + Tanggal Lahir */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tempatLahir">Tempat Lahir</Label>
                <Input
                  id="tempatLahir"
                  placeholder="Masukkan tempat lahir"
                  value={form.tempatLahir}
                  onChange={(e) => setForm((f) => ({ ...f, tempatLahir: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                <Input
                  id="tanggalLahir"
                  type="date"
                  value={form.tanggalLahir}
                  onChange={(e) => setForm((f) => ({ ...f, tanggalLahir: e.target.value }))}
                />
              </div>
            </div>

            {/* Alamat */}
            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Textarea
                id="alamat"
                placeholder="Masukkan alamat lengkap"
                value={form.alamat}
                onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Row: Nama Ortu + No Telp Ortu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="namaOrtu">Nama Orang Tua/Wali</Label>
                <Input
                  id="namaOrtu"
                  placeholder="Masukkan nama orang tua/wali"
                  value={form.namaOrtu}
                  onChange={(e) => setForm((f) => ({ ...f, namaOrtu: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="noTelpOrtu">No. Telepon Ortu</Label>
                <Input
                  id="noTelpOrtu"
                  placeholder="Masukkan no. telepon"
                  value={form.noTelpOrtu}
                  onChange={(e) => setForm((f) => ({ ...f, noTelpOrtu: e.target.value }))}
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(val) => setForm((f) => ({ ...f, status: val }))}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={closeFormDialog}>
                Batal
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? 'Menyimpan...'
                  : isEditing
                    ? 'Simpan Perubahan'
                    : 'Tambah Siswa'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Confirmation ===== */}
      <AlertDialog open={isDeleteOpen} onOpenChange={(open) => { if (!open) { setIsDeleteOpen(false); setDeleteTarget(null) } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Siswa</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data siswa{' '}
              <span className="font-semibold text-foreground">{deleteTarget?.nama}</span>?
              Tindakan ini tidak dapat dibatalkan.
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
    </section>
  )
}