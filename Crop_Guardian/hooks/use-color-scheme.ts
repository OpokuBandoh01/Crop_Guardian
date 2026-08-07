// hooks/use-color-scheme.ts

import { useThemeStore } from "@/stores/themeStore";
import { useColorScheme as useRNColorScheme } from "react-native";

// Return type is "light" | "dark", not "string | null". Every screen does
// Colors[colorScheme], which needs exactly one of those two keys.
// Guaranteeing a non-null return here also means the "?? 'light'" fallback
// written at every old call site is no longer needed (it still works
// harmlessly if left in, so nothing breaks).
export function useColorScheme(): "light" | "dark" {
  // The raw OS-level setting. Only used when the user picked
  // "Use System Settings" in Appearance.
  const systemScheme = useRNColorScheme();

  // Passing a selector function, (state) => state.themePreference, means
  // this component only re-renders when themePreference itself changes,
  // not on every unrelated store update. Same pattern as
  // useAuthStore((state) => state.isAuthenticated) elsewhere in the app.
  const themePreference = useThemeStore((state) => state.themePreference);

  if (themePreference === "system") {
    return systemScheme === "dark" ? "dark" : "light";
  }

  return themePreference;
}
