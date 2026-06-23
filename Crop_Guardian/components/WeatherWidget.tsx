// components/WeatherWidget.tsx
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import API from "@/services/api";
import { getLocationName } from "@/utils/utilities";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

// Map weather code → Ionicons name
const getWeatherIcon = (code: number): string => {
  if ([0, 1].includes(code)) return "sunny-outline";
  if ([2, 3].includes(code)) return "partly-sunny-outline";
  if ([45, 48].includes(code)) return "cloudy-outline";
  if ([51, 53, 55].includes(code)) return "rainy-outline";
  if ([61, 63, 65, 80, 81, 82].includes(code)) return "rainy-outline";
  if ([71, 73, 75].includes(code)) return "snow-outline";
  return "cloud-outline"; // fallback
};

//  Full backend shape (only fields that exist)
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

//  Added weatherDescription field
interface DisplayWeather {
  temp: number;
  humidity: number;
  feelsLike: number;
  description: string; //  weatherDescription from current
  icon: string;
  locationName: string;
  overallSummary: string;
}

interface WeatherWidgetProps {
  refreshTrigger?: number; 
}

export default function WeatherWidget({ refreshTrigger = 0 }: WeatherWidgetProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const [weatherData, setWeatherData] = useState<DisplayWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

    useEffect(() => {
    fetchWeather();
  }, [refreshTrigger]);

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
          description: current.weatherDescription, //  weather code summary
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

  useEffect(() => {
    fetchWeather();
  }, []);

  const handleGrantPermission = () => {
    fetchWeather();
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
        <Text style={[styles.weatherLocation, { color: theme.text }]}>
          {weatherData?.locationName || "Detecting location..."}
        </Text>

        <View style={styles.tempRow}>
          <Ionicons
            name={(weatherData?.icon as any) || "cloud-outline"}
            size={moderateScale(38)}
            color={theme.primary}
            style={styles.weatherStateIcon}
          />
          <Text style={[styles.tempText, { color: theme.text }]}>
            {weatherData?.temp !== undefined
              ? `${Math.round(weatherData.temp)}°C`
              : "--"}
          </Text>
        </View>

        {/*  Weather code summary (short description from backend) */}
        <Text
          style={[
            styles.weatherDesc,
            { color: theme.text, fontWeight: "600", marginBottom: 4 },
          ]}
        >
          {weatherData?.description || "—"}
        </Text>

        {/*  overallSummary as secondary summary */}
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

      {/* Vertical divider */}
      <View
        style={[
          styles.weatherDivider,
          {
            backgroundColor: colorScheme === "light" ? "#D0E9CD" : "#2E3D30",
          },
        ]}
      />

      {/* RIGHT SIDE — Humidity, Feels like */}
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
              {weatherData?.humidity !== undefined
                ? `${weatherData.humidity}%`
                : "--"}
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
  // to styles
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
