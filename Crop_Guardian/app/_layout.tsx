// app/_layout.tsx
// CLEAN root layout — zero navigation logic here.
// Navigation decisions live in app/index.tsx using <Redirect />,
// which is safe because it runs inside a mounted screen (navigator already ready).
// Reference: https://docs.expo.dev/router/reference/redirects/

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Read hydration flags from both persisted Zustand stores.
  // These become true once AsyncStorage has finished loading saved state.
  // We block rendering the Stack entirely until both are ready, which prevents
  // any screen from flashing its content before we know where to redirect.
  const onboardingHydrated = useOnboardingStore((state) => state.hasHydrated);
  const authHydrated = useAuthStore((state) => state.hasHydrated);

  // Show a full-screen spinner while AsyncStorage is being read on boot.
  // This is the correct pattern — we do NOT navigate here, we just wait.
  if (!onboardingHydrated || !authHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Once stores are hydrated, render the navigator.
  // app/index.tsx (the first screen Expo Router loads) handles all redirects
  // declaratively via <Redirect /> — safe because the navigator is now mounted.
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* index.tsx is the routing gate — it immediately redirects, never renders UI */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scan" options={{ headerShown: false }} />
        <Stack.Screen name="result" options={{ headerShown: false }} />
        <Stack.Screen name="weather" options={{ headerShown: false }} />
        <Stack.Screen name="listening" options={{ headerShown: false }} />
        <Stack.Screen name="personal-info" options={{ headerShown: false }} />
        <Stack.Screen name="farm-info" options={{ headerShown: false }} />
        <Stack.Screen name="change-password" options={{ headerShown: false }} />
        <Stack.Screen
          name="offline-database"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="appearance" options={{ headerShown: false }} />
        <Stack.Screen name="language" options={{ headerShown: false }} />
        <Stack.Screen
          name="notification-settings"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="unit-settings" options={{ headerShown: false }} />
        <Stack.Screen name="help-support" options={{ headerShown: false }} />
        <Stack.Screen name="about-us" options={{ headerShown: false }} />
        <Stack.Screen name="rate-us" options={{ headerShown: false }} />
        <Stack.Screen name="logout" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
