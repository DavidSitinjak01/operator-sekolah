'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  GraduationCap,
  LogIn,
  LogOut,
  TrendingUp,
  TrendingDown,
  School,
  UserRound,
  UserRoundPen,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
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

const CHART_COLORS = {
  emerald: '#10b981',
  blue: '#3b82f6',
  amber: '#f59e0b',
  rose: '#f43f5e',
  violet: '#8b5cf6',
  pink: '#ec4899',
};

// ── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: number | undefined;
  icon: React.ReactNode;
  gradient: string;
  iconRing: string;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ title, value, icon, gradient, iconRing, description, trend }: StatCardProps) {
  return (
    <Card className={cn(
      "border-0 overflow-hidden card-glow",
      "bg-gradient-to-br from-white to-muted/30",
      "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]"
    )}>
      <CardContent className="relative p-4 pb-4">
        {/* Decorative gradient blob */}
        <div className={cn(
          "absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.07] blur-xl",
          gradient
        )} />

        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest leading-none">{title}</p>
            <p className="text-2xl font-extrabold tracking-tight mt-2 leading-none text-foreground">
              {(value ?? 0).toLocaleString('id-ID')}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              {trend && (
                <span className={cn(
                  "inline-flex items-center gap-0.5 text-[11px] font-semibold leading-none px-1.5 py-0.5 rounded-md",
                  trend === 'up' && "bg-emerald-50 text-emerald-600",
                  trend === 'down' && "bg-rose-50 text-rose-500",
                  trend === 'neutral' && "bg-slate-100 text-slate-400",
                )}>
                  {trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
                  {trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
                  {trend === 'neutral' && <Minus className="h-3 w-3" />}
                </span>
              )}
              {description && (
                <span className="text-[11px] text-muted-foreground/70 truncate leading-none">{description}</span>
              )}
            </div>
          </div>
          <div className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            gradient, iconRing
          )}>
            <div className="text-white drop-shadow-sm">
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCards({ data }: { data: DashboardData }) {
  const aktif = data.statusDistribution.find((s) => s.status === 'Aktif')?.jumlah ?? 0;
  const mutasiOut = data.statusDistribution.find((s) => s.status === 'Mutasi Keluar')?.jumlah ?? 0;
  const laki = data.genderDistribution.find((g) => g.jenisKelamin === 'L')?.jumlah ?? 0;
  const perempuan = data.genderDistribution.find((g) => g.jenisKelamin === 'P')?.jumlah ?? 0;
  const rasioGuru = data.totalSiswa > 0
    ? (data.totalSiswa / Math.max(data.totalGuru, 1)).toFixed(1)
    : '-';

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard
        title="Siswa Aktif"
        value={aktif}
        icon={<Users className="h-5 w-5" />}
        gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
        iconRing="shadow-lg shadow-emerald-500/25"
        description={`${laki} L · ${perempuan} P`}
        trend="neutral"
      />
      <StatCard
        title="Mutasi Keluar"
        value={mutasiOut}
        icon={<LogOut className="h-5 w-5" />}
        gradient="bg-gradient-to-br from-rose-400 to-rose-500"
        iconRing="shadow-lg shadow-rose-400/25"
        trend="down"
      />
      <StatCard
        title="Mutasi Masuk"
        value={data.totalMutasiMasuk}
        icon={<LogIn className="h-5 w-5" />}
        gradient="bg-gradient-to-br from-amber-400 to-orange-500"
        iconRing="shadow-lg shadow-amber-400/25"
        trend={data.totalMutasiMasuk > 0 ? 'up' : 'neutral'}
      />
      <StatCard
        title="Total Guru"
        value={data.totalGuru}
        icon={<GraduationCap className="h-5 w-5" />}
        gradient="bg-gradient-to-br from-violet-500 to-purple-600"
        iconRing="shadow-lg shadow-violet-500/25"
        description={`Rasio 1:${rasioGuru}`}
      />
      <StatCard
        title="Laki-laki"
        value={laki}
        icon={<UserRound className="h-5 w-5" />}
        gradient="bg-gradient-to-br from-sky-400 to-blue-500"
        iconRing="shadow-lg shadow-sky-400/25"
        description={data.totalSiswa > 0 ? `${((laki / data.totalSiswa) * 100).toFixed(1)}%` : undefined}
      />
      <StatCard
        title="Perempuan"
        value={perempuan}
        icon={<UserRoundPen className="h-5 w-5" />}
        gradient="bg-gradient-to-br from-pink-400 to-pink-500"
        iconRing="shadow-lg shadow-pink-400/25"
        description={data.totalSiswa > 0 ? `${((perempuan / data.totalSiswa) * 100).toFixed(1)}%` : undefined}
      />
    </div>
  );
}

// ── Skeletons ────────────────────────────────────────────────────────────────

function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="border-0 shadow-sm">
          <CardContent className="p-4">
            <Skeleton className="h-3 w-16 mb-3" />
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-7 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-11 w-11 rounded-2xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn(
      "border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]",
      className
    )}>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[260px] w-full rounded-xl" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Card className="border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-44" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-9 w-full rounded-lg" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Charts ──────────────────────────────────────────────────────────────────

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid hsl(var(--border))',
  boxShadow: '0 8px 30px rgb(0 0 0 / 0.08)',
  fontSize: 13,
  padding: '10px 14px',
};

function SiswaPerKelasChart({ data }: { data: DashboardData }) {
  return (
    <Card className={cn(
      "border-0 overflow-hidden",
      "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]",
      "bg-gradient-to-br from-white to-muted/20"
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Distribusi Siswa per Rombel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.siswaPerRombel} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
              <XAxis dataKey="kelas" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar
                dataKey="jumlah"
                fill="url(#barGradient)"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.emerald} stopOpacity={1} />
                  <stop offset="100%" stopColor={CHART_COLORS.emerald} stopOpacity={0.6} />
                </linearGradient>
              </defs>
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
      <Card className={cn(
        "border-0",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]",
        "bg-gradient-to-br from-white to-muted/20"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <UserRound className="h-4 w-4 text-primary" />
            Rasio Jenis Kelamin
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[260px]">
          <p className="text-sm text-muted-foreground">Belum ada data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-0 overflow-hidden",
      "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]",
      "bg-gradient-to-br from-white to-muted/20"
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <UserRound className="h-4 w-4 text-primary" />
          Rasio Jenis Kelamin
        </CardTitle>
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
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                strokeWidth={0}
              >
                {genderData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? CHART_COLORS.blue : CHART_COLORS.pink} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value} siswa`, 'Jumlah']} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
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
    <Card className={cn(
      "border-0 overflow-hidden",
      "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]",
      "bg-gradient-to-br from-white to-muted/20"
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <School className="h-4 w-4 text-primary" />
          Ringkasan per Tahun Pelajaran
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[280px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/60 hover:bg-transparent">
              <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Tahun Pelajaran</TableHead>
              <TableHead className="text-center text-muted-foreground font-semibold text-xs uppercase tracking-wider">Semester</TableHead>
              <TableHead className="text-center text-muted-foreground font-semibold text-xs uppercase tracking-wider">Siswa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, idx) => {
              const isActive = item.tahunPelajaran === activeTP && item.semester === activeSem;
              return (
                <TableRow key={`${item.tahunPelajaran}-${item.semester}-${idx}`} className={cn(
                  "transition-colors",
                  isActive ? "bg-primary/5" : "hover:bg-muted/40"
                )}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {item.tahunPelajaran}
                    {isActive && (
                      <Badge className="ml-2 text-[10px] px-1.5 py-0 bg-primary text-primary-foreground font-semibold">Aktif</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{item.semester}</TableCell>
                  <TableCell className="text-center font-bold">
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

  const isMasuk = type === 'masuk';

  return (
    <Card className={cn(
      "border-0 overflow-hidden",
      "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]",
      "bg-gradient-to-br from-white to-muted/20"
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            isMasuk ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-500"
          )}>
            {isMasuk ? <LogIn className="h-3.5 w-3.5" /> : <LogOut className="h-3.5 w-3.5" />}
          </div>
          Mutasi {isMasuk ? 'Masuk' : 'Keluar'} Terbaru
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/60 hover:bg-transparent">
              <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Nama</TableHead>
              {isMasuk ? (
                <TableHead className="hidden sm:table-cell text-muted-foreground font-semibold text-xs uppercase tracking-wider">Sekolah Asal</TableHead>
              ) : (
                <>
                  <TableHead className="hidden sm:table-cell text-muted-foreground font-semibold text-xs uppercase tracking-wider">Rombel</TableHead>
                  <TableHead className="hidden sm:table-cell text-muted-foreground font-semibold text-xs uppercase tracking-wider">Tujuan</TableHead>
                </>
              )}
              <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Tanggal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 5).map((item) => {
              if (isMasuk) {
                const m = item as DashboardData['recentMutasiMasuk'][number];
                return (
                  <TableRow key={m.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium whitespace-nowrap">{m.nama}</TableCell>
                    <TableCell className="hidden sm:table-cell max-w-[160px] truncate text-muted-foreground">{m.asalSekolah || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-xs">{formatTanggal(m.tanggalMasuk)}</TableCell>
                  </TableRow>
                );
              } else {
                const k = item as DashboardData['recentMutasiKeluar'][number];
                return (
                  <TableRow key={k.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium whitespace-nowrap">{k.siswa?.nama || '-'}</TableCell>
                    <TableCell className="hidden sm:table-cell">{k.siswa?.rombel || '-'}</TableCell>
                    <TableCell className="hidden sm:table-cell max-w-[140px] truncate text-muted-foreground">{k.tujuanSekolah || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-xs">{formatTanggal(k.tanggalKeluar)}</TableCell>
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
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 mb-4">
          <Activity className="h-8 w-8 text-rose-500" />
        </div>
        <p className="text-lg font-bold text-destructive">Gagal memuat data dashboard</p>
        <p className="mt-1 text-sm text-muted-foreground">Silakan coba lagi nanti.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight gradient-text">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tahun Pelajaran <span className="font-semibold text-foreground">{tahunPelajaran}</span> — Semester <span className="font-semibold text-foreground">{semester}</span>
          </p>
        </div>
        {data && (
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {data.totalSiswa.toLocaleString('id-ID')} siswa &middot; {data.totalGuru} guru
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {isLoading ? <StatCardsSkeleton /> : data ? <StatCards data={data} /> : null}

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
