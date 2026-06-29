// components/crops/components/EditStatusModal.tsx
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";
import {
  ALL_STATUSES,
  CropStatus,
  getCropMeta,
  MyCrop,
  STATUS_META,
} from "../../../app/(tabs)/my-crops";

interface EditStatusModalProps {
  visible: boolean;
  editTarget: MyCrop | null;
  editStatus: CropStatus;
  editNotes: string;
  editLoading: boolean;
  editError: string | null;
  onClose: () => void;
  onStatusChange: (status: CropStatus) => void;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
}

export default function EditStatusModal({
  visible,
  editTarget,
  editStatus,
  editNotes,
  editLoading,
  editError,
  onClose,
  onStatusChange,
  onNotesChange,
  onSave,
}: EditStatusModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/*
       * BlurView locks background when modal is open.
       * intensity 60 + dark tint matches the AddCropModal approach.
       */}
      <BlurView intensity={60} tint="dark" style={styles.modalBackdrop}>
        {/* Invisible overlay captures taps outside the sheet to dismiss */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
          disabled={editLoading}
        />

        {/* Bottom sheet card: #FFFFFF surface matching home's card surfaces */}
        <View style={styles.bottomSheet}>
          {/* Drag handle: #D9D9D9 matches home's blendBorder / divider color */}
          <View style={styles.sheetHandle} />

          {/* Title: matches home's sectionTitle / greetingText weight+color */}
          <Text style={styles.sheetTitle}>Update Crop</Text>

          {/* Subtitle: matches home's subtitleText style */}
          {editTarget && (
            <Text style={styles.sheetSubtitle}>
              {getCropMeta(editTarget.cropType).emoji}{" "}
              {getCropMeta(editTarget.cropType).label}
            </Text>
          )}

          {/* Field label: matches home's section label pattern */}
          <Text style={styles.fieldLabel}>Current Status</Text>

          <View style={styles.statusGrid}>
            {ALL_STATUSES.map((s) => {
              const sm = STATUS_META[s];
              const isActive = editStatus === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusOption,
                    // Active state: colored border + light tinted bg
                    // matches home's overviewCard tinted bg pattern
                    isActive && {
                      borderColor: sm.color,
                      backgroundColor: sm.color + "18",
                    },
                    editLoading && styles.disabledOpacity,
                  ]}
                  onPress={() => onStatusChange(s)}
                  disabled={editLoading}
                >
                  <View
                    style={[styles.statusDot, { backgroundColor: sm.color }]}
                  />
                  <Text
                    style={[
                      styles.statusOptionText,
                      isActive && { color: sm.color, fontWeight: "700" },
                    ]}
                  >
                    {sm.label}
                  </Text>
                  {isActive && (
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={sm.color}
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Notes (optional)</Text>
          {/*
           * TextInput: border color #D9D9D9 matches home's dividers.
           * editable disabled during loading to match global loading rule.
           */}
          <TextInput
            style={[styles.textArea, editLoading && styles.disabledOpacity]}
            value={editNotes}
            onChangeText={onNotesChange}
            placeholder="Any observations about this crop..."
            // #687076 matches home's cropConditionSub placeholder-like color
            placeholderTextColor="#687076"
            multiline
            numberOfLines={3}
            maxLength={500}
            editable={!editLoading}
          />
          <Text style={styles.charCount}>{editNotes.length}/500</Text>

          {editError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorBannerText}>{editError}</Text>
            </View>
          ) : null}

          {/* Primary CTA: #094A04 bg + #FFFFE7 text, pill radius 28 */}
          <TouchableOpacity
            style={[styles.primaryBtn, editLoading && styles.disabledOpacity]}
            onPress={onSave}
            disabled={editLoading}
          >
            {editLoading ? (
              <ActivityIndicator color="#FFFFE7" />
            ) : (
              <Text style={styles.primaryBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          {/* Ghost cancel: #D9D9D9 border + #687076 text matching home's ghost pattern */}
          <TouchableOpacity
            style={[styles.ghostBtn, editLoading && styles.disabledOpacity]}
            onPress={onClose}
            disabled={editLoading}
          >
            <Text style={styles.ghostBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  bottomSheet: {
    // #FFFFFF surface card matching home's card backgrounds
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(Platform.OS === "ios" ? 36 : 24),
    paddingTop: verticalScale(16),
    width: "100%",
    // Shadow matches home's scanBanner / bottomCard elevation style
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  sheetHandle: {
    width: scale(36),
    height: verticalScale(4),
    // #D9D9D9 matches home's blendBorder divider
    backgroundColor: "#D9D9D9",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: verticalScale(16),
  },
  sheetTitle: {
    fontSize: moderateScale(20),
    fontWeight: "700", // matches home's greetingText / sectionTitle weight
    color: "#11181C", // matches home's primary text color
    marginBottom: verticalScale(4),
  },
  sheetSubtitle: {
    fontSize: moderateScale(13), // matches home's subtitleText fontSize
    color: "#687076", // matches home's cropConditionSub color
    marginBottom: verticalScale(20),
  },
  fieldLabel: {
    fontSize: moderateScale(12), // matches home's quickActionText fontSize
    fontWeight: "600",
    color: "#11181C", // matches home's primary text
    marginBottom: verticalScale(8),
  },
  statusGrid: { gap: verticalScale(8), marginBottom: verticalScale(16) },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    // #D9D9D9 matches home's blendBorder / divider color
    borderColor: "#D9D9D9",
    borderRadius: moderateScale(12), // matches home's overviewCard / quickActionBtn
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    gap: scale(8),
    // Subtle shadow matching home's overviewCard
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  statusDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  statusOptionText: {
    fontSize: moderateScale(13), // matches home's cropNameText fontSize
    color: "#11181C", // matches home's primary text color
    fontWeight: "500",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#D9D9D9", // matches home's blendBorder / divider
    borderRadius: moderateScale(12), // matches home's card borderRadius pattern
    padding: moderateScale(12),
    fontSize: moderateScale(13),
    color: "#11181C", // matches home's primary text color
    textAlignVertical: "top",
    minHeight: verticalScale(80),
    marginBottom: verticalScale(4),
    // Subtle shadow consistent with home's card elevation pattern
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  charCount: {
    fontSize: moderateScale(11),
    color: "#687076", // matches home's cropConditionSub / recentScanTime color
    textAlign: "right",
    marginBottom: verticalScale(14),
  },
  primaryBtn: {
    flexDirection: "row",
    // #094A04 matches home's primary button / scan banner background
    backgroundColor: "#094A04",
    borderRadius: moderateScale(28), // pill radius matching home's scan action buttons
    paddingVertical: verticalScale(14),
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    minHeight: verticalScale(50),
    marginBottom: verticalScale(10),
  },
  primaryBtnText: {
    // #FFFFE7 cream matches home's scan banner solid button text
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
    borderColor: "#D9D9D9", // matches home's divider / blendBorder color
    minHeight: verticalScale(48),
  },
  ghostBtnText: {
    color: "#687076", // matches home's secondary text / subtitleText color
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
