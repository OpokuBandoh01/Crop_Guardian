// app/(auth)/verify-email.tsx
// NOTE: filename kept as verify-email.tsx to avoid touching routing
// elsewhere, but this screen now handles phone-based OTP verification.
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

import { AuthHeader } from "@/components/AuthHeader";
import { CustomButton } from "@/components/CustomButton";
import { OTPInput } from "@/components/OTPInput";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { forgotPassword, verifyResetOtp } from "@/services/api"; //
import { useAuthStore } from "@/stores/authStore";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const { phoneNumber, origin } = useLocalSearchParams<{
    phoneNumber: string;
    origin?: string;
  }>();
  const isSignupFlow = origin === "signup";

  const updateUser = useAuthStore((state) => state.updateUser);

  const [otpCode, setOtpCode] = useState("");

  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [resendMessage, setResendMessage] = useState("");

  const isBusy = isVerifying || isResending;

  const handleCodeFilled = (code: string) => {
    setOtpCode(code);
    setErrorMessage("");
  };

  const handleVerify = async () => {
    setErrorMessage("");

    if (otpCode.length !== 6) {
      setErrorMessage("Please enter the 6-digit code.");
      return;
    }

    if (!phoneNumber) {
      setErrorMessage("Missing phone number. Please go back and try again.");
      return;
    }

    setIsVerifying(true);

    try {
      const result = await verifyResetOtp(phoneNumber, otpCode);

      if (isSignupFlow) {
        // Phone is verified, the backend already flipped isEmailVerified
        // to true in the database. Mirror that in the local store so the
        // (tabs) guard opens up immediately, then send the user into the app.
        updateUser({ isEmailVerified: true });
        router.replace("/(tabs)");
      } else {
        // Original forgot-password flow: continue to the reset-password
        // screen with the short-lived resetToken.
        router.push({
          pathname: "/reset-password",
          params: { resetToken: result.resetToken },
        });
      }
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message || "Invalid or expired OTP.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // : resend code handler, reuses the forgotPassword API call
  const handleResend = async () => {
    if (!phoneNumber || isBusy) return;

    setResendMessage("");
    setErrorMessage("");
    setIsResending(true);

    try {
      await forgotPassword(phoneNumber);
      setResendMessage("A new code has been sent.");
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message || "Failed to resend code.",
      );
    } finally {
      setIsResending(false);
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

        {/* Logo Placeholder */}
        <View style={styles.logoContainer}>
          <View
            style={[
              styles.logoBackground,
              { backgroundColor: theme.logoBackground },
            ]}
          >
            <Ionicons
              name="chatbox-ellipses-outline"
              size={moderateScale(32)}
              color={theme.primary}
            />{" "}
            {/* UPDATED - icon changed from mail to message/SMS */}
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.text }]}>
          Verify Your Phone Number {/* UPDATED - was "Verify Your Email" */}
        </Text>
        <Text style={[styles.subtitle, { color: theme.icon }]}>
          Enter the 6-digit code sent to {phoneNumber || "your phone"}{" "}
          {/* UPDATED - shows the phone number, was generic email text */}
        </Text>

        {/* : inline error banner */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* : inline resend confirmation banner */}
        {resendMessage ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>{resendMessage}</Text>
          </View>
        ) : null}

        {/* Form Fields */}
        <View style={styles.formContainer}>
          <OTPInput onCodeFilled={handleCodeFilled} editable={!isBusy} />{" "}
          {/* UPDATED - wired to state, disabled while busy */}
          <CustomButton
            title="Continue"
            onPress={handleVerify} // UPDATED - was inline router.push, now calls verifyResetOtp first
            loading={isVerifying} //
            disabled={isBusy} //  - disabled during verify AND resend
          />
        </View>

        {/* Footer Link */}
        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: theme.text }]}>
            {"Didn't you receive any code? "}
          </Text>
          <TouchableOpacity onPress={handleResend} disabled={isBusy}>
            {" "}
            {/* UPDATED - wired to handleResend, disabled while busy */}
            <Text
              style={[
                styles.footerLink,
                { color: isBusy ? theme.icon : theme.primary }, //  - visually dims the link while disabled
              ]}
            >
              {isResending ? "Sending..." : "Resend code"}{" "}
              {/*  - shows sending state */}
            </Text>
          </TouchableOpacity>
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
  logoBackground: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(16),
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: "600",
    textAlign: "center",
    marginBottom: verticalScale(8),
  },
  subtitle: {
    fontSize: moderateScale(14),
    textAlign: "center",
    marginBottom: verticalScale(40),
  },
  formContainer: {
    marginTop: verticalScale(10),
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: verticalScale(30),
  },
  footerText: {
    fontSize: moderateScale(14),
    fontWeight: "500",
  },
  footerLink: {
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
  // : banner styles, matching change-password.tsx's pattern
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
  successBanner: {
    backgroundColor: "#2E7D32",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    borderRadius: moderateScale(10),
    marginBottom: verticalScale(16),
  },
  successText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
});
