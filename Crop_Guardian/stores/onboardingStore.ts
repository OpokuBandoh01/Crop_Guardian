// //Store:

// selectedRole
// selectedCrops
// hasOnboarded

// Then:

// user-role
// crop-selection
// review-selection
// login
// signup

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface OnboardingStore {
  selectedRole: string;
  selectedCrops: string[];
  hasOnboarded: boolean;
  hasHydrated: boolean;

  setRole: (role: string) => void;
  setCrops: (crops: string[]) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      // NEW ADDITION: selected role state
      selectedRole: "",

      // NEW ADDITION: selected crops state
      selectedCrops: [],

      // NEW ADDITION: onboarding completion flag
      hasOnboarded: false,

      hasHydrated: false,

      // NEW ADDITION: update role
      setRole: (role) =>
        set({
          selectedRole: role,
        }),

      // NEW ADDITION: update crops
      setCrops: (crops) =>
        set({
          selectedCrops: crops,
        }),

      // NEW ADDITION: mark onboarding completed
      completeOnboarding: () =>
        set({
          hasOnboarded: true,
        }),

      // NEW ADDITION: reset onboarding state
      resetOnboarding: () =>
        set({
          selectedRole: "",
          selectedCrops: [],
          hasOnboarded: false,
        }),

      setHasHydrated: (state) =>
        set({
          hasHydrated: state,
        }),
    }),
    {
      // NEW ADDITION: persist onboarding state
      name: "onboarding-storage",

      // NEW ADDITION: use AsyncStorage under the hood
      storage: createJSONStorage(() => AsyncStorage),

      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
