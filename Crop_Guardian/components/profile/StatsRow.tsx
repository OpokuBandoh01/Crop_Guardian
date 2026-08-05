// components/profile/StatsRow.tsx
// Renders the four-column stats strip inside the green profile card,
// backed entirely by GET /api/auth/me's `stats` object.

import type { UserStats } from "@/types/user";
import React from "react";
import { StyleSheet, View } from "react-native";
import { verticalScale } from "react-native-size-matters";
import { StatItem } from "./StatItem";

interface StatsRowProps {
  stats: UserStats | null;
  loading: boolean;
}

export function StatsRow({ stats, loading }: StatsRowProps) {
  // Small helper: while the first fetch is in flight, or a specific
  // number is not yet known, show a dash instead of "0". Flashing a real
  // "0" and then the true number reads as a bug to the user.
  const display = (value?: number): string | number => {
    if (loading || value === undefined) return "-";
    return value;
  };

  return (
    <View style={styles.statsContainer}>
      <StatItem
        icon="sprout-outline"
        iconFamily="material"
        label="My Crops"
        value={display(stats?.cropsCount)}
      />
      <View style={styles.statDivider} />
      <StatItem
        icon="scan-outline"
        label="Scans"
        value={display(stats?.detectionsCount)}
      />
      <View style={styles.statDivider} />
      <StatItem
        icon="shield-checkmark-outline"
        label="Alerts"
        value={display(stats?.notificationsCount)}
      />
      <View style={styles.statDivider} />
      <StatItem
        icon="notifications-outline"
        label="Unread"
        value={display(stats?.unreadNotificationsCount)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: verticalScale(22),
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
});
