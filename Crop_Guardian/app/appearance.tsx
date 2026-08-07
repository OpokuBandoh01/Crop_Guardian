import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemePreference, useThemeStore } from "@/stores/themeStore";

export default function AppearanceScreen() {
  const router = useRouter();
  // colorScheme here is already the resolved value (system setting
  // resolved to light/dark if the user picked "system"). It drives what
  // colors this screen itself is painted with right now.
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  // Reading the saved preference and its setter directly from the store,
  // instead of local component state, means the choice survives leaving
  // and returning to this screen, and instantly affects every other
  // screen in the app once saved.
  const themePreference = useThemeStore((state) => state.themePreference);
  const setThemePreference = useThemeStore((state) => state.setThemePreference);

  // ThemePreference is the union type ("light" | "dark" | "system")
  // imported from the store, so selectedTheme can only ever hold one of
  // those three exact strings, TypeScript will flag anything else.
  const [selectedTheme, setSelectedTheme] =
    useState<ThemePreference>(themePreference);

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    setIsSaving(true);

    // Persisting the choice happens instantly, this small delay is only
    // to give the loading state (disabled buttons, spinner) a moment to
    // be visible, matching the feel of your other "Save" flows.
    setTimeout(() => {
      setThemePreference(selectedTheme);
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }, 400);
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
          activeOpacity={0.7}
          disabled={isSaving}
        >
          <Ionicons
            name="arrow-back"
            size={moderateScale(18)}
            color={theme.primary}
          />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          Appearance
        </Text>

        <View style={styles.rightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= SUCCESS BANNER ================= */}
        {showSuccess && (
          <View style={styles.successBanner}>
            <View style={styles.successIconWrapper}>
              <Ionicons
                name="checkmark-sharp"
                size={moderateScale(15)}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.successText}>
              Theme preferences saved successfully!
            </Text>
          </View>
        )}

        {/* ================= THEME HEAD ILLUSTRATION ================= */}
        <View style={styles.illustrationHeader}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor:
                  colorScheme === "light" ? "#EBF7E9" : "#1E2C20",
              },
            ]}
          >
            <Ionicons
              name={selectedTheme === "dark" ? "moon" : "sunny"}
              size={moderateScale(32)}
              color="#094A04"
            />
          </View>
          <Text style={[styles.screenTitleText, { color: theme.text }]}>
            Choose Your Theme
          </Text>
          <Text
            style={[
              styles.screenSubtitleText,
              { color: colorScheme === "light" ? "#687076" : "#9BA1A6" },
            ]}
          >
            Personalize your viewing experience. Dark mode helps save battery
            life in fields with low light.
          </Text>
        </View>

        {/* ================= THEME PREVIEW CARD ROW ================= */}
        <View style={styles.themesRow}>
          {/* Light Theme Card Option */}
          <TouchableOpacity
            style={[
              styles.themeCard,
              { backgroundColor: theme.surface },
              selectedTheme === "light"
                ? styles.themeCardActive
                : styles.themeCardInactive,
              isSaving && styles.disabledOpacity,
            ]}
            onPress={() => setSelectedTheme("light")}
            activeOpacity={0.9}
            disabled={isSaving}
          >
            <View style={[styles.mockPhone, { backgroundColor: "#FFFFE7" }]}>
              <View style={styles.mockHeader} />
              <View style={styles.mockCard} />
              <View style={styles.mockLine} />
              <View style={[styles.mockLine, { width: "50%" }]} />
            </View>

            <View style={styles.cardInfoRow}>
              <Text style={[styles.themeLabel, { color: theme.text }]}>
                Light Mode
              </Text>
              <View
                style={[
                  styles.radioOuter,
                  selectedTheme === "light"
                    ? styles.radioOuterSelected
                    : styles.radioOuterUnselected,
                ]}
              >
                {selectedTheme === "light" && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* Dark Theme Card Option */}
          <TouchableOpacity
            style={[
              styles.themeCard,
              { backgroundColor: theme.surface },
              selectedTheme === "dark"
                ? styles.themeCardActive
                : styles.themeCardInactive,
              isSaving && styles.disabledOpacity,
            ]}
            onPress={() => setSelectedTheme("dark")}
            activeOpacity={0.9}
            disabled={isSaving}
          >
            <View style={[styles.mockPhone, { backgroundColor: "#151718" }]}>
              <View
                style={[styles.mockHeader, { backgroundColor: "#1F2937" }]}
              />
              <View style={[styles.mockCard, { backgroundColor: "#2E3D30" }]} />
              <View style={[styles.mockLine, { backgroundColor: "#4B5563" }]} />
              <View
                style={[
                  styles.mockLine,
                  { width: "50%", backgroundColor: "#4B5563" },
                ]}
              />
            </View>

            <View style={styles.cardInfoRow}>
              <Text style={[styles.themeLabel, { color: theme.text }]}>
                Dark Mode
              </Text>
              <View
                style={[
                  styles.radioOuter,
                  selectedTheme === "dark"
                    ? styles.radioOuterSelected
                    : styles.radioOuterUnselected,
                ]}
              >
                {selectedTheme === "dark" && <View style={styles.radioInner} />}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ================= OPTIONS LIST CARD ================= */}
        <View style={[styles.optionsCard, { backgroundColor: theme.surface }]}>
          {/* System Default Toggle Option */}
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setSelectedTheme("system")}
            activeOpacity={0.7}
            disabled={isSaving}
          >
            <View style={styles.optionLeft}>
              <Ionicons
                name="settings-outline"
                size={moderateScale(18)}
                color={selectedTheme === "system" ? "#094A04" : theme.icon}
              />
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>
                  Use System Settings
                </Text>
                <Text
                  style={[
                    styles.optionSub,
                    { color: colorScheme === "light" ? "#687076" : "#9BA1A6" },
                  ]}
                >
                  Automatically match your device&apos;s light or dark mode.
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.radioOuter,
                selectedTheme === "system"
                  ? styles.radioOuterSelected
                  : styles.radioOuterUnselected,
              ]}
            >
              {selectedTheme === "system" && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Save Button, disabled while saving and while nothing has changed */}
        <CustomButton
          title="Save Theme Preferences"
          loading={isSaving}
          onPress={handleSave}
          disabled={isSaving || selectedTheme === themePreference}
          style={styles.saveButton}
        />
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(40),
  },
  disabledOpacity: {
    opacity: 0.6,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2E7D32",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    borderRadius: moderateScale(10),
    marginBottom: verticalScale(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  successIconWrapper: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(8),
  },
  successText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "700",
    flex: 1,
  },
  illustrationHeader: {
    alignItems: "center",
    marginVertical: verticalScale(16),
    paddingHorizontal: scale(12),
  },
  iconCircle: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  screenTitleText: {
    fontSize: moderateScale(17),
    fontWeight: "800",
    marginBottom: verticalScale(4),
  },
  screenSubtitleText: {
    fontSize: moderateScale(11.5),
    textAlign: "center",
    lineHeight: verticalScale(16),
  },
  themesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: scale(12),
    marginBottom: verticalScale(20),
  },
  themeCard: {
    flex: 1,
    borderRadius: moderateScale(14),
    padding: scale(12),
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  themeCardActive: {
    borderColor: "#094A04",
  },
  themeCardInactive: {
    borderColor: "rgba(9, 74, 4, 0.08)",
  },
  mockPhone: {
    height: verticalScale(110),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    padding: scale(8),
    marginBottom: verticalScale(10),
    gap: verticalScale(6),
  },
  mockHeader: {
    height: verticalScale(8),
    borderRadius: moderateScale(2),
    backgroundColor: "#094A04",
    width: "60%",
  },
  mockCard: {
    height: verticalScale(44),
    borderRadius: moderateScale(4),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(9, 74, 4, 0.08)",
  },
  mockLine: {
    height: verticalScale(4),
    borderRadius: moderateScale(1),
    backgroundColor: "#D1D5DB",
    width: "80%",
  },
  cardInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  themeLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  radioOuter: {
    width: moderateScale(16),
    height: moderateScale(16),
    borderRadius: moderateScale(8),
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: "#094A04",
  },
  radioOuterUnselected: {
    borderColor: "#9CA3AF",
  },
  radioInner: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: "#094A04",
  },
  optionsCard: {
    borderRadius: moderateScale(14),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1.2,
    borderColor: "rgba(9, 74, 4, 0.06)",
    marginBottom: verticalScale(20),
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(10),
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionTextContainer: {
    marginLeft: scale(10),
    flex: 1,
  },
  optionTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    marginBottom: verticalScale(2),
  },
  optionSub: {
    fontSize: moderateScale(10.5),
    lineHeight: verticalScale(14),
  },
  saveButton: {
    marginTop: verticalScale(8),
    shadowColor: "#094A04",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
});
