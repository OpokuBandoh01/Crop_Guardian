// components/crops/ConfirmDeleteModal.tsx
// Matches the same backdrop-blur, locked-background confirm pattern
// already used for logout on the profile screen.

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
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

interface ConfirmDeleteModalProps {
  visible: boolean;
  cropLabel: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({
  visible,
  cropLabel,
  deleting,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const backdropBgColor =
    colorScheme === "light"
      ? "rgba(255, 255, 255, 0.65)"
      : "rgba(0, 0, 0, 0.75)";

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={() => {
        if (!deleting) onCancel();
      }}
    >
      <View style={[styles.backdrop, { backgroundColor: backdropBgColor }]}>
        <BlurView
          style={StyleSheet.absoluteFill}
          intensity={100}
          tint={colorScheme === "light" ? "light" : "dark"}
        />

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            Remove {cropLabel}?
          </Text>
          <Text style={styles.description}>
            This removes it from your tracked crops list. Past scan history for
            this crop is kept and is not affected.
          </Text>

          <View style={styles.divider} />

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={deleting}
            >
              <Text
                style={[
                  styles.cancelText,
                  { color: theme.text, opacity: deleting ? 0.5 : 1 },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <View style={styles.verticalDivider} />
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={onConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Text style={styles.confirmText}>Remove</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(32),
  },
  card: {
    width: "100%",
    borderRadius: moderateScale(14),
    paddingTop: verticalScale(20),
  },
  title: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(10),
  },
  description: {
    fontSize: moderateScale(12),
    textAlign: "center",
    lineHeight: verticalScale(16),
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(20),
    color: "#687076",
  },
  divider: { height: 1, width: "100%", backgroundColor: "#E5E7EB" },
  actionsRow: {
    flexDirection: "row",
    height: verticalScale(46),
    alignItems: "center",
  },
  cancelButton: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { fontSize: moderateScale(14), fontWeight: "600" },
  verticalDivider: { width: 1, height: "100%", backgroundColor: "#E5E7EB" },
  confirmButton: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#EF4444",
  },
});
