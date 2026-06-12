import { create } from 'zustand';

interface TipsPanelStore {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

export const useTipsPanelStore = create<TipsPanelStore>((set) => ({
  isOpen: false,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  close: () => set({ isOpen: false }),
}));
