'use client';
import { create } from 'zustand';

interface Toast { id: number; text: string; action?: { label: string; run: () => void } }
interface UiState {
  toast: Toast | null;
  panel: 'none' | 'queue' | 'now';
  sidebarCollapsed: boolean;
  showToast: (text: string, action?: Toast['action']) => void;
  hideToast: () => void;
  setPanel: (p: UiState['panel']) => void;
  togglePanel: (p: 'queue' | 'now') => void;
  toggleSidebar: () => void;
}
let timer: ReturnType<typeof setTimeout> | undefined;
export const useUi = create<UiState>()((set, get) => ({
  toast: null, panel: 'now', sidebarCollapsed: false,
  showToast: (text, action) => {
    clearTimeout(timer);
    set({ toast: { id: Date.now(), text, action } });
    timer = setTimeout(() => set({ toast: null }), action ? 6000 : 3000);
  },
  hideToast: () => set({ toast: null }),
  setPanel: (panel) => set({ panel }),
  togglePanel: (p) => set({ panel: get().panel === p ? 'none' : p }),
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
}));
