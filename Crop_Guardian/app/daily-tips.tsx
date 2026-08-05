// app/daily-tips.tsx
// Full list screen for all of today's daily tips. Reached from the home
// screen's "+N more tips" link inside DailyTipCard.

import TipDetailModal from "@/components/daily-tips/TipDetailModal";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { DailyTipItem } from "@/schemas/tipSchema";
import { useTipStore } from "@/stores/tipStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

export default function DailyTipsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const todayTips = useTipStore((state) => state.todayTips);
  const date = useTipStore((state) => state.date);
  const loading = useTipStore((state) => state.loading);
  const error = useTipStore((state) => state.error);
  const fetchTodayTips = useTipStore((state) => state.fetchTodayTips);

  const [selectedTip, setSelectedTip] = useState<DailyTipItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchTodayTips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenTip = (tip: DailyTipItem) => {
    setSelectedTip(tip);
    setModalVisible(true);
  };

  // TypeScript: typing `item` as `DailyTipItem` means every property we
  // reference below (title, body, id...) is checked at compile time
  // against the schema, catching typos like `item.titel` before runtime.
  const renderItem = ({ item }: { item: DailyTipItem }) => (
    <TouchableOpacity
      style={[styles.tipRow, { backgroundColor: theme.surface }]}
      activeOpacity={0.8}
      disabled={loading}
      onPress={() => handleOpenTip(item)}
    >
      <View style={styles.tipRowIconBadge}>
        <Ionicons
          name="bulb-outline"
          size={moderateScale(16)}
          color="#094A04"
        />
      </View>
      <View style={styles.tipRowTextWrapper}>
        <Text
          style={[styles.tipRowTitle, { color: theme.text }]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text
          style={[styles.tipRowBody, { color: theme.icon }]}
          numberOfLines={2}
        >
          {item.body}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={moderateScale(16)}
        color={theme.icon}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          disabled={loading}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <Ionicons
            name="chevron-back"
            size={moderateScale(22)}
            color={theme.text}
          />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Daily Tips
          </Text>
          {date && (
            <Text style={[styles.headerDate, { color: theme.icon }]}>
              {date}
            </Text>
          )}
        </View>
      </View>

      {error && todayTips.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons
            name="alert-circle-outline"
            size={moderateScale(28)}
            color="#B91C1C"
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={fetchTodayTips}
            disabled={loading}
            activeOpacity={0.7}
            style={[styles.retryButton, loading && styles.disabledButton]}
          >
            <Text style={styles.retryButtonText}>
              {loading ? "Retrying..." : "Retry"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={todayTips}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchTodayTips}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.centerState}>
                <Ionicons
                  name="bulb-outline"
                  size={moderateScale(28)}
                  color="#687076"
                />
                <Text style={styles.emptyText}>
                  No tips available yet today.
                </Text>
              </View>
            ) : null
          }
        />
      )}

      <TipDetailModal
        visible={modalVisible}
        tip={selectedTip}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(12),
  },
  backButton: { padding: scale(6), marginRight: scale(8) },
  headerTitle: { fontSize: moderateScale(18), fontWeight: "700" },
  headerDate: { fontSize: moderateScale(11), marginTop: verticalScale(2) },
  listContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(40),
    gap: verticalScale(10),
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(12),
    borderRadius: moderateScale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  tipRowIconBadge: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: "#EBF7E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(10),
  },
  tipRowTextWrapper: { flex: 1, marginRight: scale(6) },
  tipRowTitle: { fontSize: moderateScale(13), fontWeight: "700" },
  tipRowBody: {
    fontSize: moderateScale(11),
    marginTop: verticalScale(2),
    lineHeight: verticalScale(15),
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(30),
    paddingTop: verticalScale(60),
    gap: verticalScale(10),
  },
  errorText: {
    fontSize: moderateScale(12),
    color: "#B91C1C",
    textAlign: "center",
  },
  emptyText: {
    fontSize: moderateScale(12),
    color: "#687076",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#094A04",
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(8),
  },
  disabledButton: { opacity: 0.5 },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
});
