import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useOnboardingStore } from "./onboardingStore";

interface User {
  id?: string;
  email?: string;
  fullName?: string;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  login: (token: string, user: User) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // auth token
      token: null,

      // logged in user
      user: null,

      // auth status
      isAuthenticated: false,

      hasHydrated: false,

      // login handler
      login: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
        }),

      // logout handler
      logout: () => {
        AsyncStorage.removeItem("userToken").catch(() => {});
        AsyncStorage.removeItem("userData").catch(() => {});
        useOnboardingStore.getState().resetOnboarding();
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },

      setHasHydrated: (state) =>
        set({
          hasHydrated: state,
        }),
    }),
    {
      // persist auth state
      name: "auth-storage",

      // persist using AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),

      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
