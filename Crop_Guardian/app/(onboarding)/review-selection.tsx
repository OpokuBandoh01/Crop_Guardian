// app/(onboarding)/review-selection.tsx
// Fixed: Zustand hooks are now called at the top level of the component.
// Previously hooks were called inside a useEffect callback which violates
// the React Rules of Hooks and causes incorrect behaviour in React Native.

import { useOnboardingStore } from "@/stores/onboardingStore";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReviewSelectionScreen() {
  // ✅ FIXED: read store values at the TOP LEVEL — not inside useEffect.
  // Zustand selectors are just hooks under the hood and must follow React's
  // Rules of Hooks (called at top level, unconditionally, in the same order every render).
  //
  // selectedRole is a plain string (e.g. "farmer") — no JSON.parse needed.
  // selectedCrops is already a string[] from the store — no JSON.parse needed.
  const selectedRole = useOnboardingStore((state) => state.selectedRole);
  const selectedCrops = useOnboardingStore((state) => state.selectedCrops);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Review Your Preferences</Text>

        {/* Role summary card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Selected Role</Text>
          <Text style={styles.roleText}>
            {/* Capitalise first letter for display friendliness */}
            {selectedRole
              ? selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)
              : "Not selected"}
          </Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push("/(onboarding)/user-role")}
          >
            <Text style={styles.editButtonText}>Edit Role</Text>
          </TouchableOpacity>
        </View>

        {/* Crops summary card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Selected Crops</Text>

          {selectedCrops.length === 0 ? (
            <Text style={styles.emptyText}>No crops selected yet</Text>
          ) : (
            selectedCrops.map((crop) => (
              <Text key={crop} style={styles.cropItem}>
                {/* Capitalise for readability e.g. "MAIZE" -> "Maize" */}
                {"\u2713"}{" "}
                {crop.charAt(0).toUpperCase() + crop.slice(1).toLowerCase()}
              </Text>
            ))
          )}

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push("/(onboarding)/crop-selection")}
          >
            <Text style={styles.editButtonText}>Edit Crops</Text>
          </TouchableOpacity>
        </View>

        {/* Authentication entry point */}
        <View style={styles.authActions}>
          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => router.push("/(auth)/signup")}
          >
            <Text style={styles.signupButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAF5",
  },
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
    color: "#1B4332",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    // Subtle shadow for card depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1B4332",
  },
  roleText: {
    fontSize: 16,
    marginBottom: 16,
    color: "#374151",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 12,
  },
  cropItem: {
    fontSize: 16,
    marginBottom: 8,
    color: "#374151",
  },
  editButton: {
    marginTop: 12,
  },
  editButtonText: {
    color: "#2D6A4F",
    fontWeight: "600",
    fontSize: 14,
  },
  authActions: {
    marginTop: 10,
    gap: 16,
  },
  loginButton: {
    height: 55,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2D6A4F",
  },
  loginButtonText: {
    color: "#2D6A4F",
    fontWeight: "600",
    fontSize: 16,
  },
  signupButton: {
    height: 55,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2D6A4F",
  },
  signupButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
