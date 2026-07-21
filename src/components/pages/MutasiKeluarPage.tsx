'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
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
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MapPin,
  Users,
  BookOpen,
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
import ExportButton from '@/components/ExportButton'
import { MUTASI_KELUAR_COLUMNS } from '@/lib/export-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/store/app'

// ── Types ────────────────────────────────────────────────────────────────────

interface SiswaData {
  id: string
  no: string
  nama: string
  nipd: string
  nisn: string
  jenisKelamin: string
  tempatLahir: string
  tanggalLahir: string
  nik: string
  agama: string
  alamat: string
  rt: string
  rw: string
  dusun: string
  kelurahan: string
  kecamatan: string
  kodePos: string
  jenisTinggal: string
  alatTransportasi: string
  telepon: string
  hp: string
  email: string
  skhun: string
  penerimaKPS: string
  noKPS: string
  namaAyah: string
  ayahTahunLahir: string
  ayahJenjangPendidikan: string
  ayahPekerjaan: string
  ayahPenghasilan: string
  ayahNik: string
  namaIbu: string
  ibuTahunLahir: string
  ibuJenjangPendidikan: string
  ibuPekerjaan: string
  ibuPenghasilan: string
  ibuNik: string
  namaWali: string
  waliTahunLahir: string
  waliJenjangPendidikan: string
  waliPekerjaan: string
  waliPenghasilan: string
  waliNik: string
  rombel: string
  noPesertaUN: string
  noSeriIjazah: string
  penerimaKIP: string
  nomorKIP: string
  namaKIP: string
  nomorKKS: string
  noRegAktaLahir: string
  bank: string
  nomorRekeningBank: string
  rekeningAtasNama: string
  layakPIP: string
  alasanLayakPIP: string
  kebutuhanKhusus: string
  sekolahAsal: string
  anakKeBerapa: string
  lintang: string
  bujur: string
  noKK: string
  beratBadan: string
  tinggiBadan: string
  lingkarKepala: string
  jmlSaudaraKandung: string
  jarakRumahKeSekolah: string
  status: string
  tahunPelajaran: string
  semester: string
}

type SiswaOption = SiswaData

interface MutasiKeluarRecord {
  id: string
  siswaId: string
  tujuanSekolah: string
  tanggalKeluar: string
  alasan: string
  noSurat: string
  statusDapodik: boolean
  tahunPelajaran: string
  semester: string
  createdAt: string
  updatedAt: string
  siswa: SiswaData | null
}

interface PaginatedResponse {
  data: MutasiKeluarRecord[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Form only stores mutasi-specific fields + siswaId
interface FormData {
  siswaId: string
  tujuanSekolah: string
  tanggalKeluar: string
  alasan: string
  noSurat: string
  tahunPelajaran: string
  semester: string
}

const INITIAL_FORM: FormData = {
  siswaId: '',
  tujuanSekolah: '',
  tanggalKeluar: '',
  alasan: '',
  noSurat: '',
  tahunPelajaran: '',
  semester: '',
}

// ── Component ────────────────────────────────────────────────────────────────

export default function MutasiKeluarPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { tahunPelajaran, semester } = useAppStore()
  const { data: session } = useSession()
  const currentUserRole = (session?.user as { role?: string })?.role || ''
  const canToggleDapodik = currentUserRole === 'admin' || currentUserRole === 'operator'

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
  const [detailItem, setDetailItem] = useState<MutasiKeluarRecord | null>(null)

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<MutasiKeluarRecord | null>(null)

  // ── Debounced search ──────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ── API: Fetch Siswa List (for combobox) ─────────────────────────────────
  const { data: siswaList = [], isLoading: siswaLoading } = useQuery<SiswaOption[]>({
    queryKey: ['siswa-list', siswaSearch, tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams({ tahunPelajaran, semester })
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
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      params.set('page', String(page));
      params.set('limit', String(limit));
      params.set('tahunPelajaran', tahunPelajaran);
      params.set('semester', semester);
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
      queryClient.invalidateQueries({ queryKey: ['siswa-list'] })
      toast({ title: 'Berhasil', description: 'Data mutasi keluar berhasil disimpan' })
      closeFormDialog()
    },
    onError: (err) => {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' })
    },
  })

  // ── API: Toggle status Dapodik ──────────────────────────────────────────
  const toggleDapodikMutation = useMutation({
    mutationFn: async ({ id, statusDapodik }: { id: string; statusDapodik: boolean }) => {
      const res = await fetch('/api/mutasi-dapodik', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'keluar', id, statusDapodik }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Gagal mengubah status Dapodik')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mutasi-keluar'] })
      toast({ title: 'Berhasil', description: 'Status Dapodik diperbarui' })
    },
    onError: (err) => {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' })
    },
  })

  // ── API: Delete ───────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/mutasi-keluar?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
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
      queryClient.invalidateQueries({ queryKey: ['siswa-list'] })
      toast({ title: 'Berhasil', description: 'Data mutasi keluar dihapus. Status siswa dikembalikan ke Aktif.' })
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
    setForm((f) => ({ ...f, siswaId: siswa.id }))
    setSiswaPopoverOpen(false)
  }

  const handleClearSiswa = () => {
    setSelectedSiswa(null)
    setSiswaSearch('')
    setForm((f) => ({ ...f, siswaId: '' }))
  }

  // ── Form helpers ──────────────────────────────────────────────────────────
  const openAddDialog = () => {
    setEditingId(null)
    setForm({
      ...INITIAL_FORM,
      tahunPelajaran,
      semester,
    })
    setSelectedSiswa(null)
    setSiswaSearch('')
    setFormErrors({})
    setFormOpen(true)
  }

  const openEditDialog = (item: MutasiKeluarRecord) => {
    setEditingId(item.id)
    setForm({
      siswaId: item.siswaId,
      tujuanSekolah: item.tujuanSekolah,
      tanggalKeluar: item.tanggalKeluar,
      alasan: item.alasan,
      noSurat: item.noSurat,
      tahunPelajaran: item.tahunPelajaran,
      semester: item.semester,
    })
    setSelectedSiswa(item.siswa ? { ...item.siswa, no: item.siswa.no } : null)
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
    if (!form.siswaId) errors.siswaId = 'Siswa wajib dipilih'
    if (!form.tujuanSekolah.trim()) errors.tujuanSekolah = 'Tujuan sekolah wajib diisi'
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

  const confirmDelete = (item: MutasiKeluarRecord) => {
    setDeletingItem(item)
    setDeleteOpen(true)
  }

  const handleDelete = () => {
    if (deletingItem) deleteMutation.mutate(deletingItem.id)
  }

  const openDetail = (item: MutasiKeluarRecord) => {
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
    setPageSize(val === 'all' ? 9999 : parseInt(val))
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
            Kelola data siswa yang mutasi keluar &mdash; data siswa langsung terhubung tanpa duplikasi
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ExportButton
            title="Laporan Mutasi Keluar"
            subtitle={`Tahun Pelajaran ${tahunPelajaran} — Semester ${semester}`}
            columns={MUTASI_KELUAR_COLUMNS}
            apiUrl="/api/mutasi-keluar"
            filename={`Mutasi-Keluar-${tahunPelajaran}-${semester}`}
            orientation="landscape"
            flattenRow={(row, idx) => {
              const r = row as Record<string, unknown>
              const s = (r.siswa || {}) as Record<string, unknown>
              const sv = (k: string) => String(s[k] || '-')
              const jk = (val: unknown) => val === 'L' ? 'Laki-laki' : val === 'P' ? 'Perempuan' : String(val || '-')
              return {
                no: String(idx + 1),
                nama: sv('nama'),
                nipd: sv('nipd'),
                nisn: sv('nisn'),
                nik: sv('nik'),
                jenisKelamin: jk(s.jenisKelamin),
                tempatLahir: sv('tempatLahir'),
                tanggalLahir: sv('tanggalLahir'),
                agama: sv('agama'),
                kebutuhanKhusus: sv('kebutuhanKhusus'),
                noKK: sv('noKK'),
                noRegAktaLahir: sv('noRegAktaLahir'),
                anakKeBerapa: sv('anakKeBerapa'),
                jmlSaudaraKandung: sv('jmlSaudaraKandung'),
                alamat: sv('alamat'),
                rt: sv('rt'),
                rw: sv('rw'),
                dusun: sv('dusun'),
                kelurahan: sv('kelurahan'),
                kecamatan: sv('kecamatan'),
                kodePos: sv('kodePos'),
                jenisTinggal: sv('jenisTinggal'),
                alatTransportasi: sv('alatTransportasi'),
                jarakRumahKeSekolah: sv('jarakRumahKeSekolah'),
                telepon: sv('telepon'),
                hp: sv('hp'),
                email: sv('email'),
                namaAyah: sv('namaAyah'),
                ayahTahunLahir: sv('ayahTahunLahir'),
                ayahJenjangPendidikan: sv('ayahJenjangPendidikan'),
                ayahPekerjaan: sv('ayahPekerjaan'),
                ayahPenghasilan: sv('ayahPenghasilan'),
                ayahNik: sv('ayahNik'),
                namaIbu: sv('namaIbu'),
                ibuTahunLahir: sv('ibuTahunLahir'),
                ibuJenjangPendidikan: sv('ibuJenjangPendidikan'),
                ibuPekerjaan: sv('ibuPekerjaan'),
                ibuPenghasilan: sv('ibuPenghasilan'),
                ibuNik: sv('ibuNik'),
                namaWali: sv('namaWali'),
                waliTahunLahir: sv('waliTahunLahir'),
                waliJenjangPendidikan: sv('waliJenjangPendidikan'),
                waliPekerjaan: sv('waliPekerjaan'),
                waliPenghasilan: sv('waliPenghasilan'),
                waliNik: sv('waliNik'),
                rombel: sv('rombel'),
                sekolahAsal: sv('sekolahAsal'),
                status: sv('status'),
                skhun: sv('skhun'),
                noPesertaUN: sv('noPesertaUN'),
                noSeriIjazah: sv('noSeriIjazah'),
                penerimaKPS: sv('penerimaKPS'),
                noKPS: sv('noKPS'),
                penerimaKIP: sv('penerimaKIP'),
                nomorKIP: sv('nomorKIP'),
                namaKIP: sv('namaKIP'),
                nomorKKS: sv('nomorKKS'),
                layakPIP: sv('layakPIP'),
                alasanLayakPIP: sv('alasanLayakPIP'),
                bank: sv('bank'),
                nomorRekeningBank: sv('nomorRekeningBank'),
                rekeningAtasNama: sv('rekeningAtasNama'),
                beratBadan: sv('beratBadan'),
                tinggiBadan: sv('tinggiBadan'),
                lingkarKepala: sv('lingkarKepala'),
                tujuanSekolah: String(r.tujuanSekolah || ''),
                tanggalKeluar: String(r.tanggalKeluar || ''),
                alasan: String(r.alasan || ''),
                noSurat: String(r.noSurat || ''),
              }
            }}
          />
          <Button onClick={openAddDialog}>
            <UserMinus className="mr-2 size-4" />
            Tambah Mutasi Keluar
          </Button>
        </div>
      </div>

      {/* Search & Page Size */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Cari nama, NIPD, NISN siswa..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
              <Badge variant="secondary" className="text-xs">{data.total} data</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading && <TableSkeleton />}

          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <p className="text-muted-foreground text-sm">Gagal memuat data. Silakan coba lagi.</p>
              <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['mutasi-keluar'] })}>Coba Lagi</Button>
            </div>
          )}

          {!isLoading && !isError && data?.data.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <UserMinus className="text-muted-foreground size-10" />
              <p className="text-muted-foreground text-sm">
                {debouncedSearch ? 'Tidak ada data yang cocok.' : 'Belum ada data mutasi keluar.'}
              </p>
            </div>
          )}

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
                      <TableHead className="text-center">Status Dapodik</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center">{startIndex + idx + 1}</TableCell>
                        <TableCell>
                          <span className="font-medium">{item.siswa?.nama || '-'}</span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{item.siswa?.nipd || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell">{item.siswa?.nisn || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell">{item.siswa?.jenisKelamin || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell">{item.siswa?.rombel || '-'}</TableCell>
                        <TableCell className="hidden xl:table-cell">{item.tujuanSekolah}</TableCell>
                        <TableCell className="hidden lg:table-cell">{formatDate(item.tanggalKeluar)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {canToggleDapodik ? (
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <Checkbox
                                  checked={item.statusDapodik}
                                  onCheckedChange={(checked) =>
                                    toggleDapodikMutation.mutate({
                                      id: item.id,
                                      statusDapodik: checked === true,
                                    })
                                  }
                                  disabled={toggleDapodikMutation.isPending}
                                />
                                <span className="text-xs text-muted-foreground">
                                  {item.statusDapodik ? 'Sudah' : 'Belum'}
                                </span>
                              </label>
                            ) : (
                              item.statusDapodik ? (
                                <Badge variant="default" className="bg-emerald-600 text-white gap-1">
                                  <CheckCircle2 className="size-3" /> Sudah
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  <Clock className="size-3" /> Belum
                                </Badge>
                              )
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="size-8" onClick={() => openDetail(item)} aria-label="Detail"><Eye className="size-4" /></Button>
                            <Button variant="ghost" size="icon" className="size-8" onClick={() => openEditDialog(item)} aria-label="Edit"><Pencil className="size-4" /></Button>
                            <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => confirmDelete(item)} aria-label="Hapus"><Trash2 className="size-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {pageSize !== 9999 && data.totalPages > 1 && (
                <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                  <p className="text-muted-foreground text-xs">
                    Halaman {data.page} dari {data.totalPages} &middot; Total {data.total} data
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="size-8" disabled={page <= 1} onClick={() => setPage(1)}><ChevronsLeft className="size-4" /></Button>
                    <Button variant="outline" size="icon" className="size-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="size-4" /></Button>
                    {generatePageNumbers(page, data.totalPages).map((p, i) =>
                      p === '...' ? (
                        <span key={`e-${i}`} className="flex size-8 items-center justify-center text-xs text-muted-foreground">...</span>
                      ) : (
                        <Button key={p} variant={page === p ? 'default' : 'outline'} size="icon" className="size-8" onClick={() => setPage(p as number)}>{p}</Button>
                      ),
                    )}
                    <Button variant="outline" size="icon" className="size-8" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="size-4" /></Button>
                    <Button variant="outline" size="icon" className="size-8" disabled={page >= data.totalPages} onClick={() => setPage(data.totalPages)}><ChevronsRight className="size-4" /></Button>
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
                ? 'Ubah informasi mutasi keluar siswa.'
                : 'Pilih siswa dari database, lalu lengkapi informasi mutasi.'}
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
                  Cari dan pilih siswa aktif dari database. Data siswa akan langsung terhubung tanpa duplikasi.
                </p>
              )}
              <Popover open={siswaPopoverOpen && !editingId} onOpenChange={editingId ? undefined : setSiswaPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={siswaPopoverOpen}
                    className="w-full justify-between font-normal h-auto py-2.5"
                    disabled={!!editingId}
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
                        ) : 'Siswa tidak ditemukan.'}
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
              {!editingId && selectedSiswa && (
                <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive w-fit" onClick={handleClearSiswa}>
                  <XCircle className="size-3.5 mr-1" /> Hapus Pilihan Siswa
                </Button>
              )}
              {formErrors.siswaId && <p className="text-destructive text-xs">{formErrors.siswaId}</p>}
            </div>

            {/* ─── Preview Data Siswa ─── */}
            {selectedSiswa && (
              <>
                <Separator />
                <div className="space-y-4">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <GraduationCap className="size-4" />
                    Data Siswa (dari database, tanpa duplikasi)
                  </Label>

                  {/* Section 1: Data Pribadi */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5 text-emerald-700">
                      <User className="size-3.5" /> Data Pribadi
                    </h3>
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <InfoField label="Nama" value={selectedSiswa.nama} />
                        <InfoField label="NIPD" value={selectedSiswa.nipd} />
                        <InfoField label="NISN" value={selectedSiswa.nisn} />
                        <InfoField label="NIK" value={selectedSiswa.nik} />
                        <InfoField label="No. KK" value={selectedSiswa.noKK} />
                        <InfoField label="No. Reg Akta Lahir" value={selectedSiswa.noRegAktaLahir} />
                        <InfoField label="Jenis Kelamin" value={selectedSiswa.jenisKelamin === 'L' ? 'Laki-laki' : selectedSiswa.jenisKelamin === 'P' ? 'Perempuan' : selectedSiswa.jenisKelamin} />
                        <InfoField label="Agama" value={selectedSiswa.agama} />
                        <InfoField label="Tempat, Tgl Lahir" value={[selectedSiswa.tempatLahir, formatDate(selectedSiswa.tanggalLahir)].filter(Boolean).join(', ')} />
                        <InfoField label="Kebutuhan Khusus" value={selectedSiswa.kebutuhanKhusus} />
                        <InfoField label="Anak Ke Berapa" value={selectedSiswa.anakKeBerapa} />
                        <InfoField label="Jml Saudara Kandung" value={selectedSiswa.jmlSaudaraKandung} />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Alamat & Kontak */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5 text-emerald-700">
                      <MapPin className="size-3.5" /> Alamat & Kontak
                    </h3>
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="sm:col-span-2"><InfoField label="Alamat" value={selectedSiswa.alamat} /></div>
                        <InfoField label="RT" value={selectedSiswa.rt} />
                        <InfoField label="RW" value={selectedSiswa.rw} />
                        <InfoField label="Dusun" value={selectedSiswa.dusun} />
                        <InfoField label="Kelurahan" value={selectedSiswa.kelurahan} />
                        <InfoField label="Kecamatan" value={selectedSiswa.kecamatan} />
                        <InfoField label="Kode Pos" value={selectedSiswa.kodePos} />
                        <InfoField label="Jenis Tinggal" value={selectedSiswa.jenisTinggal} />
                        <InfoField label="Alat Transportasi" value={selectedSiswa.alatTransportasi} />
                        <InfoField label="Jarak Rumah ke Sekolah" value={selectedSiswa.jarakRumahKeSekolah} />
                        <InfoField label="Telepon" value={selectedSiswa.telepon} />
                        <InfoField label="HP" value={selectedSiswa.hp} />
                        <div className="sm:col-span-2"><InfoField label="Email" value={selectedSiswa.email} /></div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Data Orang Tua / Wali */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5 text-emerald-700">
                      <Users className="size-3.5" /> Data Orang Tua / Wali
                    </h3>
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="sm:col-span-2"><p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Data Ayah</p></div>
                        <InfoField label="Nama Ayah" value={selectedSiswa.namaAyah} />
                        <InfoField label="Tahun Lahir" value={selectedSiswa.ayahTahunLahir} />
                        <InfoField label="Jenjang Pendidikan" value={selectedSiswa.ayahJenjangPendidikan} />
                        <InfoField label="Pekerjaan" value={selectedSiswa.ayahPekerjaan} />
                        <InfoField label="Penghasilan" value={selectedSiswa.ayahPenghasilan} />
                        <InfoField label="NIK Ayah" value={selectedSiswa.ayahNik} />
                        <div className="sm:col-span-2"><p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1 mt-2">Data Ibu</p></div>
                        <InfoField label="Nama Ibu" value={selectedSiswa.namaIbu} />
                        <InfoField label="Tahun Lahir" value={selectedSiswa.ibuTahunLahir} />
                        <InfoField label="Jenjang Pendidikan" value={selectedSiswa.ibuJenjangPendidikan} />
                        <InfoField label="Pekerjaan" value={selectedSiswa.ibuPekerjaan} />
                        <InfoField label="Penghasilan" value={selectedSiswa.ibuPenghasilan} />
                        <InfoField label="NIK Ibu" value={selectedSiswa.ibuNik} />
                        <div className="sm:col-span-2"><p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1 mt-2">Data Wali</p></div>
                        <InfoField label="Nama Wali" value={selectedSiswa.namaWali} />
                        <InfoField label="Tahun Lahir" value={selectedSiswa.waliTahunLahir} />
                        <InfoField label="Jenjang Pendidikan" value={selectedSiswa.waliJenjangPendidikan} />
                        <InfoField label="Pekerjaan" value={selectedSiswa.waliPekerjaan} />
                        <InfoField label="Penghasilan" value={selectedSiswa.waliPenghasilan} />
                        <InfoField label="NIK Wali" value={selectedSiswa.waliNik} />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Data Pendidikan & Lainnya */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5 text-emerald-700">
                      <BookOpen className="size-3.5" /> Data Pendidikan & Lainnya
                    </h3>
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <InfoField label="Rombel" value={selectedSiswa.rombel} />
                        <InfoField label="Sekolah Asal" value={selectedSiswa.sekolahAsal} />
                        <InfoField label="Status" value={selectedSiswa.status} />
                        <InfoField label="SKHUN" value={selectedSiswa.skhun} />
                        <InfoField label="No. Peserta UN" value={selectedSiswa.noPesertaUN} />
                        <InfoField label="No. Seri Ijazah" value={selectedSiswa.noSeriIjazah} />
                        <InfoField label="Penerima KPS" value={selectedSiswa.penerimaKPS} />
                        <InfoField label="No. KPS" value={selectedSiswa.noKPS} />
                        <InfoField label="Penerima KIP" value={selectedSiswa.penerimaKIP} />
                        <InfoField label="Nomor KIP" value={selectedSiswa.nomorKIP} />
                        <InfoField label="Nama KIP" value={selectedSiswa.namaKIP} />
                        <InfoField label="Nomor KKS" value={selectedSiswa.nomorKKS} />
                        <InfoField label="Layak PIP" value={selectedSiswa.layakPIP} />
                        <InfoField label="Alasan Layak PIP" value={selectedSiswa.alasanLayakPIP} />
                        <InfoField label="Bank" value={selectedSiswa.bank} />
                        <InfoField label="Nomor Rekening Bank" value={selectedSiswa.nomorRekeningBank} />
                        <InfoField label="Rekening Atas Nama" value={selectedSiswa.rekeningAtasNama} />
                        <InfoField label="Berat Badan" value={selectedSiswa.beratBadan} />
                        <InfoField label="Tinggi Badan" value={selectedSiswa.tinggiBadan} />
                        <InfoField label="Lingkar Kepala" value={selectedSiswa.lingkarKepala} />
                        <InfoField label="Lintang" value={selectedSiswa.lintang} />
                        <InfoField label="Bujur" value={selectedSiswa.bujur} />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* ─── Informasi Mutasi (hanya data spesifik mutasi) ─── */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <FileText className="size-4" />
                Informasi Mutasi
              </Label>

              <div className="grid gap-2">
                <Label htmlFor="tujuanSekolah">Tujuan Sekolah <span className="text-destructive">*</span></Label>
                <Input id="tujuanSekolah" placeholder="Masukkan tujuan sekolah" value={form.tujuanSekolah} onChange={(e) => setForm((f) => ({ ...f, tujuanSekolah: e.target.value }))} aria-invalid={!!formErrors.tujuanSekolah} />
                {formErrors.tujuanSekolah && <p className="text-destructive text-xs">{formErrors.tujuanSekolah}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tanggalKeluar">Tanggal Keluar <span className="text-destructive">*</span></Label>
                <Input id="tanggalKeluar" type="date" value={form.tanggalKeluar} onChange={(e) => setForm((f) => ({ ...f, tanggalKeluar: e.target.value }))} aria-invalid={!!formErrors.tanggalKeluar} />
                {formErrors.tanggalKeluar && <p className="text-destructive text-xs">{formErrors.tanggalKeluar}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="alasan">Alasan Mutasi <span className="text-destructive">*</span></Label>
                <Textarea id="alasan" placeholder="Masukkan alasan mutasi" rows={3} value={form.alasan} onChange={(e) => setForm((f) => ({ ...f, alasan: e.target.value }))} aria-invalid={!!formErrors.alasan} />
                {formErrors.alasan && <p className="text-destructive text-xs">{formErrors.alasan}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="noSurat">No. Surat Mutasi <span className="text-destructive">*</span></Label>
                <Input id="noSurat" placeholder="Masukkan nomor surat mutasi" value={form.noSurat} onChange={(e) => setForm((f) => ({ ...f, noSurat: e.target.value }))} aria-invalid={!!formErrors.noSurat} />
                {formErrors.noSurat && <p className="text-destructive text-xs">{formErrors.noSurat}</p>}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeFormDialog} disabled={saveMutation.isPending}>Batal</Button>
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
          {detailItem?.siswa && (
            <ScrollArea className="max-h-[70vh]">
              <div className="grid gap-6 pb-4">
                {/* Section 1: Data Pribadi */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 text-emerald-700">
                    <User className="size-4" /> Data Pribadi
                  </h3>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <InfoField label="Nama" value={detailItem.siswa.nama || '-'} />
                      <InfoField label="NIPD" value={detailItem.siswa.nipd || '-'} />
                      <InfoField label="NISN" value={detailItem.siswa.nisn || '-'} />
                      <InfoField label="NIK" value={detailItem.siswa.nik || '-'} />
                      <InfoField label="No. KK" value={detailItem.siswa.noKK || '-'} />
                      <InfoField label="No. Reg Akta Lahir" value={detailItem.siswa.noRegAktaLahir || '-'} />
                      <InfoField label="Jenis Kelamin" value={detailItem.siswa.jenisKelamin === 'L' ? 'Laki-laki' : detailItem.siswa.jenisKelamin === 'P' ? 'Perempuan' : detailItem.siswa.jenisKelamin || '-'} />
                      <InfoField label="Agama" value={detailItem.siswa.agama || '-'} />
                      <InfoField label="Tempat, Tgl Lahir" value={[detailItem.siswa.tempatLahir, formatDate(detailItem.siswa.tanggalLahir)].filter(Boolean).join(', ') || '-'} />
                      <InfoField label="Kebutuhan Khusus" value={detailItem.siswa.kebutuhanKhusus || '-'} />
                      <InfoField label="Anak Ke Berapa" value={detailItem.siswa.anakKeBerapa || '-'} />
                      <InfoField label="Jml Saudara Kandung" value={detailItem.siswa.jmlSaudaraKandung || '-'} />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Section 2: Alamat & Kontak */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 text-emerald-700">
                    <MapPin className="size-4" /> Alamat & Kontak
                  </h3>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="sm:col-span-2"><InfoField label="Alamat" value={detailItem.siswa.alamat || '-'} /></div>
                      <InfoField label="RT" value={detailItem.siswa.rt || '-'} />
                      <InfoField label="RW" value={detailItem.siswa.rw || '-'} />
                      <InfoField label="Dusun" value={detailItem.siswa.dusun || '-'} />
                      <InfoField label="Kelurahan" value={detailItem.siswa.kelurahan || '-'} />
                      <InfoField label="Kecamatan" value={detailItem.siswa.kecamatan || '-'} />
                      <InfoField label="Kode Pos" value={detailItem.siswa.kodePos || '-'} />
                      <InfoField label="Jenis Tinggal" value={detailItem.siswa.jenisTinggal || '-'} />
                      <InfoField label="Alat Transportasi" value={detailItem.siswa.alatTransportasi || '-'} />
                      <InfoField label="Jarak Rumah ke Sekolah" value={detailItem.siswa.jarakRumahKeSekolah || '-'} />
                      <InfoField label="Telepon" value={detailItem.siswa.telepon || '-'} />
                      <InfoField label="HP" value={detailItem.siswa.hp || '-'} />
                      <div className="sm:col-span-2"><InfoField label="Email" value={detailItem.siswa.email || '-'} /></div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Section 3: Data Orang Tua / Wali */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 text-emerald-700">
                    <Users className="size-4" /> Data Orang Tua / Wali
                  </h3>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="sm:col-span-2"><p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Data Ayah</p></div>
                      <InfoField label="Nama Ayah" value={detailItem.siswa.namaAyah || '-'} />
                      <InfoField label="Tahun Lahir" value={detailItem.siswa.ayahTahunLahir || '-'} />
                      <InfoField label="Jenjang Pendidikan" value={detailItem.siswa.ayahJenjangPendidikan || '-'} />
                      <InfoField label="Pekerjaan" value={detailItem.siswa.ayahPekerjaan || '-'} />
                      <InfoField label="Penghasilan" value={detailItem.siswa.ayahPenghasilan || '-'} />
                      <InfoField label="NIK Ayah" value={detailItem.siswa.ayahNik || '-'} />
                      <div className="sm:col-span-2"><p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1 mt-2">Data Ibu</p></div>
                      <InfoField label="Nama Ibu" value={detailItem.siswa.namaIbu || '-'} />
                      <InfoField label="Tahun Lahir" value={detailItem.siswa.ibuTahunLahir || '-'} />
                      <InfoField label="Jenjang Pendidikan" value={detailItem.siswa.ibuJenjangPendidikan || '-'} />
                      <InfoField label="Pekerjaan" value={detailItem.siswa.ibuPekerjaan || '-'} />
                      <InfoField label="Penghasilan" value={detailItem.siswa.ibuPenghasilan || '-'} />
                      <InfoField label="NIK Ibu" value={detailItem.siswa.ibuNik || '-'} />
                      <div className="sm:col-span-2"><p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1 mt-2">Data Wali</p></div>
                      <InfoField label="Nama Wali" value={detailItem.siswa.namaWali || '-'} />
                      <InfoField label="Tahun Lahir" value={detailItem.siswa.waliTahunLahir || '-'} />
                      <InfoField label="Jenjang Pendidikan" value={detailItem.siswa.waliJenjangPendidikan || '-'} />
                      <InfoField label="Pekerjaan" value={detailItem.siswa.waliPekerjaan || '-'} />
                      <InfoField label="Penghasilan" value={detailItem.siswa.waliPenghasilan || '-'} />
                      <InfoField label="NIK Wali" value={detailItem.siswa.waliNik || '-'} />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Section 4: Data Pendidikan & Lainnya */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 text-emerald-700">
                    <BookOpen className="size-4" /> Data Pendidikan & Lainnya
                  </h3>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <InfoField label="Rombel" value={detailItem.siswa.rombel || '-'} />
                      <InfoField label="Sekolah Asal" value={detailItem.siswa.sekolahAsal || '-'} />
                      <InfoField label="Status" value={detailItem.siswa.status || '-'} />
                      <InfoField label="SKHUN" value={detailItem.siswa.skhun || '-'} />
                      <InfoField label="No. Peserta UN" value={detailItem.siswa.noPesertaUN || '-'} />
                      <InfoField label="No. Seri Ijazah" value={detailItem.siswa.noSeriIjazah || '-'} />
                      <InfoField label="Penerima KPS" value={detailItem.siswa.penerimaKPS || '-'} />
                      <InfoField label="No. KPS" value={detailItem.siswa.noKPS || '-'} />
                      <InfoField label="Penerima KIP" value={detailItem.siswa.penerimaKIP || '-'} />
                      <InfoField label="Nomor KIP" value={detailItem.siswa.nomorKIP || '-'} />
                      <InfoField label="Nama KIP" value={detailItem.siswa.namaKIP || '-'} />
                      <InfoField label="Nomor KKS" value={detailItem.siswa.nomorKKS || '-'} />
                      <InfoField label="Layak PIP" value={detailItem.siswa.layakPIP || '-'} />
                      <InfoField label="Alasan Layak PIP" value={detailItem.siswa.alasanLayakPIP || '-'} />
                      <InfoField label="Bank" value={detailItem.siswa.bank || '-'} />
                      <InfoField label="Nomor Rekening Bank" value={detailItem.siswa.nomorRekeningBank || '-'} />
                      <InfoField label="Rekening Atas Nama" value={detailItem.siswa.rekeningAtasNama || '-'} />
                      <InfoField label="Berat Badan" value={detailItem.siswa.beratBadan || '-'} />
                      <InfoField label="Tinggi Badan" value={detailItem.siswa.tinggiBadan || '-'} />
                      <InfoField label="Lingkar Kepala" value={detailItem.siswa.lingkarKepala || '-'} />
                      <InfoField label="Lintang" value={detailItem.siswa.lintang || '-'} />
                      <InfoField label="Bujur" value={detailItem.siswa.bujur || '-'} />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Informasi Mutasi */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 text-emerald-700">
                    <FileText className="size-4" /> Informasi Mutasi
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <InfoField label="Tanggal Keluar" value={formatDate(detailItem.tanggalKeluar)} />
                    <div className="sm:col-span-2"><InfoField label="Tujuan Sekolah" value={detailItem.tujuanSekolah || '-'} /></div>
                    <div className="sm:col-span-2"><InfoField label="Alasan Mutasi" value={detailItem.alasan || '-'} /></div>
                    <InfoField label="No. Surat Mutasi" value={detailItem.noSurat || '-'} />
                    <InfoField label="Status Dapodik" value={detailItem.statusDapodik ? 'Sudah Masuk Dapodik' : 'Belum Masuk Dapodik'} />
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Tutup</Button>
            {detailItem && (
              <Button onClick={() => { setDetailOpen(false); openEditDialog(detailItem) }}>
                <Pencil className="mr-2 size-4" /> Edit
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
              <span className="font-semibold">{deletingItem?.siswa?.nama}</span>?
              <span className="block mt-2 text-amber-600">
                Status siswa akan dikembalikan ke &quot;Aktif&quot; secara otomatis.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

// ── Info Field ────────────────────────────────────────────────────────────────

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