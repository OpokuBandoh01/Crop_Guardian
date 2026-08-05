// components/profile/StatItem.tsx
// A single column inside the profile stats row (e.g. "My Crops -> 5").
// Pulled into its own component so profile.tsx does not repeat the same
// JSX block four times, and so any future screen (e.g. a home-screen
// summary card) can reuse a single stat without copying markup.

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";

// A union type restricts iconFamily to exactly these two strings, so a
// typo like "materal" is caught by TypeScript instead of failing silently
// at runtime with a blank icon.
type IconFamily = "ionicons" | "material";

interface StatItemProps {
  icon: string;
  iconFamily?: IconFamily;
  label: string;
  value: number | string;
}

export function StatItem({
  icon,
  iconFamily = "ionicons",
  label,
  value,
}: StatItemProps) {
  // Choosing which icon component to render at runtime based on a prop,
  // rather than writing two near-identical JSX branches everywhere this
  // is used.
  const IconComponent =
    iconFamily === "material" ? MaterialCommunityIcons : Ionicons;

  return (
    <View style={styles.statCol}>
      <View style={styles.statHeaderRow}>
        <IconComponent
          name={icon as any}
          size={moderateScale(16)}
          color="#A3C89E"
          style={styles.statIcon}
        />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statCol: { flex: 1, alignItems: "center" },
  statHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(4),
  },
  statIcon: { marginRight: moderateScale(3) },
  statLabel: {
    fontSize: moderateScale(9),
    fontWeight: "600",
    color: "#A3C89E",
  },
  statValue: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
