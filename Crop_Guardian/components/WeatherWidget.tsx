// components/WeatherWidget.tsx
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import API from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

// NEW ADDITION: Reusable function for reverse geocoding (can be moved to @/utils/location.ts)
export const getLocationName = async (
  latitude: number,
  longitude: number,
): Promise<string> => {
  try {
    const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (geocode.length > 0) {
      const { city, region, country } = geocode[0];
      return (
        [city, region].filter(Boolean).join(", ") ||
        country ||
        "Unknown Location"
      );
    }
    return "Unknown Location";
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return "Unknown Location";
  }
};

// NEW ADDITION: Weather code to description map (from your backend)
const weatherCodeMap: Record<number, string> = {
  0: "Clear Sky",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing Rime Fog",
  51: "Light Drizzle",
  53: "Moderate Drizzle",
  55: "Dense Drizzle",
  61: "Slight Rain",
  63: "Moderate Rain",
  65: "Heavy Rain",
  71: "Slight Snow Fall",
  73: "Moderate Snow Fall",
  75: "Heavy Snow Fall",
  80: "Slight Rain Showers",
  81: "Moderate Rain Showers",
  82: "Violent Rain Showers",
  // NO CHANGES: Extend this map easily when backend adds more codes
};

// NEW ADDITION: Map weather code → Ionicons name
const getWeatherIcon = (code: number): string => {
  if ([0, 1].includes(code)) return "sunny-outline";
  if ([2, 3].includes(code)) return "partly-sunny-outline";
  if ([45, 48].includes(code)) return "cloudy-outline";
  if ([51, 53, 55].includes(code)) return "rainy-outline";
  if ([61, 63, 65, 80, 81, 82].includes(code)) return "rainy-outline";
  if ([71, 73, 75].includes(code)) return "snow-outline";
  return "cloud-outline"; // fallback
};

// UPDATED: Full backend shape (only fields that exist)
interface BackendCurrent {
  time: string;
  interval: number;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  precipitation: number;
  weather_code: number;
  weatherDescription: string;
}

interface WeatherData {
  current: BackendCurrent;
  overallSummary: string;
  // daily, riskInsights, location are available but not used in this widget
}

interface DisplayWeather {
  temp: number;
  humidity: number;
  feelsLike: number;
  description: string;
  icon: string;
  locationName: string;
  overallSummary: string;
}

export default function WeatherWidget() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const [weatherData, setWeatherData] = useState<DisplayWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  // NO CHANGES: (kept router and theme logic)

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setPermissionDenied(false);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setPermissionDenied(true);
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const locationName = await getLocationName(
        loc.coords.latitude,
        loc.coords.longitude,
      );

      const params = {
        lat: loc.coords.latitude,
        lon: loc.coords.longitude,
      };

      const res = await API.get("/api/weather/forecast", { params });

      if (res.data?.success && res.data.data?.current) {
        const current = res.data.data.current;
        const displayData: DisplayWeather = {
          temp: current.temperature_2m,
          humidity: current.relative_humidity_2m,
          feelsLike: current.apparent_temperature,
          description: current.weatherDescription,
          icon: getWeatherIcon(current.weather_code),
          locationName,
          overallSummary: res.data.data.overallSummary,
        };
        setWeatherData(displayData);
      }
    } catch (err) {
      console.error("WeatherWidget: Error fetching weather:", err);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Re-fetch when permission changes
  useEffect(() => {
    fetchWeather();
  }, []);

  const handleGrantPermission = () => {
    fetchWeather(); // NEW ADDITION: Re-fetch after user grants permission
  };

  if (permissionDenied) {
    return (
      <View
        style={[
          styles.weatherWidget,
          {
            backgroundColor: colorScheme === "light" ? "#EBF7E9" : "#1E2C20",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          },
        ]}
      >
        <Ionicons
          name="location-outline"
          size={moderateScale(48)}
          color={theme.primary}
        />
        <Text
          style={[
            styles.weatherDesc,
            { color: theme.text, textAlign: "center", marginVertical: 12 },
          ]}
        >
          Location permission is required to show accurate weather
        </Text>
        <TouchableOpacity
          style={[
            styles.forecastButton,
            {
              backgroundColor: colorScheme === "light" ? "#C8E6C9" : "#2E3D30",
            },
          ]}
          onPress={handleGrantPermission}
        >
          <Text style={[styles.forecastButtonText, { color: theme.primary }]}>
            Grant Location Access
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.weatherWidget,
        {
          backgroundColor: colorScheme === "light" ? "#EBF7E9" : "#1E2C20",
        },
      ]}
    >
      {/* LEFT SIDE — location, temperature, description, forecast button */}
      <View style={styles.weatherLeft}>
        {/* UPDATED: Dynamic location from reverse geocoding */}
        <Text style={[styles.weatherLocation, { color: theme.text }]}>
          {weatherData?.locationName || "Detecting location..."}
        </Text>

        <View style={styles.tempRow}>
          {/* UPDATED: Dynamic icon based on weather code */}
          <Ionicons
            name={(weatherData?.icon as any) || "cloud-outline"}
            size={moderateScale(38)}
            color={theme.primary}
            style={styles.weatherStateIcon}
          />
          {/* UPDATED: Uses backend temperature_2m */}
          <Text style={[styles.tempText, { color: theme.text }]}>
            {weatherData?.temp !== undefined
              ? `${Math.round(weatherData.temp)}°C`
              : "--"}
          </Text>
        </View>

        {/* UPDATED: Uses overallSummary as requested */}
        <Text style={[styles.weatherDesc, { color: theme.text }]}>
          {weatherData?.overallSummary || "Fetching weather..."}
        </Text>

        <TouchableOpacity
          style={[
            styles.forecastButton,
            {
              backgroundColor: colorScheme === "light" ? "#C8E6C9" : "#2E3D30",
            },
          ]}
          activeOpacity={0.8}
          onPress={() => router.push("/weather")}
        >
          <Text style={[styles.forecastButtonText, { color: theme.primary }]}>
            View full forecast
          </Text>
          <Ionicons
            name="chevron-forward"
            size={moderateScale(12)}
            color={theme.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Vertical divider between left and right panels */}
      <View
        style={[
          styles.weatherDivider,
          {
            backgroundColor: colorScheme === "light" ? "#D0E9CD" : "#2E3D30",
          },
        ]}
      />

      {/* RIGHT SIDE — Humidity, Feels like (Wind removed) */}
      <View style={styles.weatherRight}>
        {/* UPDATED: Humidity from backend relative_humidity_2m */}
        <View style={styles.weatherStatItem}>
          <Ionicons
            name="water-outline"
            size={moderateScale(18)}
            color={theme.primary}
          />
          <View style={styles.weatherStatTextWrapper}>
            <Text style={[styles.weatherStatLabel, { color: theme.icon }]}>
              Humidity
            </Text>
            <Text style={[styles.weatherStatValue, { color: theme.text }]}>
              {weatherData?.humidity !== undefined
                ? `${weatherData.humidity}%`
                : "--"}
            </Text>
          </View>
        </View>

        {/* UPDATED: Feels like from backend apparent_temperature */}
        <View style={styles.weatherStatItem}>
          <Ionicons
            name="thermometer-outline"
            size={moderateScale(18)}
            color={theme.primary}
          />
          <View style={styles.weatherStatTextWrapper}>
            <Text style={[styles.weatherStatLabel, { color: theme.icon }]}>
              Feels like
            </Text>
            <Text style={[styles.weatherStatValue, { color: theme.text }]}>
              {weatherData?.feelsLike !== undefined
                ? `${Math.round(weatherData.feelsLike)}°C`
                : "--"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // NO CHANGES to styles (all existing styles preserved)
  weatherWidget: {
    flexDirection: "row",
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginBottom: verticalScale(20),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  weatherLeft: {
    flex: 1.1,
    justifyContent: "center",
  },
  weatherLocation: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    opacity: 0.8,
  },
  tempRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: verticalScale(6),
  },
  weatherStateIcon: {
    marginRight: scale(8),
  },
  tempText: {
    fontSize: moderateScale(34),
    fontWeight: "700",
  },
  weatherDesc: {
    fontSize: moderateScale(12),
    fontWeight: "500",
    marginBottom: verticalScale(10),
  },
  forecastButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(12),
  },
  forecastButtonText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    marginRight: scale(4),
  },
  weatherDivider: {
    width: 1,
    height: "80%",
    marginHorizontal: scale(12),
  },
  weatherRight: {
    flex: 0.9,
    gap: verticalScale(10),
  },
  weatherStatItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  weatherStatTextWrapper: {
    marginLeft: scale(8),
  },
  weatherStatLabel: {
    fontSize: moderateScale(10),
    fontWeight: "400",
  },
  weatherStatValue: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
});
