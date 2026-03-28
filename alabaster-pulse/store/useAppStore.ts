import { create } from 'zustand';
import type { UserSettings, FoodLogEntry } from '../db/queries';

type AppState = {
  settings: UserSettings | null;
  todayLog: FoodLogEntry[];
  setSettings: (s: UserSettings) => void;
  setTodayLog: (log: FoodLogEntry[]) => void;
  removeLogEntry: (id: number) => void;
};

export const useAppStore = create<AppState>((set) => ({
  settings: null,
  todayLog: [],
  setSettings: (settings) => set({ settings }),
  setTodayLog: (todayLog) => set({ todayLog }),
  removeLogEntry: (id) =>
    set((state) => ({ todayLog: state.todayLog.filter((e) => e.id !== id) })),
}));
