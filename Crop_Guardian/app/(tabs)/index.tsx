// app/(tabs)/index.tsx
import AnimatedScreen from "@/components/AnimatedScreen";
import WeatherWidget from "@/components/WeatherWidget";
import DailyTipCard from "@/components/daily-tips/DailyTipCard";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import API from "@/services/api";
import { confidenceLabel, fetchMyDetections } from "@/services/detectionApi";
import { formatPlanEndDate } from "@/services/subscriptionApi";
import { useNotificationStore } from "@/stores/notificationStore";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { useTipStore } from "@/stores/tipStore";
import { DetectionListItem } from "@/types/detection";
import { formatRelativeTime } from "@/utils/timeFormat";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const fetchTodayTips = useTipStore((state) => state.fetchTodayTips);

  // NEW ADDITION: subscription status for home chip
  const { status, fetchStatus } = useSubscriptionStore();

  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const [userData, setUserData] = useState<any>(null);
  const [myCrops, setMyCrops] = useState<any[]>([]);
  const [cropStages, setCropStages] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [weatherRefreshTrigger, setWeatherRefreshTrigger] = useState(0);

  const [latestDetection, setLatestDetection] =
    useState<DetectionListItem | null>(null);
  const [latestLoading, setLatestLoading] = useState(false);

  const loadLatestDetection = useCallback(async () => {
    setLatestLoading(true);
    try {
      const result = await fetchMyDetections({ page: 1, limit: 1 });
      if (result.success && result.data.length > 0) {
        setLatestDetection(result.data[0]);
      } else {
        setLatestDetection(null);
      }
    } catch {
      setLatestDetection(null);
    } finally {
      setLatestLoading(false);
    }
  }, []);

  // UPDATED: also refresh subscription status when Home gains focus
  useFocusEffect(
    useCallback(() => {
      loadLatestDetection();
      fetchStatus();
    }, [loadLatestDetection, fetchStatus]),
  );

  const getGreeting = (): string => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return "Good morning";
    }
    if (hour >= 12 && hour < 17) {
      return "Good afternoon";
    }
    if (hour >= 17 && hour < 21) {
      return "Good evening";
    }
    return "Good night";
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setWeatherRefreshTrigger((prev) => prev + 1);

    await Promise.all([
      fetchUser(),
      fetchMyCrops(),
      fetchNotifications(),
      fetchTodayTips(),
      loadLatestDetection(),
      fetchStatus(), // NEW ADDITION
    ]);
    setRefreshing(false);
  };

  const fetchUser = async () => {
    try {
      const res = await API.get("/api/auth/me");
      if (res.data?.success && res.data.user) {
        setUserData(res.data.user);
        await AsyncStorage.setItem("userData", JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.warn("Error fetching me from API, using cache:", err);
      const cached = await AsyncStorage.getItem("userData");
      if (cached) {
        try {
          setUserData(JSON.parse(cached));
        } catch {}
      }
    }
  };

  const fetchMyCrops = async () => {
    try {
      const res = await API.get("/api/crops/my-crops");
      if (res.data?.success && res.data.crops && res.data.crops.length > 0) {
        setMyCrops(res.data.crops);
        return;
      }
    } catch (err) {
      console.error("Error fetching my crops:", err);
    }

    try {
      const onboardingCropsRaw = await AsyncStorage.getItem(
        "onboarding_preferredCrops",
      );
      if (onboardingCropsRaw) {
        const parsed = JSON.parse(onboardingCropsRaw) as string[];
        const mappedCrops = parsed.map((cropName) => ({
          cropType: cropName,
        }));
        setMyCrops(mappedCrops);
      }

      const stagesRaw = await AsyncStorage.getItem("onboarding_cropStages");
      if (stagesRaw) {
        setCropStages(JSON.parse(stagesRaw));
      }
    } catch (e) {
      console.error("Error loading fallback crops/stages:", e);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchMyCrops();
    fetchNotifications();
    fetchTodayTips();
    fetchStatus(); // NEW ADDITION

    const unsubscribe = navigation.addListener("focus", () => {
      fetchUser();
      fetchMyCrops();
      fetchNotifications();
      fetchStatus(); // NEW ADDITION
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, fetchNotifications]);

  const isPaid = Boolean(status?.isPaid);
  const chipTitle = isPaid
    ? `Farmer plan active until ${formatPlanEndDate(status?.endsAt)}`
    : `${status?.remainingFreeScans ?? 0} of 5 free scans left this month`;
  const chipSubtitle = isPaid
    ? "Unlimited scans and crop risk insights"
    : "Tap to view Farmer Monthly";

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            progressBackgroundColor={theme.surface}
          />
        }
      >
        {/* ================= HEADER SECTION ================= */}

        <AnimatedScreen delay={0} style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <View style={styles.greetingRow}>
              <Text style={[styles.greetingText, { color: theme.text }]}>
                {getGreeting()},{" "}
                {userData?.profile?.fullName?.split(" ")[0] || "Farmer"}!
              </Text>
              <Image
                source={require("@/assets/icons/seedlingicon.png")}
                style={styles.seedlingIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.subtitleText, { color: theme.icon }]}>
              {"Let's make today a productive"}
              {"\n"}
              {" day on your farm."}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push("/alerts")}
            activeOpacity={0.7}
            disabled={false}
          >
            <Ionicons
              name="notifications-outline"
              size={moderateScale(24)}
              color={theme.primary}
            />
            {unreadCount > 0 && (
              <View style={[styles.badge, { borderColor: theme.background }]}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </AnimatedScreen>

        {/* NEW ADDITION: subscription status chip */}
        <AnimatedScreen delay={20}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/upgrade")}
            style={[
              styles.subscriptionChip,
              {
                backgroundColor: theme.surface,
                borderColor: theme.inputBorder,
              },
            ]}
          >
            <View style={styles.subscriptionChipTextWrap}>
              <Text
                style={[styles.subscriptionChipTitle, { color: theme.text }]}
              >
                {chipTitle}
              </Text>
              <Text style={[styles.subscriptionChipSub, { color: theme.icon }]}>
                {chipSubtitle}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={moderateScale(16)}
              color={theme.primary}
            />
          </TouchableOpacity>
        </AnimatedScreen>

        {/* ================= WEATHER SECTION ================= */}

        <AnimatedScreen delay={40}>
          <WeatherWidget refreshTrigger={weatherRefreshTrigger} />
        </AnimatedScreen>

        {/* ================= DISEASE SCAN BANNER ================= */}
        <AnimatedScreen delay={80} style={styles.scanBanner}>
          <Image
            source={require("@/assets/images/leafimage.png")}
            style={styles.scanBannerBg}
            resizeMode="cover"
          />
          <View style={styles.scanBannerBgOverlay} />

          <View style={styles.scanLeftContent}>
            <Text style={styles.scanTitle}>
              Scan Your Crop{"\n"}for Diseases
            </Text>
            <Text style={styles.scanSubtitle}>
              Get instant AI diagnosis and recommended solutions
            </Text>

            <View style={styles.scanActionContainer}>
              <TouchableOpacity
                style={styles.scanActionButtonSolid}
                onPress={() => router.push("/scan?action=camera")}
                activeOpacity={0.9}
              >
                <Ionicons
                  name="camera"
                  size={moderateScale(16)}
                  color="#094A04"
                  style={styles.scanActionIcon}
                />
                <Text style={styles.scanActionTextSolid}>Take photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scanActionButtonOutline}
                onPress={() => router.push("/scan?action=gallery")}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="image-outline"
                  size={moderateScale(16)}
                  color="#FFFFFF"
                  style={styles.scanActionIcon}
                />
                <Text style={styles.scanActionTextOutline}>Upload Image</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.scanRightOverlay}>
            <Image
              source={require("@/assets/icons/bigcameraicon.png")}
              style={styles.bigCameraIcon}
              resizeMode="contain"
            />
          </View>
        </AnimatedScreen>

        {/* ================= QUICK ACTIONS ================= */}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Quick Actions
          </Text>
        </View>

        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={[
              styles.quickActionBtn,
              {
                borderColor: theme.inputBorder,
                backgroundColor: theme.surface,
              },
            ]}
            onPress={() => router.push("/scan")}
            activeOpacity={0.8}
          >
            <Image
              source={require("@/assets/icons/scancropsicon.png")}
              style={styles.quickActionIcon}
              resizeMode="contain"
            />
            <Text style={[styles.quickActionText, { color: theme.text }]}>
              Scan crop
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickActionBtn,
              {
                borderColor: theme.inputBorder,
                backgroundColor: theme.surface,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => router.push("/weather")}
          >
            <Image
              source={require("@/assets/icons/weathericon.png")}
              style={styles.quickActionIcon}
              resizeMode="contain"
            />
            <Text style={[styles.quickActionText, { color: theme.text }]}>
              Weather
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickActionBtn,
              {
                borderColor: theme.inputBorder,
                backgroundColor: theme.surface,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => router.push("/daily-tips")}
          >
            <Image
              source={require("@/assets/icons/tipsicon.png")}
              style={styles.quickActionIcon}
              resizeMode="contain"
            />
            <Text style={[styles.quickActionText, { color: theme.text }]}>
              Tips
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickActionBtn,
              {
                borderColor: theme.inputBorder,
                backgroundColor: theme.surface,
              },
            ]}
            onPress={() => router.push("/my-crops")}
            activeOpacity={0.8}
          >
            <Image
              source={require("@/assets/icons/mycropsicon.png")}
              style={styles.quickActionIcon}
              resizeMode="contain"
            />
            <Text style={[styles.quickActionText, { color: theme.text }]}>
              My Crops
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================= HORIZONTAL SCROLLABLE SECTION ================= */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScrollView}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          <DailyTipCard />

          {/* Card 2: Recent Scan */}
          <View
            style={[
              styles.bottomCard,
              styles.recentScanCard,
              { backgroundColor: "#E1F8DE" },
            ]}
          >
            <View style={styles.recentScanHeader}>
              <Text style={styles.recentScanTitle}>Recent Scan</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.seeAllRecentRow}
                disabled={latestLoading}
                onPress={() => router.push("/detections" as any)}
              >
                <Text style={styles.recentScanSeeAll}>See all</Text>
                <Ionicons
                  name="chevron-forward"
                  size={moderateScale(10)}
                  color="#2E7D32"
                />
              </TouchableOpacity>
            </View>

            {latestLoading && !latestDetection ? (
              <ActivityIndicator
                color="#2E7D32"
                style={{ marginVertical: verticalScale(20) }}
              />
            ) : latestDetection ? (
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={latestLoading}
                onPress={() =>
                  router.push(`/detection/${latestDetection.id}` as any)
                }
              >
                {latestDetection.imageUrl ? (
                  <Image
                    source={{ uri: latestDetection.imageUrl }}
                    style={styles.recentScanImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Image
                    source={require("@/assets/images/recentscanimage.png")}
                    style={styles.recentScanImage}
                    resizeMode="cover"
                  />
                )}

                <View style={styles.recentScanDetails}>
                  <Text style={styles.recentScanDisease} numberOfLines={1}>
                    {latestDetection.diseaseName}
                  </Text>
                  <Text style={styles.recentScanConfidence}>
                    {confidenceLabel(latestDetection.confidence)}
                  </Text>
                  <Text style={styles.recentScanTime}>
                    {formatRelativeTime(latestDetection.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push("/scan" as any)}
              >
                <Image
                  source={require("@/assets/images/recentscanimage.png")}
                  style={styles.recentScanImage}
                  resizeMode="cover"
                />
                <View style={styles.recentScanDetails}>
                  <Text style={styles.recentScanDisease}>No scans yet</Text>
                  <Text style={styles.recentScanConfidence}>
                    Take a photo to start
                  </Text>
                  <Text style={styles.recentScanTime}>Tap to scan</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Card 3: Weather Alert */}
          <View
            style={[
              styles.bottomCard,
              styles.weatherAlertCard,
              { backgroundColor: "#D3E8E9" },
            ]}
          >
            <View style={styles.weatherAlertHeader}>
              <Image
                source={require("@/assets/icons/weatheralerticon.png")}
                style={styles.weatherAlertIcon}
                resizeMode="contain"
              />
              <Text style={styles.weatherAlertTitle}>Weather Alert</Text>
            </View>

            <Text style={styles.weatherAlertText}>
              Heavy rainfall expected tomorrow.
            </Text>

            <TouchableOpacity
              style={styles.weatherAlertLink}
              activeOpacity={0.8}
              onPress={() => router.push("/weather")}
            >
              <Text style={styles.weatherAlertLinkText}>Stay prepared</Text>
              <Ionicons
                name="chevron-forward"
                size={moderateScale(12)}
                color="#005B66"
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(100),
  },

  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(16),
  },
  headerLeft: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  greetingText: {
    fontSize: moderateScale(22),
    fontWeight: "700",
  },
  seedlingIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    marginLeft: scale(6),
  },
  subtitleText: {
    fontSize: moderateScale(13),
    marginTop: verticalScale(4),
    fontWeight: "400",
  },
  notificationButton: {
    padding: scale(6),
  },

  // NEW ADDITION: home subscription chip
  subscriptionChip: {
    borderRadius: moderateScale(12),
    borderWidth: 1,
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    marginBottom: verticalScale(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subscriptionChipTextWrap: {
    flex: 1,
    paddingRight: scale(8),
  },
  subscriptionChipTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
  },
  subscriptionChipSub: {
    fontSize: moderateScale(11),
    marginTop: verticalScale(2),
  },

  scanBanner: {
    height: verticalScale(165),
    borderRadius: moderateScale(16),
    backgroundColor: "#094A04",
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: verticalScale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  scanBannerBg: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "60%",
    height: "100%",
  },
  scanBannerBgOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(9, 74, 4, 0.4)",
  },
  scanLeftContent: {
    flex: 1.2,
    zIndex: 2,
    paddingLeft: scale(16),
    justifyContent: "center",
  },
  scanTitle: {
    fontSize: moderateScale(19),
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: verticalScale(23),
  },
  scanSubtitle: {
    fontSize: moderateScale(11),
    color: "#E2F5E1",
    marginTop: verticalScale(6),
    marginBottom: verticalScale(12),
    paddingRight: scale(10),
  },
  scanActionContainer: {
    gap: verticalScale(8),
  },
  scanActionButtonSolid: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(12),
    borderRadius: moderateScale(6),
    alignSelf: "flex-start",
  },
  scanActionIcon: {
    marginRight: scale(6),
  },
  scanActionTextSolid: {
    color: "#094A04",
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  scanActionButtonOutline: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(12),
    borderRadius: moderateScale(6),
    alignSelf: "flex-start",
  },
  scanActionTextOutline: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  scanRightOverlay: {
    flex: 0.8,
    zIndex: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  bigCameraIcon: {
    width: moderateScale(80),
    height: moderateScale(80),
    opacity: 0.85,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(12),
    marginTop: verticalScale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
  },

  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: scale(8),
    marginBottom: verticalScale(20),
  },
  quickActionBtn: {
    flex: 1,
    height: verticalScale(64),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionIcon: {
    width: moderateScale(22),
    height: moderateScale(22),
    marginBottom: verticalScale(4),
  },
  quickActionText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },

  horizontalScrollView: {
    marginHorizontal: scale(-16),
  },
  horizontalScrollContent: {
    paddingHorizontal: scale(16),
    gap: scale(12),
    paddingBottom: verticalScale(8),
  },
  bottomCard: {
    height: verticalScale(140),
    borderRadius: moderateScale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  recentScanCard: {
    width: scale(210),
    padding: scale(12),
    justifyContent: "space-between",
  },
  recentScanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentScanTitle: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#094A04",
  },
  seeAllRecentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  recentScanSeeAll: {
    fontSize: moderateScale(10),
    color: "#2E7D32",
    fontWeight: "600",
    marginRight: scale(2),
  },
  recentScanImage: {
    height: verticalScale(50),
    width: "100%",
    borderRadius: moderateScale(6),
    marginVertical: verticalScale(4),
  },
  recentScanDetails: {
    gap: verticalScale(1),
  },
  recentScanDisease: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#11181C",
  },
  recentScanConfidence: {
    fontSize: moderateScale(10.5),
    color: "#2E7D32",
    fontWeight: "600",
  },
  recentScanTime: {
    fontSize: moderateScale(9.5),
    color: "#687076",
  },

  weatherAlertCard: {
    width: scale(210),
    padding: scale(12),
    justifyContent: "space-between",
  },
  weatherAlertHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  weatherAlertIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    marginRight: scale(6),
  },
  weatherAlertTitle: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#005B66",
  },
  weatherAlertText: {
    fontSize: moderateScale(11.5),
    color: "#1F2937",
    lineHeight: verticalScale(16),
  },
  weatherAlertLink: {
    flexDirection: "row",
    alignItems: "center",
  },
  weatherAlertLinkText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#005B66",
    marginRight: scale(4),
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: moderateScale(10),
    minWidth: moderateScale(18),
    height: moderateScale(18),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
});
