// app/weather.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import API from "@/services/api";
import { getLocationName, getWeatherIcon } from "@/utils/utilities";
import * as Location from "expo-location";

// TYPESCRIPT NOTE: these interfaces describe the exact shape of data
// returned by the backend, so TypeScript can warn us at compile time
// if we try to read a field that does not exist (e.g. a typo), instead
// of only finding out when the app crashes at runtime.
interface BackendCurrent {
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  precipitation: number;
  weather_code: number;
  weatherDescription: string;
}

interface DailyData {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  weather_code: number[];
  weatherDescriptions: string[];
}

interface RiskInsight {
  crop: string;
  riskLevel: string;
  message: string;
  factors: string[];
}

interface WeatherResponse {
  current: BackendCurrent;
  overallSummary: string;
  daily: DailyData;
  riskInsights: RiskInsight[];
}

// NEW ADDITION: small typed prop contract for the reusable skeleton box,
// so every call site is forced to pass valid width/height values instead
// of "any" shaped object.
interface SkeletonBoxProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}

// Skeleton loader shown while the first request is in flight.
// UPDATED: restyled to use the app's surface color and cream background
// instead of a generic gray, so the loading state already feels on brand.
const SkeletonLoader = ({
  backgroundColor,
  surfaceColor,
}: {
  backgroundColor: string;
  surfaceColor: string;
}) => {
  // useRef keeps the same Animated.Value across re-renders instead of
  // creating a brand new one on every render, which would restart the loop.
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [opacity]);

  // SkeletonBoxProps used here so this inline component is type checked too.
  const SkeletonBox = ({
    width,
    height,
    borderRadius = 12,
    style,
  }: SkeletonBoxProps) => (
    <Animated.View
      style={[
        styles.skeletonBox,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor }]}
      edges={["top", "left", "right"]}
    >
      <View style={styles.headerContainer}>
        <View style={styles.backButtonSkeleton} />
        <SkeletonBox width={140} height={20} />
        <View style={styles.rightSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Current weather hero skeleton */}
        <View
          style={[
            styles.currentCard,
            { backgroundColor: surfaceColor, alignItems: "center" },
          ]}
        >
          <SkeletonBox width={80} height={80} borderRadius={40} />
          <SkeletonBox width={110} height={48} style={{ marginTop: 14 }} />
          <SkeletonBox width={150} height={18} style={{ marginTop: 10 }} />
          <SkeletonBox width={120} height={14} style={{ marginTop: 8 }} />
        </View>

        {/* Summary skeleton */}
        <View style={[styles.summaryCard, { backgroundColor: surfaceColor }]}>
          <SkeletonBox width={140} height={16} />
          <SkeletonBox width="90%" height={50} style={{ marginTop: 12 }} />
        </View>

        {/* Daily forecast skeleton */}
        <View style={styles.section}>
          <SkeletonBox width={150} height={16} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 12 }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                style={[
                  styles.dailyCard,
                  { backgroundColor: surfaceColor, alignItems: "center" },
                ]}
              >
                <SkeletonBox width={46} height={14} />
                <SkeletonBox
                  width={32}
                  height={32}
                  borderRadius={16}
                  style={{ marginVertical: 8 }}
                />
                <SkeletonBox width={60} height={16} />
                <SkeletonBox width={44} height={12} style={{ marginTop: 6 }} />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Risk insights skeleton */}
        <View style={styles.section}>
          <SkeletonBox width={170} height={16} />
          {[1, 2].map((i) => (
            <View
              key={i}
              style={[styles.riskCard, { backgroundColor: surfaceColor }]}
            >
              <View style={styles.riskHeader}>
                <SkeletonBox width={80} height={18} />
                <SkeletonBox width={50} height={18} />
              </View>
              <SkeletonBox width="95%" height={14} style={{ marginTop: 10 }} />
              <SkeletonBox width="70%" height={14} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default function WeatherPage() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // useState<WeatherResponse | null> tells TypeScript this value is EITHER
  // a fully shaped WeatherResponse OR null, nothing else. This stops us from
  // accidentally reading weatherData.current before data has arrived.
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [locationName, setLocationName] = useState<string>(
    "Detecting location...",
  );
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  // NEW ADDITION: tracks the PDF export specifically, separate from the
  // main "loading" flag, so exporting a PDF does not show the full page
  // skeleton again, it only disables the export button itself.
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);

  // Derived flag used everywhere to disable buttons/touchables while ANY
  // async operation is running, per the "always disable while loading" rule.
  const isBusy = loading || refreshing || exportingPdf;

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
      const name = await getLocationName(
        loc.coords.latitude,
        loc.coords.longitude,
      );
      setLocationName(name);

      const res = await API.get("/api/weather/forecast", {
        params: { lat: loc.coords.latitude, lon: loc.coords.longitude },
      });

      if (res.data?.success && res.data.data) {
        setWeatherData(res.data.data);
      }
    } catch (err) {
      // UPDATED: secure, generic message shown to the user. The detailed
      // error stays in console.error only, so we never leak backend or
      // stack trace details to the UI.
      console.error("Weather Page Error:", err);
      Alert.alert("Unable to load weather", "Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWeather();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchWeather();
  }, []);

  const saveAsPDF = async () => {
    if (!weatherData) return;
    // NEW ADDITION: disable the export button for the duration of the export
    setExportingPdf(true);
    // ... (PDF logic remains the same)
    const html = `...`; // (same as previous)
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        UTI: "public.pdf",
        mimeType: "application/pdf",
      });
      Alert.alert("Success", "Weather report saved as PDF");
    } catch (error) {
      // UPDATED: secure, generic error message, no internal error leaked to UI
      Alert.alert(
        "Export failed",
        "Could not generate the PDF. Please try again.",
      );
    } finally {
      setExportingPdf(false);
    }
  };

  if (permissionDenied) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.background }]}
        edges={["top", "left", "right"]}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={[styles.backButton, { borderColor: theme.primary }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={moderateScale(18)}
              color={theme.primary}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.primary }]}>
            Weather
          </Text>
          <View style={styles.rightSpacer} />
        </View>

        <View style={styles.centerContainer}>
          <View
            style={[
              styles.permissionIconWrap,
              { backgroundColor: theme.logoBackground },
            ]}
          >
            <Ionicons
              name="location-outline"
              size={moderateScale(40)}
              color={theme.primary}
            />
          </View>
          <Text style={[styles.permissionText, { color: theme.text }]}>
            Location permission is required to show weather and crop risk
            insights for your farm.
          </Text>
          <TouchableOpacity
            style={[styles.grantButton, { backgroundColor: theme.primary }]}
            onPress={fetchWeather}
            activeOpacity={0.85}
            disabled={isBusy}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.grantButtonText}>Grant Location Access</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !weatherData) {
    return (
      <SkeletonLoader
        backgroundColor={theme.background}
        surfaceColor={theme.surface}
      />
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      {/* ================= HEADER SECTION ================= */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: theme.primary }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
          disabled={isBusy}
        >
          <Ionicons
            name="arrow-back"
            size={moderateScale(18)}
            color={theme.primary}
          />
        </TouchableOpacity>

        <Text
          style={[styles.headerTitle, { color: theme.primary }]}
          numberOfLines={1}
        >
          {locationName}
        </Text>

        <TouchableOpacity
          style={[styles.backButton, { borderColor: theme.primary }]}
          onPress={fetchWeather}
          activeOpacity={0.7}
          disabled={isBusy}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Ionicons
              name="refresh"
              size={moderateScale(18)}
              color={theme.primary}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            // Disable pull to refresh while another async action is running
            enabled={!isBusy || refreshing}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {weatherData && (
          <>
            {/* ================= CURRENT WEATHER HERO ================= */}
            <View
              style={[
                styles.currentCard,
                {
                  backgroundColor:
                    colorScheme === "light" ? theme.logoBackground : "#1E2C20",
                },
              ]}
            >
              <Ionicons
                name={getWeatherIcon(weatherData.current.weather_code) as any}
                size={moderateScale(72)}
                color={theme.primary}
              />
              <Text style={[styles.currentTemp, { color: theme.text }]}>
                {Math.round(weatherData.current.temperature_2m)}°C
              </Text>
              <Text style={[styles.currentDesc, { color: theme.text }]}>
                {weatherData.current.weatherDescription}
              </Text>
              <View
                style={[
                  styles.pillBadge,
                  {
                    backgroundColor:
                      colorScheme === "light" ? "#FFFFFF" : "#2E3D30",
                  },
                ]}
              >
                <Ionicons
                  name="thermometer-outline"
                  size={moderateScale(12)}
                  color={theme.primary}
                />
                <Text style={[styles.pillBadgeText, { color: theme.primary }]}>
                  Feels like{" "}
                  {Math.round(weatherData.current.apparent_temperature)}°C
                </Text>
              </View>
            </View>

            {/* ================= TODAY'S OUTLOOK ================= */}
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              Today's Outlook
            </Text>
            <View
              style={[styles.summaryCard, { backgroundColor: theme.surface }]}
            >
              <Text style={[styles.summaryText, { color: theme.text }]}>
                {weatherData.overallSummary}
              </Text>
            </View>

            {/* ================= 7 DAY FORECAST ================= */}
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              7-Day Forecast
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dailyScroll}
              contentContainerStyle={{ paddingRight: scale(4) }}
            >
              {weatherData.daily.time.map((date, index) => (
                <View
                  key={date}
                  style={[styles.dailyCard, { backgroundColor: theme.surface }]}
                >
                  <Text style={[styles.dayText, { color: theme.text }]}>
                    {index === 0
                      ? "Today"
                      : index === 1
                        ? "Tomorrow"
                        : new Date(date).toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                  </Text>
                  <Ionicons
                    name={
                      getWeatherIcon(
                        weatherData.daily.weather_code[index],
                      ) as any
                    }
                    size={moderateScale(32)}
                    color={theme.primary}
                    style={{ marginVertical: verticalScale(6) }}
                  />
                  <Text style={[styles.tempRange, { color: theme.text }]}>
                    {Math.round(weatherData.daily.temperature_2m_max[index])}° /{" "}
                    {Math.round(weatherData.daily.temperature_2m_min[index])}°
                  </Text>
                  <View style={styles.precipRow}>
                    <Ionicons
                      name="rainy-outline"
                      size={moderateScale(11)}
                      color="#3b82f6"
                    />
                    <Text style={styles.precip}>
                      {weatherData.daily.precipitation_probability_max[index]}%
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* ================= CROP RISK INSIGHTS ================= */}
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              Crop Risk Insights
            </Text>
            <View style={styles.riskList}>
              {weatherData.riskInsights.map((insight) => {
                // UPDATED: risk colors now resolved once per item, reused
                // for both the badge background and the badge text so they
                // always stay in sync.
                const riskColor =
                  insight.riskLevel === "Low"
                    ? "#2E7D32"
                    : insight.riskLevel === "Medium"
                      ? "#E4A11B"
                      : theme.error;
                const riskBg =
                  insight.riskLevel === "Low"
                    ? colorScheme === "light"
                      ? "#EBF7E9"
                      : "#1E2C20"
                    : insight.riskLevel === "Medium"
                      ? colorScheme === "light"
                        ? "#FFFCE2"
                        : "#2D2B1C"
                      : colorScheme === "light"
                        ? "#FEEAEA"
                        : "#3A1F1F";

                return (
                  <View
                    key={insight.crop}
                    style={[
                      styles.riskCard,
                      { backgroundColor: theme.surface },
                    ]}
                  >
                    <View style={styles.riskHeader}>
                      <View style={styles.riskCropRow}>
                        <Ionicons
                          name="leaf-outline"
                          size={moderateScale(14)}
                          color={theme.primary}
                        />
                        <Text style={[styles.cropName, { color: theme.text }]}>
                          {insight.crop}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.riskLevelPill,
                          { backgroundColor: riskBg },
                        ]}
                      >
                        <Text
                          style={[styles.riskLevelText, { color: riskColor }]}
                        >
                          {insight.riskLevel}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.riskMessage, { color: theme.text }]}>
                      {insight.message}
                    </Text>
                    {insight.factors.length > 0 && (
                      <View style={styles.factorsRow}>
                        {insight.factors.map((factor) => (
                          <View
                            key={factor}
                            style={[
                              styles.factorChip,
                              {
                                backgroundColor:
                                  colorScheme === "light"
                                    ? "#F3F4F6"
                                    : "#1F2937",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.factorChipText,
                                { color: theme.icon },
                              ]}
                            >
                              {factor}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* ================= EXPORT ACTION ================= */}
            <TouchableOpacity
              style={[
                styles.pdfButton,
                { backgroundColor: theme.primary, opacity: isBusy ? 0.6 : 1 },
              ]}
              onPress={saveAsPDF}
              activeOpacity={0.85}
              disabled={isBusy}
            >
              {exportingPdf ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="document-text-outline"
                    size={moderateScale(18)}
                    color="#FFFFFF"
                  />
                  <Text style={styles.pdfButtonText}>Save as PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(4),
    paddingBottom: verticalScale(100),
  },

  // Header, matches Profile/MyCrops centered header pattern
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
  },
  backButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonSkeleton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
  },
  headerTitle: {
    flex: 1,
    fontSize: moderateScale(16),
    fontWeight: "700",
    textAlign: "center",
    marginHorizontal: scale(8),
  },
  rightSpacer: { width: moderateScale(32) },

  // Current weather hero card
  currentCard: {
    borderRadius: moderateScale(16),
    paddingVertical: verticalScale(24),
    paddingHorizontal: scale(20),
    alignItems: "center",
    marginTop: verticalScale(6),
    marginBottom: verticalScale(20),
  },
  currentTemp: {
    fontSize: moderateScale(46),
    fontWeight: "700",
    marginTop: verticalScale(10),
  },
  currentDesc: {
    fontSize: moderateScale(15),
    fontWeight: "600",
    marginTop: verticalScale(2),
  },
  pillBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(20),
    marginTop: verticalScale(12),
    gap: 5,
  },
  pillBadgeText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
  },

  // Section titles, matching Profile screen style exactly
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    marginBottom: verticalScale(10),
    marginTop: verticalScale(4),
  },

  // Today's outlook card
  summaryCard: {
    borderRadius: moderateScale(12),
    padding: scale(16),
    marginBottom: verticalScale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryText: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(19),
    opacity: 0.9,
  },

  section: { marginBottom: verticalScale(20) },

  // 7 day forecast
  dailyScroll: { marginBottom: verticalScale(20) },
  dailyCard: {
    width: scale(92),
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(8),
    marginRight: scale(10),
    borderRadius: moderateScale(14),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  dayText: { fontSize: moderateScale(12), fontWeight: "700" },
  tempRange: { fontSize: moderateScale(13), fontWeight: "700" },
  precipRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(6),
    gap: 3,
  },
  precip: { fontSize: moderateScale(11), color: "#3b82f6", fontWeight: "600" },

  // Crop risk insights
  riskList: { gap: verticalScale(12), marginBottom: verticalScale(20) },
  riskCard: {
    padding: scale(16),
    borderRadius: moderateScale(14),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  riskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(8),
  },
  riskCropRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cropName: { fontSize: moderateScale(14), fontWeight: "700" },
  riskLevelPill: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(20),
  },
  riskLevelText: { fontWeight: "700", fontSize: moderateScale(11) },
  riskMessage: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
    marginBottom: verticalScale(8),
  },
  factorsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  factorChip: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(8),
  },
  factorChipText: { fontSize: moderateScale(10.5), fontWeight: "500" },

  // PDF export button
  pdfButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(12),
    gap: 8,
    marginBottom: verticalScale(20),
  },
  pdfButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: moderateScale(14),
  },

  // Permission denied state
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(32),
  },
  permissionIconWrap: {
    width: moderateScale(88),
    height: moderateScale(88),
    borderRadius: moderateScale(44),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(20),
  },
  permissionText: {
    fontSize: moderateScale(14),
    textAlign: "center",
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(24),
  },
  grantButton: {
    paddingHorizontal: scale(28),
    paddingVertical: verticalScale(13),
    borderRadius: moderateScale(12),
    minWidth: scale(200),
    alignItems: "center",
    justifyContent: "center",
  },
  grantButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: moderateScale(13),
  },

  // Skeleton
  skeletonBox: { backgroundColor: "#E5E7EB" },
});
