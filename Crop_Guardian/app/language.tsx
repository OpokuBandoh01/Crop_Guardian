// app/language.tsx
import { Ionicons } from "@expo/vector-icons"; // NO CHANGES
import { useRouter } from "expo-router"; // NO CHANGES
import React, { useEffect, useState } from "react"; // UPDATED: added useEffect to sync selected language when the authStore user changes (e.g. after profile refresh)
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"; // UPDATED: removed TextInput import since the search bar was deleted (only 2 languages exist now, search added friction not value)
import { SafeAreaView } from "react-native-safe-area-context"; // NO CHANGES
import { moderateScale, scale, verticalScale } from "react-native-size-matters"; // NO CHANGES

import { CustomButton } from "@/components/CustomButton"; // NO CHANGES
import { Colors } from "@/constants/theme"; // NO CHANGES
import { useColorScheme } from "@/hooks/use-color-scheme"; // NO CHANGES

// NEW ADDITION: bring in the real API client so this screen can call the actual backend
// instead of the previous fake setTimeout save.
import API from "@/services/api";

// NEW ADDITION: bring in the auth store so we can read the user's currently saved
// language on mount, and write the new language back into the store after a
// successful save (so the rest of the app, e.g. Profile screen, updates immediately).
import { useAuthStore } from "@/stores/authStore";

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  // UPDATED: removed `isRegional` since we no longer group languages into
  // "Regional" vs "International" sections. The backend only supports 2
  // languages total, so grouping/searching no longer makes sense.
}

// UPDATED: LANGUAGES list now contains ONLY the two languages the backend
// actually supports (`en`, `tw`), per Section 4 (Enum Reference) of the API
// docs: Language values are strictly "en" and "tw". Sending anything else
// returns a 400 "Language must be either 'en' (English) or 'tw' (Twi)".
const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "tw", name: "Twi", nativeName: "Akan (Twi)", flag: "🇬🇭" },
];

export default function LanguageScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // NEW ADDITION: pull the current user and the updateUser action from the
  // auth store. `user` gives us the currently saved language to preselect,
  // `updateUser` lets us patch the store after a successful save without
  // needing a full re-login or a separate /me refetch.
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  // UPDATED: searchQuery state removed entirely. With only 2 languages,
  // a search bar adds friction instead of removing it (extra tap, extra
  // cognitive load) so we deleted the search UI and this state with it.

  // UPDATED: selectedLanguage now initializes from the user's actual saved
  // language (falling back to "en" if not yet known), instead of always
  // starting hardcoded at "en" regardless of what was previously saved.
  // TypeScript note: annotating this as <string> (rather than letting it
  // infer 'en' | 'tw') keeps things simple while you're still learning
  // TypeScript. If you want the compiler to block any other value from
  // ever being assigned here, change this to useState<'en' | 'tw'>('en').
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    user?.language === "tw" ? "tw" : "en",
  );

  const [isSaving, setIsSaving] = useState(false); // NO CHANGES: same loading flag, now drives a real network call
  const [showSuccess, setShowSuccess] = useState(false); // NO CHANGES: same success banner flag

  // NEW ADDITION: error state so we can show a clear message if the save
  // fails (e.g. network issue, or an unexpected non-200), instead of the
  // failure just being silently swallowed like the old fake save did.
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // NEW ADDITION: keep the screen's selection in sync if the store's user
  // object changes after this screen has already mounted (for example, if
  // the Profile screen's focus-triggered /api/auth/me refetch updates the
  // language behind the scenes while this screen is still open).
  useEffect(() => {
    if (user?.language === "tw" || user?.language === "en") {
      setSelectedLanguage(user.language);
    }
  }, [user?.language]);

  // UPDATED: handleSave is now async and actually calls the backend
  // (PUT /api/auth/language), instead of the previous fake setTimeout.
  // TypeScript note: marking this `async` means it returns a Promise<void>;
  // React Native doesn't care that onPress returns a promise, it just fires
  // it and moves on, but we still `await` inside so we can control isSaving.
  const handleSave = async () => {
    // NEW ADDITION: guard against double-submits while a save is already
    // in flight (belt-and-braces on top of the disabled button below).
    if (isSaving) return;

    setErrorMessage(null); // NEW ADDITION: clear any previous error before retrying
    setIsSaving(true); // NO CHANGES: same loading flag as before

    try {
      // NEW ADDITION: real API call. Body shape matches Section 5.1
      // "PUT /api/auth/language" exactly: { language: "en" | "tw" }.
      const response = await API.put("/api/auth/language", {
        language: selectedLanguage,
      });

      // NEW ADDITION: check `success` first, per the API's standard
      // response shape (Section 2 of the docs), before trusting any
      // other field on the response.
      if (response.data?.success) {
        // NEW ADDITION: write the confirmed language back into the
        // persisted auth store so every other screen (e.g. Profile)
        // reflects the change immediately without a refetch.
        updateUser({ language: response.data.language ?? selectedLanguage });

        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000); // NO CHANGES: same 3 second auto-hide timing as before
      } else {
        // NEW ADDITION: defensive fallback, in case the backend ever
        // returns HTTP 200 with success: false (not expected for this
        // endpoint today, but cheap to guard against).
        setErrorMessage("Could not save your language. Please try again.");
      }
    } catch (err: any) {
      // NEW ADDITION: surface a friendly, secure message. We deliberately
      // do NOT show err.response?.data?.message raw to the user, since the
      // project rule is to always use secure, generic return messages
      // rather than leaking backend internals to the UI.
      setErrorMessage("Something went wrong while saving. Please try again.");
    } finally {
      setIsSaving(false); // NO CHANGES: same reset of loading flag
    }
  };

  // UPDATED: filteredLanguages, regionalLanguages, internationalLanguages,
  // and renderLanguageItem's grouping logic have all been removed. With
  // only 2 options, we render both directly in a single simple card below.

  const renderLanguageItem = (lang: LanguageOption) => {
    const isSelected = selectedLanguage === lang.code;
    return (
      <TouchableOpacity
        key={lang.code}
        style={[
          styles.langItemRow,
          { borderColor: isSelected ? theme.primary : "rgba(9, 74, 4, 0.06)" },
          isSelected && {
            backgroundColor: colorScheme === "light" ? "#F4F9F3" : "#1A231C",
          },
        ]}
        onPress={() => setSelectedLanguage(lang.code)}
        activeOpacity={0.7}
        disabled={isSaving} // NEW ADDITION: disable language selection while a save is in progress, per the project rule "always disable all fields and clickables when any loading is going on"
      >
        <View style={styles.langLeft}>
          <Text style={styles.flagIcon}>{lang.flag}</Text>
          <View style={styles.langNameContainer}>
            <Text style={[styles.langNativeName, { color: theme.text }]}>
              {lang.nativeName}
            </Text>
            <Text
              style={[
                styles.langEnglishName,
                { color: colorScheme === "light" ? "#687076" : "#9BA1A6" },
              ]}
            >
              {lang.name}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.radioOuter,
            isSelected
              ? styles.radioOuterSelected
              : styles.radioOuterUnselected,
            isSelected && { borderColor: theme.primary },
          ]}
        >
          {isSelected && (
            <View
              style={[styles.radioInner, { backgroundColor: theme.primary }]}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { borderColor: theme.primary, opacity: isSaving ? 0.5 : 1 },
          ]} // UPDATED: dim the back button while saving, as a visual loading cue
          onPress={() => router.back()}
          activeOpacity={0.7}
          disabled={isSaving} // NEW ADDITION: prevent navigating away mid-save, per the "disable all clickables while loading" rule
        >
          <Ionicons
            name="arrow-back"
            size={moderateScale(18)}
            color={theme.primary}
          />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          Language
        </Text>

        <View style={styles.rightSpacer} />
      </View>

      {/* Success Banner */}
      {showSuccess && (
        <View style={styles.successBanner}>
          <View style={styles.successIconWrapper}>
            <Ionicons
              name="checkmark"
              size={moderateScale(14)}
              color="#FFFFFF"
            />
          </View>
          <Text style={styles.successText}>
            Language preferences saved successfully!
          </Text>
        </View>
      )}

      {/* NEW ADDITION: Error Banner, shown only if the save request fails */}
      {errorMessage && (
        <View style={styles.errorBanner}>
          <View style={styles.errorIconWrapper}>
            <Ionicons name="close" size={moderateScale(14)} color="#FFFFFF" />
          </View>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* UPDATED: Search input section removed entirely. Only 2 languages
          exist, so a search bar was pure friction with no benefit. */}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* UPDATED: single simple card listing both supported languages,
            replacing the old "Regional" / "International" grouped sections. */}
        <View style={styles.groupContainer}>
          <Text style={[styles.groupTitle, { color: theme.primary }]}>
            Available Languages
          </Text>
          <View style={[styles.groupCard, { backgroundColor: theme.surface }]}>
            {LANGUAGES.map((lang, idx) => (
              <View key={lang.code}>
                {renderLanguageItem(lang)}
                {idx < LANGUAGES.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* UPDATED: removed the "no search results" empty state since there
            is no search anymore. */}

        {/* Action Button */}
        <CustomButton
          title="Save Language"
          loading={isSaving} // NO CHANGES: CustomButton already handles its own disabled-while-loading visual state
          onPress={handleSave}
          style={styles.saveButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }, // NO CHANGES
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
  }, // NO CHANGES
  backButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  }, // NO CHANGES
  headerTitle: {
    fontSize: moderateScale(17),
    fontWeight: "700",
    textAlign: "center",
  }, // NO CHANGES
  rightSpacer: {
    width: moderateScale(32),
  }, // NO CHANGES
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2E7D32",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    borderRadius: moderateScale(10),
    marginHorizontal: scale(16),
    marginTop: verticalScale(5),
    marginBottom: verticalScale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  }, // NO CHANGES
  successIconWrapper: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(8),
  }, // NO CHANGES
  successText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "700",
    flex: 1,
  }, // NO CHANGES

  // NEW ADDITION: error banner styles, mirroring the success banner but in
  // a warning/error color (red) so it's visually distinct at a glance.
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#B91C1C",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    borderRadius: moderateScale(10),
    marginHorizontal: scale(16),
    marginTop: verticalScale(5),
    marginBottom: verticalScale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  errorIconWrapper: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(8),
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "700",
    flex: 1,
  },

  // UPDATED: searchSection, searchContainer, searchIcon, searchInput styles
  // removed entirely, since the search bar no longer exists in the JSX.

  scrollContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(40),
  }, // NO CHANGES
  groupContainer: {
    marginBottom: verticalScale(18),
  }, // NO CHANGES
  groupTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    marginBottom: verticalScale(8),
    paddingLeft: scale(4),
  }, // NO CHANGES
  groupCard: {
    borderRadius: moderateScale(14),
    borderWidth: 1.2,
    borderColor: "rgba(9, 74, 4, 0.06)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  }, // NO CHANGES
  langItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    borderLeftWidth: 3,
  }, // NO CHANGES
  langLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  }, // NO CHANGES
  flagIcon: {
    fontSize: moderateScale(22),
    marginRight: scale(12),
  }, // NO CHANGES
  langNameContainer: {
    flex: 1,
  }, // NO CHANGES
  langNativeName: {
    fontSize: moderateScale(13.5),
    fontWeight: "700",
    marginBottom: verticalScale(2),
  }, // NO CHANGES
  langEnglishName: {
    fontSize: moderateScale(11),
  }, // NO CHANGES
  radioOuter: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  }, // NO CHANGES
  radioOuterSelected: {}, // NO CHANGES
  radioOuterUnselected: {
    borderColor: "#9CA3AF",
  }, // NO CHANGES
  radioInner: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
  }, // NO CHANGES
  divider: {
    height: 1,
    backgroundColor: "rgba(9, 74, 4, 0.05)",
    marginHorizontal: scale(14),
  }, // NO CHANGES

  // UPDATED: emptyContainer/emptyText styles removed since the "no search
  // results" empty state no longer exists.

  saveButton: {
    marginTop: verticalScale(12),
    shadowColor: "#094A04",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  }, // NO CHANGES
});
