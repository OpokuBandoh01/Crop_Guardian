// stores/authStore.ts
import { unregisterPushToken } from "@/hooks/use-push-notifications";
import API from "@/services/api";
import { AppLocation } from "@/utils/utilities";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useOnboardingStore } from "./onboardingStore";
import { useSubscriptionStore } from "./subscriptionStore";

interface User {
  id?: string;
  email?: string;
  fullName?: string;
  language?: string;
  location?: AppLocation;
  phoneNumber?: string;
  isEmailVerified?: boolean;
  avatarUrl?: string | null;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  pendingToken: string | null;
  pendingUser: User | null;

  login: (token: string, user: User) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
  updateUser: (updatedUser: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  setPendingRegistration: (token: string, user: User) => void;
  clearPendingRegistration: () => void;
  confirmPendingRegistration: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
      pendingToken: null,
      pendingUser: null,

      // login handler
      login: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
          pendingToken: null,
          pendingUser: null,
        }),

      // logout handler
      logout: () => {
        const currentToken = get().token;
        unregisterPushToken(currentToken ?? undefined);
        AsyncStorage.removeItem("userToken").catch(() => {});
        AsyncStorage.removeItem("userData").catch(() => {});
        useOnboardingStore.getState().resetOnboarding();
        useSubscriptionStore.getState().reset();
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          pendingToken: null,
          pendingUser: null,
        });
      },

      setHasHydrated: (state) =>
        set({
          hasHydrated: state,
        }),
      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : updatedUser,
        })),
      refreshUser: async () => {
        const { token } = get();
        if (!token) return;

        try {
          // Secure API call - uses existing interceptor
          const response = await API.get("/api/auth/me"); // Assuming you have this endpoint
          if (response.data?.user) {
            set({ user: response.data.user });
            console.log(
              "✅ User refreshed - new language:",
              response.data.user.language,
            );
          }
        } catch (error) {
          console.error("❌ Failed to refresh user:", error);
          // Optional: logout on auth error
          if ((error as any)?.response?.status === 401) {
            get().logout();
          }
        }
      },

      setPendingRegistration: (token, user) =>
        set({
          pendingToken: token,
          pendingUser: user,
          // intentionally leave isAuthenticated false
        }),
      clearPendingRegistration: () =>
        set({
          pendingToken: null,
          pendingUser: null,
        }),

      confirmPendingRegistration: () => {
        const { pendingToken, pendingUser } = get();
        if (!pendingToken || !pendingUser) return;

        set({
          token: pendingToken,
          user: {
            ...pendingUser,
            isEmailVerified: true, // phone verified
          },
          isAuthenticated: true,
          pendingToken: null,
          pendingUser: null,
        });
      },
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
