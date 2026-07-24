import { create } from 'zustand';

type Page = 'dashboard' | 'jadwal-pelajaran' | 'absensi' | 'catatan-siswa' | 'laporan-siswa' | 'link-penting' | 'tes-minat-bakat' | 'gaya-belajar' | 'siswa' | 'mutasi-masuk' | 'mutasi-keluar' | 'guru' | 'pengaturan' | 'manajemen-user';

interface AppState {
  activePage: Page;
  setActivePage: (page: Page) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  tahunPelajaran: string;
  setTahunPelajaran: (tp: string) => void;
  semester: string;
  setSemester: (s: string) => void;
  studentPortalMode: boolean;
  setStudentPortalMode: (mode: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page, sidebarOpen: false }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  tahunPelajaran: '2025/2026',
  setTahunPelajaran: (tp) => set({ tahunPelajaran: tp }),
  semester: 'Ganjil',
  setSemester: (s) => set({ semester: s }),
  studentPortalMode: false,
  setStudentPortalMode: (mode) => set({ studentPortalMode: mode }),
}));