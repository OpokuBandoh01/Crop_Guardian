// stores/weatherStore.ts

import API from "@/services/api";
import { getLocationName, weatherCodeMap } from "@/utils/utilities";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const CACHE_DURATION_MS = 15 * 60 * 1000;

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";

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
  riskInsights?: RiskInsight[];
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
  fetchedAt: number | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;

  fetchWeather: (options?: { force?: boolean }) => Promise<void>;
  clearError: () => void;
}

async function fetchOpenMeteoRaw(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code",
    daily:
      "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,relative_humidity_2m_max,weather_code",
    forecast_days: "7",
    timezone: "auto",
  });

  const response = await fetch(`${OPEN_METEO_BASE}?${params.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo failed with status ${response.status}`);
  }

  return response.json();
}

export const useWeatherStore = create<WeatherStore>()(
  persist(
    (set, get) => ({
      // NO CHANGES
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

        if (loading) return;

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

          let latitude: number;
          let longitude: number;

          const lastKnown = await Location.getLastKnownPositionAsync({
            maxAge: CACHE_DURATION_MS,
            requiredAccuracy: 5000,
          });

          if (lastKnown) {
            latitude = lastKnown.coords.latitude;
            longitude = lastKnown.coords.longitude;
          } else {
            const fresh = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            latitude = fresh.coords.latitude;
            longitude = fresh.coords.longitude;
          }

          const [name, rawData] = await Promise.all([
            getLocationName(latitude, longitude),
            fetchOpenMeteoRaw(latitude, longitude),
          ]);

          const res = await API.post("/api/weather/enrich", {
            latitude,
            longitude,
            rawData,
          });

          if (res.data?.success && res.data.data) {
            set({
              weatherData: res.data.data as WeatherApiData,
              locationName: name,
              coords: { latitude, longitude },
              fetchedAt: Date.now(),
            });
          } else {
            const fallbackCurrent = rawData.current
              ? {
                  ...rawData.current,
                  weatherDescription:
                    weatherCodeMap[rawData.current.weather_code] || "Unknown",
                }
              : null;

            if (fallbackCurrent && rawData.daily) {
              set({
                weatherData: {
                  location: { latitude, longitude },
                  current: fallbackCurrent,
                  daily: {
                    ...rawData.daily,
                    weatherDescriptions: (rawData.daily.weather_code || []).map(
                      (code: number) => weatherCodeMap[code] || "Unknown",
                    ),
                  },
                  riskInsights: [],
                  overallSummary:
                    "Weather loaded. Crop risk insights are temporarily unavailable.",
                },
                locationName: name,
                coords: { latitude, longitude },
                fetchedAt: Date.now(),
              });
            } else {
              set({ error: "Could not load weather data. Please try again." });
            }
          }
        } catch (err) {
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
      partialize: (state) => ({
        weatherData: state.weatherData,
        locationName: state.locationName,
        coords: state.coords,
        fetchedAt: state.fetchedAt,
      }),
    },
  ),
);
