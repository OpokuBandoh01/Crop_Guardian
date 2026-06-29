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

/** Add Crop Modal - All fields and buttons disabled during loading */
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
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/*
       * BlurView with intensity 60 + dark tint provides backdrop blur.
       * This locks the background visually and prevents interaction
       * when the modal is open (pointerEvents handled by TouchableOpacity overlay).
       */}
      <BlurView intensity={60} tint="dark" style={styles.modalBackdrop}>
        {/* Full-screen invisible overlay to dismiss by tapping outside */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
          disabled={addLoading}
        />

        {/* Sheet card: #FFFFFF surface matching home's dailyTipCard / quickActionBtn */}
        <View style={styles.bottomSheet}>
          {/* Drag handle */}
          <View style={styles.sheetHandle} />

          {/* Title: matches home's sectionTitle style */}
          <Text style={styles.sheetTitle}>Add a Crop</Text>
          {/* Subtitle: matches home's subtitleText / cropConditionSub style */}
          <Text style={styles.sheetSubtitle}>
            Pick a crop to start tracking its health
          </Text>

          {addableCrops.length === 0 ? (
            <View style={styles.allAddedWrap}>
              <Text style={styles.allAddedEmoji}>🎉</Text>
              <Text style={styles.allAddedText}>
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
                      // Selected: use crop accent color border + light tinted bg
                      // matches home's overviewCard tinted background pattern
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
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorBannerText}>{addError}</Text>
            </View>
          ) : null}

          {addableCrops.length > 0 && (
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                (!selectedNewCrop || addLoading) && styles.disabledOpacity,
              ]}
              onPress={onAddCrop}
              disabled={!selectedNewCrop || addLoading}
            >
              {addLoading ? (
                /*
                 * ActivityIndicator uses cream #FFFFE7 color to match
                 * the home scan banner's white-on-green button text pattern
                 */
                <ActivityIndicator color="#FFFFE7" />
              ) : (
                <>
                  <Ionicons
                    name="add-circle-outline"
                    size={18}
                    color="#FFFFE7"
                  />
                  <Text style={styles.primaryBtnText}>Add to My Crops</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.ghostBtn, addLoading && styles.disabledOpacity]}
            onPress={onClose}
            disabled={addLoading}
          >
            <Text style={styles.ghostBtnText}>Cancel</Text>
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
    // #FFFFFF surface card matching home's dailyTipCard background
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(Platform.OS === "ios" ? 36 : 24),
    paddingTop: verticalScale(16),
    width: "100%",
    // Shadow matches home's bottomCard elevation pattern
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, // matches home's scanBanner shadowOpacity
    shadowRadius: 8, // matches home's scanBanner shadowRadius
    elevation: 10,
  },
  sheetHandle: {
    width: scale(36),
    height: verticalScale(4),
    // #D9D9D9 matches home's blendBorder / divider color
    backgroundColor: "#D9D9D9",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: verticalScale(16),
  },
  sheetTitle: {
    fontSize: moderateScale(20),
    fontWeight: "700", // matches home's greetingText fontWeight
    color: "#11181C", // matches home's primary text color
    marginBottom: verticalScale(4),
  },
  sheetSubtitle: {
    fontSize: moderateScale(13), // matches home's subtitleText fontSize
    color: "#687076", // matches home's cropConditionSub color
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
    // Border matches home's quickActionBtn border style
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: moderateScale(12), // matches home's overviewCard / quickActionBtn
    padding: moderateScale(14),
    alignItems: "center",
    gap: verticalScale(6),
    position: "relative",
    // Subtle shadow matching home's overviewCard
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cropGridEmoji: { fontSize: moderateScale(28) },
  cropGridLabel: {
    fontSize: moderateScale(13), // matches home's cropNameText fontSize
    fontWeight: "600",
    color: "#11181C", // matches home's cropNameText color
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
    fontSize: moderateScale(13),
    color: "#687076", // matches home's cropConditionSub color
    textAlign: "center",
  },
  primaryBtn: {
    flexDirection: "row",
    // #094A04 matches home's primary button / scan banner background color
    backgroundColor: "#094A04",
    borderRadius: moderateScale(28), // pill shape matching home's scan action buttons
    paddingVertical: verticalScale(14),
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    minHeight: verticalScale(50),
    marginBottom: verticalScale(10),
  },
  primaryBtnText: {
    // #FFFFE7 cream text matches home's scan banner button label style
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
    borderColor: "#D9D9D9", // matches home's blendBorder / divider color
    minHeight: verticalScale(48),
  },
  ghostBtnText: {
    color: "#687076", // matches home's viewAllLink / subtitleText color
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
