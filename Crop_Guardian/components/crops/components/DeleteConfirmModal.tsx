// components/crops/components/DeleteConfirmModal.tsx
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
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/*
       * BlurView intensity 65 + dark tint locks background.
       * justifyContent: "center" centers the confirm card on screen.
       */}
      <BlurView intensity={65} tint="dark" style={styles.modalBackdrop}>
        {/* Invisible full-screen touch target for dismissing on outside tap */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
          disabled={deleteLoading}
        />

        {/* Centered card: #FFFFFF surface matching home's dailyTipCard */}
        <View style={styles.deleteCard}>
          {/* Warning icon container: soft red bg for destructive action visual cue */}
          <View style={styles.deleteIconWrap}>
            <Ionicons name="warning-outline" size={32} color="#EF4444" />
          </View>

          {/* #11181C matches home's primary heading text color */}
          <Text style={styles.deleteTitle}>Remove Crop?</Text>

          {deleteTarget && (
            <Text style={styles.deleteMessage}>
              This will remove{" "}
              <Text style={{ fontWeight: "700" }}>
                {getCropMeta(deleteTarget.cropType).label}
              </Text>{" "}
              from your tracked crops. Your scan history is preserved.
            </Text>
          )}

          {deleteError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorBannerText}>{deleteError}</Text>
            </View>
          ) : null}

          {/* Destructive confirm button: red to signal danger, disabled during loading */}
          <TouchableOpacity
            style={[
              styles.deleteConfirmBtn,
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

          {/* Ghost cancel button: same border/color pattern as home's ghost actions */}
          <TouchableOpacity
            style={[styles.ghostBtn, deleteLoading && styles.disabledOpacity]}
            onPress={onClose}
            disabled={deleteLoading}
          >
            <Text style={styles.ghostBtnText}>Keep Crop</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteCard: {
    // #FFFFFF surface matching home's dailyTipCard / quickActionBtn cards
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(16), // matches home's overviewCard borderRadius
    padding: moderateScale(24),
    width: "88%",
    alignItems: "center",
    // Shadow matches home's bottomCard elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteIconWrap: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    // Soft red tint for the warning icon bg
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(16),
  },
  deleteTitle: {
    fontSize: moderateScale(18), // matches home's sectionTitle size range
    fontWeight: "700", // matches home's greetingText fontWeight
    color: "#11181C", // matches home's primary text color
    marginBottom: verticalScale(10),
  },
  deleteMessage: {
    fontSize: moderateScale(13), // matches home's subtitleText fontSize
    color: "#687076", // matches home's cropConditionSub color
    textAlign: "center",
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(20),
  },
  deleteConfirmBtn: {
    // Red bg for destructive action - only exception to the #094A04 primary
    backgroundColor: "#EF4444",
    borderRadius: moderateScale(28), // pill matching home's scanActionButtonSolid radius
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
    width: "100%",
    borderWidth: 1,
    borderColor: "#D9D9D9", // matches home's blendBorder / divider color
    minHeight: verticalScale(48),
  },
  ghostBtnText: {
    color: "#687076", // matches home's cropConditionSub / subtitleText color
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
    width: "100%",
  },
  errorBannerText: {
    color: "#EF4444",
    fontSize: moderateScale(13),
    flex: 1,
  },
  disabledOpacity: { opacity: 0.5 },
});
