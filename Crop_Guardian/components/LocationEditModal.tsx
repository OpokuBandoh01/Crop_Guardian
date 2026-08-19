// components/LocationEditModal.tsx
// UPDATED: MapView removed (Option B) to avoid Google Maps API key crash on Android.
// Users still edit City + Ghana Region. Coordinates are kept from the last GPS
// detection (or Accra defaults) so the backend still receives valid lat/lng.

import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// UPDATED: react-native-maps import removed — no MapView means no Google API key needed
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AppLocation, GHANA_REGIONS, GhanaRegion } from "@/utils/utilities";
import { CustomButton } from "./CustomButton";
import { CustomInput } from "./CustomInput";

// Screen height is used to set a reliable maxHeight on the sheet.
const SCREEN_HEIGHT = Dimensions.get("window").height;

// Default coordinates (Accra) used only when the user has never detected GPS yet.
// TypeScript: these are plain numbers so AppLocation.latitude / longitude stay typed as number.
const DEFAULT_LAT = 5.6037;
const DEFAULT_LNG = -0.187;

interface LocationEditModalProps {
  isVisible: boolean;
  currentLocation: AppLocation | null;
  onClose: () => void;
  onSave: (location: AppLocation) => void;
  isLoading?: boolean;
}

export const LocationEditModal: React.FC<LocationEditModalProps> = ({
  isVisible,
  currentLocation,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // useSafeAreaInsets: real bottom inset so the Save button is never hidden
  // behind the Android navigation bar / iPhone home indicator.
  const insets = useSafeAreaInsets();

  const [city, setCity] = useState(currentLocation?.city || "");
  const [region, setRegion] = useState<GhanaRegion | "">(
    (currentLocation?.region as GhanaRegion) || "",
  );

  // Keep the last known coordinates (from GPS detect). We do not let the user
  // change them in this map-free version, but we still send them to the backend.
  const [coords, setCoords] = useState({
    latitude: currentLocation?.latitude ?? DEFAULT_LAT,
    longitude: currentLocation?.longitude ?? DEFAULT_LNG,
  });
  const [accuracy, setAccuracy] = useState(currentLocation?.accuracy);

  // Sync state whenever the modal opens with updated props
  useEffect(() => {
    if (isVisible) {
      setCity(currentLocation?.city || "");
      setRegion((currentLocation?.region as GhanaRegion) || "");
      setCoords({
        latitude: currentLocation?.latitude ?? DEFAULT_LAT,
        longitude: currentLocation?.longitude ?? DEFAULT_LNG,
      });
      setAccuracy(currentLocation?.accuracy);
    }
  }, [isVisible, currentLocation]);

  const handleSave = () => {
    if (!city.trim() || !region) {
      Alert.alert("Incomplete", "Please enter your city and select a region.");
      return;
    }

    const address = `${city.trim()}, ${region}, Ghana`;

    // AppLocation requires latitude + longitude. We reuse the last GPS values
    // (or Accra defaults) so the backend validation still passes.
    const newLocation: AppLocation = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      address,
      city: city.trim(),
      region: region as GhanaRegion,
      accuracy,
    };

    onSave(newLocation);
    onClose();
  };

  const handleRegionSelect = (selected: GhanaRegion) => {
    setRegion(selected);
  };

  return (
    // React Native Modal + BlurView locks the background and prevents
    // interaction with the screen behind the sheet (project rule).
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <BlurView
        intensity={60}
        tint={colorScheme === "dark" ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.kavWrapper}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "android" ? 24 : 0}
      >
        {/* Backdrop: tap outside to close */}
        <Pressable style={styles.backdrop} onPress={onClose}>
          {/* Inner Pressable stops sheet taps from closing the modal */}
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: theme.background,
                paddingBottom: insets.bottom + verticalScale(8),
                maxHeight: SCREEN_HEIGHT * 0.9,
              },
            ]}
            onPress={() => {}}
          >
            {/* Drag handle */}
            <View style={styles.handleBar}>
              <View
                style={[styles.handle, { backgroundColor: theme.inputBorder }]}
              />
            </View>

            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: theme.primary }]}>
                  Edit Location
                </Text>
                <Text style={[styles.subtitle, { color: theme.icon }]}>
                  Helps provide accurate local disease alerts and weather
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                disabled={isLoading}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={moderateScale(28)}
                  color={theme.icon}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              {/* City Input */}
              <Text style={[styles.label, { color: theme.primary }]}>
                City / Town
              </Text>
              <CustomInput
                placeholder="e.g. Kumasi"
                value={city}
                onChangeText={setCity}
                editable={!isLoading}
                leftIcon="location-outline"
                autoCapitalize="words"
              />

              {/* Region Selector */}
              <Text style={[styles.label, { color: theme.primary }]}>
                Region
              </Text>
              <View style={styles.regionGrid}>
                {GHANA_REGIONS.map((r) => {
                  const isSelected = region === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.regionChip,
                        {
                          backgroundColor: isSelected
                            ? theme.primary
                            : theme.surface,
                          borderColor: isSelected
                            ? theme.primary
                            : theme.inputBorder,
                        },
                      ]}
                      onPress={() => handleRegionSelect(r)}
                      disabled={isLoading}
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    >
                      <Text
                        style={[
                          styles.regionChipText,
                          {
                            color: isSelected ? theme.background : theme.text,
                            fontWeight: isSelected ? "700" : "400",
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {r}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* NEW ADDITION: gentle note so the user understands coordinates
                  still come from the last GPS detect (psychology + clarity) */}
              <View
                style={[
                  styles.infoBox,
                  {
                    backgroundColor:
                      colorScheme === "light" ? "#EBF7E9" : "#1E2C20",
                  },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={moderateScale(16)}
                  color={theme.primary}
                />
                <Text style={[styles.infoText, { color: theme.text }]}>
                  Pin coordinates stay from your last GPS detection. Use “Detect
                  / Update Location” on the signup screen if you want fresh
                  coordinates.
                </Text>
              </View>

              {/* Action Buttons — always disabled while loading */}
              <View style={styles.buttonRow}>
                <View style={styles.buttonHalf}>
                  <CustomButton
                    title="Cancel"
                    variant="outline"
                    onPress={onClose}
                    disabled={isLoading}
                  />
                </View>
                <View style={styles.buttonHalf}>
                  <CustomButton
                    title="Save Location"
                    onPress={handleSave}
                    loading={isLoading}
                    disabled={isLoading}
                  />
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  kavWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingTop: verticalScale(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handleBar: {
    alignItems: "center",
    paddingBottom: verticalScale(8),
  },
  handle: {
    width: scale(40),
    height: verticalScale(4),
    borderRadius: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(12),
  },
  headerText: {
    flex: 1,
    marginRight: scale(12),
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: "700",
    marginBottom: verticalScale(2),
  },
  subtitle: {
    fontSize: moderateScale(12),
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(16),
  },
  label: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    marginBottom: verticalScale(8),
    marginTop: verticalScale(4),
  },
  regionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
    marginBottom: verticalScale(16),
  },
  regionChip: {
    borderWidth: 1,
    borderRadius: moderateScale(20),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
  },
  regionChipText: {
    fontSize: moderateScale(12),
  },
  // NEW ADDITION: info note styles
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: scale(8),
    padding: scale(12),
    borderRadius: moderateScale(10),
    marginBottom: verticalScale(16),
  },
  infoText: {
    flex: 1,
    fontSize: moderateScale(11.5),
    lineHeight: moderateScale(16),
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    gap: scale(12),
  },
  buttonHalf: {
    flex: 1,
  },
});
