// components/profile/AvatarPicker.tsx
// Wraps the full "tap avatar -> pick image -> upload to backend" flow.
// Used on both the profile screen and the personal-info screen, so the
// upload logic and loading state only exist in one place.

import { uploadAvatar } from "@/services/userApi";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { moderateScale } from "react-native-size-matters";

interface AvatarPickerProps {
  avatarUrl?: string | null;
  size?: number;
  onUploaded: (newAvatarUrl: string) => void;
  // Optional, lets the parent screen lock the picker too (e.g. while its
  // own save request is in flight), per the "disable everything while
  // loading" rule.
  disabled?: boolean;
}

export function AvatarPicker({
  avatarUrl,
  size = 70,
  onUploaded,
  disabled = false,
}: AvatarPickerProps) {
  const [uploading, setUploading] = useState(false);

  const handlePick = async () => {
    // Guard clause: do nothing if a previous upload is still running or
    // the parent screen has locked this component.
    if (uploading || disabled) return;

    // Requesting permission at the moment it is actually needed (not on
    // screen mount) is the pattern Expo recommends, it reads as more
    // trustworthy to the user than an upfront permission prompt.
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    setUploading(true);
    try {
      const res = await uploadAvatar(result.assets[0].uri);
      if (res.success) {
        onUploaded(res.avatarUrl);
      }
    } catch (err) {
      console.warn("Avatar upload failed:", err);
      // Kept silent in the UI beyond the console log, the parent screen
      // can add a toast if desired. No raw backend error surfaced here,
      // per the secure-messaging rule.
    } finally {
      setUploading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.wrapper, { width: size, height: size }]}
      onPress={handlePick}
      activeOpacity={0.9}
      disabled={uploading || disabled}
    >
      <Image
        source={
          avatarUrl
            ? { uri: avatarUrl }
            : require("@/assets/images/thefarmer.png")
        }
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
        resizeMode="cover"
      />
      <View style={styles.badge}>
        {uploading ? (
          <ActivityIndicator size="small" color="#094A04" />
        ) : (
          <Feather name="camera" size={moderateScale(12)} color="#094A04" />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "relative" },
  avatar: { borderWidth: 2, borderColor: "#FFFFFF" },
  badge: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: "#FFFFFF",
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 1.5,
    borderColor: "#094A04",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
});
