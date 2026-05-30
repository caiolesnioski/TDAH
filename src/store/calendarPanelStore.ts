import { create } from 'zustand';

interface CalendarPanelState {
  isOpen: boolean;
  selectedDate: string | null;
  toggle: () => void;
  open: () => void;
  close: () => void;
  selectDate: (date: string) => void;
}

export const useCalendarPanelStore = create<CalendarPanelState>((set) => ({
  isOpen: false,
  selectedDate: null,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  selectDate: (date) => set({ selectedDate: date }),
}));
