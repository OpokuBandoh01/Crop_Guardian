// components/crops/CropCard2.tsx
// One row in the My Crops list. Tapping the card opens the edit modal,
// the trash icon opens the delete confirmation, both handled by the
// parent screen via the callback props.

import { getCropLabel } from "@/constants/cropOptions";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { TrackedCrop } from "@/types/crops";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";
import { CropStatusPill } from "./CropStatusPill";

interface CropCardProps {
  crop: TrackedCrop;
  onPress: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

const RISK_COLORS = {
  HIGH: "#DC2626",
  MEDIUM: "#D97706",
  LOW: "#16A34A",
} as const;

export function CropCard({
  crop,
  onPress,
  onDelete,
  disabled = false,
}: CropCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.surface, opacity: disabled ? 0.6 : 1 },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {crop.customName || getCropLabel(crop.cropType)}
          </Text>
          <Text style={styles.cropTypeLabel}>
            {getCropLabel(crop.cropType)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onDelete}
          disabled={disabled}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="trash-outline"
            size={moderateScale(18)}
            color="#DC2626"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.badgeRow}>
        <CropStatusPill status={crop.status} />
        <View style={styles.riskRow}>
          <View
            style={[
              styles.riskDot,
              { backgroundColor: RISK_COLORS[crop.riskLevel] },
            ]}
          />
          <Text style={styles.riskLabel}>{crop.riskLevel} risk</Text>
        </View>
      </View>

      {crop.farmSize != null && (
        <Text style={styles.metaText}>
          {crop.farmSize} {crop.farmSizeUnit || "acres"}
        </Text>
      )}

      {crop.lastDetection && (
        <View style={styles.detectionRow}>
          <Ionicons
            name="scan-outline"
            size={moderateScale(13)}
            color="#687076"
          />
          <Text style={styles.detectionText} numberOfLines={1}>
            Last scan: {crop.lastDetection.diseaseName} (
            {Math.round(crop.lastDetection.confidence * 100)}%)
          </Text>
        </View>
      )}

      {crop.notes && (
        <Text style={styles.notes} numberOfLines={2}>
          {crop.notes}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: moderateScale(14),
    padding: scale(14),
    marginBottom: verticalScale(12),
    borderWidth: 1.2,
    borderColor: "rgba(9, 74, 4, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: verticalScale(6),
  },
  name: { fontSize: moderateScale(14), fontWeight: "700" },
  cropTypeLabel: {
    fontSize: moderateScale(10),
    color: "#687076",
    marginTop: verticalScale(1),
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(6),
  },
  riskRow: { flexDirection: "row", alignItems: "center" },
  riskDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    marginRight: scale(4),
  },
  riskLabel: {
    fontSize: moderateScale(10),
    fontWeight: "600",
    color: "#687076",
  },
  metaText: {
    fontSize: moderateScale(11),
    color: "#094A04",
    fontWeight: "600",
    marginBottom: verticalScale(4),
  },
  detectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginBottom: verticalScale(4),
  },
  detectionText: { fontSize: moderateScale(10.5), color: "#687076", flex: 1 },
  notes: {
    fontSize: moderateScale(10.5),
    color: "#687076",
    fontStyle: "italic",
  },
});
