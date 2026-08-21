// app/scan.tsx

import AnimatedScreen from "@/components/AnimatedScreen";
import BlurModal from "@/components/BlurModal";
import { CustomButton } from "@/components/CustomButton";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import API from "@/services/api";
import { formatPlanEndDate } from "@/services/subscriptionApi";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

const { width } = Dimensions.get("window");

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

type CropTypeEnum =
  | "MAIZE"
  | "CASSAVA"
  | "COCOA"
  | "PLANTAIN"
  | "TOMATO"
  | "PEPPER"
  | "RICE"
  | "YAM"
  | "GROUNDNUT"
  | "ONION"
  | "FREE";

const CROP_TYPES: { id: CropTypeEnum; name: string; icon: any }[] = [
  {
    id: "MAIZE",
    name: "Maize",
    icon: require("@/assets/images/maize_icon.png"),
  },
  {
    id: "CASSAVA",
    name: "Cassava",
    icon: require("@/assets/images/cassava_icon.png"),
  },
  {
    id: "COCOA",
    name: "Cocoa",
    icon: require("@/assets/images/cocoa_icon.png"),
  },
  {
    id: "PLANTAIN",
    name: "Plantain",
    icon: require("@/assets/images/plantain_icon.png"),
  },
  {
    id: "TOMATO",
    name: "Tomato",
    icon: require("@/assets/images/tomato_icon.png"),
  },
  {
    id: "PEPPER",
    name: "Pepper",
    icon: require("@/assets/images/pepper_icon.png"),
  },
  {
    id: "RICE",
    name: "Rice",
    icon: require("@/assets/images/rice_icon.png"),
  },
  {
    id: "YAM",
    name: "Yam",
    icon: require("@/assets/images/yam_icon.png"),
  },
  {
    id: "GROUNDNUT",
    name: "Groundnut",
    icon: require("@/assets/images/groundnut_icon.png"),
  },
  {
    id: "ONION",
    name: "Onion",
    icon: require("@/assets/images/onion_icon.png"),
  },
  {
    id: "FREE",
    name: "Others",
    icon: require("@/assets/images/onion_icon.png"),
  },
];

export default function ScanScreen() {
  const router = useRouter();
  const { action } = useLocalSearchParams<{ action?: string }>();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<CropTypeEnum | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // NEW ADDITION: subscription gate for free monthly scans
  const { status, fetchStatus } = useSubscriptionStore();
  const [limitModalVisible, setLimitModalVisible] = useState(false);

  const isPaid = Boolean(status?.isPaid);
  const remainingFreeScans = status?.remainingFreeScans ?? 0;
  const scansBlocked = !isPaid && remainingFreeScans <= 0;

  // NEW ADDITION: refresh plan status whenever scan screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchStatus();
    }, [fetchStatus]),
  );

  useEffect(() => {
    if (action === "camera") {
      guardScanOrRun(takePhoto);
    } else if (action === "gallery") {
      guardScanOrRun(uploadImage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  // NEW ADDITION: if free quota is finished, show upgrade modal instead of running the action
  const guardScanOrRun = (fn: () => void) => {
    if (scansBlocked) {
      setLimitModalVisible(true);
      return;
    }
    fn();
  };

  const takePhoto = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Camera access permission is required to take photos.",
        );
        return;
      }
      const pickerResult = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (
        !pickerResult.canceled &&
        pickerResult.assets &&
        pickerResult.assets.length > 0
      ) {
        setImageUri(pickerResult.assets[0].uri);
        setSelectedCrop(null);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to launch camera.");
    }
  };

  const uploadImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Gallery access permission is required to upload images.",
        );
        return;
      }
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (
        !pickerResult.canceled &&
        pickerResult.assets &&
        pickerResult.assets.length > 0
      ) {
        setImageUri(pickerResult.assets[0].uri);
        setSelectedCrop(null);
      }
    } catch (error) {
      console.error("Gallery error:", error);
      Alert.alert("Error", "Failed to open media library.");
    }
  };

  const handleSubmit = async () => {
    if (!imageUri) {
      Alert.alert("Error", "Please capture or select an image first.");
      return;
    }
    if (!selectedCrop) {
      Alert.alert(
        "Crop Type Required",
        "Please select a crop type from the list above before diagnosing.",
      );
      return;
    }

    // NEW ADDITION: client-side free scan gate (backend still enforces)
    if (scansBlocked) {
      setLimitModalVisible(true);
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      const filename = imageUri.split("/").pop() || "crop_image.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      formData.append("image", {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      formData.append("cropType", selectedCrop);

      const response = await API.post("/api/detect", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data && response.data.success) {
        // NEW ADDITION: refresh remaining free scans after a successful diagnosis
        fetchStatus();
        router.push({
          pathname: "/result",
          params: { data: JSON.stringify(response.data) },
        });
      } else {
        Alert.alert("Detection Failed", "No result returned from backend.");
      }
    } catch (error: any) {
      console.error("Detect error:", error);
      // NEW ADDITION: backend safety net when free quota is used up
      if (error.response?.data?.errorType === "SCAN_LIMIT_REACHED") {
        setLimitModalVisible(true);
      } else if (error.response?.data?.errorType === "CROP_MISMATCH") {
        const errorMsg =
          error.response.data.message ||
          "The uploaded image does not match the selected crop.";
        const detected = error.response.data.detectedCrop || "Unknown";
        Alert.alert(
          "Crop Mismatch",
          `${errorMsg}\n\nDetected Crop: ${detected}`,
        );
      } else {
        const errorMsg =
          error.response?.data?.message ||
          "An error occurred while uploading. Please check your network and try again.";
        Alert.alert("Error", errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderCropGrid = () => (
    <ScrollView
      style={styles.cropGridScroll}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <View style={styles.cropGrid}>
        {CROP_TYPES.map((crop) => {
          const isSelected = selectedCrop === crop.id;
          return (
            <TouchableOpacity
              key={crop.id}
              style={[
                styles.cropCard,
                { borderColor: theme.primary },
                isSelected && {
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                },
              ]}
              onPress={() => setSelectedCrop(crop.id)}
              disabled={isLoading}
            >
              <Image
                source={crop.icon}
                style={styles.cropIcon}
                contentFit="contain"
              />
              <Text
                style={[
                  styles.cropCardText,
                  { color: isSelected ? "#FFFFFF" : "#0ee14a" },
                ]}
              >
                {crop.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      {/* Header  */}
      <AnimatedScreen delay={0} style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          disabled={isLoading}
        >
          <Ionicons
            name="arrow-back-circle-outline"
            size={moderateScale(32)}
            color={theme.primary}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          Scan Your Crop
        </Text>
        <View style={styles.rightSpacer} />
      </AnimatedScreen>

      {/* NEW ADDITION: free remaining scans or paid plan line */}
      {!isPaid ? (
        <Text style={[styles.planHint, { color: theme.text }]}>
          {remainingFreeScans} of 5 free scans left this month
        </Text>
      ) : (
        <Text style={[styles.planHintPaid, { color: theme.primary }]}>
          Farmer plan active until {formatPlanEndDate(status?.endsAt)}
        </Text>
      )}

      {/* Image Container with Overlay */}
      <AnimatedScreen
        delay={80}
        style={[
          styles.imageContainer,
          !imageUri && styles.placeholderImageContainer,
        ]}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons
              name="camera-outline"
              size={moderateScale(48)}
              color={theme.icon}
            />
            <Text style={[styles.placeholderText, { color: theme.text }]}>
              No image selected
            </Text>
            <Text style={[styles.placeholderSubtext, { color: theme.text }]}>
              Use the camera button below or pick from your gallery
            </Text>
          </View>
        )}

        {/* Frame corners  */}
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />

        {imageUri && (
          <BlurView
            intensity={65}
            tint={colorScheme === "light" ? "light" : "dark"}
            style={styles.overlay}
          >
            <Text style={[styles.overlayTitle, { color: theme.text }]}>
              Select Crop Type
            </Text>
            {renderCropGrid()}
          </BlurView>
        )}
      </AnimatedScreen>

      {/* Instruction Text  */}
      <Text style={[styles.instructionText, { color: theme.text }]}>
        {imageUri
          ? selectedCrop
            ? "Ready! Tap the big Diagnose button below"
            : "Select your crop from the overlay above"
          : "Align the leaf in frame"}
      </Text>

      {/* Bottom Controls  */}
      <AnimatedScreen delay={160} style={styles.bottomControls}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => guardScanOrRun(uploadImage)}
          disabled={isLoading}
        >
          <Image
            source={require("@/assets/icons/galleryicon.png")}
            style={styles.controlIcon}
            contentFit="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.diagnoseButton,
            { borderColor: theme.primary },
            (!imageUri || !selectedCrop || isLoading) &&
              styles.diagnoseButtonDisabled,
          ]}
          onPress={() =>
            guardScanOrRun(() => {
              if (imageUri && selectedCrop) {
                handleSubmit();
              } else {
                takePhoto();
              }
            })
          }
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.primary} size="large" />
          ) : imageUri && selectedCrop ? (
            <View
              style={[
                styles.diagnoseButtonInner,
                { backgroundColor: theme.primary },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={moderateScale(32)}
                color="#FFFFFF"
              />
              <Text style={styles.diagnoseButtonText}>Diagnose</Text>
            </View>
          ) : (
            <View
              style={[
                styles.captureButtonInner,
                { backgroundColor: theme.primary },
              ]}
            >
              <Ionicons
                name="camera"
                size={moderateScale(32)}
                color="#FFFFFF"
              />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.iconButton,
            styles.invertButton,
            { borderColor: theme.text },
          ]}
          onPress={() => guardScanOrRun(takePhoto)}
          disabled={isLoading}
        >
          <Image
            source={require("@/assets/icons/invertcameraicon.png")}
            style={styles.controlIcon}
            contentFit="contain"
          />
        </TouchableOpacity>
      </AnimatedScreen>

      {/* NEW ADDITION: free scan limit modal (BlurModal locks background) */}
      <BlurModal
        visible={limitModalVisible}
        onClose={() => {
          if (!isLoading) setLimitModalVisible(false);
        }}
        closeOnBackdropPress={!isLoading}
      >
        <Text style={[styles.limitTitle, { color: theme.text }]}>
          Free scans used for this month
        </Text>
        <Text
          style={[
            styles.limitBody,
            { color: colorScheme === "light" ? "#4B5563" : "#9BA1A6" },
          ]}
        >
          You have used your 5 free scans for this month. Subscribe to Farmer
          Monthly for unlimited scans and crop weather insights.
        </Text>
        <CustomButton
          title="Subscribe · GHS 50"
          onPress={() => {
            setLimitModalVisible(false);
            router.push("/upgrade");
          }}
          disabled={isLoading}
        />
        <CustomButton
          title="Not now"
          variant="outline"
          onPress={() => setLimitModalVisible(false)}
          disabled={isLoading}
        />
      </BlurModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(8),
  },
  backButton: { padding: scale(4) },
  headerTitle: { fontSize: moderateScale(22), fontWeight: "700" },
  rightSpacer: { width: moderateScale(40) },

  // NEW ADDITION: plan status lines under header
  planHint: {
    textAlign: "center",
    fontSize: moderateScale(12),
    marginBottom: verticalScale(8),
    opacity: 0.85,
  },
  planHintPaid: {
    textAlign: "center",
    fontSize: moderateScale(12),
    marginBottom: verticalScale(8),
    fontWeight: "600",
  },

  imageContainer: {
    width: width - scale(32),
    height: verticalScale(380),
    alignSelf: "center",
    borderRadius: moderateScale(16),
    overflow: "hidden",
    position: "relative",
  },
  placeholderImageContainer: {
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  image: { width: "100%", height: "100%" },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: verticalScale(12),
    paddingHorizontal: scale(12),
  },
  overlayTitle: {
    fontSize: moderateScale(17),
    fontWeight: "700",
    marginBottom: verticalScale(10),
    textAlign: "center",
  },

  cropGridScroll: {
    width: "100%",
    flexGrow: 0,
  },
  cropGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: scale(10),
    width: "100%",
    paddingBottom: verticalScale(8),
  },
  cropCard: {
    width: (width - scale(100)) / 3,
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(6),
    borderRadius: moderateScale(14),
    borderWidth: 1.8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  cropIcon: {
    width: moderateScale(38),
    height: moderateScale(38),
    marginBottom: verticalScale(6),
  },
  cropCardText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    textAlign: "center",
  },

  corner: {
    position: "absolute",
    width: moderateScale(40),
    height: moderateScale(40),
    borderColor: "#E5E7EB",
  },
  topLeft: {
    top: moderateScale(20),
    left: moderateScale(20),
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  topRight: {
    top: moderateScale(20),
    right: moderateScale(20),
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bottomLeft: {
    bottom: moderateScale(20),
    left: moderateScale(20),
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bottomRight: {
    bottom: moderateScale(20),
    right: moderateScale(20),
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },

  instructionText: {
    textAlign: "center",
    fontSize: moderateScale(16),
    marginTop: verticalScale(12),
  },

  bottomControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    marginTop: verticalScale(20),
    paddingHorizontal: scale(20),
  },
  iconButton: { padding: scale(8) },
  invertButton: {
    borderWidth: 1,
    borderRadius: moderateScale(30),
    padding: moderateScale(8),
  },
  controlIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
    alignItems: "center",
  },

  diagnoseButton: {
    width: moderateScale(118),
    height: moderateScale(118),
    borderRadius: moderateScale(59),
    borderWidth: 3.5,
    alignItems: "center",
    justifyContent: "center",
  },
  diagnoseButtonDisabled: { opacity: 0.55 },
  diagnoseButtonInner: {
    width: moderateScale(96),
    height: moderateScale(96),
    borderRadius: moderateScale(48),
    alignItems: "center",
    justifyContent: "center",
    gap: verticalScale(6),
  },
  diagnoseButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(15),
    fontWeight: "700",
  },
  captureButtonInner: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
  },

  placeholderContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(20),
  },
  placeholderText: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    marginTop: verticalScale(12),
    textAlign: "center",
  },
  placeholderSubtext: {
    fontSize: moderateScale(12),
    fontWeight: "400",
    marginTop: verticalScale(6),
    textAlign: "center",
    lineHeight: verticalScale(16),
    opacity: 0.7,
  },

  // NEW ADDITION: limit modal text styles
  limitTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    marginBottom: verticalScale(8),
    textAlign: "center",
  },
  limitBody: {
    fontSize: moderateScale(13),
    textAlign: "center",
    marginBottom: verticalScale(16),
    lineHeight: verticalScale(18),
  },
});
