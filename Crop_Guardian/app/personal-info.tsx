import { CustomButton } from "@/components/CustomButton";
import { CustomInput } from "@/components/CustomInput";
import { AvatarPicker } from "@/components/profile/AvatarPicker";
import { LocationPicker } from "@/components/profile/LocationPicker";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useUserProfile } from "@/hooks/useUserProfile";
import { updateProfile } from "@/services/userApi";
import type { UserLocation } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

export default function PersonalInfoScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const { user, loading, refetch } = useUserProfile();

  const [fullName, setFullName] = useState("");
  // UPDATED: was a plain string for the address text field, now the full
  // UserLocation object (or null if the user has never set one), since
  // LocationPicker needs to know whether coordinates already exist.
  const [location, setLocation] = useState<UserLocation | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.profile?.fullName || "");
      setLocation(user.profile?.location || null);
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const payload: { fullName?: string; location?: UserLocation } = {
        fullName,
      };

      // UPDATED: location is only included if LocationPicker has actually
      // produced a valid { latitude, longitude } pair, either from the
      // user's existing saved profile or a fresh GPS capture. This is the
      // one place in the app responsible for guaranteeing the backend's
      // location validation always passes.
      if (location) {
        payload.location = location;
      }

      const res = await updateProfile(payload);

      if (res.success) {
        await refetch();
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          router.back();
        }, 1500);
      }
    } catch (err) {
      console.error("Error saving personal info:", err);
      setSaveError("Could not save your changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const fields = [fullName, user?.email, user?.phoneNumber, location?.address];
  const filledFields = fields.filter((f) => (f || "").trim().length > 0).length;
  const completionPercentage = Math.round((filledFields / fields.length) * 100);

  const isBusy = isSaving || loading;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { borderColor: theme.primary, opacity: isBusy ? 0.5 : 1 },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
          disabled={isBusy}
        >
          <Ionicons
            name="arrow-back"
            size={moderateScale(18)}
            color={theme.primary}
          />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          Personal Profile
        </Text>

        <View style={styles.rightSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.avatarSection}>
            <AvatarPicker
              avatarUrl={user?.profile?.avatarUrl}
              size={90}
              onUploaded={() => refetch()}
              disabled={isBusy}
            />
            <Text style={[styles.farmerName, { color: theme.text }]}>
              {fullName || "Farmer Name"}
            </Text>

            <View style={styles.verifiedBadge}>
              <Ionicons
                name="checkmark-sharp"
                size={moderateScale(10)}
                color="#094A04"
              />
              <Text style={styles.verifiedText}>Verified Member</Text>
            </View>
          </View>

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
                Personal profile updated successfully!
              </Text>
            </View>
          )}

          {saveError && (
            <View style={styles.errorBanner}>
              <Ionicons
                name="alert-circle-outline"
                size={moderateScale(15)}
                color="#FFFFFF"
              />
              <Text style={styles.errorText}>{saveError}</Text>
            </View>
          )}

          <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
            <View style={styles.completionContainer}>
              <View style={styles.completionTextRow}>
                <Text style={[styles.completionLabel, { color: theme.text }]}>
                  Profile Strength
                </Text>
                <Text style={styles.completionValue}>
                  {completionPercentage}%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${completionPercentage}%` },
                  ]}
                />
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.inputsWrapper}>
              <CustomInput
                label="FULL NAME"
                placeholder="e.g. Kofi Mensah"
                leftIcon="person-outline"
                value={fullName}
                onChangeText={setFullName}
                containerStyle={styles.inputStyle}
                editable={!isBusy}
              />

              <CustomInput
                label="EMAIL ADDRESS"
                placeholder="e.g. kofi.mensah@gmail.com"
                leftIcon="mail-outline"
                value={user?.email || ""}
                editable={false}
                containerStyle={styles.inputStyle}
              />

              <CustomInput
                label="PHONE NUMBER"
                placeholder="e.g. +233 24 123 4567"
                leftIcon="call-outline"
                value={user?.phoneNumber || ""}
                editable={false}
                containerStyle={styles.inputStyle}
              />

              {/* UPDATED: was a plain CustomInput bound to a string, now
                  the LocationPicker, which handles both "no location yet"
                  (GPS capture) and "already has one" (editable address +
                  recapture button) cases. */}
              <LocationPicker
                value={location}
                onChange={setLocation}
                disabled={isBusy}
              />
            </View>

            <CustomButton
              title="Save Changes"
              loading={isSaving}
              onPress={handleSave}
              style={styles.saveButton}
              disabled={isBusy}
            />
          </View>

          <View style={styles.tipSection}>
            <Ionicons
              name="shield-checkmark-outline"
              size={moderateScale(16)}
              color="#094A04"
            />
            <Text style={styles.tipText}>
              Your information is secure and only used to provide accurate crop
              diagnostics and localized weather forecasts. Email and phone
              number cannot be changed here.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  rightSpacer: { width: moderateScale(32) },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(40),
  },
  avatarSection: { alignItems: "center", marginVertical: verticalScale(16) },
  farmerName: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    marginTop: verticalScale(8),
    marginBottom: verticalScale(2),
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#C8E6C9",
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(12),
  },
  verifiedText: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#094A04",
    marginLeft: scale(3),
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
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    borderRadius: moderateScale(10),
    marginBottom: verticalScale(16),
    gap: scale(8),
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "700",
    flex: 1,
  },
  infoCard: {
    borderRadius: moderateScale(16),
    padding: scale(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1.2,
    borderColor: "rgba(9, 74, 4, 0.06)",
    marginBottom: verticalScale(16),
  },
  completionContainer: { marginBottom: verticalScale(12) },
  completionTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(5),
  },
  completionLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    opacity: 0.8,
  },
  completionValue: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#094A04",
  },
  progressTrack: {
    height: verticalScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: "#E5E7EB",
    width: "100%",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: moderateScale(3),
    backgroundColor: "#094A04",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(9, 74, 4, 0.08)",
    marginVertical: verticalScale(8),
    marginBottom: verticalScale(16),
  },
  inputsWrapper: { gap: verticalScale(2) },
  inputStyle: { marginBottom: verticalScale(12) },
  saveButton: {
    marginTop: verticalScale(12),
    shadowColor: "#094A04",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  tipSection: {
    flexDirection: "row",
    backgroundColor: "rgba(9, 74, 4, 0.04)",
    padding: scale(12),
    borderRadius: moderateScale(12),
    alignItems: "center",
    gap: scale(8),
  },
  tipText: {
    flex: 1,
    fontSize: moderateScale(10.5),
    lineHeight: verticalScale(15),
    color: "#094A04",
    fontWeight: "500",
  },
});
