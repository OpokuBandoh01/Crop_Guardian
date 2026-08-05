// hooks/useUserProfile.ts
// Single source of truth for the logged-in user's profile and stats.

import { fetchMe } from "@/services/userApi";
import { useAuthStore } from "@/stores/authStore";
import type { UserProfileData, UserStats } from "@/types/user";
// NEW ADDITION: useFocusEffect is what actually fixes the stale-data bug.
// It comes from @react-navigation/native, which expo-router is built on
// top of, so it works in any screen without extra setup.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";

const CACHE_KEY = "userData";

interface UseUserProfileResult {
  user: UserProfileData | null;
  stats: UserStats | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserProfile(): UseUserProfileResult {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NEW ADDITION: a ref (not state) that tracks whether a fetch is
  // currently in flight. Using a ref instead of state here means checking
  // it does not trigger a re-render, it exists purely to stop two
  // overlapping fetchProfile calls if the screen refocuses again before
  // the previous request has finished (e.g. rapid tab switching).
  const isFetchingRef = useRef(false);

  const updateAuthUser = useAuthStore((state) => state.updateUser);

  const loadFromCache = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: UserProfileData = JSON.parse(cached);
        setUser(parsed);
      }
    } catch {
      // A broken cache read is not fatal, the network call below still runs.
    }
  }, []);

  const fetchProfile = useCallback(
    async (isRefresh: boolean) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const data = await fetchMe();
        if (data.success) {
          setUser(data.user);
          setStats(data.stats);
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data.user));

          updateAuthUser({
            fullName: data.user.profile?.fullName,
            language: data.user.language,
            location: data.user.profile?.location ?? undefined,
            isEmailVerified: data.user.isEmailVerified,
          });
        }
      } catch (err) {
        console.warn("Failed to fetch profile:", err);
        setError("Could not load your profile. Pull down to try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [updateAuthUser],
  );

  // Cache-first instant paint, runs once on mount only.
  useEffect(() => {
    loadFromCache();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UPDATED: this replaces the old "fetch once on mount" useEffect.
  // useFocusEffect's callback runs both on initial mount (covering the
  // very first load) AND every time this screen regains focus afterward,
  // e.g. navigating back from personal-info.tsx after a save. This is what
  // makes the profile screen show fresh data without a manual pull to
  // refresh.
  useFocusEffect(
    useCallback(() => {
      fetchProfile(false);
    }, [fetchProfile]),
  );

  const refetch = useCallback(() => fetchProfile(true), [fetchProfile]);

  return { user, stats, loading, refreshing, error, refetch };
}
