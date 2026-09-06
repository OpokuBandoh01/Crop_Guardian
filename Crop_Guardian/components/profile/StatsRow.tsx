// components/profile/StatsRow.tsx

import type { UserStats } from "@/types/user";
import React from "react";
import { StyleSheet, View } from "react-native";
import { verticalScale } from "react-native-size-matters";
import { StatItem } from "./StatItem";

interface StatsRowProps {
  stats: UserStats | null;
  loading: boolean;
  //  open /connections with the right tab
  onPressFollowers?: () => void;
  onPressFollowing?: () => void;
}

export function StatsRow({
  stats,
  loading,
  onPressFollowers,
  onPressFollowing,
}: StatsRowProps) {
  const display = (value?: number): string | number => {
    if (loading || value === undefined) return "-";
    return value;
  };

  return (
    <View>
      {/*  original four-stat row */}
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

      {/*  thin divider between rows */}
      <View style={styles.rowDivider} />

      {/*  Followers | Following */}
      <View style={styles.statsContainer}>
        <StatItem
          icon="people-outline"
          label="Followers"
          value={display(stats?.followersCount)}
          onPress={onPressFollowers}
          disabled={loading}
        />
        <View style={styles.statDivider} />
        <StatItem
          icon="person-add-outline"
          label="Following"
          value={display(stats?.followingCount)}
          onPress={onPressFollowing}
          disabled={loading}
        />
      </View>
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
  // NEW ADDITION
  rowDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    marginVertical: verticalScale(10),
  },
});
