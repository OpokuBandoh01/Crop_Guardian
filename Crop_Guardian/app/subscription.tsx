import { CustomButton } from "@/components/CustomButton";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatPlanEndDate } from "@/services/subscriptionApi";
import { useAuthStore } from "@/stores/authStore";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

const BENEFITS = [
  {
    icon: "scan-outline" as const,
    title: "Unlimited crop scans",
    body: "Diagnose as often as you need during your plan period.",
  },
  {
    icon: "cloudy-outline" as const,
    title: "Crop risk weather insights",
    body: "See disease risk guidance tailored to your crops and local weather.",
  },
  {
    icon: "shield-checkmark-outline" as const,
    title: "Full diagnosis detail",
    body: "Keep full treatment and prevention guidance on every scan.",
  },
  {
    icon: "calendar-outline" as const,
    title: "One full month of access",
    body: "Active from the day you subscribe until the same date next month.",
  },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const user = useAuthStore((s) => s.user);
  const { status, loading, subscribing, fetchStatus, subscribe, clearError } =
    useSubscriptionStore();

  const [banner, setBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchStatus();
      clearError();
    }, [fetchStatus, clearError]),
  );

  const isPaid = Boolean(status?.isPaid);
  const remaining = status?.remainingFreeScans ?? 0;
  const endsLabel = formatPlanEndDate(status?.endsAt);

  const handleSubscribe = async () => {
    if (subscribing || isPaid) return;
    setBanner(null);

    const result = await subscribe();
    if (result.ok) {
      setBanner({ type: "success", text: result.message });
    } else {
      setBanner({ type: "error", text: result.message });
    }
  };

  const muted = colorScheme === "light" ? "#687076" : "#9BA1A6";
  const cardBorder =
    colorScheme === "light" ? "rgba(9, 74, 4, 0.08)" : "rgba(255,255,255,0.08)";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { borderColor: theme.primary, opacity: subscribing ? 0.5 : 1 },
          ]}
          onPress={() => router.back()}
          disabled={subscribing}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={moderateScale(18)}
            color={theme.primary}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          Subscription
        </Text>
        <View style={styles.rightSpacer} />
      </View>

      {banner && (
        <View
          style={[
            styles.banner,
            {
              backgroundColor:
                banner.type === "success" ? "#2E7D32" : "#B91C1C",
            },
          ]}
        >
          <Text style={styles.bannerText}>{banner.text}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status card */}
        <View style={[styles.statusCard, { backgroundColor: "#094A04" }]}>
          {loading && !status ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : isPaid ? (
            <>
              <View style={styles.statusBadgeRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={moderateScale(18)}
                  color="#A7F3D0"
                />
                <Text style={styles.statusBadgeText}>Farmer Monthly</Text>
              </View>
              <Text style={styles.statusHeadline}>
                Plan active until {endsLabel}
              </Text>
              <Text style={styles.statusSub}>
                Unlimited scans and crop weather insights are included.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.statusBadgeText}>Free plan</Text>
              <Text style={styles.statusHeadline}>
                {remaining} of 5 free scans left this month
              </Text>
              <Text style={styles.statusSub}>
                Upgrade for unlimited scans and crop risk insights.
              </Text>
            </>
          )}
        </View>

        {/* Plan pricing */}
        <View
          style={[
            styles.planCard,
            { backgroundColor: theme.surface, borderColor: cardBorder },
          ]}
        >
          <Text style={[styles.planName, { color: theme.text }]}>
            Farmer Monthly
          </Text>
          <View style={styles.priceRow}>
            <Text style={[styles.priceAmount, { color: theme.primary }]}>
              GHS 50
            </Text>
            <Text style={[styles.pricePeriod, { color: muted }]}>/ month</Text>
          </View>
          <Text style={[styles.planHint, { color: muted }]}>
            Billed monthly. Access starts today and runs until the same date
            next month.
          </Text>
        </View>

        {/* Benefits */}
        <Text style={[styles.sectionLabel, { color: theme.primary }]}>
          What you get
        </Text>
        <View
          style={[
            styles.benefitsCard,
            { backgroundColor: theme.surface, borderColor: cardBorder },
          ]}
        >
          {BENEFITS.map((item, index) => (
            <View key={item.title}>
              <View style={styles.benefitRow}>
                <View
                  style={[
                    styles.benefitIconWrap,
                    {
                      backgroundColor:
                        colorScheme === "light" ? "#EBF7E9" : "#1E2C20",
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={moderateScale(18)}
                    color={theme.primary}
                  />
                </View>
                <View style={styles.benefitTextWrap}>
                  <Text style={[styles.benefitTitle, { color: theme.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.benefitBody, { color: muted }]}>
                    {item.body}
                  </Text>
                </View>
              </View>
              {index < BENEFITS.length - 1 && (
                <View
                  style={[
                    styles.divider,
                    {
                      backgroundColor:
                        colorScheme === "light"
                          ? "rgba(9, 74, 4, 0.06)"
                          : "rgba(255,255,255,0.06)",
                    },
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        {!isPaid && (
          <>
            <Text style={[styles.accountLine, { color: muted }]}>
              Charging account: {user?.email || "Your signed-in email"}
            </Text>
            <CustomButton
              title="Subscribe · GHS 50"
              loading={subscribing}
              onPress={handleSubscribe}
              disabled={subscribing || loading}
              style={styles.cta}
            />
          </>
        )}

        {isPaid && (
          <CustomButton
            title="Back to app"
            variant="outline"
            onPress={() => router.back()}
            disabled={subscribing}
            style={styles.cta}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  headerTitle: {
    fontSize: moderateScale(17),
    fontWeight: "700",
  },
  rightSpacer: { width: moderateScale(32) },
  banner: {
    marginHorizontal: scale(16),
    marginBottom: verticalScale(8),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    borderRadius: moderateScale(10),
  },
  bannerText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(40),
  },
  statusCard: {
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginBottom: verticalScale(16),
  },
  statusBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginBottom: verticalScale(6),
  },
  statusBadgeText: {
    color: "#A7F3D0",
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  statusHeadline: {
    color: "#FFFFFF",
    fontSize: moderateScale(18),
    fontWeight: "700",
    marginBottom: verticalScale(6),
  },
  statusSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: moderateScale(12),
    lineHeight: verticalScale(17),
  },
  planCard: {
    borderRadius: moderateScale(14),
    borderWidth: 1.2,
    padding: scale(16),
    marginBottom: verticalScale(18),
  },
  planName: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    marginBottom: verticalScale(6),
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: verticalScale(8),
  },
  priceAmount: {
    fontSize: moderateScale(28),
    fontWeight: "800",
  },
  pricePeriod: {
    fontSize: moderateScale(14),
    marginLeft: scale(6),
    marginBottom: verticalScale(4),
  },
  planHint: {
    fontSize: moderateScale(12),
    lineHeight: verticalScale(17),
  },
  sectionLabel: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    marginBottom: verticalScale(8),
  },
  benefitsCard: {
    borderRadius: moderateScale(14),
    borderWidth: 1.2,
    overflow: "hidden",
    marginBottom: verticalScale(16),
  },
  benefitRow: {
    flexDirection: "row",
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
  },
  benefitIconWrap: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(12),
  },
  benefitTextWrap: { flex: 1 },
  benefitTitle: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    marginBottom: verticalScale(2),
  },
  benefitBody: {
    fontSize: moderateScale(11.5),
    lineHeight: verticalScale(16),
  },
  divider: {
    height: 1,
    marginHorizontal: scale(14),
  },
  accountLine: {
    fontSize: moderateScale(11.5),
    marginBottom: verticalScale(8),
    textAlign: "center",
  },
  cta: {
    marginTop: verticalScale(4),
  },
});
