'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UserMinus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/store/app'

// ── Types ────────────────────────────────────────────────────────────────────

interface MutasiKeluar {
  id: string
  namaSiswa: string
  nis: string
  tujuanSekolah: string
  kelas: string
  tanggalKeluar: string
  alasanMutasi: string
  noSuratMutasi: string
  tahunPelajaran: string
  semester: string
}

interface PaginatedResponse {
  data: MutasiKeluar[]
  total: number
  page: number
  limit: number
  totalPages: number
}

type FormData = Omit<MutasiKeluar, 'id'>

const INITIAL_FORM: FormData = {
  namaSiswa: '',
  nis: '',
  tujuanSekolah: '',
  kelas: '',
  tanggalKeluar: '',
  alasanMutasi: '',
  noSuratMutasi: '',
  tahunPelajaran: '2025/2026',
  semester: 'Ganjil',
}

const KELAS_OPTIONS = ['VII-A', 'VII-B', 'VIII-A', 'VIII-B', 'IX-A', 'IX-B'] as const

const LIMIT = 10

// ── Component ────────────────────────────────────────────────────────────────

export default function MutasiKeluarPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { tahunPelajaran, semester } = useAppStore()

  // ── State ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Dialog state
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<MutasiKeluar | null>(null)

  // ── Debounced search ──────────────────────────────────────────────────────
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value)
      const timeout = setTimeout(() => {
        setDebouncedSearch(value)
        setPage(1)
      }, 300)
      return () => clearTimeout(timeout)
    },
    [],
  )

  // ── API: Fetch ────────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery<PaginatedResponse>({
    queryKey: ['mutasi-keluar', debouncedSearch, page, tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: debouncedSearch,
        page: String(page),
        limit: String(LIMIT),
      })
      params.set('tahunPelajaran', tahunPelajaran)
      params.set('semester', semester)
      const res = await fetch(`/api/mutasi-keluar?${params}`)
      if (!res.ok) throw new Error('Gagal memuat data mutasi keluar')
      return res.json()
    },
  })

  // ── API: Create / Update ──────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (payload: FormData & { id?: string }) => {
      const isEdit = !!payload.id
      const { id, ...body } = payload
      const res = await fetch('/api/mutasi-keluar', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id, ...body } : body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Gagal menyimpan data')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mutasi-keluar'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Berhasil', description: 'Data mutasi keluar berhasil disimpan' })
      closeFormDialog()
    },
    onError: (err) => {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' })
    },
  })

  // ── API: Delete ───────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/mutasi-keluar?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Gagal menghapus data')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mutasi-keluar'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Berhasil', description: 'Data mutasi keluar berhasil dihapus' })
      setDeleteOpen(false)
      setDeletingItem(null)
    },
    onError: (err) => {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' })
    },
  })

  // ── Form helpers ──────────────────────────────────────────────────────────
  const openAddDialog = () => {
    setEditingId(null)
    setForm({
      ...INITIAL_FORM,
      tahunPelajaran: useAppStore.getState().tahunPelajaran,
      semester: useAppStore.getState().semester,
    })
    setFormErrors({})
    setFormOpen(true)
  }

  const openEditDialog = (item: MutasiKeluar) => {
    setEditingId(item.id)
    setForm({
      namaSiswa: item.namaSiswa,
      nis: item.nis,
      tujuanSekolah: item.tujuanSekolah,
      kelas: item.kelas,
      tanggalKeluar: item.tanggalKeluar,
      alasanMutasi: item.alasanMutasi,
      noSuratMutasi: item.noSuratMutasi,
      tahunPelajaran: item.tahunPelajaran,
      semester: item.semester,
    })
    setFormErrors({})
    setFormOpen(true)
  }

  const closeFormDialog = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(INITIAL_FORM)
    setFormErrors({})
  }

  const validate = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {}
    if (!form.namaSiswa.trim()) errors.namaSiswa = 'Nama siswa wajib diisi'
    if (!form.nis.trim()) errors.nis = 'NIS wajib diisi'
    if (!form.tujuanSekolah.trim()) errors.tujuanSekolah = 'Tujuan sekolah wajib diisi'
    if (!form.kelas) errors.kelas = 'Kelas wajib dipilih'
    if (!form.tanggalKeluar) errors.tanggalKeluar = 'Tanggal keluar wajib diisi'
    if (!form.alasanMutasi.trim()) errors.alasanMutasi = 'Alasan mutasi wajib diisi'
    if (!form.noSuratMutasi.trim()) errors.noSuratMutasi = 'No. surat mutasi wajib diisi'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    saveMutation.mutate(editingId ? { id: editingId, ...form } : form)
  }

  const confirmDelete = (item: MutasiKeluar) => {
    setDeletingItem(item)
    setDeleteOpen(true)
  }

  const handleDelete = () => {
    if (deletingItem) {
      deleteMutation.mutate(deletingItem.id)
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const startIndex = (page - 1) * LIMIT

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mutasi Keluar</h1>
          <p className="text-muted-foreground text-sm">
            Kelola data siswa yang mutasi keluar dari sekolah
          </p>
        </div>
        <Button onClick={openAddDialog} className="shrink-0">
          <UserMinus className="mr-2 size-4" />
          Tambah Mutasi Keluar
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Cari nama, NIS, atau tujuan sekolah..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Daftar Mutasi Keluar</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Loading skeleton */}
          {isLoading && <TableSkeleton />}

          {/* Error state */}
          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <p className="text-muted-foreground text-sm">
                Gagal memuat data. Silakan coba lagi.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ['mutasi-keluar'] })
                }
              >
                Coba Lagi
              </Button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && data?.data.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <UserMinus className="text-muted-foreground size-10" />
              <p className="text-muted-foreground text-sm">
                {debouncedSearch
                  ? 'Tidak ada data yang cocok dengan pencarian.'
                  : 'Belum ada data mutasi keluar.'}
              </p>
            </div>
          )}

          {/* Data table */}
          {!isLoading && !isError && data && data.data.length > 0 && (
            <>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">No</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>NIS</TableHead>
                      <TableHead className="hidden md:table-cell">Tujuan Sekolah</TableHead>
                      <TableHead className="hidden sm:table-cell">Kelas</TableHead>
                      <TableHead className="hidden lg:table-cell">Tgl Keluar</TableHead>
                      <TableHead className="hidden lg:table-cell">No. Surat</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center">{startIndex + idx + 1}</TableCell>
                        <TableCell className="font-medium">{item.namaSiswa}</TableCell>
                        <TableCell>{item.nis}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {item.tujuanSekolah}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{item.kelas}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {formatDate(item.tanggalKeluar)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {item.noSuratMutasi}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => openEditDialog(item)}
                              aria-label="Edit"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:text-destructive"
                              onClick={() => confirmDelete(item)}
                              aria-label="Hapus"
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
              {data.totalPages > 1 && (
                <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                  <p className="text-muted-foreground text-xs">
                    Halaman {data.page} dari {data.totalPages} &middot; Total {data.total} data
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={page <= 1}
                      onClick={() => setPage(1)}
                      aria-label="Halaman pertama"
                    >
                      <ChevronsLeft className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      aria-label="Halaman sebelumnya"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>

                    {generatePageNumbers(page, data.totalPages).map((p, i) =>
                      p === '...' ? (
                        <span
                          key={`ellipsis-${i}`}
                          className="flex size-8 items-center justify-center text-xs text-muted-foreground"
                        >
                          ...
                        </span>
                      ) : (
                        <Button
                          key={p}
                          variant={page === p ? 'default' : 'outline'}
                          size="icon"
                          className="size-8"
                          onClick={() => setPage(p as number)}
                        >
                          {p}
                        </Button>
                      ),
                    )}

                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={page >= data.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      aria-label="Halaman berikutnya"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={page >= data.totalPages}
                      onClick={() => setPage(data.totalPages)}
                      aria-label="Halaman terakhir"
                    >
                      <ChevronsRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => !open && closeFormDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Mutasi Keluar' : 'Tambah Mutasi Keluar'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Ubah data mutasi keluar siswa.'
                : 'Isi formulir untuk menambahkan data mutasi keluar baru.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Nama Siswa */}
            <div className="grid gap-2">
              <Label htmlFor="namaSiswa">
                Nama Siswa <span className="text-destructive">*</span>
              </Label>
              <Input
                id="namaSiswa"
                placeholder="Masukkan nama siswa"
                value={form.namaSiswa}
                onChange={(e) => setForm((f) => ({ ...f, namaSiswa: e.target.value }))}
                aria-invalid={!!formErrors.namaSiswa}
              />
              {formErrors.namaSiswa && (
                <p className="text-destructive text-xs">{formErrors.namaSiswa}</p>
              )}
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
                onChange={(e) => setForm((f) => ({ ...f, nis: e.target.value }))}
                aria-invalid={!!formErrors.nis}
              />
              {formErrors.nis && (
                <p className="text-destructive text-xs">{formErrors.nis}</p>
              )}
            </div>

            {/* Tujuan Sekolah */}
            <div className="grid gap-2">
              <Label htmlFor="tujuanSekolah">
                Tujuan Sekolah <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tujuanSekolah"
                placeholder="Masukkan tujuan sekolah"
                value={form.tujuanSekolah}
                onChange={(e) => setForm((f) => ({ ...f, tujuanSekolah: e.target.value }))}
                aria-invalid={!!formErrors.tujuanSekolah}
              />
              {formErrors.tujuanSekolah && (
                <p className="text-destructive text-xs">{formErrors.tujuanSekolah}</p>
              )}
            </div>

            {/* Kelas */}
            <div className="grid gap-2">
              <Label htmlFor="kelas">
                Kelas <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.kelas}
                onValueChange={(val) => setForm((f) => ({ ...f, kelas: val }))}
              >
                <SelectTrigger id="kelas" className="w-full" aria-invalid={!!formErrors.kelas}>
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
              {formErrors.kelas && (
                <p className="text-destructive text-xs">{formErrors.kelas}</p>
              )}
            </div>

            {/* Tanggal Keluar */}
            <div className="grid gap-2">
              <Label htmlFor="tanggalKeluar">
                Tanggal Keluar <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tanggalKeluar"
                type="date"
                value={form.tanggalKeluar}
                onChange={(e) => setForm((f) => ({ ...f, tanggalKeluar: e.target.value }))}
                aria-invalid={!!formErrors.tanggalKeluar}
              />
              {formErrors.tanggalKeluar && (
                <p className="text-destructive text-xs">{formErrors.tanggalKeluar}</p>
              )}
            </div>

            {/* Alasan Mutasi */}
            <div className="grid gap-2">
              <Label htmlFor="alasanMutasi">
                Alasan Mutasi <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="alasanMutasi"
                placeholder="Masukkan alasan mutasi"
                rows={3}
                value={form.alasanMutasi}
                onChange={(e) => setForm((f) => ({ ...f, alasanMutasi: e.target.value }))}
                aria-invalid={!!formErrors.alasanMutasi}
              />
              {formErrors.alasanMutasi && (
                <p className="text-destructive text-xs">{formErrors.alasanMutasi}</p>
              )}
            </div>

            {/* No. Surat Mutasi */}
            <div className="grid gap-2">
              <Label htmlFor="noSuratMutasi">
                No. Surat Mutasi <span className="text-destructive">*</span>
              </Label>
              <Input
                id="noSuratMutasi"
                placeholder="Masukkan nomor surat mutasi"
                value={form.noSuratMutasi}
                onChange={(e) => setForm((f) => ({ ...f, noSuratMutasi: e.target.value }))}
                aria-invalid={!!formErrors.noSuratMutasi}
              />
              {formErrors.noSuratMutasi && (
                <p className="text-destructive text-xs">{formErrors.noSuratMutasi}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeFormDialog} disabled={saveMutation.isPending}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editingId ? 'Simpan Perubahan' : 'Tambah Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Mutasi Keluar?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data mutasi keluar atas nama{' '}
              <span className="font-semibold">{deletingItem?.namaSiswa}</span>? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="hidden h-4 w-40 md:block" />
          <Skeleton className="hidden h-4 w-16 sm:block" />
          <Skeleton className="hidden h-4 w-28 lg:block" />
          <Skeleton className="hidden h-4 w-28 lg:block" />
          <div className="ml-auto flex gap-1">
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="size-8 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Pagination helper ────────────────────────────────────────────────────────

function generatePageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = []

  if (current <= 3) {
    pages.push(1, 2, 3, 4, '...', total)
  } else if (current >= total - 2) {
    pages.push(1, '...', total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total)
  }

  return pages
}