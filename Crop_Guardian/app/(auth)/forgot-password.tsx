// app/(auth)/forgot-password.tsx
import React, { useState } from "react"; // UPDATED - added useState import
import { Image, ScrollView, StyleSheet, Text, View } from "react-native"; // NO CHANGES
import { SafeAreaView } from "react-native-safe-area-context"; // NO CHANGES
import { moderateScale, scale, verticalScale } from "react-native-size-matters"; // NO CHANGES

import { useRouter } from "expo-router"; // NO CHANGES

import { AuthHeader } from "@/components/AuthHeader"; // NO CHANGES
import { CustomButton } from "@/components/CustomButton"; // NO CHANGES
import { CustomInput } from "@/components/CustomInput"; // NO CHANGES
import { Colors } from "@/constants/theme"; // NO CHANGES
import { useColorScheme } from "@/hooks/use-color-scheme"; // NO CHANGES
import { forgotPassword } from "@/services/api"; // NEW ADDITION - the API call we just added

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // NEW ADDITION: local form state for the phone number field.
  // Plain useState is enough here, this screen doesn't need a
  // global store since the value only needs to live for this flow.
  const [phoneNumber, setPhoneNumber] = useState("");

  // NEW ADDITION: tracks whether the API call is in flight, so we
  // can disable the form and show a loading spinner on the button.
  const [isLoading, setIsLoading] = useState(false);

  // NEW ADDITION: holds an error message to show inline, instead
  // of a native Alert, matching the banner pattern used elsewhere.
  const [errorMessage, setErrorMessage] = useState("");

  // NEW ADDITION: handles the "Submit Now" press.
  const handleSubmit = async () => {
    setErrorMessage("");

    // Basic client-side check before hitting the network at all.
    if (!phoneNumber.trim()) {
      setErrorMessage("Please enter your phone number.");
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword(phoneNumber.trim());

      // Move to the OTP screen, passing the phone number forward
      // via route params so the next screen knows who to verify.
      router.push({
        pathname: "/verify-email",
        params: { phoneNumber: phoneNumber.trim() },
      });
    } catch (error: any) {
      // Show the backend's message if present, otherwise a safe fallback.
      setErrorMessage(
        error?.response?.data?.message ||
          "Something went wrong. Please try again.",
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
        {/* Reusable Auth Header */}
        <AuthHeader
          title="CropGuardian"
          showBackButton={false}
          showLoginLink={true}
        />

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
          Forgot Your Password{"\n"}and Continue
        </Text>

        {/* NEW ADDITION: inline error banner, only renders when there's an error */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Form Fields */}
        <View style={styles.formContainer}>
          <CustomInput
            placeholder="Enter your phone number"
            leftIcon="call-outline" // UPDATED - was "mail-outline", now phone icon
            keyboardType="phone-pad" // UPDATED - was "email-address"
            autoCapitalize="none"
            value={phoneNumber} // NEW ADDITION - controlled input
            onChangeText={setPhoneNumber} // NEW ADDITION - controlled input
            editable={!isLoading} // NEW ADDITION - disable field while loading
          />

          <CustomButton
            title="Submit Now"
            onPress={handleSubmit} // UPDATED - was inline router.push, now calls the API first
            loading={isLoading} // NEW ADDITION - shows spinner via CustomButton's built-in loading prop
            disabled={isLoading} // NEW ADDITION - prevents double taps while loading
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
    marginTop: verticalScale(40),
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
    lineHeight: moderateScale(32),
  },
  formContainer: {
    marginTop: verticalScale(10),
  },
  // NEW ADDITION: error banner styles, matches the red banner
  // pattern already used in change-password.tsx
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
