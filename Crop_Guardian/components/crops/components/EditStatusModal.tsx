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
      <BlurView intensity={60} tint="dark" style={styles.modalBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
          disabled={editLoading}
        />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Update Crop</Text>
          {editTarget && (
            <Text style={styles.sheetSubtitle}>
              {getCropMeta(editTarget.cropType).emoji}{" "}
              {getCropMeta(editTarget.cropType).label}
            </Text>
          )}

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
          <TextInput
            style={[styles.textArea, editLoading && styles.disabledOpacity]}
            value={editNotes}
            onChangeText={onNotesChange}
            placeholder="Any observations about this crop..."
            placeholderTextColor="#9CA3AF"
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
  fieldLabel: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#374151",
    marginBottom: verticalScale(8),
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
  statusGrid: { gap: verticalScale(8), marginBottom: verticalScale(16) },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    gap: scale(8),
  },
  primaryBtnText: {
    color: "#FFFFE7",
    fontSize: moderateScale(15),
    fontWeight: "700",
  },
  statusOptionText: {
    fontSize: moderateScale(14),
    color: "#374151",
    fontWeight: "500",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    fontSize: moderateScale(14),
    color: "#111827",
    textAlignVertical: "top",
    minHeight: verticalScale(80),
    marginBottom: verticalScale(4),
  },
  charCount: {
    fontSize: moderateScale(11),
    color: "#9CA3AF",
    textAlign: "right",
    marginBottom: verticalScale(14),
  },
  statusDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
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
  ghostBtn: {
    borderRadius: moderateScale(28),
    paddingVertical: verticalScale(13),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    minHeight: verticalScale(48),
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
  ghostBtnText: {
    color: "#6B7280",
    fontSize: moderateScale(15),
    fontWeight: "600",
  },
  disabledOpacity: { opacity: 0.5 },
});
