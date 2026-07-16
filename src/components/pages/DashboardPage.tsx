'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  GraduationCap,
  LogIn,
  LogOut,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

// ── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  totalSiswa: number;
  totalGuru: number;
  totalMutasiMasuk: number;
  totalMutasiKeluar: number;
  siswaAktif: number;
  siswaNonaktif: number;
  guruAktif: number;
  guruNonaktif: number;
  siswaPerKelas: { kelas: string; jumlah: number }[];
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
    nama: string;
    nis: string;
    tujuanSekolah: string;
    tanggalKeluar: string;
  }[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTanggal(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ── Summary Card Config ──────────────────────────────────────────────────────

interface SummaryCardConfig {
  title: string;
  value: number | undefined;
  icon: React.ReactNode;
  iconBg: string;
  cardBg: string;
}

function getSummaryCards(data: DashboardData | undefined): SummaryCardConfig[] {
  return [
    {
      title: 'Total Siswa',
      value: data?.totalSiswa,
      icon: <Users className="h-5 w-5" />,
      iconBg: 'bg-emerald-50 text-emerald-600',
      cardBg: 'bg-emerald-50/40',
    },
    {
      title: 'Total Guru',
      value: data?.totalGuru,
      icon: <GraduationCap className="h-5 w-5" />,
      iconBg: 'bg-violet-50 text-violet-600',
      cardBg: 'bg-violet-50/40',
    },
    {
      title: 'Mutasi Masuk',
      value: data?.totalMutasiMasuk,
      icon: <LogIn className="h-5 w-5" />,
      iconBg: 'bg-amber-50 text-amber-600',
      cardBg: 'bg-amber-50/40',
    },
    {
      title: 'Mutasi Keluar',
      value: data?.totalMutasiKeluar,
      icon: <LogOut className="h-5 w-5" />,
      iconBg: 'bg-rose-50 text-rose-600',
      cardBg: 'bg-rose-50/40',
    },
  ];
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-4 p-6">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SummaryCards({ data }: { data: DashboardData }) {
  const cards = getSummaryCards(data);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className={card.cardBg}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${card.iconBg}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {card.title}
              </p>
              <p className="text-3xl font-bold tracking-tight">
                {card.value?.toLocaleString('id-ID') ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-52" />
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function SiswaPerKelasChart({ data }: { data: DashboardData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribusi Siswa per Kelas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.siswaPerKelas}
              margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="kelas"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value: number) => [`${value} siswa`, 'Jumlah']}
                labelFormatter={(label) => `Kelas ${label}`}
              />
              <Bar
                dataKey="jumlah"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={56}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function TahunPelajaranOverviewTable({
  data,
  activeTahunPelajaran,
  activeSemester,
}: {
  data: DashboardData['tahunPelajaranOverview'];
  activeTahunPelajaran: string;
  activeSemester: string;
}) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan per Tahun Pelajaran</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada data tahun pelajaran.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ringkasan per Tahun Pelajaran</CardTitle>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tahun Pelajaran</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Jumlah Siswa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, idx) => {
              const isActive =
                item.tahunPelajaran === activeTahunPelajaran &&
                item.semester === activeSemester;
              return (
                <TableRow
                  key={`${item.tahunPelajaran}-${item.semester}-${idx}`}
                  className={isActive ? 'bg-emerald-50' : ''}
                >
                  <TableCell className="font-medium whitespace-nowrap">
                    {item.tahunPelajaran}
                  </TableCell>
                  <TableCell>{item.semester}</TableCell>
                  <TableCell className="font-medium">
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

function TahunPelajaranOverviewSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-56" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentTablesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {[1, 2].map((key) => (
        <Card key={key}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RecentMutasiMasukTable({
  data,
}: {
  data: DashboardData['recentMutasiMasuk'];
}) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mutasi Masuk Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada data mutasi masuk.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mutasi Masuk Terbaru</CardTitle>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>NIS</TableHead>
              <TableHead>Sekolah Asal</TableHead>
              <TableHead>Tanggal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 5).map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium whitespace-nowrap">
                  {item.nama}
                </TableCell>
                <TableCell>{item.nis}</TableCell>
                <TableCell className="max-w-[180px] truncate">
                  {item.asalSekolah}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatTanggal(item.tanggalMasuk)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RecentMutasiKeluarTable({
  data,
}: {
  data: DashboardData['recentMutasiKeluar'];
}) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mutasi Keluar Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Belum ada data mutasi keluar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mutasi Keluar Terbaru</CardTitle>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>NIS</TableHead>
              <TableHead>Sekolah Tujuan</TableHead>
              <TableHead>Tanggal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 5).map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium whitespace-nowrap">
                  {item.nama}
                </TableCell>
                <TableCell>{item.nis}</TableCell>
                <TableCell className="max-w-[180px] truncate">
                  {item.tujuanSekolah}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatTanggal(item.tanggalKeluar)}
                </TableCell>
              </TableRow>
            ))}
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
        <p className="text-lg font-semibold text-destructive">
          Gagal memuat data dashboard
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Silakan coba lagi nanti.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Tahun Pelajaran {tahunPelajaran} &mdash; Semester {semester}
        </p>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <SummaryCardsSkeleton />
      ) : data ? (
        <SummaryCards data={data} />
      ) : null}

      {/* Bar Chart */}
      {isLoading ? (
        <ChartSkeleton />
      ) : data ? (
        <SiswaPerKelasChart data={data} />
      ) : null}

      {/* Ringkasan per Tahun Pelajaran */}
      {isLoading ? (
        <TahunPelajaranOverviewSkeleton />
      ) : data ? (
        <TahunPelajaranOverviewTable
          data={data.tahunPelajaranOverview}
          activeTahunPelajaran={tahunPelajaran}
          activeSemester={semester}
        />
      ) : null}

      {/* Recent Activity Tables */}
      {isLoading ? (
        <RecentTablesSkeleton />
      ) : data ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecentMutasiMasukTable data={data.recentMutasiMasuk} />
          <RecentMutasiKeluarTable data={data.recentMutasiKeluar} />
        </div>
      ) : null}
    </div>
  );
}