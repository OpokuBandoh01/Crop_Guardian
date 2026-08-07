// stores/themeStore.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// TypeScript "type" here defines the exact set of allowed values for theme
// preference. A union type ("light" | "dark" | "system") means TypeScript
// will catch a typo like setThemePreference("Light") at compile time,
// instead of you finding out at runtime.
export type ThemePreference = "light" | "dark" | "system";

// An "interface" describes the shape of an object. This one describes
// everything the store holds: the data (state) and the functions that
// change that data (actions). It is passed as the generic <ThemeState>
// to create() below so TypeScript knows what shape the store has.
interface ThemeState {
  // The user's saved preference. Defaults to "system" so the app matches
  // the phone's setting until the user explicitly overrides it.
  themePreference: ThemePreference;

  // True once zustand has finished reading the saved value back from
  // AsyncStorage. Same hasHydrated pattern you already use in
  // authStore / onboardingStore.
  hasHydrated: boolean;

  // Action to change the preference. Return type is "void" because it
  // only updates state, it does not hand anything back to the caller.
  setThemePreference: (preference: ThemePreference) => void;

  // Internal setter, only called from onRehydrateStorage below.
  setHasHydrated: (value: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  // persist() wraps the store so its state is automatically saved to and
  // loaded from AsyncStorage, same pattern as your other stores.
  persist(
    (set) => ({
      themePreference: "system",
      hasHydrated: false,

      setThemePreference: (preference) => set({ themePreference: preference }),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      // Key this store is saved under in AsyncStorage.
      name: "theme-storage",

      // createJSONStorage adapts AsyncStorage, which is async, to the
      // storage interface the persist middleware expects.
      storage: createJSONStorage(() => AsyncStorage),

      // Runs once, right after the persisted value is read back from
      // AsyncStorage on app start. Flips hasHydrated to true so consumers
      // know themePreference can now be trusted.
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
