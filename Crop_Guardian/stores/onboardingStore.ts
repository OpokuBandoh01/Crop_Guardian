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
      //  selected role state
      selectedRole: "",

      //  selected crops state
      selectedCrops: [],

      //  onboarding completion flag
      hasOnboarded: false,

      hasHydrated: false,

      //  update role
      setRole: (role) =>
        set({
          selectedRole: role,
        }),

      //  update crops
      setCrops: (crops) =>
        set({
          selectedCrops: crops,
        }),

      //  mark onboarding completed
      completeOnboarding: () =>
        set({
          hasOnboarded: true,
        }),

      //  reset onboarding state
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
      //  persist onboarding state
      name: "onboarding-storage",

      //  use AsyncStorage under the hood
      storage: createJSONStorage(() => AsyncStorage),

      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
