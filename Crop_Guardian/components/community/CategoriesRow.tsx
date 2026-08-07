// components/community/CategoriesRow.tsx
// Horizontally scrollable row of category/tag chips shown at the top of
// the Community feed. The TAGS themselves come from the backend
// (GET /api/community/tags, backend-seeded), only the ICONS are decided
// on the frontend here, since the backend does not send an icon field.

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { CommunityTag } from "@/types/community";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

// `keyof typeof Ionicons.glyphMap` pulls the exact set of valid icon
// names straight from the Ionicons library's own TypeScript types. This
// means a typo below (e.g. "leeaf-outline") is caught at compile time
// instead of silently rendering a blank icon at runtime.
type IoniconName = keyof typeof Ionicons.glyphMap;

// Maps a tag's `slug` to an icon. This only needs to cover the slugs the
// backend seeds today (per the docx: Disease Help, Treatment Success,
// Fertilizer Tip, General Question, Weather Impact, Local Medicine,
// Other); anything seeded later that isn't in this map falls back to a
// generic tag icon instead of crashing or rendering nothing.
const TAG_ICON_MAP: Record<string, IoniconName> = {
  "disease-help": "bug-outline",
  "treatment-success": "checkmark-circle-outline",
  "fertilizer-tip": "nutrition-outline",
  "general-question": "help-circle-outline",
  "weather-impact": "cloud-outline",
  "local-medicine": "flask-outline",
  other: "pricetag-outline",
};

const FALLBACK_ICON: IoniconName = "pricetag-outline";

interface CategoriesRowProps {
  tags: CommunityTag[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  disabled?: boolean;
}

export default function CategoriesRow({
  tags,
  selectedSlug,
  onSelect,
  disabled = false,
}: CategoriesRowProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // Nothing to show yet (tags still loading, or none seeded on the
  // backend). Rendering nothing here instead of a placeholder box keeps
  // this subtle rather than showing an empty-looking row.
  if (tags.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {tags.map((tag) => {
        const isSelected = tag.slug === selectedSlug;
        const iconName = TAG_ICON_MAP[tag.slug] ?? FALLBACK_ICON;

        return (
          <TouchableOpacity
            key={tag.id}
            style={[
              styles.chip,
              {
                backgroundColor: theme.surface,
                borderColor: isSelected ? theme.primary : theme.inputBorder,
                borderWidth: isSelected ? 2 : 1,
              },
            ]}
            onPress={() => onSelect(tag.slug)}
            activeOpacity={0.7}
            disabled={disabled}
          >
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isSelected
                    ? theme.primary
                    : colorScheme === "light"
                      ? "#EBF7E9"
                      : "#1E2C20",
                },
              ]}
            >
              <Ionicons
                name={iconName}
                size={moderateScale(18)}
                color={isSelected ? "#FFFFFF" : theme.primary}
              />
            </View>
            <Text
              style={[styles.label, { color: theme.text }]}
              numberOfLines={2}
            >
              {tag.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: scale(10),
    paddingBottom: verticalScale(4),
  },
  chip: {
    width: scale(72),
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(6),
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(6),
  },
  label: {
    fontSize: moderateScale(9.5),
    fontWeight: "600",
    textAlign: "center",
    lineHeight: verticalScale(12),
  },
});
