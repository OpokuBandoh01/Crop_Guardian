// app/(onboarding)/user-role.tsx
// Fixed: useOnboardingStore is now called at the component top level (React hook rule).
// Previously setRole was called INSIDE handleNext which violates the Rules of Hooks
// and causes a crash in React Native.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
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

// Role Options — kept as a constant outside the component so it is not
// recreated on every render (micro-optimisation, good habit in React Native).
const ROLES = [
  {
    id: "farmer",
    label: "Farmer",
    icon: require("@/assets/icons/farmericon.png"),
  },
  {
    id: "beginner",
    label: "Beginner",
    icon: require("@/assets/icons/beginnericon.png"),
  },
  {
    id: "gardener",
    label: "Gardener",
    icon: require("@/assets/icons/gardenericon.png"),
  },
  { id: "student", label: "Student", isIonicon: true, iconName: "school" },
  {
    id: "other",
    label: "Other / Just exploring",
    isIonicon: true,
    iconName: "ellipsis-horizontal-circle-outline",
  },
] as const;

export default function UserRoleScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // Local state tracks which role button is highlighted in the UI
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // ✅ FIXED: hook called at the TOP LEVEL of the component, not inside a callback.
  // React's Rules of Hooks require hooks to be called unconditionally at the top.
  // Calling a hook inside handleNext (an event handler) would break the hook order
  // across renders and cause a React invariant violation.
  const setRole = useOnboardingStore((state) => state.setRole);

  const handleNext = () => {
    if (!selectedRole) return;

    // Now we just call the already-retrieved action — no hook call here.
    setRole(selectedRole.toUpperCase()); // Store uppercase to match backend enum exactly
    router.push("/crop-selection");
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <View style={styles.headerWrapper}>
        <AuthHeader />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: theme.text }]}>
            Who are you?
          </Text>
          <Text style={[styles.subtitle, { color: theme.text }]}>
            This helps us to serve you better
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {ROLES.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.optionButton,
                  { borderColor: theme.primary },
                  isSelected && {
                    backgroundColor: theme.logoBackground,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setSelectedRole(role.id)}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  {role.isIonicon ? (
                    <Ionicons
                      // "as any" is needed here because TypeScript cannot infer
                      // the exact union of all valid Ionicons name strings at compile time.
                      name={role.iconName as any}
                      size={moderateScale(24)}
                      color={theme.text}
                    />
                  ) : (
                    <Image
                      source={role.icon}
                      style={styles.customIcon}
                      resizeMode="contain"
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.optionLabel,
                    { color: theme.text },
                    isSelected && { fontWeight: "600" },
                  ]}
                >
                  {role.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {/* Disable the button when no role is selected so the user cannot proceed */}
        <CustomButton
          title="Next"
          onPress={handleNext}
          disabled={!selectedRole}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerWrapper: { paddingHorizontal: scale(20) },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(40),
  },
  headerTextContainer: {
    alignItems: "center",
    marginTop: verticalScale(10),
    marginBottom: verticalScale(40),
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: "700",
    marginBottom: verticalScale(16),
  },
  subtitle: { fontSize: moderateScale(16), fontWeight: "400" },
  optionsContainer: { gap: verticalScale(20) },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(18),
    paddingHorizontal: scale(20),
    borderWidth: 1,
    borderRadius: moderateScale(8),
  },
  iconContainer: {
    width: moderateScale(30),
    alignItems: "center",
    marginRight: scale(12),
  },
  customIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
  },
  optionLabel: { fontSize: moderateScale(16) },
  footer: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(20),
  },
});
