// app/(auth)/verify-email.tsx
// NOTE: filename kept as verify-email.tsx to avoid touching routing
// elsewhere, but this screen now handles phone-based OTP verification.
import { Ionicons } from "@expo/vector-icons"; // NO CHANGES
import { useLocalSearchParams, useRouter } from "expo-router"; // UPDATED - added useLocalSearchParams
import React, { useState } from "react"; // UPDATED - added useState
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"; // NO CHANGES
import { SafeAreaView } from "react-native-safe-area-context"; // NO CHANGES
import { moderateScale, scale, verticalScale } from "react-native-size-matters"; // NO CHANGES

import { AuthHeader } from "@/components/AuthHeader"; // NO CHANGES
import { CustomButton } from "@/components/CustomButton"; // NO CHANGES
import { OTPInput } from "@/components/OTPInput"; // NO CHANGES
import { Colors } from "@/constants/theme"; // NO CHANGES
import { useColorScheme } from "@/hooks/use-color-scheme"; // NO CHANGES
import { forgotPassword, verifyResetOtp } from "@/services/api"; // NEW ADDITION

export default function VerifyEmailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // NEW ADDITION: read the phoneNumber passed forward from forgot-password.tsx
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();

  // NEW ADDITION: holds the 6-digit code as the user types it
  const [otpCode, setOtpCode] = useState("");

  // NEW ADDITION: separate loading flags for verify vs resend,
  // so tapping "Resend" doesn't show a spinner on the main button.
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // NEW ADDITION: inline error + success messages
  const [errorMessage, setErrorMessage] = useState("");
  const [resendMessage, setResendMessage] = useState("");

  // Any loading state disables the whole form, per project rule
  const isBusy = isVerifying || isResending;

  // NEW ADDITION: called by OTPInput once all 6 digits are filled
  const handleCodeFilled = (code: string) => {
    setOtpCode(code);
    setErrorMessage("");
  };

  // NEW ADDITION: verify button handler
  const handleVerify = async () => {
    setErrorMessage("");

    if (otpCode.length !== 6) {
      setErrorMessage("Please enter the 6-digit code.");
      return;
    }

    if (!phoneNumber) {
      // Defensive check: shouldn't happen in normal flow, but guards
      // against this screen being opened directly without params.
      setErrorMessage("Missing phone number. Please go back and try again.");
      return;
    }

    setIsVerifying(true);

    try {
      const result = await verifyResetOtp(phoneNumber, otpCode);

      // Pass the resetToken forward to reset-password.tsx via params.
      router.push({
        pathname: "/reset-password",
        params: { resetToken: result.resetToken },
      });
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message || "Invalid or expired OTP.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // NEW ADDITION: resend code handler, reuses the forgotPassword API call
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

        {/* NEW ADDITION: inline error banner */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* NEW ADDITION: inline resend confirmation banner */}
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
            loading={isVerifying} // NEW ADDITION
            disabled={isBusy} // NEW ADDITION - disabled during verify AND resend
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
                { color: isBusy ? theme.icon : theme.primary }, // NEW ADDITION - visually dims the link while disabled
              ]}
            >
              {isResending ? "Sending..." : "Resend code"}{" "}
              {/* NEW ADDITION - shows sending state */}
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
  // NEW ADDITION: banner styles, matching change-password.tsx's pattern
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
