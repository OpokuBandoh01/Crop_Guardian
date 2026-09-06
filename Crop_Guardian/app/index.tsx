// app/index.tsx

import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";

export default function IndexScreen() {
  const router = useRouter();

  const hasOnboarded = useOnboardingStore((state) => state.hasOnboarded);
  const onboardingHydrated = useOnboardingStore((state) => state.hasHydrated);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    // Wait until both stores have finished loading from storage
    if (!onboardingHydrated || !authHydrated) return;

    let destination: string;

    if (isAuthenticated) {
      destination = "/(tabs)";
    } else if (!hasOnboarded) {
      destination = "/(onboarding)/user-role";
    } else {
      destination = "/(auth)/login";
    }

    // Hide the native splash as soon as we know where to go
    // This gives a clean transition from the FarmDoc logo to the next screen
    const hideAndNavigate = async () => {
      await SplashScreen.hideAsync();
      router.replace(destination as any);
    };

    hideAndNavigate();
  }, [hasOnboarded, onboardingHydrated, isAuthenticated, authHydrated, router]);

  //  Return null instead of a spinner.
  // The native splash (FarmDoc logo) stays visible until we hide it above.
  return null;
}
