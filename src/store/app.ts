import { create } from 'zustand';

type Page = 'dashboard' | 'siswa' | 'mutasi-masuk' | 'mutasi-keluar' | 'guru';

interface AppState {
  activePage: Page;
  setActivePage: (page: Page) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  tahunPelajaran: string;
  setTahunPelajaran: (tp: string) => void;
  semester: string;
  setSemester: (s: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page, sidebarOpen: false }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  tahunPelajaran: '',
  setTahunPelajaran: (tp) => set({ tahunPelajaran: tp }),
  semester: 'Ganjil',
  setSemester: (s) => set({ semester: s }),
}));