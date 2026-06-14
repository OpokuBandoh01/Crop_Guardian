// app/index.tsx

import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";

export default function IndexScreen() {
  const router = useRouter();

  const hasOnboarded = useOnboardingStore((state) => state.hasOnboarded);
  const onboardingHydrated = useOnboardingStore((state) => state.hasHydrated);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!onboardingHydrated || !authHydrated) return;

    let destination: string;
    if (!hasOnboarded) {
      destination = "/(onboarding)/user-role";
    } else if (isAuthenticated) {
      destination = "/(tabs)";
    } else {
      destination = "/(auth)/login";
    }

    const timer = setTimeout(() => {
      router.replace(destination as any);
    }, 0);

    return () => clearTimeout(timer);
  }, [hasOnboarded, onboardingHydrated, isAuthenticated, authHydrated]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
