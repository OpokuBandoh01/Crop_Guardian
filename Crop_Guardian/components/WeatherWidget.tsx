// components/WeatherWidget.tsx
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useWeatherStore } from "@/stores/weatherStore"; // NEW ADDITION: shared cache store
import { getWeatherIcon } from "@/utils/utilities"; // UPDATED: reuse the single shared icon-map function instead of a local duplicate copy
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

interface WeatherWidgetProps {
  // Incrementing this from the parent (e.g. on pull-to-refresh on Home)
  // forces a real network refresh, bypassing the 15 minute cache.
  refreshTrigger?: number;
}

export default function WeatherWidget({
  refreshTrigger = 0,
}: WeatherWidgetProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // Pulling individual slices (not the whole store object) so this component
  // only re-renders when one of these specific values actually changes.
  const weatherData = useWeatherStore((state) => state.weatherData);
  const locationName = useWeatherStore((state) => state.locationName);
  const loading = useWeatherStore((state) => state.loading);
  const permissionDenied = useWeatherStore((state) => state.permissionDenied);
  const fetchWeather = useWeatherStore((state) => state.fetchWeather);

  // useRef<number> tracks the previous refreshTrigger value across renders
  // without causing a re-render itself, purely used to detect "did this prop
  // actually change" versus "component just re-rendered for another reason".
  const previousTrigger = useRef<number>(refreshTrigger);

  // Mount effect: ask the store for data. If a cached result younger than
  // 15 minutes already exists (e.g. the Weather screen fetched it moments
  // ago), fetchWeather() resolves instantly and does not hit the network.
  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  // Separate effect specifically for the parent-driven force refresh
  // (pull-to-refresh on the Home screen). Only fires when refreshTrigger
  // actually increments, not on first mount.
  useEffect(() => {
    if (refreshTrigger !== previousTrigger.current) {
      previousTrigger.current = refreshTrigger;
      fetchWeather({ force: true });
    }
  }, [refreshTrigger, fetchWeather]);

  const handleGrantPermission = () => {
    fetchWeather({ force: true });
  };

  // Loading state, ONLY shown when there is no data at all yet (first ever
  // load). Once cached data exists, we keep showing it even during a
  // background refresh, so the widget never blanks out on pull-to-refresh.
  if (loading && !weatherData) {
    return (
      <View
        style={[
          styles.weatherWidget,
          {
            backgroundColor: colorScheme === "light" ? "#EBF7E9" : "#1E2C20",
            justifyContent: "center",
            minHeight: verticalScale(130),
          },
        ]}
      >
        {/* UPDATED: plain ActivityIndicator instead of an animated skeleton, simpler and cheaper to render */}
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

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
          disabled={loading} // NEW ADDITION: disable while a request is in flight
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Text style={[styles.forecastButtonText, { color: theme.primary }]}>
              Grant Location Access
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  const current = weatherData?.current;

  return (
    <View
      style={[
        styles.weatherWidget,
        {
          backgroundColor: colorScheme === "light" ? "#EBF7E9" : "#1E2C20",
        },
      ]}
    >
      {/* LEFT SIDE, location, temperature, description, forecast button */}
      <View style={styles.weatherLeft}>
        <Text style={[styles.weatherLocation, { color: theme.text }]}>
          {locationName}
        </Text>

        <View style={styles.tempRow}>
          <Ionicons
            name={
              (current
                ? getWeatherIcon(current.weather_code)
                : "cloud-outline") as any
            }
            size={moderateScale(38)}
            color={theme.primary}
            style={styles.weatherStateIcon}
          />
          <Text style={[styles.tempText, { color: theme.text }]}>
            {current ? `${Math.round(current.temperature_2m)}°C` : "--"}
          </Text>
        </View>

        <Text
          style={[
            styles.weatherDesc,
            { color: theme.text, fontWeight: "600", marginBottom: 4 },
          ]}
        >
          {current?.weatherDescription || "Fetching..."}
        </Text>

        <Text
          style={[
            styles.weatherDesc,
            { color: theme.text, opacity: 0.85, fontSize: moderateScale(11.5) },
          ]}
        >
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
          disabled={loading} // NEW ADDITION: disable while any refresh is running
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

      <View
        style={[
          styles.weatherDivider,
          {
            backgroundColor: colorScheme === "light" ? "#D0E9CD" : "#2E3D30",
          },
        ]}
      />

      {/* RIGHT SIDE, humidity, feels like */}
      <View style={styles.weatherRight}>
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
              {current ? `${current.relative_humidity_2m}%` : "--"}
            </Text>
          </View>
        </View>

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
              {current ? `${Math.round(current.apparent_temperature)}°C` : "--"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
