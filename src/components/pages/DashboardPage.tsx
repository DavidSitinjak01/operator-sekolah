'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users, GraduationCap, LogIn, LogOut, TrendingUp,
  School, UserRound, UserRoundPen, Activity, ArrowUpRight,
  ArrowDownRight, Minus, ClipboardCheck, CalendarCheck,
  AlertTriangle, Clock, ChevronRight, CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
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
  recentMutasiMasuk: { id: string; nama: string; nis: string; asalSekolah: string; tanggalMasuk: string }[];
  recentMutasiKeluar: { id: string; tujuanSekolah: string; tanggalKeluar: string; siswa: { nama: string; nipd: string; nisn: string; rombel: string } | null }[];
  // Absensi enrichment
  tanggalHariIni: string;
  bulanIni: string;
  hariIni: { hadir: number; sakit: number; izin: number; alpa: number; total: number; totalSiswa: number };
  bulanIniSummary: { hadir: number; sakit: number; izin: number; alpa: number; total: number };
  totalAbsensiRecords: number;
  perRombelAbsensi: {
    rombel: string; totalSiswa: number;
    todayHadir: number; todaySakit: number; todayIzin: number; todayAlpa: number; todayFilled: number;
    monthHadir: number; monthSakit: number; monthIzin: number; monthAlpa: number; monthFilled: number;
  }[];
  totalRombelAbsensi: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTanggal(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatHariIni(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

const C = {
  emerald: '#10b981', blue: '#3b82f6', amber: '#f59e0b', rose: '#f43f5e',
  violet: '#8b5cf6', pink: '#ec4899', cyan: '#06b6d4', orange: '#f97316',
};

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid hsl(var(--border))',
  boxShadow: '0 8px 30px rgb(0 0 0 / 0.08)',
  fontSize: 13,
  padding: '10px 14px',
};

// ── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: number | string | undefined;
  icon: React.ReactNode;
  gradient: string;
  iconRing: string;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  subValue?: string;
}

function StatCard({ title, value, icon, gradient, iconRing, description, trend, subValue }: StatCardProps) {
  return (
    <Card className={cn(
      "border-0 overflow-hidden",
      "bg-gradient-to-br from-white to-muted/30",
      "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]"
    )}>
      <CardContent className="relative p-4 pb-4">
        <div className={cn(
          "absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.07] blur-xl",
          gradient
        )} />
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest leading-none">{title}</p>
            <p className="text-2xl font-extrabold tracking-tight mt-2 leading-none text-foreground">
              {typeof value === 'number' ? value.toLocaleString('id-ID') : value ?? 0}
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
            {subValue && (
              <p className="text-[11px] text-muted-foreground/60 mt-1 leading-none">{subValue}</p>
            )}
          </div>
          <div className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            gradient, iconRing
          )}>
            <div className="text-white drop-shadow-sm">{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCards({ data }: { data: DashboardData }) {
  const aktif = data.statusDistribution.find((s) => s.status === 'Aktif')?.jumlah ?? 0;
  const laki = data.genderDistribution.find((g) => g.jenisKelamin === 'L')?.jumlah ?? 0;
  const perempuan = data.genderDistribution.find((g) => g.jenisKelamin === 'P')?.jumlah ?? 0;
  const rasioGuru = data.totalSiswa > 0
    ? (data.totalSiswa / Math.max(data.totalGuru, 1)).toFixed(1)
    : '-';

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
      {/* ── Attendance Today ── */}
      <StatCard
        title="Hadir Hari Ini"
        value={data.hariIni.hadir}
        icon={<CheckCircle2 className="h-5 w-5" />}
        gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
        iconRing="shadow-lg shadow-emerald-500/25"
        description={data.hariIni.totalSiswa > 0 ? `${data.hariIni.hadir}/${data.hariIni.totalSiswa} siswa (${((data.hariIni.hadir / data.hariIni.totalSiswa) * 100).toFixed(0)}%)` : 'Belum ada data'}
        trend="neutral"
        subValue={data.hariIni.total > 0 ? `${data.hariIni.total} record diisi` : 'Belum ada absensi hari ini'}
      />
      <StatCard
        title="Sakit Hari Ini"
        value={data.hariIni.sakit}
        icon={<AlertTriangle className="h-5 w-5" />}
        gradient="bg-gradient-to-br from-amber-400 to-orange-500"
        iconRing="shadow-lg shadow-amber-400/25"
        trend="neutral"
      />
      <StatCard
        title="Izin Hari Ini"
        value={data.hariIni.izin}
        icon={<Clock className="h-5 w-5" />}
        gradient="bg-gradient-to-br from-blue-400 to-blue-500"
        iconRing="shadow-lg shadow-blue-400/25"
        trend="neutral"
      />
      <StatCard
        title="Alpa Hari Ini"
        value={data.hariIni.alpa}
        icon={<XCircle className="h-5 w-5" />}
        gradient="bg-gradient-to-br from-rose-400 to-rose-500"
        iconRing="shadow-lg shadow-rose-400/25"
        trend="down"
      />
      {/* ── General Stats ── */}
      <StatCard
        title="Siswa Aktif"
        value={aktif}
        icon={<Users className="h-5 w-5" />}
        gradient="bg-gradient-to-br from-cyan-400 to-cyan-500"
        iconRing="shadow-lg shadow-cyan-400/25"
        description={`${laki} L · ${perempuan} P`}
        trend="neutral"
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
        title="Mutasi Masuk"
        value={data.totalMutasiMasuk}
        icon={<LogIn className="h-5 w-5" />}
        gradient="bg-gradient-to-br from-emerald-400 to-teal-500"
        iconRing="shadow-lg shadow-emerald-400/25"
        trend={data.totalMutasiMasuk > 0 ? 'up' : 'neutral'}
      />
      <StatCard
        title="Mutasi Keluar"
        value={data.totalMutasiKeluar}
        icon={<LogOut className="h-5 w-5" />}
        gradient="bg-gradient-to-br from-pink-400 to-rose-500"
        iconRing="shadow-lg shadow-pink-400/25"
        trend="down"
      />
    </div>
  );
}

// ── Skeletons ────────────────────────────────────────────────────────────────

function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
      {Array.from({ length: 8 }).map((_, i) => (
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

// ── Kehadiran Chart (Stacked Bar) ──────────────────────────────────────────

function KehadiranChart({ data }: { data: DashboardData }) {
  const chartData = data.perRombelAbsensi.map((r) => ({
    name: r.rombel,
    Hadir: r.monthHadir,
    Sakit: r.monthSakit,
    Izin: r.monthIzin,
    Alpa: r.monthAlpa,
  }));

  if (chartData.length === 0) {
    return (
      <Card className={cn(
        "border-0 overflow-hidden",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]",
        "bg-gradient-to-br from-white to-muted/20"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            Rekap Kehadiran Bulan Ini per Rombel
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[280px]">
          <div className="text-center">
            <ClipboardCheck className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Belum ada data absensi</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Mulai input absensi di menu Absensi Siswa</p>
          </div>
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            Rekap Kehadiran Bulan Ini
          </CardTitle>
          <Badge variant="secondary" className="text-[10px] font-medium">
            {data.bulanIni} · {data.totalAbsensiRecords.toLocaleString('id-ID')} record
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Hadir" stackId="a" fill={C.emerald} radius={[0, 0, 0, 0]} maxBarSize={32} />
              <Bar dataKey="Sakit" stackId="a" fill={C.amber} maxBarSize={32} />
              <Bar dataKey="Izin" stackId="a" fill={C.blue} maxBarSize={32} />
              <Bar dataKey="Alpa" stackId="a" fill={C.rose} radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Siswa Per Rombel Bar Chart ─────────────────────────────────────────────

function SiswaPerKelasChart({ data }: { data: DashboardData }) {
  return (
    <Card className={cn(
      "border-0 overflow-hidden",
      "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]",
      "bg-gradient-to-br from-white to-muted/20"
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
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
              <Bar dataKey="jumlah" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.emerald} stopOpacity={1} />
                  <stop offset="100%" stopColor={C.emerald} stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Gender Pie Chart ──────────────────────────────────────────────────────

function GenderPieChart({ data }: { data: DashboardData }) {
  const genderData = data.genderDistribution
    .filter((g) => g.jenisKelamin === 'L' || g.jenisKelamin === 'P')
    .map((g) => ({
      name: g.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      value: g.jumlah,
    }));

  if (genderData.length === 0 || genderData.every((d) => d.value === 0)) {
    return (
      <Card className={cn("border-0", "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]", "bg-gradient-to-br from-white to-muted/20")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <UserRound className="h-4 w-4 text-primary" /> Rasio Jenis Kelamin
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[260px]">
          <p className="text-sm text-muted-foreground">Belum ada data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-0 overflow-hidden", "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]", "bg-gradient-to-br from-white to-muted/20")}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <UserRound className="h-4 w-4 text-primary" /> Rasio Jenis Kelamin
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={genderData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} strokeWidth={0}>
                {genderData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? C.blue : C.pink} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value} siswa`, 'Jumlah']} />
              <Legend verticalAlign="bottom" iconType="circle" iconSize={8}
                formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Kehadiran Bulan Ini Pie ──────────────────────────────────────────────

function KehadiranPieChart({ data }: { data: DashboardData }) {
  const pieData = [
    { name: 'Hadir', value: data.bulanIniSummary.hadir },
    { name: 'Sakit', value: data.bulanIniSummary.sakit },
    { name: 'Izin', value: data.bulanIniSummary.izin },
    { name: 'Alpa', value: data.bulanIniSummary.alpa },
  ].filter((d) => d.value > 0);

  if (pieData.length === 0) {
    return (
      <Card className={cn("border-0", "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]", "bg-gradient-to-br from-white to-muted/20")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-primary" /> Distribusi Kehadiran Bulan Ini
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[260px]">
          <p className="text-sm text-muted-foreground">Belum ada data</p>
        </CardContent>
      </Card>
    );
  }

  const pieColors = [C.emerald, C.amber, C.blue, C.rose];

  return (
    <Card className={cn("border-0 overflow-hidden", "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]", "bg-gradient-to-br from-white to-muted/20")}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-primary" /> Distribusi Kehadiran Bulan Ini
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} strokeWidth={0}>
                {pieData.map((_, index) => (
                  <Cell key={`kehadiran-${index}`} fill={pieColors[index] || '#888'} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value.toLocaleString('id-ID')}`, 'Jumlah']} />
              <Legend verticalAlign="bottom" iconType="circle" iconSize={8}
                formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Tahun Pelajaran Table ──────────────────────────────────────────────────

function TahunPelajaranOverview({ data, activeTP, activeSem }: {
  data: DashboardData['tahunPelajaranOverview'];
  activeTP: string;
  activeSem: string;
}) {
  if (!data || data.length === 0) return null;

  return (
    <Card className={cn("border-0 overflow-hidden", "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]", "bg-gradient-to-br from-white to-muted/20")}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <School className="h-4 w-4 text-primary" /> Ringkasan per Tahun Pelajaran
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
                  <TableCell className="text-center font-bold">{item.jumlahSiswa.toLocaleString('id-ID')}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ── Per-Rombel Absensi Table ────────────────────────────────────────────────

function PerRombelAbsensiTable({ data, todayStr }: { data: DashboardData; todayStr: string }) {
  if (!data.perRombelAbsensi || data.perRombelAbsensi.length === 0) return null;

  return (
    <Card className={cn("border-0 overflow-hidden", "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]", "bg-gradient-to-br from-white to-muted/20")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            Kehadiran per Rombel
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-medium gap-1">
            <CalendarCheck className="h-3 w-3" />
            {todayStr}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="max-h-[340px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/60 hover:bg-transparent">
              <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Rombel</TableHead>
              <TableHead className="text-center text-muted-foreground font-semibold text-xs uppercase tracking-wider">Siswa</TableHead>
              <TableHead className="text-center text-muted-foreground font-semibold text-xs uppercase tracking-wider" style={{ color: C.emerald }}>H</TableHead>
              <TableHead className="text-center text-muted-foreground font-semibold text-xs uppercase tracking-wider" style={{ color: C.amber }}>S</TableHead>
              <TableHead className="text-center text-muted-foreground font-semibold text-xs uppercase tracking-wider" style={{ color: C.blue }}>I</TableHead>
              <TableHead className="text-center text-muted-foreground font-semibold text-xs uppercase tracking-wider" style={{ color: C.rose }}>A</TableHead>
              <TableHead className="text-center text-muted-foreground font-semibold text-xs uppercase tracking-wider">Diisi</TableHead>
              <TableHead className="text-center text-muted-foreground font-semibold text-xs uppercase tracking-wider">% Hadir</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.perRombelAbsensi.map((r, idx) => {
              const pct = r.totalSiswa > 0 ? ((r.todayHadir / r.totalSiswa) * 100).toFixed(0) : '-';
              const filledInfo = r.todayFilled > 0 ? `${r.todayFilled}/${r.totalSiswa}` : '-';
              return (
                <TableRow key={r.rombel} className={cn(
                  idx % 2 === 1 && "bg-muted/20",
                  "hover:bg-muted/40 transition-colors"
                )}>
                  <TableCell className="font-medium whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                      {r.rombel}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">{r.totalSiswa}</TableCell>
                  <TableCell className="text-center font-semibold" style={{ color: r.todayHadir > 0 ? C.emerald : undefined }}>{r.todayHadir}</TableCell>
                  <TableCell className="text-center" style={{ color: r.todaySakit > 0 ? C.amber : undefined }}>{r.todaySakit}</TableCell>
                  <TableCell className="text-center" style={{ color: r.todayIzin > 0 ? C.blue : undefined }}>{r.todayIzin}</TableCell>
                  <TableCell className="text-center" style={{ color: r.todayAlpa > 0 ? C.rose : undefined }}>{r.todayAlpa}</TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    <span className="text-[10px]">{filledInfo}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={pct === '-' ? 'secondary' : Number(pct) >= 80 ? 'default' : Number(pct) >= 60 ? 'secondary' : 'destructive'}
                      className={cn("text-[10px] px-1.5 py-0 font-semibold",
                        Number(pct) >= 80 && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
                        Number(pct) >= 60 && Number(pct) < 80 && "bg-amber-100 text-amber-700 hover:bg-amber-100",
                        Number(pct) < 60 && Number(pct) > 0 && "bg-rose-100 text-rose-700 hover:bg-rose-100",
                        pct === '-' && "bg-muted text-muted-foreground hover:bg-muted",
                      )}>
                      {pct === '-' ? '-' : `${pct}%`}
                    </Badge>
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

// ── Recent Mutasi Table ─────────────────────────────────────────────────────

function RecentMutasiTable({ data, type }: { data: DashboardData['recentMutasiMasuk'] | DashboardData['recentMutasiKeluar']; type: 'masuk' | 'keluar' }) {
  if (!data || data.length === 0) return null;
  const isMasuk = type === 'masuk';

  return (
    <Card className={cn("border-0 overflow-hidden", "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]", "bg-gradient-to-br from-white to-muted/20")}>
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

// ── Main Dashboard ────────────────────────────────────────────────────────

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
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            TP <span className="font-semibold text-foreground">{tahunPelajaran}</span> — Semester <span className="font-semibold text-foreground">{semester}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data && (
            <>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">Hari ini</p>
                <p className="text-xs font-medium text-foreground">{formatHariIni(data.tanggalHariIni)}</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {data.totalSiswa.toLocaleString('id-ID')} siswa · {data.totalGuru} guru
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      {isLoading ? <StatCardsSkeleton /> : data ? <StatCards data={data} /> : null}

      {/* ── Row 1: Kehadiran Bulan Ini (stacked bar) + Kehadiran Pie + Gender Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5">
          {isLoading ? <ChartSkeleton /> : data ? <KehadiranPieChart data={data} /> : null}
        </div>
        <div className="lg:col-span-4">
          {isLoading ? <ChartSkeleton /> : data ? <GenderPieChart data={data} /> : null}
        </div>
        <div className="lg:col-span-3">
          {isLoading ? <ChartSkeleton /> : data ? <SiswaPerKelasChart data={data} /> : null}
        </div>
      </div>

      {/* ── Row 2: Rekap Kehadiran per Rombel (wide chart) + Per-Rombel Detail Table ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          {isLoading ? <ChartSkeleton /> : data ? <KehadiranChart data={data} /> : null}
        </div>
        <div className="lg:col-span-5">
          {isLoading ? <TableSkeleton /> : data ? (
            <PerRombelAbsensiTable data={data} todayStr={data.tanggalHariIni} />
          ) : null}
        </div>
      </div>

      {/* ── Row 3: Tahun Pelajaran + Recent Mutasi ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4">
          {isLoading ? <TableSkeleton /> : data ? (
            <TahunPelajaranOverview data={data.tahunPelajaranOverview} activeTP={tahunPelajaran} activeSem={semester} />
          ) : null}
        </div>
        <div className="lg:col-span-4">
          {isLoading ? <TableSkeleton /> : data ? (
            <RecentMutasiTable data={data.recentMutasiKeluar} type="keluar" />
          ) : null}
        </div>
        <div className="lg:col-span-4">
          {isLoading ? <TableSkeleton /> : data ? (
            <RecentMutasiTable data={data.recentMutasiMasuk} type="masuk" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
