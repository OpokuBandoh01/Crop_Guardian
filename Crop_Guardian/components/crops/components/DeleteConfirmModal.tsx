//components/crops/components/DeleteConfirmModal.tsx
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCropMeta, MyCrop } from "../../../app/(tabs)/my-crops";

interface DeleteConfirmModalProps {
  visible: boolean;
  deleteTarget: MyCrop | null;
  deleteLoading: boolean;
  deleteError: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  visible,
  deleteTarget,
  deleteLoading,
  deleteError,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <BlurView
        intensity={65}
        tint="dark"
        style={[styles.modalBackdrop, { justifyContent: "center" }]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
          disabled={deleteLoading}
        />
        <View style={[styles.deleteCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.deleteIconWrap, { backgroundColor: colorScheme === "light" ? "#FEE2E2" : "#2D1B1B" }]}>
            <Ionicons name="warning-outline" size={32} color="#EF4444" />
          </View>
          <Text style={[styles.deleteTitle, { color: theme.text }]}>Remove Crop?</Text>
          {deleteTarget && (
            <Text style={[styles.deleteMessage, { color: theme.icon }]}>
              This will remove{" "}
              <Text style={{ fontWeight: "700", color: theme.text }}>
                {getCropMeta(deleteTarget.cropType).label}
              </Text>{" "}
              from your tracked crops. Your scan history is preserved.
            </Text>
          )}

          {deleteError ? (
            <View style={[styles.errorBanner, { backgroundColor: colorScheme === "light" ? "#FEF2F2" : "#2D1D1D" }]}>
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorBannerText}>{deleteError}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.deleteConfirmBtn,
              { backgroundColor: theme.error },
              deleteLoading && styles.disabledOpacity,
            ]}
            onPress={onConfirm}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.deleteConfirmText}>Yes, Remove</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.ghostBtn,
              { borderColor: colorScheme === "light" ? "#D1D5DB" : "#4B5563" },
              deleteLoading && styles.disabledOpacity,
            ]}
            onPress={onClose}
            disabled={deleteLoading}
          >
            <Text style={[styles.ghostBtnText, { color: theme.icon }]}>Keep Crop</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: "center", alignItems: "center" },
  deleteCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(20),
    padding: moderateScale(24),
    width: "88%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 14,
  },
  deleteIconWrap: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(16),
  },
  deleteTitle: {
    fontSize: moderateScale(20),
    fontWeight: "800",
    color: "#111827",
    marginBottom: verticalScale(10),
  },
  deleteMessage: {
    fontSize: moderateScale(14),
    color: "#6B7280",
    textAlign: "center",
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(20),
  },
  deleteConfirmBtn: {
    backgroundColor: "#EF4444",
    borderRadius: moderateScale(28),
    paddingVertical: verticalScale(13),
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: verticalScale(48),
    marginBottom: verticalScale(10),
  },
  deleteConfirmText: {
    color: "#FFFFFF",
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
