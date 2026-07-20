"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, Users, LogIn, LogOut, GraduationCap, Menu, X, School, CalendarDays, Settings, Plus, Trash2, Loader2, Shield, UserCog } from "lucide-react";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
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
  { key: "pengaturan" as const, label: "Pengaturan", icon: Settings },
  { key: "manajemen-user" as const, label: "Manajemen User", icon: UserCog, adminOnly: true },
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
      <div className="flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tahun Pelajaran
          </span>
        </div>
        <button
          onClick={onManage}
          className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Kelola Tahun Pelajaran"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="px-3 space-y-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tahun Ajaran</Label>
          <Select value={isValid ? tahunPelajaran : options[0] || ""} onValueChange={setTahunPelajaran}>
            <SelectTrigger className="w-full h-9 text-sm">
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
          <Label className="text-xs text-muted-foreground">Semester</Label>
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger className="w-full h-9 text-sm">
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

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { activePage, setActivePage } = useAppStore();
  const [manageTPOpen, setManageTPOpen] = useState(false);
  const { data: session } = useSession();

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
          "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-600 text-white">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">Operator Sekolah</h1>
            <p className="text-xs text-muted-foreground">Sistem Informasi</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto lg:hidden p-1 rounded-md hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tahun Pelajaran Selector */}
        <div className="border-b border-border py-4">
          <TahunPelajaranSelector onManage={() => setManageTPOpen(true)} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => {
              if ('adminOnly' in item && item.adminOnly) {
                return ((session?.user as { role?: string })?.role || '') === 'admin';
              }
              return true;
            })
            .map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.key;
            const showSeparator = item.key === 'pengaturan' || item.key === 'manajemen-user';
            return (
              <div key={item.key}>
                {showSeparator && <div className="my-2 border-t border-border" />}
                <button
                  onClick={() => {
                    setActivePage(item.key);
                    onClose();
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isActive ? "text-emerald-600" : "text-muted-foreground"
                    )}
                  />
                  {item.label}
                </button>
              </div>
            );
          })}
        </nav>

        {/* User & Footer */}
        <div className="border-t border-border">
          {/* User info */}
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex-shrink-0">
              {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {session?.user?.name || "User"}
              </p>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-500" />
                <p className="text-xs text-muted-foreground capitalize">
                  {(session?.user as { role?: string })?.role || "operator"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
          <div className="px-4 py-2">
            <p className="text-xs text-muted-foreground text-center">
              &copy; {new Date().getFullYear()} Operator Sekolah
            </p>
          </div>
        </div>
      </aside>

      <ManageTPDialog open={manageTPOpen} onClose={() => setManageTPOpen(false)} />
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

  return (
    <AuthGuard>
      <QueryClientProvider client={queryClient}>
        <DashboardShell sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <Toaster />
      </QueryClientProvider>
    </AuthGuard>
  );
}

function DashboardShell({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }) {
  const { tahunPelajaran, semester } = useAppStore();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
        <div className="flex flex-1">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div className="flex-1 flex flex-col min-w-0">
            {/* Top bar for mobile */}
            <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-white border-b border-border lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="shrink-0"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-emerald-600 text-white">
                  <School className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold">Operator Sekolah</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                  {tahunPelajaran} — {semester}
                </span>
              </div>
            </header>

            {/* Main content */}
            <main className="flex-1 p-4 md:p-6 lg:p-8">
              <PageContent />
            </main>
          </div>
        </div>

        {/* Sticky Footer */}
        <footer className="mt-auto bg-white border-t border-border px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            Aplikasi Sistem Informasi Operator Sekolah &mdash; &copy; {new Date().getFullYear()}
          </p>
        </footer>
      </div>
  );
}