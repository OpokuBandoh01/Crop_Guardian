// app/weather.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useWeatherStore } from "@/stores/weatherStore"; // NEW ADDITION: shared 15 minute cache store
import { getWeatherIcon } from "@/utils/utilities";

export default function WeatherPage() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // Reading slices individually from the shared store rather than one big
  // object, this keeps re-renders limited to only the piece that changed.
  const weatherData = useWeatherStore((state) => state.weatherData);
  const locationName = useWeatherStore((state) => state.locationName);
  const fetchedAt = useWeatherStore((state) => state.fetchedAt);
  const loading = useWeatherStore((state) => state.loading);
  const permissionDenied = useWeatherStore((state) => state.permissionDenied);
  const fetchWeather = useWeatherStore((state) => state.fetchWeather);

  const [refreshing, setRefreshing] = useState<boolean>(false);
  // Tracks the PDF export specifically, separate from data loading, so
  // exporting a PDF only disables the export button, not the whole screen.
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);

  // Derived flag used to disable buttons/touchables while ANY async
  // operation is running, per the "always disable while loading" rule.
  const isBusy = loading || refreshing || exportingPdf;

  // On mount, ask the store for data. If a fresh cached result already
  // exists (from the Home screen widget, or a previous visit within the
  // last 15 minutes), this resolves instantly with no network call.
  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // force: true intentionally bypasses the cache here, pull-to-refresh
    // is the one explicit user action that should always hit the network.
    await fetchWeather({ force: true });
    setRefreshing(false);
  }, [fetchWeather]);

  // Builds the actual PDF HTML from real weatherData, previous version of
  // this file had a placeholder string "..." here which is why the export
  // was silently producing an empty/broken PDF.
  const buildReportHtml = (): string => {
    if (!weatherData)
      return "<html><body><p>No weather data available.</p></body></html>";

    const { current, daily, riskInsights, overallSummary } = weatherData;

    // Build each daily forecast row as an HTML table row string.
    const dailyRows = daily.time
      .map((date, index) => {
        const dayLabel =
          index === 0
            ? "Today"
            : new Date(date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
        return `
          <tr>
            <td>${dayLabel}</td>
            <td>${daily.weatherDescriptions[index] ?? "Unknown"}</td>
            <td>${Math.round(daily.temperature_2m_max[index])}° / ${Math.round(
              daily.temperature_2m_min[index],
            )}°</td>
            <td>${daily.precipitation_probability_max[index]}%</td>
          </tr>`;
      })
      .join("");

    // Build each crop risk insight as an HTML block.
    const riskBlocks = riskInsights
      .map(
        (insight) => `
          <div class="risk-card">
            <div class="risk-header">
              <span class="risk-crop">${insight.crop}</span>
              <span class="risk-level risk-${insight.riskLevel.toLowerCase()}">${insight.riskLevel}</span>
            </div>
            <p class="risk-message">${insight.message}</p>
            ${
              insight.factors.length > 0
                ? `<p class="risk-factors">Factors: ${insight.factors.join(", ")}</p>`
                : ""
            }
          </div>`,
      )
      .join("");

    // Full HTML document. Inline styles only, since expo-print renders this
    // as a standalone document, it does not have access to app stylesheets.
    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px; color: #11181C; }
            h1 { color: #094A04; font-size: 22px; margin-bottom: 4px; }
            .subtitle { color: #687076; font-size: 13px; margin-bottom: 20px; }
            .current-card { background: #EBF7E9; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
            .current-temp { font-size: 36px; font-weight: 700; color: #094A04; margin: 4px 0; }
            .summary-card { background: #F9FAFB; border-radius: 12px; padding: 16px; margin-bottom: 20px; font-size: 13px; line-height: 19px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { text-align: left; padding: 8px; font-size: 12px; border-bottom: 1px solid #E5E7EB; }
            th { color: #094A04; }
            .risk-card { border: 1px solid #E5E7EB; border-radius: 10px; padding: 12px; margin-bottom: 10px; }
            .risk-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
            .risk-crop { font-weight: 700; font-size: 13px; }
            .risk-level { font-weight: 700; font-size: 11px; padding: 2px 8px; border-radius: 10px; }
            .risk-low { background: #EBF7E9; color: #2E7D32; }
            .risk-medium { background: #FFFCE2; color: #E4A11B; }
            .risk-high { background: #FEEAEA; color: #EF4444; }
            .risk-message { font-size: 12px; margin: 4px 0; }
            .risk-factors { font-size: 11px; color: #687076; }
            .footer { font-size: 10px; color: #9CA3AF; margin-top: 24px; }
          </style>
        </head>
        <body>
          <h1>Crop Guardian Weather Report</h1>
          <p class="subtitle">${locationName} &middot; Generated ${new Date().toLocaleString()}</p>

          <div class="current-card">
            <div class="current-temp">${Math.round(current.temperature_2m)}&deg;C</div>
            <p>${current.weatherDescription}</p>
            <p>Feels like ${Math.round(current.apparent_temperature)}&deg;C &middot; Humidity ${current.relative_humidity_2m}%</p>
          </div>

          <h3>Today's Outlook</h3>
          <div class="summary-card"><p>${overallSummary}</p></div>

          <h3>7-Day Forecast</h3>
          <table>
            <tr><th>Day</th><th>Condition</th><th>Temp</th><th>Rain Chance</th></tr>
            ${dailyRows}
          </table>

          <h3>Crop Risk Insights</h3>
          ${riskBlocks}

          <p class="footer">Generated by Crop Guardian. Risk levels are estimates based on weather conditions, not guarantees.</p>
        </body>
      </html>`;
  };

  const saveAsPDF = async () => {
    if (!weatherData) return;

    setExportingPdf(true);

    try {
      const html = buildReportHtml(); // UPDATED: real HTML built from actual data, was a placeholder string before

      const { uri } = await Print.printToFileAsync({ html });

      // NEW ADDITION: check sharing is actually available on this device
      // before calling shareAsync, some emulators/devices have no share
      // sheet at all, which would otherwise fail silently.
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert(
          "Sharing not available",
          "Your device does not support sharing files, but the PDF was created successfully.",
        );
        return;
      }

      await Sharing.shareAsync(uri, {
        UTI: "public.pdf",
        mimeType: "application/pdf",
      });
    } catch (error) {
      // UPDATED: secure, generic error message, no internal error leaked to UI
      console.error("PDF export error:", error);
      Alert.alert(
        "Export failed",
        "Could not generate the PDF. Please try again.",
      );
    } finally {
      setExportingPdf(false);
    }
  };

  // Small trust-building touch: show how fresh the cached data is, so the
  // person understands why a re-open of this screen felt instant, rather
  // than wondering if the app is showing them something stale unknowingly.
  const getFreshnessLabel = (): string | null => {
    if (!fetchedAt) return null;
    const minutesAgo = Math.floor((Date.now() - fetchedAt) / 60000);
    if (minutesAgo < 1) return "Updated just now";
    if (minutesAgo === 1) return "Updated 1 minute ago";
    return `Updated ${minutesAgo} minutes ago`;
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
            onPress={() => fetchWeather({ force: true })}
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

  // UPDATED: plain centered ActivityIndicator, replacing the animated
  // SkeletonLoader component entirely. Only shown on the very first load,
  // when there is no cached data yet to display.
  if (loading && !weatherData) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.background }]}
        edges={["top", "left", "right"]}
      >
        <View style={styles.headerContainer}>
          <View style={styles.backButtonSkeleton} />
          <Text style={[styles.headerTitle, { color: theme.primary }]}>
            Weather
          </Text>
          <View style={styles.rightSpacer} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.icon }]}>
            Getting your local forecast...
          </Text>
        </View>
      </SafeAreaView>
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
          onPress={() => fetchWeather({ force: true })}
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
            enabled={!isBusy || refreshing}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {weatherData && (
          <>
            {/* NEW ADDITION: freshness label, builds trust that cached data is intentional, not stale by accident */}
            {getFreshnessLabel() && (
              <Text style={[styles.freshnessLabel, { color: theme.icon }]}>
                {getFreshnessLabel()}
              </Text>
            )}

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

  // NEW ADDITION: small "Updated X minutes ago" label above the hero card
  freshnessLabel: {
    fontSize: moderateScale(11),
    fontWeight: "500",
    marginBottom: verticalScale(8),
    textAlign: "center",
  },

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

  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    marginBottom: verticalScale(10),
    marginTop: verticalScale(4),
  },

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
  // NEW ADDITION: label shown under the ActivityIndicator on first load
  loadingText: {
    fontSize: moderateScale(13),
    marginTop: verticalScale(12),
    fontWeight: "500",
  },
});
