// components/daily-tips/DailyTipCard.tsx
// Self-contained "Daily Tip" card for the home screen. It fetches its own
// data from tipStore, so the home screen only needs to render
// <DailyTipCard /> with no props and no extra wiring. Handles loading,
// error, empty, and success states internally, and disables all touches
// while a request is in flight.
//
// UPDATED: the success state used to show one tip alongside a static image.
// It now shows a swipeable, auto-advancing slideshow of ALL of today's tips
// (no image), with dot indicators. Tapping the current slide still opens
// TipDetailModal for that specific tip.

import TipDetailModal from "@/components/daily-tips/TipDetailModal";
import type { DailyTipItem } from "@/schemas/tipSchema";
import { useTipStore } from "@/stores/tipStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

// NEW ADDITION: fixed card footprint, kept identical to the old width/height
// so this card still lines up with the other cards in the home screen's
// horizontal scroll row. Pulled out as constants because the slide width
// below needs to be derived from the card width minus its own padding.
const CARD_WIDTH = scale(280);
const CARD_HEIGHT = verticalScale(140);
const CARD_PADDING_H = scale(12);
const SLIDE_WIDTH = CARD_WIDTH - CARD_PADDING_H * 2;

// NEW ADDITION: how often the slideshow auto-advances when the user isn't
// interacting with it, in milliseconds.
const AUTO_ADVANCE_MS = 5000;

export default function DailyTipCard() {
  const router = useRouter();

  // TypeScript: each selector below pulls exactly one field out of the
  // store instead of the whole store object. This means this component
  // only re-renders when the specific field it reads actually changes.
  const todayTips = useTipStore((state) => state.todayTips);
  const loading = useTipStore((state) => state.loading);
  const error = useTipStore((state) => state.error);
  const fetchTodayTips = useTipStore((state) => state.fetchTodayTips);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTip, setSelectedTip] = useState<DailyTipItem | null>(null);

  // NEW ADDITION: tracks which slide is currently in view, drives the dot
  // indicators and lets us compute where to auto-scroll to next.
  const [activeIndex, setActiveIndex] = useState(0);

  // TypeScript: ScrollView is the RN component type, so scrollRef.current
  // gives us access to imperative methods like .scrollTo(). Starts as null
  // because the ref isn't attached to anything until after the first render.
  const scrollRef = useRef<ScrollView>(null);

  // TypeScript: ReturnType<typeof setInterval> instead of NodeJS.Timeout,
  // since this file runs in the React Native / Hermes runtime, not Node, and
  // the two environments type setInterval's return value slightly differently.
  const autoAdvanceRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Only fetch if we don't already have tips cached from a previous
    // session. Pull-to-refresh on the home screen handles forcing a fresh
    // fetch (see the updated app/(tabs)/index.tsx onRefresh below).
    if (todayTips.length === 0) {
      fetchTodayTips();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // NEW ADDITION: starts (or restarts) the auto-advance timer. Defined as a
  // function so both the mount effect and the "resume after manual swipe"
  // handler below can call the same logic instead of duplicating it.
  const startAutoAdvance = () => {
    stopAutoAdvance();

    if (todayTips.length <= 1) return; // nothing to advance through

    autoAdvanceRef.current = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % todayTips.length;
        scrollRef.current?.scrollTo({
          x: nextIndex * SLIDE_WIDTH,
          animated: true,
        });
        return nextIndex;
      });
    }, AUTO_ADVANCE_MS);
  };

  const stopAutoAdvance = () => {
    if (autoAdvanceRef.current) {
      clearInterval(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
  };

  useEffect(() => {
    startAutoAdvance();
    // Always clean up the interval on unmount or when todayTips changes,
    // otherwise a stale timer keeps firing against an old tips array.
    return stopAutoAdvance;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayTips.length]);

  // NEW ADDITION: when the ScrollView settles after a manual swipe, work out
  // which slide is now centered (rounding handles any sub-pixel drift) and
  // sync activeIndex to it, then resume the auto-advance timer.
  const handleMomentumScrollEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH);
    setActiveIndex(newIndex);
    startAutoAdvance();
  };

  const handleUserSwipeStart = () => {
    stopAutoAdvance();
  };

  const handleOpenTip = (tip: DailyTipItem) => {
    setSelectedTip(tip);
    setModalVisible(true);
  };

  // ================= LOADING STATE (first load, nothing cached yet) =================
  if (loading && todayTips.length === 0) {
    return (
      <View style={[styles.card, styles.dailyTipCard]}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: "70%" }]} />
        <View style={[styles.skeletonLine, { width: "50%" }]} />
      </View>
    );
  }

  // ================= ERROR STATE (no cached tips to fall back on) =================
  if (error && todayTips.length === 0) {
    return (
      <View style={[styles.card, styles.dailyTipCard, styles.centerContent]}>
        <Ionicons
          name="alert-circle-outline"
          size={moderateScale(20)}
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
    );
  }

  // ================= EMPTY STATE (no tips seeded/eligible today) =================
  if (todayTips.length === 0) {
    return (
      <View style={[styles.card, styles.dailyTipCard, styles.centerContent]}>
        <Ionicons
          name="bulb-outline"
          size={moderateScale(20)}
          color="#687076"
        />
        <Text style={styles.emptyText}>
          No tips yet today. Check back later.
        </Text>
      </View>
    );
  }

  // ================= SUCCESS STATE (slideshow) =================
  return (
    <>
      <View style={[styles.card, styles.dailyTipCard]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTitleWrapper}>
            <Ionicons
              name="bulb-outline"
              size={moderateScale(16)}
              color="#094A04"
              style={styles.cardHeaderIcon}
            />
            <Text style={styles.dailyTipHeaderTitle}>Daily Tip</Text>
          </View>

          {todayTips.length > 1 && (
            <TouchableOpacity
              onPress={() => router.push("/daily-tips")}
              disabled={loading}
              activeOpacity={0.7}
              style={styles.seeAllRow}
            >
              <Text style={styles.seeAllText}>See all</Text>
              <Ionicons
                name="chevron-forward"
                size={moderateScale(11)}
                color="#2E7D32"
              />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={!loading}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={SLIDE_WIDTH}
          snapToAlignment="start"
          onScrollBeginDrag={handleUserSwipeStart}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          style={styles.slideScrollView}
        >
          {todayTips.map((tip) => (
            <TouchableOpacity
              key={tip.id}
              style={styles.slide}
              activeOpacity={0.85}
              disabled={loading}
              onPress={() => handleOpenTip(tip)}
            >
              <Text style={styles.dailyTipTitle} numberOfLines={1}>
                {tip.title}
              </Text>
              <Text style={styles.dailyTipBody} numberOfLines={4}>
                {tip.body}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {todayTips.length > 1 && (
          <View style={styles.dotsRow}>
            {todayTips.map((tip, i) => (
              <View
                key={tip.id}
                style={[styles.dot, i === activeIndex && styles.dotActive]}
              />
            ))}
          </View>
        )}
      </View>

      <TipDetailModal
        visible={modalVisible}
        tip={selectedTip}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: moderateScale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    backgroundColor: "#FFFFFF",
  },
  dailyTipCard: {
    // UPDATED: no longer flexDirection: "row" now that the image column is
    // gone, this is a simple top-to-bottom stack (header, slides, dots).
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    flexDirection: "column",
    overflow: "hidden",
    paddingVertical: verticalScale(10),
    paddingHorizontal: CARD_PADDING_H,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: scale(14),
    gap: verticalScale(6),
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(6),
  },
  cardHeaderTitleWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardHeaderIcon: {
    marginRight: scale(6),
  },
  dailyTipHeaderTitle: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#11181C",
  },
  // NEW ADDITION: the ScrollView itself just needs to fill the remaining
  // card height between the header row and the dot indicators below.
  slideScrollView: {
    flex: 1,
  },
  slide: {
    width: SLIDE_WIDTH,
    justifyContent: "center",
  },
  dailyTipTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#094A04",
    marginBottom: verticalScale(2),
  },
  dailyTipBody: {
    fontSize: moderateScale(11),
    color: "#4B5563",
    lineHeight: verticalScale(15),
  },
  seeAllRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    fontSize: moderateScale(10.5),
    fontWeight: "600",
    color: "#2E7D32",
    marginRight: scale(2),
  },
  // NEW ADDITION: dot indicators showing slideshow position, replaces the
  // old "+N more tips" text link since the slideshow itself now shows all
  // tips directly.
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: scale(4),
    marginTop: verticalScale(6),
  },
  dot: {
    width: moderateScale(5),
    height: moderateScale(5),
    borderRadius: moderateScale(2.5),
    backgroundColor: "#D9D9D9",
  },
  dotActive: {
    backgroundColor: "#2E7D32",
    width: moderateScale(12), // elongated pill shape for the active dot
  },
  skeletonLine: {
    height: verticalScale(12),
    width: "90%",
    borderRadius: moderateScale(4),
    backgroundColor: "#E5E7EB",
    marginVertical: verticalScale(6),
    marginHorizontal: scale(12),
  },
  errorText: {
    fontSize: moderateScale(11),
    color: "#B91C1C",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#094A04",
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(8),
  },
  disabledButton: {
    opacity: 0.5,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  emptyText: {
    fontSize: moderateScale(11),
    color: "#687076",
    textAlign: "center",
  },
});
