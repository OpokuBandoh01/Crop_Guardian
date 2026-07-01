// components/crops/components/CropCard.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  fmtConfidence,
  fmtDate,
  getCropMeta,
  getRiskMeta,
  getStatusMeta,
  MyCrop,
} from "../../../app/(tabs)/my-crops";

interface CropCardProps {
  item: MyCrop;
  onPress: (crop: MyCrop) => void;
  onEdit: (crop: MyCrop) => void;
  onDelete: (crop: MyCrop) => void;
}

export default function CropCard({
  item,
  onPress,
  onEdit,
  onDelete,
}: CropCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const meta = getCropMeta(item.cropType);
  const statusMeta = getStatusMeta(item.status);
  const riskMeta = getRiskMeta(item.riskLevel);

  return (
    <TouchableOpacity
      style={[
        styles.cropCard,
        {
          backgroundColor: theme.surface,
          shadowColor: colorScheme === "light" ? "#094A04" : "#000000",
        },
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
    >
      <View style={[styles.cardAccent, { backgroundColor: meta.accent }]} />

      <View style={styles.cardBody}>
        <View style={styles.cardHeaderRow}>
          <View
            style={[
              styles.cropEmojiWrapper,
              { backgroundColor: colorScheme === "light" ? "#F0F7EE" : "#253A20" },
            ]}
          >
            <Text style={styles.cropEmoji}>{meta.emoji}</Text>
          </View>

          <View style={styles.cropNameBlock}>
            <Text style={[styles.cropLabel, { color: theme.text }]}>{meta.label}</Text>
            {item.customName ? (
              <Text style={[styles.customName, { color: theme.icon }]} numberOfLines={1}>
                {item.customName}
              </Text>
            ) : null}
          </View>

          <View style={[styles.riskBadge, { backgroundColor: riskMeta.bg }]}>
            <Text style={[styles.riskText, { color: riskMeta.color }]}>
              {(item.riskLevel ?? "LOW").toUpperCase()} RISK
            </Text>
          </View>
        </View>

        <View style={styles.cardMidRow}>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: statusMeta.color + "22" },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusMeta.color }]}
            />
            <Text style={[styles.statusText, { color: statusMeta.color }]}>
              {statusMeta.label}
            </Text>
          </View>

          <Text style={[styles.lastActivity, { color: theme.icon }]}>
            {item.lastActivityDate
              ? `Last scan ${fmtDate(item.lastActivityDate)}`
              : "No scans yet"}
          </Text>
        </View>

        {item.lastDetection ? (
          <View style={styles.lastDetectionRow}>
            <Ionicons name="bug-outline" size={12} color={theme.icon} />
            <Text style={[styles.lastDetectionText, { color: theme.icon }]} numberOfLines={1}>
              {item.lastDetection.diseaseName} —{" "}
              {fmtConfidence(item.lastDetection.confidence)} confidence
            </Text>
          </View>
        ) : (
          <View style={styles.lastDetectionRow}>
            <Ionicons
              name="checkmark-circle-outline"
              size={12}
              color="#22C55E"
            />
            <Text style={[styles.lastDetectionText, { color: "#22C55E" }]}>
              No disease detected yet
            </Text>
          </View>
        )}

        <View style={[styles.cardActionRow, { borderTopColor: colorScheme === "light" ? "#F3F4F6" : "#2D3D2A" }]}>
          <TouchableOpacity
            style={styles.cardActionBtn}
            onPress={() => onEdit(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="pencil-outline" size={14} color={theme.primary} />
            <Text style={[styles.cardActionText, { color: theme.primary }]}>Edit Status</Text>
          </TouchableOpacity>

          <View style={[styles.cardActionDivider, { backgroundColor: colorScheme === "light" ? "#E5E7EB" : "#2D3D2A" }]} />

          <TouchableOpacity
            style={styles.cardActionBtn}
            onPress={() => onPress(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="time-outline" size={14} color={theme.primary} />
            <Text style={[styles.cardActionText, { color: theme.primary }]}>History</Text>
          </TouchableOpacity>

          <View style={[styles.cardActionDivider, { backgroundColor: colorScheme === "light" ? "#E5E7EB" : "#2D3D2A" }]} />

          <TouchableOpacity
            style={styles.cardActionBtn}
            onPress={() => onDelete(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={14} color={theme.error} />
            <Text style={[styles.cardActionText, { color: theme.error }]}>
              Remove
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cropCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(16),
    marginBottom: verticalScale(14),
    overflow: "hidden",
    shadowColor: "#094A04",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardAccent: { width: scale(5) },
  cardBody: { flex: 1, padding: moderateScale(14) },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(10),
    gap: scale(10),
  },
  cropEmojiWrapper: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(12),
    backgroundColor: "#F0F7EE",
    alignItems: "center",
    justifyContent: "center",
  },
  cropEmoji: { fontSize: moderateScale(22) },
  cropNameBlock: { flex: 1 },
  cropLabel: {
    fontSize: moderateScale(17),
    fontWeight: "700",
    color: "#083D04",
  },
  customName: {
    fontSize: moderateScale(12),
    color: "#6B7280",
    marginTop: verticalScale(1),
  },
  riskBadge: {
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(8),
  },
  riskText: {
    fontSize: moderateScale(9),
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardMidRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(8),
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(10),
    gap: scale(5),
  },
  statusDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  statusText: { fontSize: moderateScale(11), fontWeight: "600" },
  lastActivity: { fontSize: moderateScale(11), color: "#9CA3AF" },
  lastDetectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    marginBottom: verticalScale(12),
  },
  lastDetectionText: {
    fontSize: moderateScale(11),
    color: "#6B7280",
    flex: 1,
  },
  cardActionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: verticalScale(10),
  },
  cardActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    flex: 1,
    justifyContent: "center",
  },
  cardActionText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#094A04",
  },
  cardActionDivider: {
    width: 1,
    height: verticalScale(14),
    backgroundColor: "#E5E7EB",
  },
});
