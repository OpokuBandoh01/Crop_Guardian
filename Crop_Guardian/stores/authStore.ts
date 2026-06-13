import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
      // NEW ADDITION: auth token
      token: null,

      // NEW ADDITION: logged in user
      user: null,

      // NEW ADDITION: auth status
      isAuthenticated: false,

      hasHydrated: false,

      // NEW ADDITION: login handler
      login: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
        }),

      // NEW ADDITION: logout handler
      logout: () => {
        AsyncStorage.removeItem("userToken").catch(() => {});
        AsyncStorage.removeItem("userData").catch(() => {});
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
      // NEW ADDITION: persist auth state
      name: "auth-storage",

      // NEW ADDITION: persist using AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),

      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
