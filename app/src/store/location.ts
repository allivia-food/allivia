import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import '@/services/storage';
import type { ChosenLocation } from '@/features/restaurants/location';

interface LocationStore {
  location: ChosenLocation | null;
  setLocation: (location: ChosenLocation | null) => void;
}

const safeStorage = createJSONStorage(() => ({
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
}));

export const useLocationStore = create<LocationStore>()(
  persist(
    (set) => ({
      location: null,
      setLocation: (location) => set({ location }),
    }),
    { name: 'allivia-restaurants-location', storage: safeStorage },
  ),
);
