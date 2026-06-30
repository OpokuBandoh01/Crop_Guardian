// app/(auth)/reset-password.tsx
import { useLocalSearchParams, useRouter } from "expo-router"; // UPDATED - added useLocalSearchParams
import React, { useState } from "react"; // UPDATED - added useState
import { Image, ScrollView, StyleSheet, Text, View } from "react-native"; // NO CHANGES
import { SafeAreaView } from "react-native-safe-area-context"; // NO CHANGES
import { moderateScale, scale, verticalScale } from "react-native-size-matters"; // NO CHANGES

import { AuthHeader } from "@/components/AuthHeader"; // NO CHANGES
import { CustomButton } from "@/components/CustomButton"; // NO CHANGES
import { CustomInput } from "@/components/CustomInput"; // NO CHANGES
import { Colors } from "@/constants/theme"; // NO CHANGES
import { useColorScheme } from "@/hooks/use-color-scheme"; // NO CHANGES
import { resetPassword } from "@/services/api"; // NEW ADDITION

export default function ResetPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // NEW ADDITION: read the resetToken passed forward from verify-email.tsx
  const { resetToken } = useLocalSearchParams<{ resetToken: string }>();

  // NEW ADDITION: controlled state for both password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // NEW ADDITION: loading + error state, same pattern as other screens
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // NEW ADDITION: handles the "Continue" press
  const handleContinue = async () => {
    setErrorMessage("");

    // Client-side validation before hitting the network
    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!resetToken) {
      // Defensive check: guards against this screen being opened
      // directly without going through the OTP step first.
      setErrorMessage("Reset session missing. Please start over.");
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(resetToken, newPassword);
      router.replace("/password-success");
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message ||
          "Failed to reset password. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Reusable Auth Header (No Back Button) */}
        <AuthHeader title="CropGuardian" showBackButton={false} />

        {/* App Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/icons/leaflogoicon.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.text }]}>
          Reset Password
        </Text>

        {/* NEW ADDITION: inline error banner */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Form Fields */}
        <View style={styles.formContainer}>
          <CustomInput
            placeholder="Password"
            leftIcon="lock-closed-outline"
            isPassword
            value={newPassword} // NEW ADDITION - controlled input
            onChangeText={setNewPassword} // NEW ADDITION - controlled input
            editable={!isLoading} // NEW ADDITION - disable while loading
          />

          <CustomInput
            placeholder="Confirm password"
            leftIcon="lock-closed-outline"
            isPassword
            value={confirmPassword} // NEW ADDITION - controlled input
            onChangeText={setConfirmPassword} // NEW ADDITION - controlled input
            editable={!isLoading} // NEW ADDITION - disable while loading
          />

          <CustomButton
            title="Continue"
            onPress={handleContinue} // UPDATED - was inline router.replace, now calls resetPassword first
            loading={isLoading} // NEW ADDITION
            disabled={isLoading} // NEW ADDITION
          />

          <CustomButton
            title="Cancel"
            variant="outline"
            onPress={() => router.replace("/login")}
            disabled={isLoading} // NEW ADDITION - prevent navigating away mid-submit
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(40),
  },
  logoContainer: {
    alignItems: "center",
    marginTop: verticalScale(20),
    marginBottom: verticalScale(24),
  },
  logoImage: {
    width: moderateScale(80),
    height: moderateScale(80),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: "600",
    textAlign: "center",
    marginBottom: verticalScale(40),
  },
  formContainer: {
    marginTop: verticalScale(10),
  },
  // NEW ADDITION: error banner styles, matches the pattern used in other auth screens
  errorBanner: {
    backgroundColor: "#C62828",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    borderRadius: moderateScale(10),
    marginBottom: verticalScale(16),
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
});
