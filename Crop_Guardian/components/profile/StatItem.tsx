// components/profile/StatItem.tsx

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";

type IconFamily = "ionicons" | "material";

interface StatItemProps {
  icon: string;
  iconFamily?: IconFamily;
  label: string;
  value: number | string;
  //  make the whole column tappable when provided
  onPress?: () => void;
  disabled?: boolean;
}

export function StatItem({
  icon,
  iconFamily = "ionicons",
  label,
  value,
  onPress,
  disabled = false,
}: StatItemProps) {
  const IconComponent =
    iconFamily === "material" ? MaterialCommunityIcons : Ionicons;

  const content = (
    <>
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
    </>
  );

  //  tappable when onPress is set (Followers / Following)
  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.statCol}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={disabled}
      >
        {content}
      </TouchableOpacity>
    );
  }

  // non-tappable stats stay as a plain View
  return <View style={styles.statCol}>{content}</View>;
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
