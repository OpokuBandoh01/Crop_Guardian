// app/(auth)/signup.tsx
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Location from "expo-location";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

import { CustomButton } from "@/components/CustomButton";
import { CustomInput } from "@/components/CustomInput";
import { LocationEditModal } from "@/components/LocationEditModal";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SignUpFormData, signUpSchema } from "@/schemas/authShemas";
import API, { forgotPassword } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import {
  AppLocation,
  formatLocationDisplay,
  getAccuracyLabel,
  GHANA_REGIONS,
  GhanaRegion,
} from "@/utils/utilities";

export default function SignUpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const loginUser = useAuthStore((state) => state.login);

  // Pull role + crops set during the onboarding flow
  const selectedRole = useOnboardingStore((state) => state.selectedRole);
  const selectedCrops = useOnboardingStore((state) => state.selectedCrops);
  const completeOnboarding = useOnboardingStore(
    (state) => state.completeOnboarding,
  );

  // Track loading states separately so the UI can disable correctly
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Location lives outside react-hook-form because it is not a plain text field
  const [userLocation, setUserLocation] = useState<AppLocation | null>(null);

  // ─── React Hook Form setup ────────────────────────────────────────────────
  // mode: "onBlur" tells react-hook-form to validate each field the moment
  // the user moves away from it (on blur), not just on submit.
  // This gives the "live check" feeling — the user fills a field, tabs away,
  // and sees an error (or no error) immediately under that field.
  //
  // zodResolver wires our Zod schema into react-hook-form so it uses
  // Zod's rules for every validation run.
  const {
    control,
    handleSubmit,
    watch, // watch() lets us read field values to drive the disabled logic
    formState: { errors, isValid },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    // mode "onBlur": validate when focus leaves a field
    // reValidateMode "onChange": re-validate as the user types AFTER the first error
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Watch all required fields so the button disabled check is reactive.
  // watch() subscribes to value changes without causing the form to validate.
  const watchedFirstName = watch("firstName");
  const watchedLastName = watch("lastName");
  const watchedEmail = watch("email");
  const watchedPhoneNumber = watch("phoneNumber");
  const watchedPassword = watch("password");
  const watchedConfirm = watch("confirmPassword");

  // The Create Account button is only enabled when:
  // 1. All required fields have values (not empty strings)
  // 2. Zod considers the whole form valid (isValid === true)
  // 3. The user has confirmed a location
  // 4. Nothing is loading
  // Using isValid from react-hook-form means Zod errors also block the button.
  const allRequiredFilled =
    watchedFirstName.trim().length >= 2 &&
    watchedLastName.trim().length >= 2 &&
    watchedEmail.trim().length > 0 &&
    watchedPhoneNumber.trim().length > 0 &&
    watchedPassword.length >= 8 &&
    watchedConfirm.length > 0;

  const canSubmit =
    isValid &&
    allRequiredFilled &&
    !!userLocation &&
    !isLoading &&
    !isDetectingLocation;

  // Silently detect location when the screen mounts
  useEffect(() => {
    detectCurrentLocation(true);
  }, []);

  // ─── Location detection ───────────────────────────────────────────────────
  const detectCurrentLocation = async (silent = false) => {
    if (!silent) setIsDetectingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
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
        region: GHANA_REGIONS.includes(region as GhanaRegion)
          ? (region as GhanaRegion)
          : undefined,
        accuracy: loc.coords.accuracy || undefined,
      };

      setUserLocation(newLoc);
      if (!silent)
        Alert.alert(
          "Location Detected",
          `Location set to: ${formatLocationDisplay(newLoc)}`,
        );
    } catch (err) {
      console.warn("Could not get GPS location:", err);
      if (!silent)
        Alert.alert("Detection Failed", "Please use the manual edit option.");
    } finally {
      if (!silent) setIsDetectingLocation(false);
    }
  };

  // ─── Form submission ──────────────────────────────────────────────────────
  const handleSignUp = async (data: SignUpFormData) => {
    if (!userLocation) {
      Alert.alert(
        "Location Required",
        "Please detect or set your location to continue.",
      );
      return;
    }

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
      //  data.phoneNumber is now always a non-empty digit string
      // (the Zod schema guarantees this), so the `if (data.phoneNumber)`
      // guard that used to wrap this is no longer needed.
      const digits = data.phoneNumber.replace(/^0/, ""); // remove leading 0
      const formattedPhone = `+233${digits}`;

      const payload = {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        fullName: `${data.firstName.trim()} ${data.lastName.trim()}`,
        phoneNumber: formattedPhone,
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

      loginUser(response.data.token, {
        ...response.data.user,
        location: userLocation,
      });

      completeOnboarding();

      //  formattedPhone is now always present, so the previous
      // `if (formattedPhone)` guard around this call is removed.
      try {
        await forgotPassword(formattedPhone);
      } catch (err) {
        console.warn("Could not send verification code automatically:", err);
      }

      router.replace({
        pathname: "/(auth)/verify-email",
        params: {
          phoneNumber: formattedPhone,
          origin: "signup",
        },
      });
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

  // Save location coming back from the modal
  const handleLocationSave = (location: AppLocation) => {
    setUserLocation(location);
  };

  // True whenever any async operation is running — used to disable everything
  const isBusy = isLoading || isDetectingLocation;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      // Only protect top — bottom is handled by ScrollView padding
      edges={["top", "left", "right"]}
    >
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isLoading}
        keyboardShouldPersistTaps="handled"
        // bottomOffset adds extra space between the focused input and the
        // keyboard's top edge so the input+its error text isn't hugging the keyboard
        bottomOffset={40}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/icons/leaflogoicon.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        {/* Header */}
        <Text style={[styles.title, { color: theme.primary }]}>
          Create An Account
        </Text>
        <Text style={[styles.subtitle, { color: theme.icon }]}>
          Join CropGuardian to start your plant care journey
        </Text>
        {/* ── First Name + Last Name Row ── */}
        <View style={styles.row}>
          {/* halfInputWrapper wraps both the input AND its error text
              so the error always appears directly below its own field */}
          <View style={styles.halfInputWrapper}>
            <Controller
              control={control}
              name="firstName"
              // field.onBlur is required — without passing it to the input,
              // react-hook-form never knows the field was blurred and
              // mode:"onBlur" validation will not fire for this field.
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomInput
                  placeholder="First Name"
                  leftIcon="person-outline"
                  containerStyle={styles.halfInput}
                  value={value}
                  onChangeText={(text) => {
                    // Prevent digits from being typed into name fields entirely
                    const lettersOnly = text.replace(/[^a-zA-Z\s'\-]/g, "");
                    onChange(lettersOnly);
                  }}
                  onBlur={onBlur} // triggers validation when user leaves field
                  editable={!isBusy}
                  autoCapitalize="words"
                />
              )}
            />
            {errors.firstName && (
              <Text
                style={[styles.errorText, { color: theme.error ?? "#E53E3E" }]}
              >
                {errors.firstName.message}
              </Text>
            )}
          </View>

          <View style={styles.halfInputWrapper}>
            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomInput
                  placeholder="Last Name"
                  leftIcon="person-outline"
                  containerStyle={styles.halfInput}
                  value={value}
                  onChangeText={(text) => {
                    const lettersOnly = text.replace(/[^a-zA-Z\s'\-]/g, "");
                    onChange(lettersOnly);
                  }}
                  onBlur={onBlur}
                  editable={!isBusy}
                  autoCapitalize="words"
                />
              )}
            />
            {errors.lastName && (
              <Text
                style={[styles.errorText, { color: theme.error ?? "#E53E3E" }]}
              >
                {errors.lastName.message}
              </Text>
            )}
          </View>
        </View>
        {/* ── Email ── */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <CustomInput
                placeholder="Email Address"
                leftIcon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                editable={!isBusy}
              />
              {errors.email && (
                <Text
                  style={[
                    styles.errorText,
                    { color: theme.error ?? "#E53E3E" },
                  ]}
                >
                  {errors.email.message}
                </Text>
              )}
            </View>
          )}
        />
        {/* ── Phone Number ── */}
        <Controller
          control={control}
          name="phoneNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.phoneRow}>
              <View
                style={[
                  styles.phonePrefixBadge,
                  {
                    borderColor: theme.inputBorder,
                    backgroundColor: theme.surface,
                  },
                ]}
              >
                <Text style={[styles.phonePrefixText, { color: theme.text }]}>
                  🇬🇭 +233
                </Text>
              </View>

              <View style={styles.phoneInputFlex}>
                <CustomInput
                  placeholder="244 123 456" // UPDATED: removed "(Optional)", this field is now required
                  keyboardType="number-pad"
                  value={value}
                  onChangeText={(text) => {
                    const digitsOnly = text.replace(/\D/g, "");
                    onChange(digitsOnly.slice(0, 10));
                  }}
                  onBlur={onBlur}
                  editable={!isBusy}
                  maxLength={10}
                />
              </View>
            </View>
          )}
        />
        ;
        {errors.phoneNumber && (
          <Text
            style={[
              styles.errorText,
              styles.phoneError,
              { color: theme.error ?? "#E53E3E" },
            ]}
          >
            {errors.phoneNumber.message}
          </Text>
        )}
        {/* ── Location Card ── */}
        <View
          style={[
            styles.locationCard,
            {
              backgroundColor: theme.surface,
              borderColor: userLocation ? theme.primary : theme.inputBorder,
            },
          ]}
        >
          <View style={styles.locationHeader}>
            <Ionicons
              name={userLocation ? "location" : "location-outline"}
              size={24}
              color={userLocation ? theme.primary : theme.icon}
            />
            <Text style={[styles.locationTitle, { color: theme.text }]}>
              Your Location
            </Text>
            {/* Green tick once location is confirmed */}
            {userLocation && (
              <Ionicons
                name="checkmark-circle"
                size={moderateScale(18)}
                color={theme.primary}
              />
            )}
          </View>

          <Text
            style={[
              styles.detectedLocation,
              { color: userLocation ? theme.text : theme.icon },
            ]}
          >
            {formatLocationDisplay(userLocation)}
          </Text>

          {userLocation?.accuracy && (
            <Text style={[styles.accuracyText, { color: theme.icon }]}>
              {getAccuracyLabel(userLocation.accuracy)}
            </Text>
          )}

          {/* Show a helper note if location has not been set yet */}
          {!userLocation && (
            <Text style={[styles.locationHint, { color: "#E53E3E" }]}>
              Location is required to continue
            </Text>
          )}

          <View style={styles.locationActions}>
            <CustomButton
              title={
                isDetectingLocation
                  ? "Detecting..."
                  : "Detect / Update Location"
              }
              onPress={() => detectCurrentLocation(false)}
              loading={isDetectingLocation}
              disabled={isBusy}
              variant="outline"
            />
            <TouchableOpacity
              onPress={() => setIsModalVisible(true)}
              disabled={isBusy}
              style={styles.manualEditLink}
            >
              <Text style={{ color: theme.primary, fontWeight: "600" }}>
                Not correct? Edit manually
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* ── Password ── */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <CustomInput
                placeholder="Password"
                leftIcon="lock-closed-outline"
                isPassword
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                editable={!isBusy}
              />
              {errors.password && (
                <Text
                  style={[
                    styles.errorText,
                    { color: theme.error ?? "#E53E3E" },
                  ]}
                >
                  {errors.password.message}
                </Text>
              )}
              {/* Password strength hint — shown when no error and field has value */}
              {!errors.password && value.length > 0 && value.length < 8 && (
                <Text style={[styles.hintText, { color: theme.icon }]}>
                  Must be at least 8 characters with uppercase, lowercase, and a
                  number
                </Text>
              )}
            </View>
          )}
        />
        {/* ── Confirm Password ── */}
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <CustomInput
                placeholder="Confirm Password"
                leftIcon="lock-closed-outline"
                isPassword
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                editable={!isBusy}
              />
              {errors.confirmPassword && (
                <Text
                  style={[
                    styles.errorText,
                    { color: theme.error ?? "#E53E3E" },
                  ]}
                >
                  {errors.confirmPassword.message}
                </Text>
              )}
            </View>
          )}
        />
        {/* ── Terms ── */}
        <View style={styles.termsContainer}>
          <Text style={[styles.termsText, { color: theme.text }]}>
            By creating an account, you agree to our{" "}
            <Text style={[styles.linkText, { color: theme.primary }]}>
              Terms and Conditions
            </Text>{" "}
            and{" "}
            <Text style={[styles.linkText, { color: theme.primary }]}>
              Privacy Policy
            </Text>
          </Text>
        </View>
        {/* ── Submit Button ──
            disabled unless: all required fields filled + Zod valid + location set + not loading.
            The canSubmit boolean above centralises this logic. */}
        <CustomButton
          title="Create Account"
          loading={isLoading}
          disabled={!canSubmit}
          onPress={handleSubmit(handleSignUp)}
        />
        {/* Small hint so the user knows WHY the button is grey */}
        {!canSubmit && !isBusy && (
          <Text style={[styles.submitHint, { color: theme.icon }]}>
            {!userLocation
              ? "Please set your location above"
              : "Please fill in all required fields correctly"}
          </Text>
        )}
        {/* ── Footer ── */}
        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: theme.icon }]}>
            Already have an account?{" "}
          </Text>
          <Link href="/login" asChild>
            <TouchableOpacity disabled={isBusy}>
              <Text style={[styles.footerLink, { color: theme.primary }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </KeyboardAwareScrollView>

      {/* ── Location Edit Modal ──
          Rendered outside ScrollView so it floats over the entire screen.
          The modal itself manages its own backdrop and blur. */}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(32),
    paddingBottom: verticalScale(48),
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
    marginBottom: verticalScale(28),
    paddingHorizontal: scale(20),
  },

  // ── Name row ──
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    // gap between the two half-width columns
    gap: scale(10),
  },
  halfInputWrapper: {
    // Each column takes exactly half the row minus the gap
    flex: 1,
  },
  halfInput: {
    flex: 1,
  },

  // ── Error text ── appears directly below the offending field
  errorText: {
    fontSize: moderateScale(11),
    marginTop: verticalScale(-10), // pull up close to the input border
    marginBottom: verticalScale(10),
    marginLeft: scale(4),
  },

  // ── Phone ──
  // The phone row lays out the +233 badge and the digit input side by side
  phoneRow: {
    flexDirection: "row",
    alignItems: "flex-start", // align-start so the badge and input top-align
    gap: scale(8),
    marginBottom: verticalScale(0), // error text provides the bottom spacing
  },
  phonePrefixBadge: {
    height: verticalScale(50),
    borderWidth: 1,
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(12),
    justifyContent: "center",
    alignItems: "center",
    // The badge is a fixed-width pill — no flex so it doesn't grow
  },
  phonePrefixText: {
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  phoneInputFlex: {
    // Take up all remaining width after the badge
    flex: 1,
  },
  phoneError: {
    // Extra top margin to account for no marginTop pull-up (no input above it)
    marginTop: verticalScale(-6),
    marginBottom: verticalScale(10),
  },

  // ── Location card ──
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
    flex: 1,
  },
  detectedLocation: {
    fontSize: moderateScale(14),
    fontWeight: "500",
    marginBottom: verticalScale(4),
  },
  accuracyText: {
    fontSize: moderateScale(12),
    marginBottom: verticalScale(8),
  },
  locationHint: {
    fontSize: moderateScale(11),
    marginBottom: verticalScale(8),
    fontWeight: "500",
  },
  locationActions: {
    gap: verticalScale(4),
    marginTop: verticalScale(4),
  },
  manualEditLink: {
    paddingVertical: verticalScale(8),
    alignItems: "center",
  },

  // ── Password hint ──
  hintText: {
    fontSize: moderateScale(11),
    marginTop: verticalScale(-10),
    marginBottom: verticalScale(10),
    marginLeft: scale(4),
  },

  // ── Terms ──
  termsContainer: {
    marginTop: verticalScale(4),
    marginBottom: verticalScale(16),
    paddingHorizontal: scale(8),
  },
  termsText: {
    fontSize: moderateScale(12),
    textAlign: "center",
    lineHeight: moderateScale(20),
  },
  linkText: {
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  // ── Submit hint (shown when button is disabled) ──
  submitHint: {
    fontSize: moderateScale(11),
    textAlign: "center",
    marginTop: verticalScale(-8),
    marginBottom: verticalScale(8),
  },

  // ── Footer ──
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: verticalScale(16),
  },
  footerText: {
    fontSize: moderateScale(14),
  },
  footerLink: {
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
});
