// components/crops/components/AddCropModal.tsx
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { CropType } from "../../../app/(tabs)/my-crops";

interface AddCropModalProps {
  visible: boolean;
  addableCrops: CropType[];
  selectedNewCrop: CropType | null;
  addLoading: boolean;
  addError: string | null;
  onClose: () => void;
  onSelectCrop: (crop: CropType) => void;
  onAddCrop: () => void;
  CROP_META: Record<CropType, { emoji: string; accent: string; label: string }>;
}

/** Add Crop Modal - All fields disabled during loading */
export default function AddCropModal({
  visible,
  addableCrops,
  selectedNewCrop,
  addLoading,
  addError,
  onClose,
  onSelectCrop,
  onAddCrop,
  CROP_META,
}: AddCropModalProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <BlurView intensity={60} tint="dark" style={styles.modalBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
          disabled={addLoading}
        />
        <View style={[styles.bottomSheet, { backgroundColor: theme.surface }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colorScheme === "light" ? "#D1D5DB" : "#4B5563" }]} />
          <Text style={[styles.sheetTitle, { color: theme.primary }]}>Add a Crop</Text>
          <Text style={[styles.sheetSubtitle, { color: theme.icon }]}>
            Pick a crop to start tracking its health
          </Text>

          {addableCrops.length === 0 ? (
            <View style={styles.allAddedWrap}>
              <Text style={styles.allAddedEmoji}>🎉</Text>
              <Text style={[styles.allAddedText, { color: theme.icon }]}>
                You are tracking all available crops!
              </Text>
            </View>
          ) : (
            <View style={styles.cropGrid}>
              {addableCrops.map((crop) => {
                const meta = CROP_META[crop];
                const isSelected = selectedNewCrop === crop;
                return (
                  <TouchableOpacity
                    key={crop}
                    style={[
                      styles.cropGridItem,
                      { borderColor: colorScheme === "light" ? "#E5E7EB" : "#2D3D2A" },
                      isSelected && {
                        borderColor: meta.accent,
                        backgroundColor: meta.accent + "18",
                      },
                      addLoading && styles.disabledOpacity,
                    ]}
                    onPress={() => onSelectCrop(crop)}
                    disabled={addLoading}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.cropGridEmoji}>{meta.emoji}</Text>
                    <Text
                      style={[
                        styles.cropGridLabel,
                        { color: theme.text },
                        isSelected && { color: meta.accent, fontWeight: "700" },
                      ]}
                    >
                      {meta.label}
                    </Text>
                    {isSelected && (
                      <View
                        style={[
                          styles.cropGridCheck,
                          { backgroundColor: meta.accent },
                        ]}
                      >
                        <Ionicons name="checkmark" size={10} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {addError ? (
            <View style={[styles.errorBanner, { backgroundColor: colorScheme === "light" ? "#FEF2F2" : "#2D1D1D" }]}>
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorBannerText}>{addError}</Text>
            </View>
          ) : null}

          {addableCrops.length > 0 && (
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: theme.primary },
                (!selectedNewCrop || addLoading) && styles.disabledOpacity,
              ]}
              onPress={onAddCrop}
              disabled={!selectedNewCrop || addLoading}
            >
              {addLoading ? (
                <ActivityIndicator color={colorScheme === "light" ? "#FFFFE7" : "#11181C"} />
              ) : (
                <>
                  <Ionicons
                    name="add-circle-outline"
                    size={18}
                    color={colorScheme === "light" ? "#FFFFE7" : "#11181C"}
                  />
                  <Text style={[styles.primaryBtnText, { color: colorScheme === "light" ? "#FFFFE7" : "#11181C" }]}>Add to My Crops</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.ghostBtn,
              { borderColor: colorScheme === "light" ? "#D1D5DB" : "#4B5563" },
              addLoading && styles.disabledOpacity,
            ]}
            onPress={onClose}
            disabled={addLoading}
          >
            <Text style={[styles.ghostBtnText, { color: theme.icon }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(Platform.OS === "ios" ? 36 : 24),
    paddingTop: verticalScale(16),
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  sheetHandle: {
    width: scale(36),
    height: verticalScale(4),
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: verticalScale(16),
  },
  sheetTitle: {
    fontSize: moderateScale(20),
    fontWeight: "800",
    color: "#083D04",
    marginBottom: verticalScale(4),
  },
  sheetSubtitle: {
    fontSize: moderateScale(14),
    color: "#6B7280",
    marginBottom: verticalScale(20),
  },
  cropGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(10),
    marginBottom: verticalScale(20),
  },
  cropGridItem: {
    width: "47%",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    alignItems: "center",
    gap: verticalScale(6),
    position: "relative",
  },
  cropGridEmoji: { fontSize: moderateScale(28) },
  cropGridLabel: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#374151",
  },
  cropGridCheck: {
    position: "absolute",
    top: moderateScale(8),
    right: moderateScale(8),
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    alignItems: "center",
    justifyContent: "center",
  },
  allAddedWrap: { alignItems: "center", paddingVertical: verticalScale(24) },
  allAddedEmoji: {
    fontSize: moderateScale(40),
    marginBottom: verticalScale(8),
  },
  allAddedText: {
    fontSize: moderateScale(14),
    color: "#6B7280",
    textAlign: "center",
  },
  primaryBtn: {
    flexDirection: "row",
    backgroundColor: "#094A04",
    borderRadius: moderateScale(28),
    paddingVertical: verticalScale(14),
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    minHeight: verticalScale(50),
    marginBottom: verticalScale(10),
  },
  primaryBtnText: {
    color: "#FFFFE7",
    fontSize: moderateScale(15),
    fontWeight: "700",
  },
  ghostBtn: {
    borderRadius: moderateScale(28),
    paddingVertical: verticalScale(13),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    minHeight: verticalScale(48),
  },
  ghostBtnText: {
    color: "#6B7280",
    fontSize: moderateScale(15),
    fontWeight: "600",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    marginBottom: verticalScale(12),
    gap: scale(6),
  },
  errorBannerText: {
    color: "#EF4444",
    fontSize: moderateScale(13),
    flex: 1,
  },
  disabledOpacity: { opacity: 0.5 },
});
