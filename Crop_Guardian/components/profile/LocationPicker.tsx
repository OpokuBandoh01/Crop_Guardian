// components/profile/LocationPicker.tsx
// Handles both cases: a user with no saved location yet (first-time GPS
// capture) and a user updating an already-saved one. PUT /api/auth/profile
// requires a real { latitude, longitude } pair whenever `location` is sent
// at all, so this component is the only place responsible for producing
// valid coordinates for that field.

import { CustomInput } from "@/components/CustomInput";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { UserLocation } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

interface LocationPickerProps {
  value: UserLocation | null;
  onChange: (location: UserLocation) => void;
  disabled?: boolean;
}

export function LocationPicker({
  value,
  onChange,
  disabled = false,
}: LocationPickerProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const [capturing, setCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const handleCapture = async () => {
    if (capturing || disabled) return;
    setCaptureError(null);
    setCapturing(true);

    try {
      // Asking for permission right when it's needed (not on screen mount)
      // reads as more trustworthy to the user than an upfront prompt.
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setCaptureError(
          "Location permission is needed to set your farm location.",
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;

      // Reverse geocoding turns raw coordinates into a readable label.
      // Wrapped in its own try/catch: a network hiccup here should never
      // block saving the coordinates themselves, an address is a nice
      // extra, not a requirement.
      let address = value?.address || "";
      try {
        const results = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        const place = results[0];
        if (place) {
          address = [place.city || place.subregion, place.region]
            .filter(Boolean)
            .join(", ");
        }
      } catch {
        // Silent fallback, keep whatever address string existed before.
      }

      onChange({ latitude, longitude, address });
    } catch (err) {
      console.warn("Failed to capture location:", err);
      setCaptureError("Could not get your current location. Please try again.");
    } finally {
      setCapturing(false);
    }
  };

  const hasLocation = !!value;

  return (
    <View style={styles.wrapper}>
      {hasLocation ? (
        <>
          {/* The address label stays hand-editable, the underlying
              latitude/longitude only change when the user explicitly
              recaptures GPS below via handleCapture. */}
          <CustomInput
            label="LOCATION / REGION"
            placeholder="e.g. Kumasi, Ashanti"
            leftIcon="location-outline"
            value={value?.address || ""}
            onChangeText={(text) =>
              onChange({ ...(value as UserLocation), address: text })
            }
            editable={!disabled && !capturing}
            containerStyle={styles.inputSpacing}
          />

          <TouchableOpacity
            style={[
              styles.updateButton,
              {
                borderColor: theme.primary,
                opacity: disabled || capturing ? 0.5 : 1,
              },
            ]}
            onPress={handleCapture}
            activeOpacity={0.7}
            disabled={disabled || capturing}
          >
            {capturing ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <>
                <Ionicons
                  name="navigate-outline"
                  size={moderateScale(14)}
                  color={theme.primary}
                />
                <Text
                  style={[styles.updateButtonText, { color: theme.primary }]}
                >
                  Update to current location
                </Text>
              </>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyLabel, { color: theme.primary }]}>
            LOCATION / REGION
          </Text>
          <Text
            style={[
              styles.emptyHint,
              { color: colorScheme === "light" ? "#687076" : "#9BA1A6" },
            ]}
          >
            No location saved yet. Setting this helps us give you accurate
            weather alerts for your farm.
          </Text>
          <TouchableOpacity
            style={[
              styles.captureButton,
              {
                backgroundColor: theme.primary,
                opacity: disabled || capturing ? 0.6 : 1,
              },
            ]}
            onPress={handleCapture}
            activeOpacity={0.8}
            disabled={disabled || capturing}
          >
            {capturing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name="navigate-outline"
                  size={moderateScale(15)}
                  color="#FFFFFF"
                />
                <Text style={styles.captureButtonText}>
                  Use My Current Location
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {captureError && <Text style={styles.errorText}>{captureError}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: verticalScale(4) },
  inputSpacing: { marginBottom: verticalScale(8) },
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    borderWidth: 1,
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(8),
    marginBottom: verticalScale(12),
  },
  updateButtonText: { fontSize: moderateScale(12), fontWeight: "600" },
  emptyState: { marginBottom: verticalScale(12) },
  emptyLabel: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    marginBottom: verticalScale(4),
  },
  emptyHint: {
    fontSize: moderateScale(11),
    lineHeight: verticalScale(15),
    marginBottom: verticalScale(10),
  },
  captureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(12),
  },
  captureButtonText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  errorText: {
    fontSize: moderateScale(11),
    color: "#DC2626",
    marginTop: verticalScale(4),
    fontWeight: "500",
  },
});
