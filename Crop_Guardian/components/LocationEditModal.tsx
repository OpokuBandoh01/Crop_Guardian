// components/LocationEditModal.tsx
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useEffect, useRef, useState } from "react";
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
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AppLocation, GHANA_REGIONS, GhanaRegion } from "@/utils/utilities";
import { CustomButton } from "./CustomButton";
import { CustomInput } from "./CustomInput";

// Screen height is used to set a reliable maxHeight on the sheet.
// Using Dimensions here (not useWindowDimensions) is fine inside a modal
// because the modal does not need to respond to orientation changes in this app.
const SCREEN_HEIGHT = Dimensions.get("window").height;

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

  // useSafeAreaInsets gives the real bottom inset (home bar on iPhone,
  // navigation bar on Android). We add this to the sheet's bottom padding
  // so the Save button is never hidden behind the system UI.
  // This is the correct fix for the "sheet at the bottom of the screen
  // and content is cut off" bug.
  const insets = useSafeAreaInsets();

  const [city, setCity] = useState(currentLocation?.city || "");
  const [region, setRegion] = useState<GhanaRegion | "">(
    (currentLocation?.region as GhanaRegion) || "",
  );
  const [mapCoords, setMapCoords] = useState({
    latitude: currentLocation?.latitude || 5.6037,
    longitude: currentLocation?.longitude || -0.187,
  });
  const [accuracy, setAccuracy] = useState(currentLocation?.accuracy);

  // Ref used to animate the map camera when coords change programmatically
  const mapRef = useRef<MapView>(null);

  // Sync state whenever the modal opens with updated props
  useEffect(() => {
    if (isVisible && currentLocation) {
      setCity(currentLocation.city || "");
      setRegion((currentLocation.region as GhanaRegion) || "");
      setMapCoords({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
      setAccuracy(currentLocation.accuracy);
    }
  }, [isVisible, currentLocation]);

  const handleSave = () => {
    if (!city.trim() || !region) {
      Alert.alert("Incomplete", "Please enter your city and select a region.");
      return;
    }

    const address = `${city.trim()}, ${region}, Ghana`;

    const newLocation: AppLocation = {
      latitude: mapCoords.latitude,
      longitude: mapCoords.longitude,
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
    // React Native's built-in Modal renders above all other views including
    // tab bars and navigation bars, so the BlurView covers the full screen.
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      // statusBarTranslucent makes the modal extend behind the status bar
      // on Android, so the BlurView covers the full screen on both platforms.
      statusBarTranslucent
    >
      {/* BlurView: full-screen frosted glass behind the sheet */}
      <BlurView
        intensity={60}
        tint={colorScheme === "dark" ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />

      {/* KeyboardAvoidingView sits INSIDE the modal and wraps everything.
          This pushes the sheet up when the software keyboard appears so
          the City input is never hidden. We use "padding" on iOS and
          "height" on Android because their keyboard behaviours differ. */}
      <KeyboardAvoidingView
        style={styles.kavWrapper}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        // keyboardVerticalOffset accounts for any extra space at the top
        // (status bar height on Android + a small buffer)
        keyboardVerticalOffset={Platform.OS === "android" ? 24 : 0}
      >
        {/* Backdrop Pressable: tapping outside the sheet closes it */}
        <Pressable style={styles.backdrop} onPress={onClose}>
          {/* Inner Pressable stops touches on the sheet itself from
              bubbling up to the backdrop and closing the modal accidentally */}
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: theme.background,
                // Add safe-area bottom inset so the content clears the home bar.
                // Without this, the Save button sits behind the gesture bar on
                // modern iPhones and is impossible to tap.
                paddingBottom: insets.bottom + verticalScale(8),
                // Cap the sheet at 88% of screen height so it never goes full-screen
                maxHeight: SCREEN_HEIGHT * 1,
              },
            ]}
            // Consuming the press event here prevents it reaching the backdrop
            onPress={() => {}}
          >
            {/* Drag handle — visual affordance */}
            <View style={styles.handleBar}>
              <View
                style={[styles.handle, { backgroundColor: theme.inputBorder }]}
              />
            </View>

            {/* Header row */}
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

            {/* ScrollView wraps all sheet content.
                - keyboardShouldPersistTaps="handled" lets region chips receive
                  taps even when the keyboard is open.
                - bounces={false} prevents the sheet from rubber-banding against
                  the outer scroll when the user scrolls to the end. */}
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

              {/* Map — drag the pin to fine-tune coordinates */}
              <Text style={[styles.label, { color: theme.primary }]}>
                Fine-tune pin position
              </Text>
              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  initialRegion={{
                    latitude: mapCoords.latitude,
                    longitude: mapCoords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                  // On Android, allowing the map to scroll while inside a
                  // ScrollView causes a gesture conflict where the outer scroll
                  // intercepts map pans. Disabling map scroll on Android forces
                  // all panning to happen via the draggable marker instead.
                  scrollEnabled={Platform.OS === "ios"}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker
                    coordinate={mapCoords}
                    draggable
                    onDragEnd={(e) => setMapCoords(e.nativeEvent.coordinate)}
                  />
                </MapView>
              </View>

              {/* Action Buttons */}
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
  // KeyboardAvoidingView needs flex:1 to fill the modal's full screen area
  kavWrapper: {
    flex: 1,
    justifyContent: "flex-end", // push the sheet to the bottom of the screen
  },

  // Backdrop fills the space above the sheet.
  // flex:1 + justifyContent:"flex-end" means the sheet sticks to the bottom
  // and the backdrop fills everything above it.
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },

  // Bottom sheet panel
  sheet: {
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingTop: verticalScale(8),
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // Elevation for Android
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

  // Constrain the header text so the close button is always visible
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

  // ScrollView expands to fill the remaining height inside the sheet
  scrollArea: {
    flexGrow: 0, // do NOT let the scroll area push the sheet taller than maxHeight
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

  mapContainer: {
    height: verticalScale(180),
    borderRadius: moderateScale(12),
    overflow: "hidden",
    marginBottom: verticalScale(16),
  },

  map: {
    flex: 1,
  },

  buttonRow: {
    flexDirection: "row",
    gap: scale(12),
  },

  buttonHalf: {
    flex: 1,
  },
});
