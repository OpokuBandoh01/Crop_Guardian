// hooks/use-color-scheme.ts
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useThemeStore } from '@/stores/themeStore';

export function useColorScheme() {
  const themePreference = useThemeStore((state) => state.themePreference);
  const systemScheme = useRNColorScheme();

  if (themePreference === 'system') {
    return systemScheme ?? 'light';
  }
  return themePreference;
}
