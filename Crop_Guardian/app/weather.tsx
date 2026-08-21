// app/weather.tsx

import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { useFocusEffect, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
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
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { useWeatherStore } from "@/stores/weatherStore";
import { getWeatherIcon } from "@/utils/utilities";

// //NEW ADDITION : helper labels so metric chips feel human (psychology)
function humidityLabel(pct: number): string {
  if (pct >= 80) return "High";
  if (pct >= 60) return "Moderate";
  return "Comfortable";
}

function rainChanceLabel(pct: number): string {
  if (pct >= 70) return "Likely rain";
  if (pct >= 40) return "Possible showers";
  if (pct >= 20) return "Low chance";
  return "Mostly dry";
}

function formatHeroDate(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  const day = d.getDate();
  const month = d.toLocaleDateString("en-GB", { month: "short" });
  return `Today, ${day} ${month}`;
}

function formatDayLabel(iso: string, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

function formatDaySub(iso: string, index: number): string {
  if (index === 0) return "";
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.toLocaleDateString("en-GB", { month: "short" });
  return `${day} ${month}`;
}

export default function WeatherPage() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // //NO CHANGES : store slices (keeps re-renders narrow)
  const weatherData = useWeatherStore((state) => state.weatherData);
  const locationName = useWeatherStore((state) => state.locationName);
  const fetchedAt = useWeatherStore((state) => state.fetchedAt);
  const loading = useWeatherStore((state) => state.loading);
  const permissionDenied = useWeatherStore((state) => state.permissionDenied);
  const fetchWeather = useWeatherStore((state) => state.fetchWeather);

  // NEW ADDITION: subscription status (paid unlocks crop risk insights)
  const { status, fetchStatus } = useSubscriptionStore();
  const isPaid = Boolean(status?.isPaid || status?.hasCropInsights);

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);

  // //NO CHANGES : disable all pressables while any async work runs
  const isBusy = loading || refreshing || exportingPdf;

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  // NEW ADDITION: refresh plan status when weather screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchStatus();
    }, [fetchStatus]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // UPDATED: also refresh subscription status on pull-to-refresh
    await Promise.all([fetchWeather({ force: true }), fetchStatus()]);
    setRefreshing(false);
  }, [fetchWeather, fetchStatus]);

  // UPDATED: PDF builder safely handles missing riskInsights (free plan)
  const buildReportHtml = () => {
    if (!weatherData) return "";
    const { current, daily, overallSummary } = weatherData;
    // NEW ADDITION: optional chaining — free responses may omit riskInsights
    const riskInsights = weatherData.riskInsights ?? [];

    const dailyRows = daily.time
      .map((date, index) => {
        const label =
          index === 0
            ? "Today"
            : index === 1
              ? "Tomorrow"
              : new Date(date).toLocaleDateString("en-US", {
                  weekday: "short",
                });
        return `
          <tr>
            <td>${label}</td>
            <td>${daily.weatherDescriptions[index] ?? "Unknown"}</td>
            <td>${Math.round(daily.temperature_2m_max[index])}° / ${Math.round(
              daily.temperature_2m_min[index],
            )}°</td>
            <td>${daily.precipitation_probability_max[index]}%</td>
          </tr>`;
      })
      .join("");

    const riskBlocks =
      riskInsights.length > 0
        ? riskInsights
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
            .join("")
        : `<p class="summary-card">Crop risk insights are available with Farmer Monthly.</p>`;

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
          <p class="subtitle">${locationName}</p>
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

  // //NO CHANGES : secure PDF export flow
  const saveAsPDF = async () => {
    if (!weatherData) return;
    setExportingPdf(true);
    try {
      const html = buildReportHtml();
      const { uri } = await Print.printToFileAsync({ html });
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
      console.error("PDF export error:", error);
      Alert.alert(
        "Export failed",
        "Could not generate the PDF. Please try again.",
      );
    } finally {
      setExportingPdf(false);
    }
  };

  const getFreshnessLabel = (): string | null => {
    if (!fetchedAt) return null;
    const minutesAgo = Math.floor((Date.now() - fetchedAt) / 60000);
    if (minutesAgo < 1) return "Updated just now";
    if (minutesAgo === 1) return "Updated 1 minute ago";
    return `Updated ${minutesAgo} minutes ago`;
  };

  // //NEW ADDITION : derive rain chance + approximate hourly strip from daily data
  const todayRainChance = useMemo(() => {
    if (!weatherData?.daily?.precipitation_probability_max?.length) return 0;
    return weatherData.daily.precipitation_probability_max[0] ?? 0;
  }, [weatherData]);

  const hourlyApprox = useMemo(() => {
    if (!weatherData) return [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentTemp = weatherData.current.temperature_2m;
    const maxT = weatherData.daily.temperature_2m_max[0] ?? currentTemp;
    const minT = weatherData.daily.temperature_2m_min[0] ?? currentTemp;
    const code = weatherData.current.weather_code;

    // Build 6 slots starting from current hour so the UI matches the design.
    // This is a visual approximation only until backend returns real hourly.
    return Array.from({ length: 6 }).map((_, i) => {
      const hour = (currentHour + i) % 24;
      const label =
        i === 0
          ? "Now"
          : `${hour % 12 === 0 ? 12 : hour % 12} ${hour < 12 ? "AM" : "PM"}`;
      // Gentle curve: cooler near night, warmer toward afternoon peak
      const afternoonBoost = hour >= 12 && hour <= 16 ? 1 : 0;
      const nightDrop = hour >= 20 || hour <= 5 ? -1 : 0;
      const t =
        i === 0
          ? currentTemp
          : Math.round(
              Math.min(
                maxT,
                Math.max(
                  minT,
                  currentTemp +
                    afternoonBoost +
                    nightDrop +
                    (i % 2 === 0 ? 0.5 : -0.3),
                ),
              ),
            );
      return {
        key: `h-${i}`,
        label,
        temp: Math.round(t),
        icon: getWeatherIcon(code),
      };
    });
  }, [weatherData]);

  // NEW ADDITION: safe list — free plan may omit riskInsights entirely
  const riskInsights = weatherData?.riskInsights ?? [];
  const hasCropInsights = riskInsights.length > 0;
  // Primary crop advice card (first risk insight, matches screenshot focus)
  const primaryAdvice = hasCropInsights ? riskInsights[0] : null;

  // ================= PERMISSION DENIED =================
  // //NO CHANGES : same permission empty state behaviour
  if (permissionDenied) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.background }]}
        edges={["top", "left", "right"]}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={[styles.iconBtn, { borderColor: theme.primary }]}
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
          <View style={styles.iconBtnPlaceholder} />
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
            Location permission is needed to show your local farm weather and
            crop risk advice.
          </Text>
          <TouchableOpacity
            style={[styles.grantButton, { backgroundColor: theme.primary }]}
            onPress={() => fetchWeather({ force: true })}
            activeOpacity={0.85}
          >
            <Text style={styles.grantButtonText}>Enable location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ================= FIRST LOAD =================
  // //NO CHANGES : plain spinner while no cached data
  if (loading && !weatherData) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.background }]}
        edges={["top", "left", "right"]}
      >
        <View style={styles.headerContainer}>
          <View style={styles.iconBtnPlaceholder} />
          <Text style={[styles.headerTitle, { color: theme.primary }]}>
            Weather
          </Text>
          <View style={styles.iconBtnPlaceholder} />
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

  // ================= MAIN UI (screenshot layout) =================
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      {/* //UPDATED : header matches screenshot — back | Weather | bell */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={[styles.iconBtn, { borderColor: theme.primary }]}
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

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.primary }]}>
            Weather
          </Text>
          {/* //NEW ADDITION : location under title with pin icon */}
          <View style={styles.locationRow}>
            <Ionicons
              name="location-sharp"
              size={moderateScale(12)}
              color={theme.primary}
            />
            <Text
              style={[styles.locationText, { color: theme.icon }]}
              numberOfLines={1}
            >
              {locationName}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.iconBtn, { borderColor: theme.primary }]}
          onPress={() => router.push("/(tabs)/alerts")}
          activeOpacity={0.7}
          disabled={isBusy}
        >
          <Ionicons
            name="notifications-outline"
            size={moderateScale(18)}
            color={theme.primary}
          />
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
            {getFreshnessLabel() && (
              <Text
                style={[styles.freshnessLabel, { color: theme.tabIconDefault }]}
              >
                {getFreshnessLabel()}
              </Text>
            )}

            {/* ================= HERO CARD ================= */}
            {/* //UPDATED : field background image + large temp like screenshot */}
            <ImageBackground
              source={require("@/assets/images/weatherbackground.png")}
              style={styles.heroCard}
              imageStyle={styles.heroImage}
            >
              {/* dark soft overlay so white text stays readable */}
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <View style={styles.heroLeft}>
                  <Text style={styles.heroDate}>
                    {formatHeroDate(weatherData.current.time)}
                  </Text>
                  <Text style={styles.heroTemp}>
                    {Math.round(weatherData.current.temperature_2m)}°C
                  </Text>
                  <Text style={styles.heroDesc}>
                    {weatherData.current.weatherDescription}
                  </Text>
                </View>
                <View style={styles.heroRight}>
                  <Ionicons
                    name={
                      getWeatherIcon(weatherData.current.weather_code) as any
                    }
                    size={moderateScale(64)}
                    color="#FFFFFF"
                  />
                </View>
              </View>
            </ImageBackground>

            {/* ================= 3 METRIC CHIPS ================= */}
            {/* //NEW ADDITION : Humidity / Rain Chance / Wind row */}
            <View style={styles.metricsRow}>
              <View
                style={[
                  styles.metricChip,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.inputBorder,
                  },
                ]}
              >
                <View style={styles.metricIconWrap}>
                  <Ionicons
                    name="water-outline"
                    size={moderateScale(16)}
                    color={theme.primary}
                  />
                </View>
                <Text
                  style={[styles.metricLabel, { color: theme.tabIconDefault }]}
                >
                  Humidity
                </Text>
                <Text style={[styles.metricValue, { color: theme.text }]}>
                  {weatherData.current.relative_humidity_2m}%
                </Text>
                <Text style={[styles.metricSub, { color: theme.icon }]}>
                  {humidityLabel(weatherData.current.relative_humidity_2m)}
                </Text>
              </View>

              <View
                style={[
                  styles.metricChip,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.inputBorder,
                  },
                ]}
              >
                <View style={styles.metricIconWrap}>
                  <Ionicons
                    name="rainy-outline"
                    size={moderateScale(16)}
                    color={theme.primary}
                  />
                </View>
                <Text
                  style={[styles.metricLabel, { color: theme.tabIconDefault }]}
                >
                  Rain Chance
                </Text>
                <Text style={[styles.metricValue, { color: theme.text }]}>
                  {todayRainChance}%
                </Text>
                <Text style={[styles.metricSub, { color: theme.icon }]}>
                  {rainChanceLabel(todayRainChance)}
                </Text>
              </View>

              <View
                style={[
                  styles.metricChip,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.inputBorder,
                  },
                ]}
              >
                <View style={styles.metricIconWrap}>
                  <Ionicons
                    name="navigate-outline"
                    size={moderateScale(16)}
                    color={theme.primary}
                  />
                </View>
                <Text
                  style={[styles.metricLabel, { color: theme.tabIconDefault }]}
                >
                  Feels like
                </Text>
                <Text style={[styles.metricValue, { color: theme.text }]}>
                  {Math.round(weatherData.current.apparent_temperature)}°
                </Text>
                <Text style={[styles.metricSub, { color: theme.icon }]}>
                  Apparent
                </Text>
              </View>
            </View>

            {/* ================= WEATHER ADVICE CARD (paid) ================= */}
            {/* //UPDATED : only when riskInsights are present */}
            {primaryAdvice && (
              <View style={styles.adviceCard}>
                <View style={styles.adviceTop}>
                  <Text style={styles.adviceTitle}>
                    Weather Advice for{" "}
                    {primaryAdvice.crop.charAt(0) +
                      primaryAdvice.crop.slice(1).toLowerCase()}
                  </Text>
                  <View style={styles.adviceShield}>
                    <Ionicons
                      name="shield-checkmark"
                      size={moderateScale(18)}
                      color="#FFFFFF"
                    />
                  </View>
                </View>
                <Text style={styles.adviceBody} numberOfLines={3}>
                  {primaryAdvice.message}
                </Text>
                {primaryAdvice.factors.length > 0 && (
                  <Text style={styles.adviceFactors} numberOfLines={1}>
                    {primaryAdvice.factors.join(" · ")}
                  </Text>
                )}
              </View>
            )}

            {/* NEW ADDITION: free plan upgrade card (forecast still fully visible) */}
            {!hasCropInsights && (
              <TouchableOpacity
                style={styles.upgradeCard}
                activeOpacity={0.88}
                disabled={isBusy}
                onPress={() => router.push("/upgrade")}
              >
                <View style={styles.upgradeTop}>
                  <View style={styles.upgradeIconWrap}>
                    <Ionicons
                      name="leaf"
                      size={moderateScale(18)}
                      color="#FFFFFF"
                    />
                  </View>
                  <Text style={styles.upgradeTitle}>
                    Unlock crop risk insights
                  </Text>
                </View>
                <Text style={styles.upgradeBody}>
                  Farmer Monthly adds disease risk guidance for your crops based
                  on local weather. Forecast above stays free for everyone.
                </Text>
                <View style={styles.upgradeCtaRow}>
                  <Text style={styles.upgradeCta}>Subscribe · GHS 50</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={moderateScale(16)}
                    color="#A7F3D0"
                  />
                </View>
              </TouchableOpacity>
            )}

            {/* Optional overall summary for free users (weather-only from backend) */}
            {!hasCropInsights && weatherData.overallSummary ? (
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor:
                      colorScheme === "light" ? "#E8EDE8" : theme.inputBorder,
                  },
                ]}
              >
                <Text style={[styles.summaryTitle, { color: theme.text }]}>
                  Today&apos;s outlook
                </Text>
                <Text
                  style={[styles.summaryBody, { color: theme.tabIconDefault }]}
                >
                  {weatherData.overallSummary}
                </Text>
              </View>
            ) : null}

            {/* ================= HOURLY FORECAST ================= */}
            {/* //NEW ADDITION : horizontal hourly strip (approx until backend hourly) */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Hourly Forecast
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={isBusy}
                onPress={() => {
                  // soft scroll cue — full hourly needs backend later
                  Alert.alert(
                    "Hourly forecast",
                    "Showing a short preview from today's conditions. Full hourly data will arrive when the weather API includes hourly readings.",
                  );
                }}
              >
                <Text style={[styles.sectionLink, { color: theme.primary }]}>
                  View Full Forecast
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hourlyRow}
            >
              {hourlyApprox.map((slot) => (
                <View
                  key={slot.key}
                  style={[
                    styles.hourlyCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor:
                        colorScheme === "light" ? "#E8EDE8" : theme.inputBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.hourlyLabel,
                      { color: theme.tabIconDefault },
                    ]}
                  >
                    {slot.label}
                  </Text>
                  <Ionicons
                    name={slot.icon as any}
                    size={moderateScale(22)}
                    color={theme.primary}
                    style={{ marginVertical: verticalScale(6) }}
                  />
                  <Text style={[styles.hourlyTemp, { color: theme.text }]}>
                    {slot.temp}°
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* ================= 7-DAY FORECAST ================= */}
            {/* //UPDATED : vertical list layout matching screenshot */}
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.text, marginTop: verticalScale(6) },
              ]}
            >
              7-Day Forecast
            </Text>

            <View
              style={[
                styles.dailyList,
                {
                  backgroundColor: theme.surface,
                  borderColor:
                    colorScheme === "light" ? "#E8EDE8" : theme.inputBorder,
                },
              ]}
            >
              {weatherData.daily.time.map((date, index) => {
                const rain =
                  weatherData.daily.precipitation_probability_max[index] ?? 0;
                const desc =
                  weatherData.daily.weatherDescriptions[index] ?? "Unknown";
                const high = Math.round(
                  weatherData.daily.temperature_2m_max[index],
                );
                const low = Math.round(
                  weatherData.daily.temperature_2m_min[index],
                );
                const isLast = index === weatherData.daily.time.length - 1;

                return (
                  <View
                    key={date}
                    style={[
                      styles.dailyRow,
                      !isLast && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor:
                          colorScheme === "light" ? "#E5E7EB" : "#374151",
                      },
                    ]}
                  >
                    <View style={styles.dailyLeft}>
                      <Text style={[styles.dailyDay, { color: theme.text }]}>
                        {formatDayLabel(date, index)}
                      </Text>
                      {index > 0 && (
                        <Text
                          style={[
                            styles.dailySub,
                            { color: theme.tabIconDefault },
                          ]}
                        >
                          {formatDaySub(date, index)}
                        </Text>
                      )}
                    </View>

                    <View style={styles.dailyMid}>
                      <Ionicons
                        name={
                          getWeatherIcon(
                            weatherData.daily.weather_code[index],
                          ) as any
                        }
                        size={moderateScale(20)}
                        color={theme.primary}
                      />
                      <Text
                        style={[
                          styles.dailyDesc,
                          { color: theme.tabIconDefault },
                        ]}
                        numberOfLines={1}
                      >
                        {desc}
                      </Text>
                    </View>

                    <View style={styles.dailyRight}>
                      <Text style={styles.dailyRain}>{rain}%</Text>
                      <Text style={[styles.dailyTemps, { color: theme.text }]}>
                        {low}°/{high}°
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* ================= EXTRA CROP RISKS (paid, if more than one) ================= */}
            {riskInsights.length > 1 && (
              <>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.text, marginTop: verticalScale(8) },
                  ]}
                >
                  More Crop Insights
                </Text>
                <View style={styles.riskList}>
                  {riskInsights.slice(1).map((insight) => {
                    const levelColor =
                      insight.riskLevel === "High"
                        ? "#EF4444"
                        : insight.riskLevel === "Medium"
                          ? "#E4A11B"
                          : "#2E7D32";
                    const levelBg =
                      insight.riskLevel === "High"
                        ? "#FEEAEA"
                        : insight.riskLevel === "Medium"
                          ? "#FFFCE2"
                          : "#EBF7E9";
                    return (
                      <View
                        key={insight.crop}
                        style={[
                          styles.riskCard,
                          { backgroundColor: theme.surface },
                        ]}
                      >
                        <View style={styles.riskHeader}>
                          <Text
                            style={[styles.cropName, { color: theme.text }]}
                          >
                            {insight.crop.charAt(0) +
                              insight.crop.slice(1).toLowerCase()}
                          </Text>
                          <View
                            style={[
                              styles.riskLevelPill,
                              { backgroundColor: levelBg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.riskLevelText,
                                { color: levelColor },
                              ]}
                            >
                              {insight.riskLevel}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={[styles.riskMessage, { color: theme.text }]}
                        >
                          {insight.message}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {/* ================= EXPORT ================= */}
            {/* //NO CHANGES : PDF export still available, disabled while busy */}
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
    paddingBottom: verticalScale(110),
  },

  // Header
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: scale(8),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: "700",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    marginTop: verticalScale(1),
  },
  locationText: {
    fontSize: moderateScale(11),
    fontWeight: "500",
    maxWidth: scale(180),
  },
  iconBtn: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnPlaceholder: {
    width: moderateScale(34),
    height: moderateScale(34),
  },

  freshnessLabel: {
    fontSize: moderateScale(11),
    marginBottom: verticalScale(8),
    fontWeight: "500",
  },

  // Hero
  heroCard: {
    height: verticalScale(150),
    borderRadius: moderateScale(18),
    overflow: "hidden",
    marginBottom: verticalScale(12),
    justifyContent: "flex-end",
  },
  heroImage: {
    borderRadius: moderateScale(18),
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(16),
    paddingTop: verticalScale(20),
  },
  heroLeft: {
    flex: 1,
  },
  heroDate: {
    color: "rgba(255,255,255,0.9)",
    fontSize: moderateScale(12),
    fontWeight: "600",
    marginBottom: verticalScale(2),
  },
  heroTemp: {
    color: "#FFFFFF",
    fontSize: moderateScale(40),
    fontWeight: "800",
    lineHeight: moderateScale(46),
  },
  heroDesc: {
    color: "rgba(255,255,255,0.95)",
    fontSize: moderateScale(14),
    fontWeight: "600",
    marginTop: verticalScale(2),
  },
  heroRight: {
    marginLeft: scale(8),
    marginBottom: verticalScale(4),
  },

  // Metrics
  metricsRow: {
    flexDirection: "row",
    gap: scale(8),
    marginBottom: verticalScale(12),
  },
  metricChip: {
    flex: 1,
    borderRadius: moderateScale(14),
    borderWidth: 1,
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(8),
    alignItems: "flex-start",
  },
  metricIconWrap: {
    marginBottom: verticalScale(4),
  },
  metricLabel: {
    fontSize: moderateScale(10),
    fontWeight: "500",
  },
  metricValue: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    marginTop: verticalScale(2),
  },
  metricSub: {
    fontSize: moderateScale(10),
    fontWeight: "500",
    marginTop: verticalScale(1),
  },

  // Advice card (paid)
  adviceCard: {
    backgroundColor: "#0B3D0B",
    borderRadius: moderateScale(16),
    padding: scale(14),
    marginBottom: verticalScale(16),
  },
  adviceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(6),
  },
  adviceTitle: {
    color: "#FFFFFF",
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    flex: 1,
    paddingRight: scale(8),
  },
  adviceShield: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  adviceBody: {
    color: "rgba(255,255,255,0.9)",
    fontSize: moderateScale(12),
    lineHeight: moderateScale(17),
  },
  adviceFactors: {
    color: "rgba(255,255,255,0.65)",
    fontSize: moderateScale(10.5),
    marginTop: verticalScale(6),
  },

  // NEW ADDITION: free upgrade card
  upgradeCard: {
    backgroundColor: "#0B3D0B",
    borderRadius: moderateScale(16),
    padding: scale(14),
    marginBottom: verticalScale(12),
  },
  upgradeTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(8),
    gap: scale(8),
  },
  upgradeIconWrap: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeTitle: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "700",
    flex: 1,
  },
  upgradeBody: {
    color: "rgba(255,255,255,0.88)",
    fontSize: moderateScale(12),
    lineHeight: moderateScale(17),
    marginBottom: verticalScale(10),
  },
  upgradeCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  upgradeCta: {
    color: "#A7F3D0",
    fontSize: moderateScale(13),
    fontWeight: "700",
  },

  // NEW ADDITION: weather-only summary for free users
  summaryCard: {
    borderRadius: moderateScale(14),
    borderWidth: 1,
    padding: scale(14),
    marginBottom: verticalScale(14),
  },
  summaryTitle: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    marginBottom: verticalScale(4),
  },
  summaryBody: {
    fontSize: moderateScale(12),
    lineHeight: moderateScale(17),
  },

  // Section headers
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    marginBottom: verticalScale(8),
  },
  sectionLink: {
    fontSize: moderateScale(11.5),
    fontWeight: "600",
    marginBottom: verticalScale(8),
  },

  // Hourly
  hourlyRow: {
    gap: scale(8),
    paddingBottom: verticalScale(4),
    marginBottom: verticalScale(12),
  },
  hourlyCard: {
    width: scale(64),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    paddingVertical: verticalScale(10),
    alignItems: "center",
  },
  hourlyLabel: {
    fontSize: moderateScale(10.5),
    fontWeight: "600",
  },
  hourlyTemp: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },

  // 7-day list
  dailyList: {
    borderRadius: moderateScale(16),
    borderWidth: 1,
    paddingHorizontal: scale(12),
    marginBottom: verticalScale(14),
  },
  dailyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(12),
  },
  dailyLeft: {
    width: scale(78),
  },
  dailyDay: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
  },
  dailySub: {
    fontSize: moderateScale(10),
    marginTop: verticalScale(1),
  },
  dailyMid: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingHorizontal: scale(4),
  },
  dailyDesc: {
    fontSize: moderateScale(11.5),
    fontWeight: "500",
    flexShrink: 1,
  },
  dailyRight: {
    alignItems: "flex-end",
    minWidth: scale(58),
  },
  dailyRain: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#3B82F6",
  },
  dailyTemps: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    marginTop: verticalScale(2),
  },

  // Extra risk cards
  riskList: { gap: verticalScale(10), marginBottom: verticalScale(12) },
  riskCard: {
    padding: scale(14),
    borderRadius: moderateScale(14),
  },
  riskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(6),
  },
  cropName: { fontSize: moderateScale(13.5), fontWeight: "700" },
  riskLevelPill: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(20),
  },
  riskLevelText: { fontWeight: "700", fontSize: moderateScale(11) },
  riskMessage: {
    fontSize: moderateScale(12.5),
    lineHeight: moderateScale(17),
  },

  // PDF
  pdfButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(12),
    gap: 8,
    marginBottom: verticalScale(12),
  },
  pdfButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: moderateScale(14),
  },

  // Empty / loading
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
  loadingText: {
    fontSize: moderateScale(13),
    marginTop: verticalScale(12),
    fontWeight: "500",
  },
});
