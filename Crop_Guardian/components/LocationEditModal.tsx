// components/LocationEditModal.tsx
import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"; //  For draggable map preview
import Modal from "react-native-modal";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    AppLocation,
    GHANA_REGIONS,
    GhanaRegion
} from "@/utils/utilities";
import { CustomButton } from "./CustomButton";
import { CustomInput } from "./CustomInput";

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

  const [city, setCity] = useState(currentLocation?.city || "");
  const [region, setRegion] = useState<GhanaRegion | "">(
    (currentLocation?.region as GhanaRegion) || "",
  );
  const [mapCoords, setMapCoords] = useState({
    latitude: currentLocation?.latitude || 5.6037,
    longitude: currentLocation?.longitude || -0.187,
  });
  const [accuracy, setAccuracy] = useState(currentLocation?.accuracy);

  const mapRef = useRef<MapView>(null);

  //  Sync props when modal opens
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
      Alert.alert("Incomplete", "Please enter city and select region");
      return;
    }

    const address = `${city}, ${region}, Ghana`;
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
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      backdropOpacity={0.7}
      backdropColor="#000"
      animationIn="slideInUp"
      animationOut="slideOutDown"
      style={styles.modal}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.primary }]}>
          Edit Location
        </Text>
        <Text style={[styles.subtitle, { color: theme.icon }]}>
          Helps provide accurate local disease alerts & weather
        </Text>

        <CustomInput
          placeholder="City / Town"
          value={city}
          onChangeText={setCity}
          editable={!isLoading}
          leftIcon="location-outline"
        />

        {/* Region Dropdown */}
        <View style={styles.dropdownWrapper}>
          <Text style={[styles.label, { color: theme.primary }]}>Region</Text>
          <View style={[styles.dropdown, { borderColor: theme.inputBorder }]}>
            {GHANA_REGIONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.regionOption,
                  region === r && { backgroundColor: theme.primary },
                ]}
                onPress={() => handleRegionSelect(r)}
              >
                <Text
                  style={[
                    styles.regionText,
                    { color: region === r ? theme.background : theme.text },
                  ]}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Draggable Map Preview */}
        <View style={styles.mapContainer}>
          <Text style={[styles.label, { color: theme.primary }]}>
            Drag pin to fine-tune position
          </Text>
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
            onRegionChangeComplete={(region) => {
              // Optional: update coords if needed
            }}
          >
            <Marker
              coordinate={mapCoords}
              draggable
              onDragEnd={(e) => setMapCoords(e.nativeEvent.coordinate)}
            />
          </MapView>
        </View>

        <View style={styles.buttonRow}>
          <CustomButton
            title="Cancel"
            variant="outline"
            onPress={onClose}
            disabled={isLoading}
          />
          <CustomButton
            title="Save Location"
            onPress={handleSave}
            loading={isLoading}
            disabled={isLoading}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: { justifyContent: "flex-end", margin: 0 },
  container: {
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    padding: scale(20),
    maxHeight: "85%",
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: "700",
    marginBottom: verticalScale(4),
  },
  subtitle: { fontSize: moderateScale(13), marginBottom: verticalScale(20) },
  label: {
    fontSize: moderateScale(12),
    marginBottom: verticalScale(6),
    fontWeight: "600",
  },
  dropdownWrapper: { marginBottom: verticalScale(16) },
  dropdown: {
    maxHeight: verticalScale(200),
    borderWidth: 1,
    borderRadius: moderateScale(8),
    overflow: "hidden",
  },
  regionOption: {
    padding: scale(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  regionText: { fontSize: moderateScale(14) },
  mapContainer: {
    height: verticalScale(220),
    marginBottom: verticalScale(20),
    borderRadius: moderateScale(12),
    overflow: "hidden",
  },
  map: { flex: 1 },
  buttonRow: { flexDirection: "row", gap: scale(12) },
});
