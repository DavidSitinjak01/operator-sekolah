'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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
  Eye,
  ChevronDown,
  GraduationCap,
  Phone,
  MapPin,
  Calendar,
  User,
  FileText,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/store/app'

// ── Types ────────────────────────────────────────────────────────────────────

interface SiswaOption {
  id: string
  no: string
  nama: string
  nipd: string
  nisn: string
  nik: string
  jenisKelamin: string
  tempatLahir: string
  tanggalLahir: string
  agama: string
  alamat: string
  hp: string
  namaAyah: string
  namaIbu: string
  rombel: string
  sekolahAsal: string
}

interface MutasiKeluar {
  id: string
  siswaId: string | null
  nama: string
  nipd: string
  nisn: string
  nik: string
  jenisKelamin: string
  tempatLahir: string
  tanggalLahir: string
  agama: string
  alamat: string
  hp: string
  namaAyah: string
  namaIbu: string
  rombel: string
  sekolahAsal: string
  tujuanSekolah: string
  kelas: string
  tanggalKeluar: string
  alasan: string
  noSurat: string
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

interface FormData {
  siswaId: string
  nama: string
  nipd: string
  nisn: string
  nik: string
  jenisKelamin: string
  tempatLahir: string
  tanggalLahir: string
  agama: string
  alamat: string
  hp: string
  namaAyah: string
  namaIbu: string
  rombel: string
  sekolahAsal: string
  tujuanSekolah: string
  kelas: string
  tanggalKeluar: string
  alasan: string
  noSurat: string
  tahunPelajaran: string
  semester: string
}

const INITIAL_FORM: FormData = {
  siswaId: '',
  nama: '',
  nipd: '',
  nisn: '',
  nik: '',
  jenisKelamin: '',
  tempatLahir: '',
  tanggalLahir: '',
  agama: '',
  alamat: '',
  hp: '',
  namaAyah: '',
  namaIbu: '',
  rombel: '',
  sekolahAsal: '',
  tujuanSekolah: '',
  kelas: '',
  tanggalKeluar: '',
  alasan: '',
  noSurat: '',
  tahunPelajaran: '2025/2026',
  semester: 'Ganjil',
}

// ── Component ────────────────────────────────────────────────────────────────

export default function MutasiKeluarPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { tahunPelajaran, semester } = useAppStore()

  // ── State ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Dialog state
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [selectedSiswa, setSelectedSiswa] = useState<SiswaOption | null>(null)
  const [siswaPopoverOpen, setSiswaPopoverOpen] = useState(false)
  const [siswaSearch, setSiswaSearch] = useState('')

  // Detail dialog state
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<MutasiKeluar | null>(null)

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<MutasiKeluar | null>(null)

  // ── Debounced search ──────────────────────────────────────────────────────
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    const timeout = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 300)
    return () => clearTimeout(timeout)
  }, [])

  // ── API: Fetch Siswa List ────────────────────────────────────────────────
  const { data: siswaList = [], isLoading: siswaLoading } = useQuery<SiswaOption[]>({
    queryKey: ['siswa-list', siswaSearch, tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams({
        tahunPelajaran,
        semester,
        limit: '100',
      })
      if (siswaSearch) params.set('search', siswaSearch)
      const res = await fetch(`/api/siswa/list?${params}`)
      if (!res.ok) throw new Error('Gagal memuat data siswa')
      return res.json()
    },
  })

  // ── API: Fetch Mutasi Keluar ─────────────────────────────────────────────
  const limit = pageSize === 9999 ? 9999 : pageSize
  const { data, isLoading, isError } = useQuery<PaginatedResponse>({
    queryKey: ['mutasi-keluar', debouncedSearch, page, limit, tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: debouncedSearch,
        page: String(page),
        limit: String(limit),
        tahunPelajaran,
        semester,
      })
      const res = await fetch(`/api/mutasi-keluar?${params}`)
      if (!res.ok) throw new Error('Gagal memuat data mutasi keluar')
      return res.json()
    },
  })

  // ── API: Create / Update ─────────────────────────────────────────────────
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
        throw new Error(err.error || 'Gagal menyimpan data')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mutasi-keluar'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['siswa'] })
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
        throw new Error(err.error || 'Gagal menghapus data')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mutasi-keluar'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['siswa'] })
      toast({ title: 'Berhasil', description: 'Data mutasi keluar berhasil dihapus. Status siswa dikembalikan ke Aktif.' })
      setDeleteOpen(false)
      setDeletingItem(null)
    },
    onError: (err) => {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' })
    },
  })

  // ── Siswa Selection ───────────────────────────────────────────────────────
  const handleSelectSiswa = (siswa: SiswaOption) => {
    setSelectedSiswa(siswa)
    setForm((f) => ({
      ...f,
      siswaId: siswa.id,
      nama: siswa.nama,
      nipd: siswa.nipd || '',
      nisn: siswa.nisn || '',
      nik: siswa.nik || '',
      jenisKelamin: siswa.jenisKelamin || '',
      tempatLahir: siswa.tempatLahir || '',
      tanggalLahir: siswa.tanggalLahir || '',
      agama: siswa.agama || '',
      alamat: siswa.alamat || '',
      hp: siswa.hp || '',
      namaAyah: siswa.namaAyah || '',
      namaIbu: siswa.namaIbu || '',
      rombel: siswa.rombel || '',
      sekolahAsal: siswa.sekolahAsal || '',
      kelas: siswa.rombel || f.kelas,
    }))
    setSiswaPopoverOpen(false)
  }

  const handleClearSiswa = () => {
    setSelectedSiswa(null)
    setSiswaSearch('')
    setForm((f) => ({
      ...f,
      siswaId: '',
      nama: '',
      nipd: '',
      nisn: '',
      nik: '',
      jenisKelamin: '',
      tempatLahir: '',
      tanggalLahir: '',
      agama: '',
      alamat: '',
      hp: '',
      namaAyah: '',
      namaIbu: '',
      rombel: '',
      sekolahAsal: '',
      kelas: '',
    }))
  }

  // ── Form helpers ──────────────────────────────────────────────────────────
  const openAddDialog = () => {
    setEditingId(null)
    setForm({
      ...INITIAL_FORM,
      tahunPelajaran: useAppStore.getState().tahunPelajaran,
      semester: useAppStore.getState().semester,
    })
    setSelectedSiswa(null)
    setSiswaSearch('')
    setFormErrors({})
    setFormOpen(true)
  }

  const openEditDialog = (item: MutasiKeluar) => {
    setEditingId(item.id)
    setForm({
      siswaId: item.siswaId || '',
      nama: item.nama,
      nipd: item.nipd,
      nisn: item.nisn,
      nik: item.nik,
      jenisKelamin: item.jenisKelamin,
      tempatLahir: item.tempatLahir,
      tanggalLahir: item.tanggalLahir,
      agama: item.agama,
      alamat: item.alamat,
      hp: item.hp,
      namaAyah: item.namaAyah,
      namaIbu: item.namaIbu,
      rombel: item.rombel,
      sekolahAsal: item.sekolahAsal,
      tujuanSekolah: item.tujuanSekolah,
      kelas: item.kelas,
      tanggalKeluar: item.tanggalKeluar,
      alasan: item.alasan,
      noSurat: item.noSurat,
      tahunPelajaran: item.tahunPelajaran,
      semester: item.semester,
    })
    setSelectedSiswa(item.siswaId ? {
      id: item.siswaId,
      nama: item.nama,
      nipd: item.nipd,
      nisn: item.nisn,
      nik: item.nik,
      jenisKelamin: item.jenisKelamin,
      tempatLahir: item.tempatLahir,
      tanggalLahir: item.tanggalLahir,
      agama: item.agama,
      alamat: item.alamat,
      hp: item.hp,
      namaAyah: item.namaAyah,
      namaIbu: item.namaIbu,
      rombel: item.rombel,
      sekolahAsal: item.sekolahAsal,
      no: '',
    } : null)
    setSiswaSearch('')
    setFormErrors({})
    setFormOpen(true)
  }

  const closeFormDialog = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(INITIAL_FORM)
    setSelectedSiswa(null)
    setSiswaSearch('')
    setFormErrors({})
  }

  const validate = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {}
    if (!form.nama.trim()) errors.nama = 'Nama siswa wajib diisi'
    if (!form.tujuanSekolah.trim()) errors.tujuanSekolah = 'Tujuan sekolah wajib diisi'
    if (!form.kelas) errors.kelas = 'Kelas wajib diisi'
    if (!form.tanggalKeluar) errors.tanggalKeluar = 'Tanggal keluar wajib diisi'
    if (!form.alasan.trim()) errors.alasan = 'Alasan mutasi wajib diisi'
    if (!form.noSurat.trim()) errors.noSurat = 'No. surat mutasi wajib diisi'
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

  const openDetail = (item: MutasiKeluar) => {
    setDetailItem(item)
    setDetailOpen(true)
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const startIndex = (page - 1) * limit

  const handlePageSizeChange = (val: string) => {
    const size = val === 'all' ? 9999 : parseInt(val)
    setPageSize(size)
    setPage(1)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mutasi Keluar</h1>
          <p className="text-muted-foreground text-sm">
            Kelola data siswa yang mutasi keluar dari sekolah &mdash; data terhubung dengan Data Siswa
          </p>
        </div>
        <Button onClick={openAddDialog} className="shrink-0">
          <UserMinus className="mr-2 size-4" />
          Tambah Mutasi Keluar
        </Button>
      </div>

      {/* Search & Page Size */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Cari nama, NIPD, NISN, atau tujuan sekolah..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Tampilkan:</span>
          <Select value={pageSize === 9999 ? 'all' : String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-[90px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="all">Semua</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Daftar Mutasi Keluar</CardTitle>
            {data && data.total > 0 && (
              <Badge variant="secondary" className="text-xs">
                {data.total} data
              </Badge>
            )}
          </div>
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
                onClick={() => queryClient.invalidateQueries({ queryKey: ['mutasi-keluar'] })}
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
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">No</TableHead>
                      <TableHead className="min-w-[180px]">Nama</TableHead>
                      <TableHead className="hidden sm:table-cell">NIPD</TableHead>
                      <TableHead className="hidden md:table-cell">NISN</TableHead>
                      <TableHead className="hidden md:table-cell">L/P</TableHead>
                      <TableHead className="hidden lg:table-cell">Rombel</TableHead>
                      <TableHead className="hidden xl:table-cell">Tujuan Sekolah</TableHead>
                      <TableHead className="hidden lg:table-cell">Tgl Keluar</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center">{startIndex + idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{item.nama}</span>
                            {item.siswaId && (
                              <Badge variant="outline" className="w-fit text-[10px] px-1.5 py-0 h-5 text-emerald-600 border-emerald-300">
                                <CheckCircle2 className="size-3 mr-0.5" />
                                Terhubung
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{item.nipd || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell">{item.nisn || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell">{item.jenisKelamin || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell">{item.rombel || item.kelas || '-'}</TableCell>
                        <TableCell className="hidden xl:table-cell">{item.tujuanSekolah}</TableCell>
                        <TableCell className="hidden lg:table-cell">{formatDate(item.tanggalKeluar)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => openDetail(item)}
                              aria-label="Detail"
                            >
                              <Eye className="size-4" />
                            </Button>
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
              {pageSize !== 9999 && data.totalPages > 1 && (
                <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                  <p className="text-muted-foreground text-xs">
                    Halaman {data.page} dari {data.totalPages} &middot; Total {data.total} data
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="size-8" disabled={page <= 1} onClick={() => setPage(1)} aria-label="Halaman pertama">
                      <ChevronsLeft className="size-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="size-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Halaman sebelumnya">
                      <ChevronLeft className="size-4" />
                    </Button>
                    {generatePageNumbers(page, data.totalPages).map((p, i) =>
                      p === '...' ? (
                        <span key={`ellipsis-${i}`} className="flex size-8 items-center justify-center text-xs text-muted-foreground">...</span>
                      ) : (
                        <Button key={p} variant={page === p ? 'default' : 'outline'} size="icon" className="size-8" onClick={() => setPage(p as number)}>
                          {p}
                        </Button>
                      ),
                    )}
                    <Button variant="outline" size="icon" className="size-8" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Halaman berikutnya">
                      <ChevronRight className="size-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="size-8" disabled={page >= data.totalPages} onClick={() => setPage(data.totalPages)} aria-label="Halaman terakhir">
                      <ChevronsRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ═══ Add / Edit Dialog ═══ */}
      <Dialog open={formOpen} onOpenChange={(open) => !open && closeFormDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Mutasi Keluar' : 'Tambah Mutasi Keluar'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Ubah data mutasi keluar siswa.'
                : 'Pilih siswa dari Data Siswa, lalu lengkapi informasi mutasi.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            {/* ─── Siswa Selection ─── */}
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">
                Pilih Siswa <span className="text-destructive">*</span>
              </Label>
              {!editingId && (
                <p className="text-xs text-muted-foreground">
                  Cari dan pilih siswa dari database. Data siswa akan terisi otomatis.
                </p>
              )}
              <Popover open={siswaPopoverOpen} onOpenChange={setSiswaPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={siswaPopoverOpen}
                    className="w-full justify-between font-normal h-auto py-2.5"
                  >
                    {selectedSiswa ? (
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-medium">{selectedSiswa.nama}</span>
                        <span className="text-muted-foreground text-xs">
                          ({selectedSiswa.rombel}{selectedSiswa.nipd ? ` - ${selectedSiswa.nipd}` : ''})
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Cari nama, NIPD, atau NISN siswa...</span>
                    )}
                    <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Ketik untuk mencari siswa..."
                      value={siswaSearch}
                      onValueChange={setSiswaSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {siswaLoading ? (
                          <div className="flex items-center justify-center gap-2 py-6">
                            <Loader2 className="size-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Mencari...</span>
                          </div>
                        ) : (
                          'Siswa tidak ditemukan.'
                        )}
                      </CommandEmpty>
                      <CommandGroup className="max-h-[300px] overflow-y-auto">
                        {siswaList.map((siswa) => (
                          <CommandItem
                            key={siswa.id}
                            value={siswa.id}
                            onSelect={() => handleSelectSiswa(siswa)}
                            className="flex flex-col items-start gap-0.5 py-2.5"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <span className="font-medium text-sm">{siswa.nama}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                                {siswa.jenisKelamin === 'L' ? 'L' : siswa.jenisKelamin === 'P' ? 'P' : '-'}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground flex gap-3">
                              <span>{siswa.rombel}</span>
                              {siswa.nipd && <span>NIPD: {siswa.nipd}</span>}
                              {siswa.nisn && <span>NISN: {siswa.nisn}</span>}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedSiswa && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive w-fit"
                  onClick={handleClearSiswa}
                >
                  <XCircle className="size-3.5 mr-1" />
                  Hapus Pilihan Siswa
                </Button>
              )}
            </div>

            <Separator />

            {/* ─── Data Siswa (auto-filled, read-only display) ─── */}
            {selectedSiswa && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <GraduationCap className="size-4" />
                  Data Siswa (otomatis terisi)
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoField label="Nama" value={form.nama} />
                  <InfoField label="NIPD" value={form.nipd} />
                  <InfoField label="NISN" value={form.nisn} />
                  <InfoField label="NIK" value={form.nik} />
                  <InfoField label="Jenis Kelamin" value={form.jenisKelamin === 'L' ? 'Laki-laki' : form.jenisKelamin === 'P' ? 'Perempuan' : form.jenisKelamin} />
                  <InfoField label="Agama" value={form.agama} />
                  <InfoField label="Tempat, Tgl Lahir" value={[form.tempatLahir, formatDate(form.tanggalLahir)].filter(Boolean).join(', ')} />
                  <InfoField label="No. HP" value={form.hp} />
                  <div className="sm:col-span-2">
                    <InfoField label="Alamat" value={form.alamat} />
                  </div>
                  <InfoField label="Nama Ayah" value={form.namaAyah} />
                  <InfoField label="Nama Ibu" value={form.namaIbu} />
                  <InfoField label="Rombel" value={form.rombel} />
                  <InfoField label="Sekolah Asal" value={form.sekolahAsal} />
                </div>
              </div>
            )}

            {/* ─── Manual nama fallback (if no siswa selected) ─── */}
            {!selectedSiswa && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="nama">Nama Siswa <span className="text-destructive">*</span></Label>
                  <Input
                    id="nama"
                    placeholder="Masukkan nama siswa"
                    value={form.nama}
                    onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                    aria-invalid={!!formErrors.nama}
                  />
                  {formErrors.nama && <p className="text-destructive text-xs">{formErrors.nama}</p>}
                </div>
              </>
            )}

            <Separator />

            {/* ─── Informasi Mutasi ─── */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <FileText className="size-4" />
                Informasi Mutasi
              </Label>

              {/* Tujuan Sekolah */}
              <div className="grid gap-2">
                <Label htmlFor="tujuanSekolah">Tujuan Sekolah <span className="text-destructive">*</span></Label>
                <Input
                  id="tujuanSekolah"
                  placeholder="Masukkan tujuan sekolah"
                  value={form.tujuanSekolah}
                  onChange={(e) => setForm((f) => ({ ...f, tujuanSekolah: e.target.value }))}
                  aria-invalid={!!formErrors.tujuanSekolah}
                />
                {formErrors.tujuanSekolah && <p className="text-destructive text-xs">{formErrors.tujuanSekolah}</p>}
              </div>

              {/* Kelas */}
              <div className="grid gap-2">
                <Label htmlFor="kelas">Kelas <span className="text-destructive">*</span></Label>
                <Input
                  id="kelas"
                  placeholder={selectedSiswa ? form.kelas || 'Otomatis dari rombel siswa' : 'Masukkan kelas'}
                  value={form.kelas}
                  onChange={(e) => setForm((f) => ({ ...f, kelas: e.target.value }))}
                  aria-invalid={!!formErrors.kelas}
                />
                {formErrors.kelas && <p className="text-destructive text-xs">{formErrors.kelas}</p>}
              </div>

              {/* Tanggal Keluar */}
              <div className="grid gap-2">
                <Label htmlFor="tanggalKeluar">Tanggal Keluar <span className="text-destructive">*</span></Label>
                <Input
                  id="tanggalKeluar"
                  type="date"
                  value={form.tanggalKeluar}
                  onChange={(e) => setForm((f) => ({ ...f, tanggalKeluar: e.target.value }))}
                  aria-invalid={!!formErrors.tanggalKeluar}
                />
                {formErrors.tanggalKeluar && <p className="text-destructive text-xs">{formErrors.tanggalKeluar}</p>}
              </div>

              {/* Alasan Mutasi */}
              <div className="grid gap-2">
                <Label htmlFor="alasan">Alasan Mutasi <span className="text-destructive">*</span></Label>
                <Textarea
                  id="alasan"
                  placeholder="Masukkan alasan mutasi"
                  rows={3}
                  value={form.alasan}
                  onChange={(e) => setForm((f) => ({ ...f, alasan: e.target.value }))}
                  aria-invalid={!!formErrors.alasan}
                />
                {formErrors.alasan && <p className="text-destructive text-xs">{formErrors.alasan}</p>}
              </div>

              {/* No. Surat Mutasi */}
              <div className="grid gap-2">
                <Label htmlFor="noSurat">No. Surat Mutasi <span className="text-destructive">*</span></Label>
                <Input
                  id="noSurat"
                  placeholder="Masukkan nomor surat mutasi"
                  value={form.noSurat}
                  onChange={(e) => setForm((f) => ({ ...f, noSurat: e.target.value }))}
                  aria-invalid={!!formErrors.noSurat}
                />
                {formErrors.noSurat && <p className="text-destructive text-xs">{formErrors.noSurat}</p>}
              </div>
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

      {/* ═══ Detail Dialog ═══ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Mutasi Keluar</DialogTitle>
            <DialogDescription>Data lengkap siswa yang mutasi keluar.</DialogDescription>
          </DialogHeader>
          {detailItem && (
            <ScrollArea className="max-h-[70vh]">
              <div className="grid gap-6 pb-4">
                {/* Data Siswa */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 text-emerald-700">
                    <User className="size-4" />
                    Data Siswa
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoField label="Nama" value={detailItem.nama} />
                    <InfoField label="NIPD" value={detailItem.nipd || '-'} />
                    <InfoField label="NISN" value={detailItem.nisn || '-'} />
                    <InfoField label="NIK" value={detailItem.nik || '-'} />
                    <InfoField label="Jenis Kelamin" value={detailItem.jenisKelamin === 'L' ? 'Laki-laki' : detailItem.jenisKelamin === 'P' ? 'Perempuan' : detailItem.jenisKelamin || '-'} />
                    <InfoField label="Agama" value={detailItem.agama || '-'} />
                    <InfoField label="Tempat, Tgl Lahir" value={[detailItem.tempatLahir, formatDate(detailItem.tanggalLahir)].filter(Boolean).join(', ') || '-'} />
                    <InfoField label="No. HP" value={detailItem.hp || '-'} />
                    <div className="sm:col-span-2">
                      <InfoField label="Alamat" value={detailItem.alamat || '-'} />
                    </div>
                    <InfoField label="Nama Ayah" value={detailItem.namaAyah || '-'} />
                    <InfoField label="Nama Ibu" value={detailItem.namaIbu || '-'} />
                    <InfoField label="Rombel" value={detailItem.rombel || '-'} />
                    <InfoField label="Sekolah Asal" value={detailItem.sekolahAsal || '-'} />
                  </div>
                  {detailItem.siswaId && (
                    <Badge variant="outline" className="w-fit text-xs text-emerald-600 border-emerald-300">
                      <CheckCircle2 className="size-3 mr-1" />
                      Terhubung ke Data Siswa
                    </Badge>
                  )}
                </div>

                <Separator />

                {/* Data Mutasi */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <FileText className="size-4" />
                    Informasi Mutasi
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoField label="Kelas" value={detailItem.kelas || '-'} />
                    <InfoField label="Tanggal Keluar" value={formatDate(detailItem.tanggalKeluar)} />
                    <div className="sm:col-span-2">
                      <InfoField label="Tujuan Sekolah" value={detailItem.tujuanSekolah || '-'} />
                    </div>
                    <div className="sm:col-span-2">
                      <InfoField label="Alasan Mutasi" value={detailItem.alasan || '-'} />
                    </div>
                    <InfoField label="No. Surat Mutasi" value={detailItem.noSurat || '-'} />
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Tutup</Button>
            {detailItem && (
              <Button onClick={() => { setDetailOpen(false); openEditDialog(detailItem) }}>
                <Pencil className="mr-2 size-4" />
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Delete Confirmation ═══ */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Mutasi Keluar?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data mutasi keluar atas nama{' '}
              <span className="font-semibold">{deletingItem?.nama}</span>?
              {deletingItem?.siswaId && (
                <span className="block mt-2 text-amber-600">
                  Status siswa akan dikembalikan ke &quot;Aktif&quot; secara otomatis.
                </span>
              )}
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

// ── Info Field Component ──────────────────────────────────────────────────────

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm">{value || '-'}</p>
    </div>
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
          <Skeleton className="hidden h-4 w-20 sm:block" />
          <Skeleton className="hidden h-4 w-28 md:block" />
          <Skeleton className="hidden h-4 w-8 md:block" />
          <Skeleton className="hidden h-4 w-24 lg:block" />
          <Skeleton className="hidden h-4 w-32 xl:block" />
          <Skeleton className="hidden h-4 w-28 lg:block" />
          <div className="ml-auto flex gap-1">
            <Skeleton className="size-8 rounded-md" />
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