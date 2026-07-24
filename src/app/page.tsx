"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, Users, LogIn, LogOut, GraduationCap, Menu, X, School, CalendarDays, Settings, Plus, Trash2, Loader2, Shield, UserCog, KeyRound, Eye, EyeOff, PanelLeftClose, PanelLeftOpen, CalendarClock, ClipboardCheck, FileText, BookOpenCheck, Link as LinkIcon, Brain, Palette, MonitorSmartphone } from "lucide-react";
import { useAppStore } from "@/store/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import AuthGuard from "@/components/AuthGuard";
import DashboardPage from "@/components/pages/DashboardPage";
import SiswaPage from "@/components/pages/SiswaPage";
import MutasiMasukPage from "@/components/pages/MutasiMasukPage";
import MutasiKeluarPage from "@/components/pages/MutasiKeluarPage";
import GuruPage from "@/components/pages/GuruPage";
import PengaturanPage from "@/components/pages/PengaturanPage";
import ManajemenUserPage from "@/components/pages/ManajemenUserPage";
import JadwalPelajaranPage from "@/components/pages/JadwalPelajaranPage";
import AbsensiPage from "@/components/pages/AbsensiPage";
import CatatanSiswaPage from "@/components/pages/CatatanSiswaPage";
import LaporanSiswaPage from "@/components/pages/LaporanSiswaPage";
import LinkPentingPage from "@/components/pages/LinkPentingPage";
import TesMinatBakatPage from "@/components/pages/TesMinatBakatPage";
import GayaBelajarPage from "@/components/pages/GayaBelajarPage";
import SiswaPortalPage from "@/components/pages/SiswaPortalPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,           // 1 min — avoid redundant refetches
      gcTime: 5 * 60_000,         // 5 min — keep cached data in background
      refetchOnWindowFocus: false, // don't refetch when tab regains focus
      retry: 1,
    },
  },
});

const SEMESTER_OPTIONS = ["Ganjil", "Genap"];

const navItems = [
  { key: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { key: "siswa" as const, label: "Data Siswa", icon: Users },
  { key: "mutasi-masuk" as const, label: "Mutasi Masuk", icon: LogIn },
  { key: "mutasi-keluar" as const, label: "Mutasi Keluar", icon: LogOut },
  { key: "guru" as const, label: "Data Guru", icon: GraduationCap },
  { key: "jadwal-pelajaran" as const, label: "Jadwal Pelajaran", icon: CalendarClock, adminOrOperator: true },
  { key: "absensi" as const, label: "Absensi Siswa", icon: ClipboardCheck, adminOrOperator: true },
  { key: "catatan-siswa" as const, label: "Catatan Siswa", icon: FileText, adminOrOperator: true },
  { key: "laporan-siswa" as const, label: "Laporan Siswa", icon: BookOpenCheck, adminOrOperator: true },
  { key: "link-penting" as const, label: "Link Penting", icon: LinkIcon, adminOrOperator: true },
  { key: "tes-minat-bakat" as const, label: "Tes Minat Bakat", icon: Brain, adminOrOperator: true },
  { key: "gaya-belajar" as const, label: "Gaya Belajar", icon: Palette, adminOrOperator: true },
  { key: "siswa-portal" as const, label: "Portal Siswa", icon: MonitorSmartphone },
  { key: "pengaturan" as const, label: "Pengaturan", icon: Settings, adminOrOperator: true },
  { key: "manajemen-user" as const, label: "Manajemen User", icon: UserCog, adminOrOperator: true },
];

// ─── TP Manage Dialog ────────────────────────────────────────────────────────

function ManageTPDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newTP, setNewTP] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; tahunPelajaran: string } | null>(null);

  const { data: tpList = [], isLoading } = useQuery({
    queryKey: ["tahun-pelajaran"],
    queryFn: async () => {
      const res = await fetch("/api/tahun-pelajaran");
      if (!res.ok) throw new Error("Gagal memuat");
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async (tp: string) => {
      const res = await fetch("/api/tahun-pelajaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tahunPelajaran: tp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambah");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tahun-pelajaran"] });
      toast({ title: "Berhasil", description: "Tahun pelajaran berhasil ditambahkan" });
      setNewTP("");
    },
    onError: (err) => toast({ title: "Gagal", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/tahun-pelajaran", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tahun-pelajaran"] });
      toast({ title: "Berhasil", description: "Tahun pelajaran berhasil dihapus" });
      setDeleteTarget(null);
    },
    onError: (err) => toast({ title: "Gagal", description: err.message, variant: "destructive" }),
  });

  const handleAdd = () => {
    const val = newTP.trim();
    if (!val) return;
    // Validate format: YYYY/YYYY+1
    const match = val.match(/^(\d{4})\/(\d{4})$/);
    if (!match || parseInt(match[2]) !== parseInt(match[1]) + 1) {
      toast({ title: "Format Salah", description: 'Gunakan format "YYYY/YYYY+1", contoh: "2026/2027"', variant: "destructive" });
      return;
    }
    addMutation.mutate(val);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kelola Tahun Pelajaran</DialogTitle>
            <DialogDescription>Tambah atau hapus tahun pelajaran yang tersedia di sistem.</DialogDescription>
          </DialogHeader>

          {/* Add new */}
          <div className="flex gap-2">
            <Input
              placeholder="Contoh: 2026/2027"
              value={newTP}
              onChange={(e) => setNewTP(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1"
            />
            <Button onClick={handleAdd} disabled={addMutation.isPending || !newTP.trim()} size="sm">
              {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Tambah
            </Button>
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto space-y-1">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoading && tpList.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada data.</p>
            )}
            {tpList.map((tp: { id: string; tahunPelajaran: string }) => (
              <div
                key={tp.id}
                className="flex items-center justify-between px-3 py-2 rounded-md border border-border hover:bg-muted/50"
              >
                <span className="text-sm font-medium">{tp.tahunPelajaran}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(tp)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tahun Pelajaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus <strong>{deleteTarget?.tahunPelajaran}</strong>? Data siswa, guru, dan mutasi pada tahun pelajaran ini tetap ada di database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Tahun Pelajaran Selector (dynamic) ──────────────────────────────────────

function TahunPelajaranSelector({ onManage }: { onManage: () => void }) {
  const { tahunPelajaran, setTahunPelajaran, semester, setSemester } = useAppStore();

  const { data: tpList = [] } = useQuery({
    queryKey: ["tahun-pelajaran"],
    queryFn: async () => {
      const res = await fetch("/api/tahun-pelajaran");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // If API data loaded, ensure the current selection is valid
  const options = tpList.map((tp: { tahunPelajaran: string }) => tp.tahunPelajaran);
  const isValid = options.includes(tahunPelajaran);

  // Auto-sync store when the current tahunPelajaran is not in the API list
  useEffect(() => {
    if (!isValid && options.length > 0) {
      setTahunPelajaran(options[0]);
    }
  }, [isValid, options, setTahunPelajaran]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
            Tahun Pelajaran
          </span>
        </div>
        <button
          onClick={onManage}
          className="p-1 rounded-md hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors"
          title="Kelola Tahun Pelajaran"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="px-1 space-y-2">
        <div className="space-y-1.5">
          <Label className="text-[11px] text-white/35 font-medium">Tahun Ajaran</Label>
          <Select value={isValid ? tahunPelajaran : options[0] || ""} onValueChange={setTahunPelajaran}>
            <SelectTrigger className="w-full h-9 text-sm bg-white/8 border-white/10 text-white/80 hover:bg-white/12 focus:ring-white/20 data-[placeholder]:text-white/30">
              <SelectValue placeholder={options.length === 0 ? "Belum ada data" : "Pilih..."} />
            </SelectTrigger>
            <SelectContent>
              {options.map((tp: string) => (
                <SelectItem key={tp} value={tp} className="text-sm">
                  {tp}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] text-white/35 font-medium">Semester</Label>
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger className="w-full h-9 text-sm bg-white/8 border-white/10 text-white/80 hover:bg-white/12 focus:ring-white/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEMESTER_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="text-sm">
                  Semester {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ open, onClose, collapsed, onToggleCollapse, className }: { open: boolean; onClose: () => void; collapsed: boolean; onToggleCollapse: () => void; className?: string }) {
  const { activePage, setActivePage } = useAppStore();
  const [manageTPOpen, setManageTPOpen] = useState(false);
  const { data: session } = useSession();
  const { toast } = useToast();

  // Change password state
  const [cpOpen, setCpOpen] = useState(false);
  const [cpOld, setCpOld] = useState('');
  const [cpNew, setCpNew] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');
  const [cpErrors, setCpErrors] = useState<Record<string, string>>({});
  const [cpLoading, setCpLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async () => {
    const errors: Record<string, string> = {};
    if (!cpOld.trim()) errors.oldPassword = 'Password lama wajib diisi';
    if (!cpNew.trim()) errors.newPassword = 'Password baru wajib diisi';
    else if (cpNew.length < 6) errors.newPassword = 'Password baru minimal 6 karakter';
    if (!cpConfirm.trim()) errors.confirmNewPassword = 'Konfirmasi password wajib diisi';
    else if (cpNew !== cpConfirm) errors.confirmNewPassword = 'Konfirmasi password tidak cocok';
    if (Object.keys(errors).length > 0) { setCpErrors(errors); return; }

    setCpLoading(true);
    setCpErrors({});
    try {
      const userId = (session?.user as { id?: string })?.id;
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, oldPassword: cpOld, newPassword: cpNew, confirmNewPassword: cpConfirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        const field = data.error?.includes('lama') ? 'oldPassword' : 'newPassword';
        setCpErrors({ [field]: data.error });
        return;
      }
      toast({ title: 'Berhasil', description: 'Password berhasil diubah' });
      setCpOpen(false);
      setCpOld(''); setCpNew(''); setCpConfirm('');
    } catch {
      toast({ title: 'Gagal', description: 'Terjadi kesalahan', variant: 'destructive' });
    } finally {
      setCpLoading(false);
    }
  };

  const closeCp = () => { setCpOpen(false); setCpOld(''); setCpNew(''); setCpConfirm(''); setCpErrors({}); };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 flex flex-col transition-all duration-300 ease-in-out",
          "[background:linear-gradient(180deg,oklch(0.17_0.04_160)_0%,oklch(0.14_0.05_170)_50%,oklch(0.12_0.04_260)_100%)]",
          open && !collapsed ? "translate-x-0" : "-translate-x-full",
          !collapsed && "lg:translate-x-0 lg:static lg:z-auto",
          collapsed && "lg:-translate-x-full lg:absolute lg:z-auto",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm text-white shadow-lg shadow-emerald-900/20">
            <School className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-white leading-tight">Operator Sekolah</h1>
            <p className="text-[11px] text-white/50 leading-tight">Sistem Informasi</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            title="Tutup Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Tahun Pelajaran Selector */}
        <div className="border-b border-white/10 py-3 px-3">
          <TahunPelajaranSelector onManage={() => setManageTPOpen(true)} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => {
              if ('adminOrOperator' in item && item.adminOrOperator) {
                const role = (session?.user as { role?: string })?.role || '';
                return role === 'admin' || role === 'operator';
              }
              return true;
            })
            .map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.key;
            const showSeparator = item.key === 'laporan-siswa' || item.key === 'link-penting' || item.key === 'tes-minat-bakat' || item.key === 'gaya-belajar' || item.key === 'siswa-portal' || item.key === 'pengaturan' || item.key === 'manajemen-user';
            return (
              <div key={item.key}>
                {showSeparator && <div className="my-2.5 border-t border-white/8" />}
                <button
                  onClick={() => {
                    setActivePage(item.key);
                    onClose();
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                    isActive
                      ? "bg-white/15 text-white shadow-sm shadow-black/10 backdrop-blur-sm"
                      : "text-white/55 hover:bg-white/8 hover:text-white/85"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-[18px] h-[18px] flex-shrink-0 transition-colors",
                      isActive ? "text-white" : "text-white/45"
                    )}
                  />
                  <span className="leading-none">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        {/* User & Footer */}
        <div className="border-t border-white/10">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs font-bold flex-shrink-0 ring-1 ring-white/10">
              {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate leading-tight">
                {session?.user?.name || "User"}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield className="w-3 h-3 text-emerald-400" />
                <p className="text-[11px] text-white/45 capitalize leading-none">
                  {(session?.user as { role?: string })?.role || "operator"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10"
                onClick={() => setCpOpen(true)}
                title="Ubah Password"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/40 hover:text-rose-300 hover:bg-white/10"
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Keluar"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <ManageTPDialog open={manageTPOpen} onClose={() => setManageTPOpen(false)} />

      {/* ═══ Change Password Dialog ═══ */}
      <Dialog open={cpOpen} onOpenChange={(v) => !v && closeCp()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-600" />
              Ubah Password
            </DialogTitle>
            <DialogDescription>Masukkan password lama dan password baru Anda.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Password Lama */}
            <div className="grid gap-2">
              <Label htmlFor="cp-old">Password Lama</Label>
              <div className="relative">
                <Input
                  id="cp-old"
                  type={showOld ? "text" : "password"}
                  placeholder="Masukkan password lama"
                  value={cpOld}
                  onChange={(e) => { setCpOld(e.target.value); setCpErrors((p) => ({ ...p, oldPassword: '' })); }}
                  className="pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowOld(!showOld)}
                  tabIndex={-1}
                >
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {cpErrors.oldPassword && <p className="text-destructive text-xs">{cpErrors.oldPassword}</p>}
            </div>

            {/* Password Baru */}
            <div className="grid gap-2">
              <Label htmlFor="cp-new">Password Baru</Label>
              <div className="relative">
                <Input
                  id="cp-new"
                  type={showNew ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={cpNew}
                  onChange={(e) => { setCpNew(e.target.value); setCpErrors((p) => ({ ...p, newPassword: '' })); }}
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNew(!showNew)}
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {cpErrors.newPassword && <p className="text-destructive text-xs">{cpErrors.newPassword}</p>}
            </div>

            {/* Konfirmasi Password */}
            <div className="grid gap-2">
              <Label htmlFor="cp-confirm">Konfirmasi Password Baru</Label>
              <div className="relative">
                <Input
                  id="cp-confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Ulangi password baru"
                  value={cpConfirm}
                  onChange={(e) => { setCpConfirm(e.target.value); setCpErrors((p) => ({ ...p, confirmNewPassword: '' })); }}
                  className="pr-10"
                  autoComplete="new-password"
                  onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {cpErrors.confirmNewPassword && <p className="text-destructive text-xs">{cpErrors.confirmNewPassword}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeCp} disabled={cpLoading}>Batal</Button>
            <Button onClick={handleChangePassword} disabled={cpLoading}>
              {cpLoading && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
              Ubah Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Page Router ─────────────────────────────────────────────────────────────

function PageContent() {
  const { activePage } = useAppStore();

  switch (activePage) {
    case "dashboard":
      return <DashboardPage />;
    case "siswa":
      return <SiswaPage />;
    case "mutasi-masuk":
      return <MutasiMasukPage />;
    case "mutasi-keluar":
      return <MutasiKeluarPage />;
    case "guru":
      return <GuruPage />;
    case "jadwal-pelajaran":
      return <JadwalPelajaranPage />;
    case "absensi":
      return <AbsensiPage />;
    case "catatan-siswa":
      return <CatatanSiswaPage />;
    case "laporan-siswa":
      return <LaporanSiswaPage />;
    case "link-penting":
      return <LinkPentingPage />;
    case "tes-minat-bakat":
      return <TesMinatBakatPage />;
    case "gaya-belajar":
      return <GayaBelajarPage />;
    case "siswa-portal":
      return <SiswaPortalPage />;
    case "pengaturan":
      return <PengaturanPage />;
    case "manajemen-user":
      return <ManajemenUserPage />;
    default:
      return <DashboardPage />;
  }
}

// ─── Root ────────────────────────────────────────────────────────────────────

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <AuthGuard>
      <QueryClientProvider client={queryClient}>
        <DashboardShell
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />
        <Toaster />
      </QueryClientProvider>
    </AuthGuard>
  );
}

function DashboardShell({ sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed }: { sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void; sidebarCollapsed: boolean; setSidebarCollapsed: (collapsed: boolean) => void }) {
  const { tahunPelajaran, semester } = useAppStore();

  return (
    <div className="min-h-screen flex flex-col bg-background">
        <div className="flex flex-1">
          <Sidebar
            className="print:hidden"
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          <div className="flex-1 flex flex-col min-w-0">
            {/* Top bar for mobile */}
            <header className="print:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 glass-subtle border-b border-border/60 lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="shrink-0 hover:bg-primary/10"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                  <School className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-foreground">Operator Sekolah</span>
              </div>
              <div className="ml-auto flex items-center">
                <span className="text-[11px] font-medium text-muted-foreground bg-primary/8 text-primary px-2.5 py-1 rounded-full border border-primary/12">
                  {tahunPelajaran} · {semester}
                </span>
              </div>
            </header>

            {/* Expand sidebar button (desktop only, visible when sidebar is collapsed) */}
            {sidebarCollapsed && (
              <div className="print:hidden hidden lg:flex items-center gap-3 px-5 py-2.5 glass-subtle border-b border-border/60">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(false)}
                  className="text-muted-foreground hover:text-primary hover:bg-primary/8"
                >
                  <PanelLeftOpen className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Menu</span>
                </Button>
                <div className="ml-auto flex items-center">
                  <span className="text-[11px] font-medium text-muted-foreground bg-primary/8 text-primary px-2.5 py-1 rounded-full border border-primary/12">
                    {tahunPelajaran} · {semester}
                  </span>
                </div>
              </div>
            )}

            {/* Main content */}
            <main className="flex-1 p-4 md:p-6 lg:p-8 print:p-0 print:m-0">
              <PageContent />
            </main>
          </div>
        </div>

        {/* Sticky Footer */}
        <footer className="print:hidden mt-auto glass-subtle border-t border-border/60 px-4 py-3">
          <div className="flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
            <p className="text-[11px] text-muted-foreground font-medium">
              Sistem Informasi Operator Sekolah &mdash; &copy; {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
  );
}