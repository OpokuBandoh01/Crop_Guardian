// app/detection/[id].tsx
// //NEW ADDITION : detection detail screen (history open)
// Separate from result.tsx so live-scan flow stays unchanged.
// Loads GET /api/detection/:id, with AsyncStorage fallback when offline.
//
// Expo dynamic routes:
// https://docs.expo.dev/router/reference/url-parameters/

import { getCropLabel } from "@/constants/cropOptions";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    confidenceLabel,
    confidencePercent,
    fetchDetectionById,
} from "@/services/detectionApi";
import type { DetectionDetail } from "@/types/detection";
import { formatRelativeTime } from "@/utils/timeFormat";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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

export default function DetectionDetailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const { id } = useLocalSearchParams<{ id: string }>();

  const [detail, setDetail] = useState<DetectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isBusy = loading;

  const load = useCallback(async () => {
    if (!id) {
      setErrorMessage("Missing detection id.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await fetchDetectionById(String(id));
      setFromCache(!!result.fromCache);

      if (!result.success || !result.data) {
        setDetail(null);
        setErrorMessage(result.message || "Detection not found");
      } else {
        setDetail(result.data);
      }
    } catch {
      setDetail(null);
      setErrorMessage(
        "Could not load this scan. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const Section = ({
    title,
    body,
  }: {
    title: string;
    body: string | null | undefined;
  }) => {
    if (!body || !body.trim()) return null;
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          {title}
        </Text>
        <Text style={[styles.sectionBody, { color: theme.text }]}>{body}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.iconBtn, { borderColor: theme.primary }]}
          onPress={() => router.back()}
          disabled={isBusy}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={moderateScale(18)}
            color={theme.primary}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          Scan Detail
        </Text>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.icon }]}>
            Loading scan...
          </Text>
        </View>
      ) : errorMessage || !detail ? (
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={moderateScale(40)}
            color={theme.error}
          />
          <Text style={[styles.errorText, { color: theme.text }]}>
            {errorMessage || "Detection not found"}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.primary }]}
            onPress={load}
            activeOpacity={0.85}
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {fromCache && (
            <Text
              style={[styles.offlineBanner, { color: theme.tabIconDefault }]}
            >
              Showing saved scan (offline)
            </Text>
          )}

          {detail.imageUrl ? (
            <Image
              source={{ uri: detail.imageUrl }}
              style={styles.heroImage}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                styles.heroPlaceholder,
                { backgroundColor: theme.logoBackground },
              ]}
            >
              <Ionicons
                name="leaf-outline"
                size={moderateScale(40)}
                color={theme.primary}
              />
            </View>
          )}

          <Text style={[styles.disease, { color: theme.text }]}>
            {detail.diseaseName}
          </Text>
          <Text style={[styles.meta, { color: theme.tabIconDefault }]}>
            {getCropLabel(detail.cropType as any) || detail.cropType}
            {"  ·  "}
            {confidencePercent(detail.confidence)} ·{" "}
            {confidenceLabel(detail.confidence)}
          </Text>
          <Text style={[styles.time, { color: theme.tabIconDefault }]}>
            {formatRelativeTime(detail.createdAt)}
          </Text>

          <Section title="Symptoms" body={detail.symptoms} />
          <Section title="Causes" body={detail.causes} />
          <Section title="Organic treatments" body={detail.organicTreatments} />
          <Section title="Chemical options" body={detail.chemicalOptions} />
          <Section title="Prevention" body={detail.prevention} />
          <Section title="Local notes" body={detail.localNotes} />

          {Array.isArray(detail.possibleDiseases) &&
            detail.possibleDiseases.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.primary }]}>
                  Other possible diseases
                </Text>
                {detail.possibleDiseases.map((p, idx) => (
                  <Text
                    key={`${p.name}-${idx}`}
                    style={[styles.sectionBody, { color: theme.text }]}
                  >
                    • {p.name} ({confidencePercent(p.confidence)})
                  </Text>
                ))}
              </View>
            )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
  },
  headerTitle: {
    fontSize: moderateScale(17),
    fontWeight: "700",
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(24),
  },
  loadingText: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(13),
  },
  errorText: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(14),
    textAlign: "center",
    marginBottom: verticalScale(14),
  },
  retryBtn: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(12),
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(40),
  },
  offlineBanner: {
    textAlign: "center",
    fontSize: moderateScale(11),
    marginBottom: verticalScale(8),
  },
  heroImage: {
    width: "100%",
    height: verticalScale(180),
    borderRadius: moderateScale(16),
    marginBottom: verticalScale(12),
  },
  heroPlaceholder: {
    width: "100%",
    height: verticalScale(140),
    borderRadius: moderateScale(16),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(12),
  },
  disease: {
    fontSize: moderateScale(20),
    fontWeight: "800",
  },
  meta: {
    fontSize: moderateScale(12.5),
    marginTop: verticalScale(4),
  },
  time: {
    fontSize: moderateScale(11),
    marginTop: verticalScale(2),
    marginBottom: verticalScale(12),
  },
  section: {
    marginBottom: verticalScale(14),
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    marginBottom: verticalScale(4),
  },
  sectionBody: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(19),
  },
});
