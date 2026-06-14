// this file is no longer relevant. ignore it

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

import { CustomButton } from "@/components/CustomButton";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function LogoutScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      setIsLoggingOut(false);
      // Clear sessions and redirect to login
      router.replace("/login");
    }, 1500);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      {/* ================= HEADER SECTION ================= */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: theme.primary }]}
          onPress={() => router.back()}
          disabled={isLoggingOut}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={moderateScale(18)}
            color={theme.primary}
          />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          Log Out
        </Text>

        <View style={styles.rightSpacer} />
      </View>

      <View style={styles.content}>
        {/* Large stylized exit icon */}
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: colorScheme === "light" ? "#FEE2E2" : "#2D1F21",
            },
          ]}
        >
          <Ionicons name="log-out" size={moderateScale(40)} color="#EF4444" />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>
          Logout Confirmation
        </Text>

        <Text
          style={[
            styles.description,
            { color: colorScheme === "light" ? "#4B5563" : "#9BA1A6" },
          ]}
        >
          Are you sure you want to log out of your account? You will need to
          enter your credentials again to manage your crops, run diagnostics,
          and check localized weather forecasts.
        </Text>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <CustomButton
            title="Yes, Log Out"
            loading={isLoggingOut}
            onPress={handleLogout}
            style={styles.logoutButton}
          />

          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: theme.primary }]}
            onPress={() => router.back()}
            disabled={isLoggingOut}
            activeOpacity={0.8}
          >
            <Text style={[styles.cancelButtonText, { color: theme.primary }]}>
              Cancel & Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
  },
  backButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: moderateScale(17),
    fontWeight: "700",
    textAlign: "center",
  },
  rightSpacer: {
    width: moderateScale(32),
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(24),
    paddingBottom: verticalScale(40),
  },
  iconCircle: {
    width: moderateScale(90),
    height: moderateScale(90),
    borderRadius: moderateScale(45),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(20),
    // Soft shadow
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    marginBottom: verticalScale(10),
    textAlign: "center",
  },
  description: {
    fontSize: moderateScale(12.5),
    textAlign: "center",
    lineHeight: verticalScale(18),
    marginBottom: verticalScale(30),
  },
  buttonsContainer: {
    width: "100%",
    gap: verticalScale(12),
  },
  logoutButton: {
    backgroundColor: "#EF4444",
    width: "100%",
    marginBottom: 0,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cancelButton: {
    width: "100%",
    borderWidth: 1.2,
    borderRadius: moderateScale(8),
    height: verticalScale(50),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  cancelButtonText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
});
