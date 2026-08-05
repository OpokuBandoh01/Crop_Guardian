// components/ui/BlurModal.tsx
// Generic reusable modal used anywhere in the app that needs a blurred
// backdrop with the background locked behind it. Built once here so every
// future modal (tip details, post detail, comment thread, etc) behaves
// identically instead of each screen rolling its own.

import { useColorScheme } from "@/hooks/use-color-scheme";
import { BlurView } from "expo-blur";
import React from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    View,
    type ViewStyle,
} from "react-native";
import { moderateScale, scale } from "react-native-size-matters";

// TypeScript: `React.PropsWithChildren<{...}>` adds a typed `children`
// prop (React.ReactNode) to whatever shape we pass in, so we don't have
// to declare `children` ourselves in the object below.
type BlurModalProps = React.PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  contentStyle?: ViewStyle;
  // When false, tapping the blurred backdrop will NOT close the modal.
  // Defaults to true, matching common modal UX.
  closeOnBackdropPress?: boolean;
}>;

export default function BlurModal({
  visible,
  onClose,
  children,
  contentStyle,
  closeOnBackdropPress = true,
}: BlurModalProps) {
  const colorScheme = useColorScheme() ?? "light";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose} // handles Android hardware back button
    >
      {/*
        The BlurView + Pressable below covers the ENTIRE screen. Because
        React Native's Modal renders above everything else and this
        backdrop captures all touches, nothing behind it (home screen
        buttons, form fields, etc) is reachable while the modal is open.
        This is what "locks the background" in practice.
      */}
      <View style={StyleSheet.absoluteFill}>
        <BlurView
          intensity={40}
          tint={colorScheme === "dark" ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeOnBackdropPress ? onClose : undefined}
            accessibilityLabel="Close modal"
          />
        </BlurView>

        {/*
          This wrapper sits on top of the backdrop above (rendered after,
          so it's drawn on a higher layer). `pointerEvents="box-none"` means
          empty space in this wrapper still lets touches fall through to
          the backdrop, but the actual content box below still receives
          its own touches normally.
        */}
        <View style={styles.centerWrapper} pointerEvents="box-none">
          <View style={[styles.content, contentStyle]}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centerWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(20),
  },
  content: {
    width: "100%",
    borderRadius: moderateScale(16),
    backgroundColor: "#FFFFFF",
    padding: scale(20),
    maxHeight: "80%",
  },
});
