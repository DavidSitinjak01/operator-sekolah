import { create } from 'zustand';

type Page = 'dashboard' | 'siswa' | 'mutasi-masuk' | 'mutasi-keluar' | 'guru';

interface AppState {
  activePage: Page;
  setActivePage: (page: Page) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page, sidebarOpen: false }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));