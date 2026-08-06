// components/crops/CropStatusPill.tsx
// Small colored pill for a crop's status, reused in the card and the
// edit form's status selector.

import type { CropStatus } from "@/types/crops";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

// A lookup keyed by every possible CropStatus value. TypeScript's
// `Record<CropStatus, ...>` means if a new status is ever added to the
// union type in types/crop.ts and this object isn't updated to match, it
// will fail to compile, catching the mismatch immediately instead of
// silently rendering an unstyled pill later.
const STATUS_STYLES: Record<
  CropStatus,
  { bg: string; text: string; label: string }
> = {
  HEALTHY: { bg: "#EBF7E9", text: "#094A04", label: "Healthy" },
  MONITORING: { bg: "#E0F2FE", text: "#0369A1", label: "Monitoring" },
  AT_RISK: { bg: "#FEE2E2", text: "#DC2626", label: "At Risk" },
  HARVEST_READY: { bg: "#FEF3C7", text: "#92400E", label: "Harvest Ready" },
};

export function CropStatusPill({ status }: { status: CropStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <View style={[styles.pill, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.text }]}>{style.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(10),
    alignSelf: "flex-start",
  },
  text: { fontSize: moderateScale(10), fontWeight: "700" },
});
