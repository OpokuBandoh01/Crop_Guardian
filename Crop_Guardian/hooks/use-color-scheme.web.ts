// hooks/use-color-scheme.web.ts

import { useThemeStore } from "@/stores/themeStore";
import { useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

/**
 * Web needs this extra hydration step because Expo Router statically
 * renders pages on the server first, where there is no real "system
 * theme" or saved AsyncStorage value to read yet. Returning "light"
 * until after the first client-side render avoids a mismatch between
 * server-rendered and client-rendered HTML.
 */
export function useColorScheme(): "light" | "dark" {
  // TypeScript infers this is a boolean state from the initial value
  // (false), so no generic annotation like useState<boolean> is needed.
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const systemScheme = useRNColorScheme();
  const themePreference = useThemeStore((state) => state.themePreference);

  if (!hasHydrated) {
    return "light";
  }

  if (themePreference === "system") {
    return systemScheme === "dark" ? "dark" : "light";
  }

  return themePreference;
}
