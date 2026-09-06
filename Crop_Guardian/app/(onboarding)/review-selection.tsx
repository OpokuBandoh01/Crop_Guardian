// app/(onboarding)/review-selection.tsx

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
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
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useOnboardingStore } from "@/stores/onboardingStore";

export default function ReviewSelectionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // NO CHANGES: Reading from onboarding store at the top level (Rules of Hooks)
  const selectedRole = useOnboardingStore((state) => state.selectedRole);
  const selectedCrops = useOnboardingStore((state) => state.selectedCrops);

  // NEW ADDITION: Format role for display (e.g. "BEGINNER" → "Beginner")
  const displayRole = selectedRole
    ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1).toLowerCase()
    : "Not selected";

  // NEW ADDITION: Format crops as a readable comma-separated list
  const displayCrops =
    selectedCrops.length > 0
      ? selectedCrops
          .map(
            (crop) =>
              crop.charAt(0).toUpperCase() + crop.slice(1).toLowerCase(),
          )
          .join(", ")
      : "No crops selected";

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      {/* UPDATED: Using AuthHeader for consistent back button across onboarding */}
      <View style={styles.headerWrapper}>
        <AuthHeader showBackButton={true} showLoginLink={false} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* NEW ADDITION: Title + Subtitle section */}
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: theme.text }]}>
            Review Your Preferences
          </Text>
          <Text style={[styles.subtitle, { color: theme.text }]}>
            Please review your selections before creating your account
          </Text>
        </View>

        {/* NEW ADDITION: Selected Role Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.inputBorder },
          ]}
        >
          <View style={styles.cardLeft}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: theme.logoBackground },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={moderateScale(18)}
                color={theme.primary}
              />
            </View>

            <View style={styles.cardTextContainer}>
              <Text style={[styles.cardLabel, { color: theme.icon }]}>
                Selected Role
              </Text>
              <Text style={[styles.cardValue, { color: theme.text }]}>
                {displayRole}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push("/(onboarding)/user-role")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="create-outline"
              size={moderateScale(14)}
              color={theme.primary}
            />
            <Text style={[styles.editButtonText, { color: theme.primary }]}>
              Edit Role
            </Text>
          </TouchableOpacity>
        </View>

        {/* NEW ADDITION: Selected Crops Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.inputBorder },
          ]}
        >
          <View style={styles.cardLeft}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: theme.logoBackground },
              ]}
            >
              <Ionicons
                name="leaf-outline"
                size={moderateScale(18)}
                color={theme.primary}
              />
            </View>

            <View style={styles.cardTextContainer}>
              <Text style={[styles.cardLabel, { color: theme.icon }]}>
                Selected Crops
              </Text>
              <Text style={[styles.cardValue, { color: theme.text }]}>
                {displayCrops}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push("/(onboarding)/crop-selection")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="create-outline"
              size={moderateScale(14)}
              color={theme.primary}
            />
            <Text style={[styles.editButtonText, { color: theme.primary }]}>
              Edit Crops
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* NEW ADDITION: Create Account button at the bottom */}
      <View style={styles.footer}>
        <CustomButton
          title="Create Account"
          onPress={() => router.push("/(auth)/signup")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerWrapper: {
    paddingHorizontal: scale(20),
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(40),
  },
  headerTextContainer: {
    alignItems: "center",
    marginBottom: verticalScale(32),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: "700",
    marginBottom: verticalScale(8),
    textAlign: "center",
  },
  subtitle: {
    fontSize: moderateScale(14),
    fontWeight: "400",
    textAlign: "center",
    opacity: 0.7,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(16),
    borderWidth: 1,
    // Subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: scale(12),
  },
  iconCircle: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: "center",
    alignItems: "center",
  },
  cardTextContainer: {
    flex: 1,
  },
  cardLabel: {
    fontSize: moderateScale(12),
    fontWeight: "500",
    marginBottom: verticalScale(2),
  },
  cardValue: {
    fontSize: moderateScale(16),
    fontWeight: "600",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(8),
  },
  editButtonText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(20),
  },
});
