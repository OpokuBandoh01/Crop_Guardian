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

import { CustomButton } from "@/components/CustomButton";
import { OTPInput } from "@/components/OTPInput";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { forgotPassword, verifyResetOtp } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const { phoneNumber, origin } = useLocalSearchParams<{
    phoneNumber: string;
    origin?: string;
  }>();
  // "signup" means the user just registered and is already authenticated,
  // but isEmailVerified is still false. Tabs will redirect here until verified.
  const isSignupFlow = origin === "signup";

  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);
  const confirmPendingRegistration = useAuthStore(
    (state) => state.confirmPendingRegistration,
  );

  const clearPendingRegistration = useAuthStore(
    (state) => state.clearPendingRegistration,
  );

  const [otpCode, setOtpCode] = useState("");

  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [resendMessage, setResendMessage] = useState("");

  // Single busy flag: disable every interactive control while either
  // verify or resend is in flight (app-wide loading rule).
  const isBusy = isVerifying || isResending;

  const handleCodeFilled = (code: string) => {
    setOtpCode(code);
    setErrorMessage("");
  };

  const handleExit = () => {
    if (isBusy) return; // NO CHANGES

    if (isSignupFlow) {
      // UPDATED: clear pending register state, then go to login
      clearPendingRegistration();
      router.replace("/(auth)/login");
      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(auth)/login");
    }
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
        confirmPendingRegistration();
        router.replace("/(tabs)");
      } else {
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

  // Resend code handler, reuses the forgotPassword API call
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
        {/* Back / exit is always available so the user is never trapped.
            Disabled only while a network action is running. */}
        {/* <AuthHeader
          title="CropGuardian"
          // showBackButton={true}
          disabled={isBusy}
          // onBackPress={handleExit}
        /> */}

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
            />
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.text }]}>
          Verify Your Phone Number
        </Text>
        <Text style={[styles.subtitle, { color: theme.icon }]}>
          Enter the 6-digit code sent to {phoneNumber || "your phone"}{" "}
        </Text>

        {/* Inline error banner */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Inline resend confirmation banner */}
        {resendMessage ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>{resendMessage}</Text>
          </View>
        ) : null}

        {/* Form Fields */}
        <View style={styles.formContainer}>
          <OTPInput onCodeFilled={handleCodeFilled} editable={!isBusy} />
          <CustomButton
            title="Continue"
            onPress={handleVerify}
            loading={isVerifying}
            disabled={isBusy}
          />
        </View>

        {/* Footer Link: resend */}
        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: theme.text }]}>
            {"Didn't you receive any code? "}
          </Text>
          <TouchableOpacity onPress={handleResend} disabled={isBusy}>
            <Text
              style={[
                styles.footerLink,
                { color: isBusy ? theme.icon : theme.primary },
              ]}
            >
              {isResending ? "Sending..." : "Resend code"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Secondary exit: clearer copy for users who feel stuck.
            Same handler as the header back button. */}
        <TouchableOpacity
          onPress={handleExit}
          disabled={isBusy}
          style={styles.exitLink}
          accessibilityRole="button"
          accessibilityLabel={isSignupFlow ? "Go back to login" : "Go back"}
        >
          <Text
            style={[
              styles.exitLinkText,
              { color: isBusy ? theme.icon : theme.primary },
            ]}
          >
            {isSignupFlow ? "Wrong number? Back to Login" : "Go back"}
          </Text>
        </TouchableOpacity>
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
  exitLink: {
    marginTop: verticalScale(24),
    alignItems: "center",
    paddingVertical: verticalScale(8),
  },
  exitLinkText: {
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
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
