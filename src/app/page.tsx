"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LayoutDashboard, Users, LogIn, LogOut, GraduationCap, Menu, X, School } from "lucide-react";
import { useAppStore } from "@/store/app";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import DashboardPage from "@/components/pages/DashboardPage";
import SiswaPage from "@/components/pages/SiswaPage";
import MutasiMasukPage from "@/components/pages/MutasiMasukPage";
import MutasiKeluarPage from "@/components/pages/MutasiKeluarPage";
import GuruPage from "@/components/pages/GuruPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const navItems = [
  { key: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { key: "siswa" as const, label: "Data Siswa", icon: Users },
  { key: "mutasi-masuk" as const, label: "Mutasi Masuk", icon: LogIn },
  { key: "mutasi-keluar" as const, label: "Mutasi Keluar", icon: LogOut },
  { key: "guru" as const, label: "Data Guru", icon: GraduationCap },
];

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { activePage, setActivePage } = useAppStore();

  return (
    <>
      {/* Overlay for mobile */}
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

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.key;
            return (
              <button
                key={item.key}
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
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} Operator Sekolah
          </p>
        </div>
      </aside>
    </>
  );
}

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
    default:
      return <DashboardPage />;
  }
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
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
      <Toaster />
    </QueryClientProvider>
  );
}