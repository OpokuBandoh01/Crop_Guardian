// components/crops/components/CropCard.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";
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
  const meta = getCropMeta(item.cropType);
  const statusMeta = getStatusMeta(item.status);
  const riskMeta = getRiskMeta(item.riskLevel);

  return (
    <TouchableOpacity
      style={styles.cropCard}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
    >
      {/* Left accent strip - matches home's card left-border accents */}
      <View style={[styles.cardAccent, { backgroundColor: meta.accent }]} />

      <View style={styles.cardBody}>
        {/* ---- Header row: emoji + name + risk badge ---- */}
        <View style={styles.cardHeaderRow}>
          {/* Emoji container: same soft #EBF7E9 bg as home's overviewCard */}
          <View style={styles.cropEmojiWrapper}>
            <Text style={styles.cropEmoji}>{meta.emoji}</Text>
          </View>

          <View style={styles.cropNameBlock}>
            {/* #11181C matches home's cropNameText color */}
            <Text style={styles.cropLabel}>{meta.label}</Text>
            {item.customName ? (
              <Text style={styles.customName} numberOfLines={1}>
                {item.customName}
              </Text>
            ) : null}
          </View>

          {/* Risk badge: pill shape matching home's status pills */}
          <View style={[styles.riskBadge, { backgroundColor: riskMeta.bg }]}>
            <Text style={[styles.riskText, { color: riskMeta.color }]}>
              {(item.riskLevel ?? "LOW").toUpperCase()} RISK
            </Text>
          </View>
        </View>

        {/* ---- Status row ---- */}
        <View style={styles.cardMidRow}>
          {/* Status pill: uses color + 22 hex alpha, same as home's tinted cards */}
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

          {/* #687076 matches home's cropConditionSub / recentScanTime color */}
          <Text style={styles.lastActivity}>
            {item.lastActivityDate
              ? `Last scan ${fmtDate(item.lastActivityDate)}`
              : "No scans yet"}
          </Text>
        </View>

        {/* ---- Last detection info row ---- */}
        {item.lastDetection ? (
          <View style={styles.lastDetectionRow}>
            <Ionicons name="bug-outline" size={12} color="#687076" />
            <Text style={styles.lastDetectionText} numberOfLines={1}>
              {item.lastDetection.diseaseName}{" "}
              {fmtConfidence(item.lastDetection.confidence)} confidence
            </Text>
          </View>
        ) : (
          <View style={styles.lastDetectionRow}>
            <Ionicons
              name="checkmark-circle-outline"
              size={12}
              color="#2E7D32"
            />
            {/* #2E7D32 matches home's cropStatusHealthy color */}
            <Text style={[styles.lastDetectionText, { color: "#2E7D32" }]}>
              No disease detected yet
            </Text>
          </View>
        )}

        {/* ---- Action row: divider matches home's #D9D9D9 blendBorder ---- */}
        <View style={styles.cardActionRow}>
          <TouchableOpacity
            style={styles.cardActionBtn}
            onPress={() => onEdit(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {/* #094A04 matches home's primary icon color */}
            <Ionicons name="pencil-outline" size={14} color="#094A04" />
            <Text style={styles.cardActionText}>Edit Status</Text>
          </TouchableOpacity>

          <View style={styles.cardActionDivider} />

          <TouchableOpacity
            style={styles.cardActionBtn}
            onPress={() => onPress(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="time-outline" size={14} color="#094A04" />
            <Text style={styles.cardActionText}>History</Text>
          </TouchableOpacity>

          <View style={styles.cardActionDivider} />

          <TouchableOpacity
            style={styles.cardActionBtn}
            onPress={() => onDelete(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={14} color="#EF4444" />
            <Text style={[styles.cardActionText, { color: "#EF4444" }]}>
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
    // White surface card: matches home's dailyTipCard / quickActionBtn backgroundColor
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12), // matches home's overviewCard / quickActionBtn borderRadius
    marginBottom: verticalScale(14),
    overflow: "hidden",
    // Shadow matches home's bottomCard shadow style
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
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
    // #EBF7E9 matches home's overviewCard healthy background
    backgroundColor: "#EBF7E9",
    alignItems: "center",
    justifyContent: "center",
  },
  cropEmoji: { fontSize: moderateScale(22) },
  cropNameBlock: { flex: 1 },
  cropLabel: {
    fontSize: moderateScale(13), // matches home's cropNameText fontSize
    fontWeight: "700",
    color: "#11181C", // matches home's cropNameText / headings color
  },
  customName: {
    fontSize: moderateScale(11),
    color: "#687076", // matches home's cropConditionSub color
    marginTop: verticalScale(1),
  },
  riskBadge: {
    borderRadius: moderateScale(20), // pill shape matching home's status pills
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
  // #687076 matches home's recentScanTime color
  lastActivity: { fontSize: moderateScale(11), color: "#687076" },
  lastDetectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    marginBottom: verticalScale(12),
  },
  lastDetectionText: {
    fontSize: moderateScale(11),
    color: "#687076",
    flex: 1,
  },
  cardActionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    // #D9D9D9 matches home's blendBorder divider color
    borderTopColor: "#D9D9D9",
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
    color: "#094A04", // matches home's primary icon / viewAllLink color
  },
  cardActionDivider: {
    width: 1,
    height: verticalScale(14),
    backgroundColor: "#D9D9D9", // matches home's blendBorder color
  },
});
