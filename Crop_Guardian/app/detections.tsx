// app/detections.tsx
// //NEW ADDITION : full detection history list
// - Path: /detections
// - Supports ?cropType=MAIZE pre-filter (used from My Crops)
// - Crop chips + disease name search from day one
// - Pagination, pull-to-refresh, focus refetch
// - Offline: shows last cached page 1 when network fails
//
// Expo Router file-based route docs:
// https://docs.expo.dev/router/reference/url-parameters/

import { CROP_OPTIONS, getCropLabel } from "@/constants/cropOptions";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    confidenceLabel,
    confidencePercent,
    fetchMyDetections,
} from "@/services/detectionApi";
import type { DetectionListItem } from "@/types/detection";
import { formatRelativeTime } from "@/utils/timeFormat";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

export default function DetectionsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // Optional deep-link filter from My Crops: /detections?cropType=MAIZE
  const { cropType: cropTypeParam } = useLocalSearchParams<{
    cropType?: string;
  }>();

  const initialCrop = useMemo(() => {
    if (!cropTypeParam) return null;
    return String(cropTypeParam).toUpperCase();
  }, [cropTypeParam]);

  const [items, setItems] = useState<DetectionListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCrop, setSelectedCrop] = useState<string | null>(initialCrop);
  const [searchText, setSearchText] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Disable all interactive controls while any load is running
  const isBusy = loading || refreshing || loadingMore;

  const loadPage = useCallback(
    async (pageToLoad: number, mode: "replace" | "append") => {
      try {
        if (mode === "replace" && pageToLoad === 1 && !refreshing) {
          setLoading(true);
        }
        setErrorMessage(null);

        const result = await fetchMyDetections({
          page: pageToLoad,
          limit: 10,
          cropType: selectedCrop ?? undefined,
          q: appliedQuery || undefined,
        });

        setFromCache(!!result.fromCache);
        setPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);

        if (mode === "append") {
          setItems((prev) => {
            const existing = new Set(prev.map((p) => p.id));
            const next = result.data.filter((d) => !existing.has(d.id));
            return [...prev, ...next];
          });
        } else {
          setItems(result.data);
        }

        if (!result.success) {
          setErrorMessage(result.message || "Could not load scans.");
        }
      } catch {
        setErrorMessage(
          "Could not load scans. Check your connection and try again.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [selectedCrop, appliedQuery, refreshing],
  );

  // //NEW ADDITION : reload when crop chip or applied search changes
  React.useEffect(() => {
    loadPage(1, "replace");
  }, [selectedCrop, appliedQuery, loadPage]);

  // Focus refetch when navigating back to this screen
  useFocusEffect(
    useCallback(() => {
      loadPage(1, "replace");
    }, [loadPage]),
  );

  const onRefresh = () => {
    if (isBusy) return;
    setRefreshing(true);
    loadPage(1, "replace");
  };

  const onLoadMore = () => {
    if (isBusy || page >= totalPages) return;
    setLoadingMore(true);
    loadPage(page + 1, "append");
  };

  // //UPDATED : search only updates appliedQuery; useEffect triggers the fetch
  const applySearch = () => {
    if (isBusy) return;
    setAppliedQuery(searchText.trim());
  };

  const onSelectCrop = (crop: string | null) => {
    if (isBusy) return;
    setSelectedCrop(crop);
  };

  const renderItem = ({ item }: { item: DetectionListItem }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: colorScheme === "light" ? "#E8EDE8" : theme.inputBorder,
        },
      ]}
      activeOpacity={0.85}
      disabled={isBusy}
      onPress={() => router.push(`/detection/${item.id}` as any)}
    >
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.thumb}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.thumbPlaceholder,
            { backgroundColor: theme.logoBackground },
          ]}
        >
          <Ionicons
            name="leaf-outline"
            size={moderateScale(22)}
            color={theme.primary}
          />
        </View>
      )}

      <View style={styles.cardBody}>
        <Text style={[styles.disease, { color: theme.text }]} numberOfLines={1}>
          {item.diseaseName}
        </Text>
        <Text
          style={[styles.meta, { color: theme.tabIconDefault }]}
          numberOfLines={1}
        >
          {getCropLabel(item.cropType as any) || item.cropType}
          {"  ·  "}
          {confidencePercent(item.confidence)} ·{" "}
          {confidenceLabel(item.confidence)}
        </Text>
        {!!item.symptomsSnippet && (
          <Text
            style={[styles.snippet, { color: theme.icon }]}
            numberOfLines={2}
          >
            {item.symptomsSnippet}
          </Text>
        )}
        <Text style={[styles.time, { color: theme.tabIconDefault }]}>
          {formatRelativeTime(item.createdAt)}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={moderateScale(16)}
        color={theme.tabIconDefault}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      {/* Header */}
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
        <Text style={[styles.title, { color: theme.primary }]}>
          Scan History
        </Text>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      {/* Search */}
      <View
        style={[
          styles.searchRow,
          {
            backgroundColor: theme.surface,
            borderColor:
              colorScheme === "light" ? "#E8EDE8" : theme.inputBorder,
          },
        ]}
      >
        <Ionicons
          name="search"
          size={moderateScale(16)}
          color={theme.tabIconDefault}
        />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search disease name..."
          placeholderTextColor={theme.placeholder}
          value={searchText}
          onChangeText={setSearchText}
          editable={!isBusy}
          returnKeyType="search"
          onSubmitEditing={applySearch}
        />
        <TouchableOpacity
          onPress={applySearch}
          disabled={isBusy}
          activeOpacity={0.7}
        >
          <Text style={[styles.searchBtn, { color: theme.primary }]}>
            Search
          </Text>
        </TouchableOpacity>
      </View>

      {/* Crop chips */}
      <FlatList
        horizontal
        data={[null, ...CROP_OPTIONS.map((c) => c.type)]}
        keyExtractor={(item) => item ?? "all"}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        renderItem={({ item }) => {
          const active =
            selectedCrop === item || (item === null && !selectedCrop);
          const label = item ? getCropLabel(item) : "All";
          return (
            <TouchableOpacity
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.primary : theme.surface,
                  borderColor: active
                    ? theme.primary
                    : colorScheme === "light"
                      ? "#E8EDE8"
                      : theme.inputBorder,
                },
              ]}
              disabled={isBusy}
              activeOpacity={0.8}
              onPress={() => onSelectCrop(item)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? "#FFFFFF" : theme.text },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {fromCache && (
        <Text style={[styles.offlineBanner, { color: theme.tabIconDefault }]}>
          Showing saved scans (offline)
        </Text>
      )}

      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.icon }]}>
            Loading your scans...
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📷</Text>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {errorMessage ? "Could not load scans" : "No scans yet"}
              </Text>
              <Text style={[styles.emptyBody, { color: theme.tabIconDefault }]}>
                {errorMessage ||
                  "Take a photo of a leaf to build your scan history."}
              </Text>
              {!errorMessage && (
                <TouchableOpacity
                  style={[styles.cta, { backgroundColor: theme.primary }]}
                  activeOpacity={0.85}
                  disabled={isBusy}
                  onPress={() => router.push("/scan" as any)}
                >
                  <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.ctaText}>Scan now</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                style={{ marginVertical: verticalScale(12) }}
                color={theme.primary}
              />
            ) : null
          }
        />
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
  title: {
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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: scale(16),
    marginBottom: verticalScale(8),
    borderWidth: 1,
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(10),
    gap: scale(8),
    minHeight: verticalScale(42),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13),
    paddingVertical: verticalScale(8),
  },
  searchBtn: {
    fontSize: moderateScale(13),
    fontWeight: "700",
  },
  chipsRow: {
    paddingHorizontal: scale(16),
    gap: scale(8),
    paddingBottom: verticalScale(8),
  },
  chip: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(16),
    borderWidth: 1,
  },
  chipText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  offlineBanner: {
    textAlign: "center",
    fontSize: moderateScale(11),
    marginBottom: verticalScale(4),
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(40),
    flexGrow: 1,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: moderateScale(14),
    padding: scale(10),
    marginBottom: verticalScale(10),
    gap: scale(10),
  },
  thumb: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(10),
  },
  thumbPlaceholder: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
  },
  disease: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
  },
  meta: {
    fontSize: moderateScale(11),
    marginTop: verticalScale(2),
  },
  snippet: {
    fontSize: moderateScale(11.5),
    marginTop: verticalScale(4),
    lineHeight: moderateScale(15),
  },
  time: {
    fontSize: moderateScale(10.5),
    marginTop: verticalScale(4),
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(13),
  },
  empty: {
    alignItems: "center",
    paddingTop: verticalScale(48),
    paddingHorizontal: scale(24),
  },
  emptyEmoji: {
    fontSize: moderateScale(36),
    marginBottom: verticalScale(8),
  },
  emptyTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    marginBottom: verticalScale(6),
  },
  emptyBody: {
    fontSize: moderateScale(13),
    textAlign: "center",
    lineHeight: moderateScale(18),
    marginBottom: verticalScale(16),
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(12),
  },
  ctaText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: moderateScale(13),
  },
});
