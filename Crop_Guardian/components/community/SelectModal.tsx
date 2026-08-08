// components/community/SelectModal.tsx
// Reusable single-select bottom-sheet modal, used for the Category, Crop
// Type, and Region pickers on Create Post. Per project convention,
// modals use a backdrop blur and lock the background so it cannot be
// interacted with while open — React Native's <Modal> already blocks
// every touch to whatever is behind it by default, the BlurView here
// just makes that visually obvious rather than leaving a hard cut.

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

// Exported so the screen using this modal can type its options array
// against the same shape, instead of duplicating { label, value } inline.
export interface SelectModalOption {
  label: string;
  value: string;
}

interface SelectModalProps {
  visible: boolean;
  title: string;
  options: SelectModalOption[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export default function SelectModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: SelectModalProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <BlurView
        intensity={40}
        tint={colorScheme === "dark" ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      >
        {/* Tapping the blurred area outside the sheet closes the modal. */}
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        >
          {/* Stops a tap ON the sheet itself from bubbling up to the
              backdrop TouchableOpacity above and closing the modal. */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[styles.sheet, { backgroundColor: theme.surface }]}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>
                {title}
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={10}>
                <Ionicons
                  name="close"
                  size={moderateScale(22)}
                  color={theme.icon}
                />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              style={styles.optionsList}
              renderItem={({ item }) => {
                const isSelected = item.value === selectedValue;
                return (
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => {
                      onSelect(item.value);
                      onClose();
                    }}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        { color: isSelected ? theme.primary : theme.text },
                        isSelected && styles.optionLabelSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={moderateScale(18)}
                        color={theme.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropTouchable: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    maxHeight: "60%",
    paddingBottom: verticalScale(24),
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  sheetTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
  },
  optionsList: {
    paddingHorizontal: scale(18),
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: verticalScale(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  optionLabel: {
    fontSize: moderateScale(13.5),
  },
  optionLabelSelected: {
    fontWeight: "700",
  },
});
