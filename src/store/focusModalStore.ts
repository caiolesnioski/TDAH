import { create } from 'zustand';
import type { Task } from '../types';

interface FocusModalState {
  isOpen: boolean;
  activeTask: Task | null;
  openModal: (task: Task) => void;
  closeModal: () => void;
}

export const useFocusModalStore = create<FocusModalState>((set) => ({
  isOpen: false,
  activeTask: null,
  openModal: (task) => set({ isOpen: true, activeTask: task }),
  closeModal: () => set({ isOpen: false, activeTask: null }),
}));
