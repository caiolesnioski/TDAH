import { create } from 'zustand';
import type { Task } from '@/types';

type State = {
  task: Task | null;
  durationMinutes: number;
  timeRemaining: number;
  isRunning: boolean;
  isPomodoro: boolean;
};

type Actions = {
  start: (task: Task, duration: number, pomodoro?: boolean) => void;
  tick: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
};

export const useFloatingTimerStore = create<State & Actions>((set) => ({
  task: null,
  durationMinutes: 25,
  timeRemaining: 0,
  isRunning: false,
  isPomodoro: false,
  start: (task, duration, pomodoro = false) =>
    set({ task, durationMinutes: duration, timeRemaining: duration * 60, isRunning: true, isPomodoro: pomodoro }),
  tick: () =>
    set((s) => {
      if (s.timeRemaining <= 1) return { timeRemaining: 0, isRunning: false };
      return { timeRemaining: s.timeRemaining - 1 };
    }),
  pause: () => set({ isRunning: false }),
  resume: () => set({ isRunning: true }),
  stop: () => set({ task: null, timeRemaining: 0, isRunning: false, isPomodoro: false }),
}));
