// components/daily-tips/TipDetailModal.tsx
// Shows the full title and body of a single daily tip inside the shared
// BlurModal shell. Kept separate from BlurModal so BlurModal stays generic.

import BlurModal from "@/components/BlurModal";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { DailyTipItem } from "@/schemas/tipSchema";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";

// TypeScript: `tip` is typed as `DailyTipItem | null` because this modal
// can be mounted before any tip has been selected (e.g. right after the
// screen loads). Making it nullable forces every usage below to check for
// null first, preventing a crash from reading `.title` off `undefined`.
interface TipDetailModalProps {
  visible: boolean;
  tip: DailyTipItem | null;
  onClose: () => void;
}

export default function TipDetailModal({
  visible,
  tip,
  onClose,
}: TipDetailModalProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // Guard clause: nothing to render if no tip has been selected yet.
  if (!tip) return null;

  return (
    <BlurModal visible={visible} onClose={onClose}>
      <View style={styles.headerRow}>
        <View style={styles.iconBadge}>
          <Ionicons name="bulb" size={moderateScale(18)} color="#094A04" />
        </View>
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.7}
          style={styles.closeButton}
          accessibilityLabel="Close tip details"
        >
          <Ionicons name="close" size={moderateScale(20)} color={theme.icon} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.primary }]}>
          {tip.title}
        </Text>
        <Text style={[styles.body, { color: theme.logoBackground }]}>
          {tip.body}
        </Text>

        {/* Optional metadata chips - only rendered if the backend sent them */}
        {tip.cropTypes && tip.cropTypes.length > 0 && (
          <View style={styles.chipsRow}>
            {tip.cropTypes.map((crop) => (
              <View key={crop} style={styles.chip}>
                <Text style={styles.chipText}>{crop}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </BlurModal>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  iconBadge: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: "#EBF7E9",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    padding: moderateScale(4),
  },
  title: {
    fontSize: moderateScale(17),
    fontWeight: "700",
    marginBottom: verticalScale(10),
  },
  body: {
    fontSize: moderateScale(14),
    lineHeight: verticalScale(21),
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(6),
    marginTop: verticalScale(14),
  },
  chip: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(20),
    backgroundColor: "#EBF7E9",
  },
  chipText: {
    fontSize: moderateScale(10),
    fontWeight: "600",
    color: "#094A04",
  },
});
