// stores/themeStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeStore {
  themePreference: ThemePreference;
  hasHydrated: boolean;
  setThemePreference: (pref: ThemePreference) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      themePreference: "system",
      hasHydrated: false,
      setThemePreference: (themePreference) => set({ themePreference }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
