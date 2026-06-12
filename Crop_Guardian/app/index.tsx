// app/index.tsx
// This is the routing GATE for the entire app.
// It runs as a real mounted screen inside the Stack navigator,
// so <Redirect /> is safe to call — the navigator is guaranteed mounted.
//
// Pattern reference: https://docs.expo.dev/router/reference/redirects/
//
// Flow:
//   Not onboarded yet  →  /(onboarding)/user-role
//   Onboarded + logged in  →  /(tabs)
//   Onboarded + not logged in  →  /(auth)/login

import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";

export default function IndexScreen() {
  // Read persisted state from Zustand stores.
  // By the time this screen renders, both stores are already hydrated
  // (because _layout.tsx blocks rendering until hydration is complete).
  // So these values are always accurate — no risk of a wrong redirect.
  const hasOnboarded = useOnboardingStore((state) => state.hasOnboarded);
  const onboardingHydrated = useOnboardingStore((state) => state.hasHydrated);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authHydrated = useAuthStore((state) => state.hasHydrated);

  // Safety guard: if somehow this screen renders before hydration completes,
  // show a spinner rather than redirecting with stale (false) values.
  // In practice this should not happen because _layout.tsx guards it,
  // but defensive programming is good practice.
  if (!onboardingHydrated || !authHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // <Redirect /> is a declarative component — it calls router.replace() internally
  // but only after the component tree (including the navigator) is fully committed.
  // This is why it does NOT throw the "navigate before mounting" error.

  if (!hasOnboarded) {
    // First-time user — send to onboarding flow
    return <Redirect href="/(onboarding)/user-role" />;
  }

  if (isAuthenticated) {
    // Returning user who is logged in — go straight to the app
    return <Redirect href="/(tabs)" />;
  }

  // Onboarded but not logged in — send to login
  return <Redirect href="/(auth)/login" />;
}
