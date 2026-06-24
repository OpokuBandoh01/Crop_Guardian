// app/(auth)/signup
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

import { CustomButton } from "@/components/CustomButton";
import { CustomInput } from "@/components/CustomInput";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import API from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";

// NEW ADDITION: Location related imports
import { LocationEditModal } from "@/components/LocationEditModal";
import {
  AppLocation,
  formatLocationDisplay,
  getAccuracyLabel,
  GHANA_REGIONS, GhanaRegion,
} from "@/utils/utilities";

export default function SignUpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const loginUser = useAuthStore((state) => state.login);

  // NEW ADDITION: get role selected during onboarding
  const selectedRole = useOnboardingStore((state) => state.selectedRole);

  // NEW ADDITION: get crops selected during onboarding
  const selectedCrops = useOnboardingStore((state) => state.selectedCrops);

  // NEW ADDITION: mark onboarding completed
  const completeOnboarding = useOnboardingStore(
    (state) => state.completeOnboarding,
  );

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // UPDATED: Full location state (replaces old locationText + coords)
  const [userLocation, setUserLocation] = useState<AppLocation | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Fetch coordinates on mount - UPDATED: Use enhanced logic
  useEffect(() => {
    (async () => {
      await detectCurrentLocation(true); // silent initial detection
    })();
  }, []);

  // NEW ADDITION: Centralized location detection function with UX feedback
  const detectCurrentLocation = async (silent = false) => {
    if (!silent) setIsDetectingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (!silent)
          Alert.alert(
            "Permission Denied",
            "Please enable location for accurate local features.",
          );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      let address = "Ghana";
      let city = "";
      let region = "";

      if (geocode.length > 0) {
        const g = geocode[0];
        city = g.city || g.subregion || "";
        region = g.region || "";
        address =
          [city, region].filter(Boolean).join(", ") || g.country || "Ghana";
      }

      const newLoc: AppLocation = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        address,
        city,
        region: GHANA_REGIONS.includes(region as any)
          ? (region as GhanaRegion)
          : undefined,
        accuracy: loc.coords.accuracy || undefined,
      };

      setUserLocation(newLoc);
      if (!silent) {
        Alert.alert(
          "Success",
          `Location detected: ${formatLocationDisplay(newLoc)}`,
        );
      }
    } catch (err) {
      console.warn("Could not get GPS location:", err);
      if (!silent) Alert.alert("Detection Failed", "Please use manual edit.");
    } finally {
      if (!silent) setIsDetectingLocation(false);
    }
  };

  const handleSignUp = async () => {
    // NO CHANGES to basic validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    // NEW ADDITION: Ensure location is set (no skipping)
    if (!userLocation) {
      Alert.alert(
        "Location Required",
        "Please detect or set your location to continue.",
      );
      return;
    }

    // NO CHANGES to onboarding checks
    if (!selectedRole) {
      Alert.alert(
        "Onboarding Required",
        "Please complete onboarding before creating an account.",
      );
      return;
    }

    if (selectedCrops.length === 0) {
      Alert.alert(
        "Crop Selection Required",
        "Please select at least one crop.",
      );
      return;
    }

    setIsLoading(true);
    try {
      // UPDATED: Payload now uses full userLocation (matches exact backend expectation)
      const payload = {
        email,
        password,
        fullName: `${firstName} ${lastName}`.trim(),
        phoneNumber: phoneNumber || undefined,
        role: selectedRole.toUpperCase() as
          | "FARMER"
          | "BEGINNER"
          | "GARDENER"
          | "STUDENT"
          | "OTHER",
        preferredCrops: selectedCrops,
        location: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          address: userLocation.address,
        },
      };

      const response = await API.post("/api/auth/register", payload);

      // UPDATED: Pass full user including location to store
      loginUser(response.data.token, {
        ...response.data.user,
        location: userLocation,
      });

      completeOnboarding();
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Signup error:", error);
      const errorMsg =
        error.response?.data?.message ||
        "An error occurred during sign up. Please try again.";
      Alert.alert("Registration Failed", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // NEW ADDITION: Handle save from modal
  const handleLocationSave = (location: AppLocation) => {
    setUserLocation(location);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Logo - NO CHANGES */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/icons/leaflogoicon.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Headers - NO CHANGES */}
        <Text style={[styles.title, { color: theme.primary }]}>
          Create An Account
        </Text>
        <Text style={[styles.subtitle, { color: theme.icon }]}>
          Join CropGuardian to start your plant care journey
        </Text>

        {/* Form Fields - Most unchanged, location section updated */}
        <View style={styles.row}>
          <CustomInput
            placeholder="First Name"
            leftIcon="person-outline"
            containerStyle={styles.halfInput}
            value={firstName}
            onChangeText={setFirstName}
            editable={!isLoading && !isDetectingLocation}
          />
          <CustomInput
            placeholder="Last Name"
            leftIcon="person-outline"
            containerStyle={styles.halfInput}
            value={lastName}
            onChangeText={setLastName}
            editable={!isLoading && !isDetectingLocation}
          />
        </View>

        {/* Other inputs - editable disabled during loading/detection */}
        <CustomInput
          placeholder="Email"
          leftIcon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading && !isDetectingLocation}
        />

        <CustomInput
          placeholder="Phone Number (Optional)"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          editable={!isLoading && !isDetectingLocation}
        />

        {/* Country Code - NO CHANGES */}
        <View style={styles.countryCodeWrapper}>
          <Text
            style={[
              styles.floatingLabel,
              { backgroundColor: theme.background, color: theme.icon },
            ]}
          >
            Country Code (Auto-detected)
          </Text>
          <View
            style={[
              styles.countryCodeContainer,
              {
                borderColor: theme.inputBorder,
                backgroundColor: theme.surface,
              },
            ]}
          >
            <Ionicons
              name="globe-outline"
              size={moderateScale(20)}
              color={theme.icon}
              style={styles.leftIcon}
            />
            <Text style={[styles.countryText, { color: theme.text }]}>GH</Text>
            <Ionicons
              name="checkmark-circle"
              size={moderateScale(20)}
              color={theme.primary}
            />
          </View>
          <Text style={[styles.helperText, { color: theme.icon }]}>2/2</Text>
        </View>

        {/* NEW ADDITION: User-friendly Location Card */}
        <View
          style={[
            styles.locationCard,
            { backgroundColor: theme.surface, borderColor: theme.inputBorder },
          ]}
        >
          <View style={styles.locationHeader}>
            <Ionicons name="location-outline" size={24} color={theme.primary} />
            <Text style={[styles.locationTitle, { color: theme.text }]}>
              Your Location
            </Text>
          </View>

          <Text style={[styles.detectedLocation, { color: theme.text }]}>
            {formatLocationDisplay(userLocation)}
          </Text>

          {userLocation?.accuracy && (
            <Text style={[styles.accuracyText, { color: theme.icon }]}>
              {getAccuracyLabel(userLocation.accuracy)}
            </Text>
          )}

          <View style={styles.locationActions}>
            <CustomButton
              title="Detect / Update Location"
              onPress={() => detectCurrentLocation(false)}
              loading={isDetectingLocation}
              disabled={isLoading || isDetectingLocation}
              variant="outline"
            />
            <TouchableOpacity
              onPress={() => setIsModalVisible(true)}
              disabled={isLoading || isDetectingLocation}
              style={styles.manualEditLink}
            >
              <Text style={{ color: theme.primary, fontWeight: "600" }}>
                Not correct? Edit manually
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <CustomInput
          placeholder="Password"
          leftIcon="lock-closed-outline"
          isPassword
          value={password}
          onChangeText={setPassword}
          editable={!isLoading && !isDetectingLocation}
        />

        <CustomInput
          placeholder="Confirm Password"
          leftIcon="lock-closed-outline"
          isPassword
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!isLoading && !isDetectingLocation}
        />

        {/* Terms - NO CHANGES */}
        <View style={styles.termsContainer}>
          <Text style={[styles.termsText, { color: theme.text }]}>
            I agree to the{" "}
            <Text style={[styles.linkText, { color: theme.primary }]}>
              Terms and Conditions
            </Text>{" "}
            and{" "}
            <Text style={[styles.linkText, { color: theme.primary }]}>
              Privacy Policy
            </Text>
          </Text>
        </View>

        {/* Submit Button - disabled during any loading */}
        <CustomButton
          title="Create Account"
          loading={isLoading}
          disabled={isLoading || isDetectingLocation || !userLocation}
          onPress={handleSignUp}
        />

        {/* Footer - NO CHANGES */}
        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: theme.icon }]}>
            Already have an account?{" "}
          </Text>
          <Link href="/login" asChild>
            <TouchableOpacity>
              <Text style={[styles.footerLink, { color: theme.primary }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>

      {/* NEW ADDITION: Modal */}
      <LocationEditModal
        isVisible={isModalVisible}
        currentLocation={userLocation}
        onClose={() => setIsModalVisible(false)}
        onSave={handleLocationSave}
        isLoading={isLoading}
      />
    </SafeAreaView>
  );
}

// Updated styles with location card
const styles = StyleSheet.create({
  // ... all existing styles remain the same (NO CHANGES to previous definitions)
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(40),
    paddingBottom: verticalScale(40),
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: verticalScale(16),
  },
  logoImage: {
    width: moderateScale(80),
    height: moderateScale(80),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: "700",
    textAlign: "center",
    marginBottom: verticalScale(8),
  },
  subtitle: {
    fontSize: moderateScale(14),
    textAlign: "center",
    marginBottom: verticalScale(30),
    paddingHorizontal: scale(20),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    flex: 0.48,
  },
  countryCodeWrapper: {
    marginBottom: verticalScale(16),
    position: "relative",
  },
  floatingLabel: {
    position: "absolute",
    top: -verticalScale(8),
    left: scale(12),
    zIndex: 1,
    paddingHorizontal: scale(4),
    fontSize: moderateScale(10),
  },
  countryCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(12),
    height: verticalScale(50),
  },
  leftIcon: {
    marginRight: scale(10),
  },
  countryText: {
    flex: 1,
    fontSize: moderateScale(14),
  },
  helperText: {
    textAlign: "right",
    fontSize: moderateScale(10),
    marginTop: verticalScale(4),
  },
  termsContainer: {
    marginTop: verticalScale(8),
    marginBottom: verticalScale(20),
    paddingHorizontal: scale(20),
  },
  termsText: {
    fontSize: moderateScale(12),
    textAlign: "center",
    lineHeight: moderateScale(18),
  },
  linkText: {
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: verticalScale(20),
  },
  footerText: {
    fontSize: moderateScale(14),
  },
  footerLink: {
    fontSize: moderateScale(14),
    fontWeight: "700",
  },

  // NEW ADDITION: Location card styles
  locationCard: {
    borderWidth: 1,
    borderRadius: moderateScale(12),
    padding: scale(16),
    marginBottom: verticalScale(16),
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginBottom: verticalScale(8),
  },
  locationTitle: {
    fontSize: moderateScale(16),
    fontWeight: "600",
  },
  detectedLocation: {
    fontSize: moderateScale(15),
    fontWeight: "500",
    marginBottom: verticalScale(4),
  },
  accuracyText: {
    fontSize: moderateScale(12),
    marginBottom: verticalScale(12),
  },
  locationActions: {
    gap: verticalScale(8),
  },
  manualEditLink: {
    paddingVertical: verticalScale(8),
    alignItems: "center",
  },
});
