'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  GraduationCap,
  LogIn,
  LogOut,
  TrendingUp,
  School,
  UserRound,
  UserRoundPen,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store/app';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  totalSiswa: number;
  totalGuru: number;
  totalMutasiMasuk: number;
  totalMutasiKeluar: number;
  genderDistribution: { jenisKelamin: string; jumlah: number }[];
  statusDistribution: { status: string; jumlah: number }[];
  siswaPerRombel: { kelas: string; jumlah: number }[];
  tahunPelajaranOverview: { tahunPelajaran: string; semester: string; jumlahSiswa: number }[];
  recentMutasiMasuk: {
    id: string;
    nama: string;
    nis: string;
    asalSekolah: string;
    tanggalMasuk: string;
  }[];
  recentMutasiKeluar: {
    id: string;
    tujuanSekolah: string;
    tanggalKeluar: string;
    siswa: { nama: string; nipd: string; nisn: string; rombel: string } | null;
  }[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTanggal(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

const PIE_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// ── Summary Card ──────────────────────────────────────────────────────────

function SummaryCard({
  title,
  value,
  icon,
  iconBg,
  description,
  trend,
}: {
  title: string;
  value: number | undefined;
  icon: React.ReactNode;
  iconBg: string;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', iconBg)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider leading-none">{title}</p>
          <p className="text-xl font-bold tracking-tight mt-1 leading-none">
            {(value ?? 0).toLocaleString('id-ID')}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            {trend && (
              <span className={cn(
                'inline-flex items-center gap-0.5 text-[11px] font-medium leading-none',
                trend === 'up' && 'text-emerald-600',
                trend === 'down' && 'text-rose-600',
                trend === 'neutral' && 'text-slate-400',
              )}>
                <TrendingUp className="h-3 w-3" />
              </span>
            )}
            {description && (
              <span className="text-[11px] text-muted-foreground truncate leading-none">{description}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCards({ data }: { data: DashboardData }) {
  const aktif = data.statusDistribution.find((s) => s.status === 'Aktif')?.jumlah ?? 0;
  const mutasiOut = data.statusDistribution.find((s) => s.status === 'Mutasi Keluar')?.jumlah ?? 0;
  const laki = data.genderDistribution.find((g) => g.jenisKelamin === 'L')?.jumlah ?? 0;
  const perempuan = data.genderDistribution.find((g) => g.jenisKelamin === 'P')?.jumlah ?? 0;
  const rasioGuru = data.totalSiswa > 0
    ? (data.totalSiswa / Math.max(data.totalGuru, 1)).toFixed(1)
    : '-';

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <SummaryCard
        title="Siswa Aktif"
        value={aktif}
        icon={<Users className="h-5 w-5" />}
        iconBg="bg-emerald-100 text-emerald-600"
        description={`${laki} L · ${perempuan} P`}
        trend="neutral"
      />
      <SummaryCard
        title="Mutasi Keluar"
        value={mutasiOut}
        icon={<LogOut className="h-5 w-5" />}
        iconBg="bg-rose-100 text-rose-600"
        trend="down"
      />
      <SummaryCard
        title="Mutasi Masuk"
        value={data.totalMutasiMasuk}
        icon={<LogIn className="h-5 w-5" />}
        iconBg="bg-amber-100 text-amber-600"
        trend={data.totalMutasiMasuk > 0 ? 'up' : 'neutral'}
      />
      <SummaryCard
        title="Total Guru"
        value={data.totalGuru}
        icon={<GraduationCap className="h-5 w-5" />}
        iconBg="bg-violet-100 text-violet-600"
        description={`Rasio 1:${rasioGuru}`}
      />
      <SummaryCard
        title="Laki-laki"
        value={laki}
        icon={<UserRound className="h-5 w-5" />}
        iconBg="bg-sky-100 text-sky-600"
        description={data.totalSiswa > 0 ? `${((laki / data.totalSiswa) * 100).toFixed(1)}%` : undefined}
      />
      <SummaryCard
        title="Perempuan"
        value={perempuan}
        icon={<UserRoundPen className="h-5 w-5" />}
        iconBg="bg-pink-100 text-pink-600"
        description={data.totalSiswa > 0 ? `${((perempuan / data.totalSiswa) * 100).toFixed(1)}%` : undefined}
      />
    </div>
  );
}

// ── Skeletons ────────────────────────────────────────────────────────────────

function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('border-0 shadow-sm', className)}>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[260px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-44" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-9 w-full" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Charts ──────────────────────────────────────────────────────────────────

function SiswaPerKelasChart({ data }: { data: DashboardData }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Distribusi Siswa per Rombel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.siswaPerRombel} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="kelas" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: 13,
                }}
                formatter={(value: number) => [`${value} siswa`, 'Jumlah']}
                labelFormatter={(label) => `Rombel ${label}`}
              />
              <Bar dataKey="jumlah" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function GenderPieChart({ data }: { data: DashboardData }) {
  const genderData = data.genderDistribution.filter((g) => g.jenisKelamin === 'L' || g.jenisKelamin === 'P')
    .map((g) => ({
      name: g.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      value: g.jumlah,
    }));

  if (genderData.length === 0 || genderData.every((d) => d.value === 0)) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Rasio Jenis Kelamin</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[260px]">
          <p className="text-sm text-muted-foreground">Belum ada data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Rasio Jenis Kelamin</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {genderData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#0ea5e9' : '#ec4899'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  fontSize: 13,
                }}
                formatter={(value: number) => [`${value} siswa`, 'Jumlah']}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Tables ──────────────────────────────────────────────────────────────────

function TahunPelajaranOverview({
  data,
  activeTP,
  activeSem,
}: {
  data: DashboardData['tahunPelajaranOverview'];
  activeTP: string;
  activeSem: string;
}) {
  if (!data || data.length === 0) return null;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <School className="h-4 w-4 text-muted-foreground" />
          Ringkasan per Tahun Pelajaran
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[280px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tahun Pelajaran</TableHead>
              <TableHead className="text-center">Semester</TableHead>
              <TableHead className="text-center">Siswa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, idx) => {
              const isActive = item.tahunPelajaran === activeTP && item.semester === activeSem;
              return (
                <TableRow key={`${item.tahunPelajaran}-${item.semester}-${idx}`} className={isActive ? 'bg-primary/5' : ''}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {item.tahunPelajaran}
                    {isActive && (
                      <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">Aktif</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{item.semester}</TableCell>
                  <TableCell className="text-center font-semibold">
                    {item.jumlahSiswa.toLocaleString('id-ID')}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RecentMutasiTable({ data, type }: { data: DashboardData['recentMutasiMasuk'] | DashboardData['recentMutasiKeluar']; type: 'masuk' | 'keluar' }) {
  if (!data || data.length === 0) return null;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          {type === 'masuk' ? <LogIn className="h-4 w-4 text-amber-500" /> : <LogOut className="h-4 w-4 text-rose-500" />}
          Mutasi {type === 'masuk' ? 'Masuk' : 'Keluar'} Terbaru
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              {type === 'masuk' ? (
                <>
                  <TableHead className="hidden sm:table-cell">Sekolah Asal</TableHead>
                </>
              ) : (
                <>
                  <TableHead className="hidden sm:table-cell">Rombel</TableHead>
                  <TableHead className="hidden sm:table-cell">Tujuan</TableHead>
                </>
              )}
              <TableHead>Tanggal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 5).map((item) => {
              if (type === 'masuk') {
                const m = item as DashboardData['recentMutasiMasuk'][number];
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium whitespace-nowrap">{m.nama}</TableCell>
                    <TableCell className="hidden sm:table-cell max-w-[160px] truncate">{m.asalSekolah || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatTanggal(m.tanggalMasuk)}</TableCell>
                  </TableRow>
                );
              } else {
                const k = item as DashboardData['recentMutasiKeluar'][number];
                return (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium whitespace-nowrap">{k.siswa?.nama || '-'}</TableCell>
                    <TableCell className="hidden sm:table-cell">{k.siswa?.rombel || '-'}</TableCell>
                    <TableCell className="hidden sm:table-cell max-w-[140px] truncate">{k.tujuanSekolah || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatTanggal(k.tanggalKeluar)}</TableCell>
                  </TableRow>
                );
              }
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { tahunPelajaran, semester } = useAppStore();

  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ['dashboard', tahunPelajaran, semester],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('tahunPelajaran', tahunPelajaran);
      params.set('semester', semester);
      const res = await fetch(`/api/dashboard?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat data dashboard');
      return res.json();
    },
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-semibold text-destructive">Gagal memuat data dashboard</p>
        <p className="mt-1 text-sm text-muted-foreground">Silakan coba lagi nanti.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Tahun Pelajaran {tahunPelajaran} — Semester {semester}
          </p>
        </div>
        {data && (
          <p className="text-xs text-muted-foreground">
            {data.totalSiswa.toLocaleString('id-ID')} siswa · {data.totalGuru} guru
          </p>
        )}
      </div>

      {/* Summary Cards */}
      {isLoading ? <SummaryCardsSkeleton /> : data ? <SummaryCards data={data} /> : null}

      {/* Charts Row: Bar Chart + Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          {isLoading ? <ChartSkeleton /> : data ? <SiswaPerKelasChart data={data} /> : null}
        </div>
        <div className="lg:col-span-2">
          {isLoading ? <ChartSkeleton /> : data ? <GenderPieChart data={data} /> : null}
        </div>
      </div>

      {/* Bottom Row: TP Overview + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          {isLoading ? <TableSkeleton /> : data ? (
            <TahunPelajaranOverview
              data={data.tahunPelajaranOverview}
              activeTP={tahunPelajaran}
              activeSem={semester}
            />
          ) : null}
        </div>
        <div className="lg:col-span-3">
          {isLoading ? <TableSkeleton /> : data ? (
            <div className="space-y-4">
              <RecentMutasiTable data={data.recentMutasiKeluar} type="keluar" />
              <RecentMutasiTable data={data.recentMutasiMasuk} type="masuk" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
