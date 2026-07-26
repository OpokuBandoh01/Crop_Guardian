// stores/weatherStore.ts

import API from "@/services/api";
import { getLocationName } from "@/utils/utilities";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const CACHE_DURATION_MS = 15 * 60 * 1000;

export interface BackendCurrent {
  time: string;
  interval: number;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  precipitation: number;
  weather_code: number;
  weatherDescription: string;
}

export interface DailyData {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  relative_humidity_2m_max: number[];
  weather_code: number[];
  weatherDescriptions: string[];
}

export interface RiskInsight {
  crop: string;
  riskLevel: string;
  message: string;
  factors: string[];
}

export interface WeatherApiData {
  location: { latitude: number; longitude: number };
  current: BackendCurrent;
  daily: DailyData;
  riskInsights: RiskInsight[];
  overallSummary: string;
}

interface Coords {
  latitude: number;
  longitude: number;
}

interface WeatherStore {
  weatherData: WeatherApiData | null;
  locationName: string;
  coords: Coords | null;
  fetchedAt: number | null; // epoch ms, null means "never fetched"
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;

  // force = true bypasses the 15 minute cache, used by pull-to-refresh.
  fetchWeather: (options?: { force?: boolean }) => Promise<void>;
  clearError: () => void;
}

export const useWeatherStore = create<WeatherStore>()(
  persist(
    (set, get) => ({
      weatherData: null,
      locationName: "Detecting location...",
      coords: null,
      fetchedAt: null,
      loading: false,
      error: null,
      permissionDenied: false,

      fetchWeather: async (options) => {
        const force = options?.force === true;
        const { fetchedAt, loading, weatherData } = get();

        // Guard against overlapping calls, e.g. widget and screen mounting
        // in the same tick, both racing to call fetchWeather().
        if (loading) return;

        // Cache hit: if we have data and it is still within the 15 minute
        // window, and the caller did not explicitly ask to force a refresh,
        // just return early and let existing state serve the UI.
        const isFresh =
          fetchedAt !== null && Date.now() - fetchedAt < CACHE_DURATION_MS;
        if (!force && weatherData && isFresh) {
          return;
        }

        set({ loading: true, error: null });

        try {
          const { status } = await Location.requestForegroundPermissionsAsync();

          if (status !== "granted") {
            set({ permissionDenied: true, loading: false });
            return;
          }

          set({ permissionDenied: false });

          // Speed optimization: try the device's last known cached position
          // first. This resolves near-instantly since it does not wait for a
          // brand new GPS/network fix, which is normally the single slowest
          // part of this whole chain (can take several seconds on its own).
          // We only fall back to a fresh, slower fix if no cached position
          // exists yet on the device (e.g. very first app use after install).
          let latitude: number;
          let longitude: number;

          const lastKnown = await Location.getLastKnownPositionAsync({
            maxAge: CACHE_DURATION_MS, // don't reuse a stale/expired fix
            requiredAccuracy: 5000, // meters, generous since weather doesn't need precision
          });

          if (lastKnown) {
            latitude = lastKnown.coords.latitude;
            longitude = lastKnown.coords.longitude;
          } else {
            const fresh = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced, // explicit: weather doesn't need GPS-grade precision
            });
            latitude = fresh.coords.latitude;
            longitude = fresh.coords.longitude;
          }

          // Reverse geocoding and the weather API call can run at the same
          // time since neither depends on the other's result, this shaves
          // off whichever one would otherwise have run second.
          const [name, res] = await Promise.all([
            getLocationName(latitude, longitude),
            API.get("/api/weather/forecast", {
              params: { lat: latitude, lon: longitude },
            }),
          ]);

          if (res.data?.success && res.data.data) {
            set({
              weatherData: res.data.data as WeatherApiData,
              locationName: name,
              coords: { latitude, longitude },
              fetchedAt: Date.now(),
            });
          } else {
            set({ error: "Could not load weather data. Please try again." });
          }
        } catch (err) {
          // UPDATED: secure, generic message only, detailed error stays in
          // console for debugging and is never surfaced to the end user.
          console.error("Weather fetch error:", err);
          set({
            error: "Unable to load weather right now. Please try again.",
          });
        } finally {
          set({ loading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "weather-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the data fields, not transient UI flags like loading
      // or permissionDenied, those should always reset fresh on app start.
      partialize: (state) => ({
        weatherData: state.weatherData,
        locationName: state.locationName,
        coords: state.coords,
        fetchedAt: state.fetchedAt,
      }),
    },
  ),
);
