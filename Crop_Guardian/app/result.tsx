// app/result.tsx

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal, //  for the suggest-crop modal
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

//  BlurView for modal backdrop blur
import { BlurView } from "expo-blur";

import API, { EXPO_PUBLIC_GHANANLP_API_KEY } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import axios from "axios";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

// TypeScript: describe the shape of the suggestAddToMyCrops object
// so TypeScript can validate every access to its properties.
interface SuggestCrop {
  suggested: boolean;
  cropType: string;
  message: string;
}

export default function ResultScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams<{ data?: string }>();

  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);

  console.log("language", user?.language);

  // TypeScript: scanResult is typed as any because the backend response
  // shape may grow over time — strict typing is handled via SuggestCrop below.
  let scanResult: any = null;
  if (data) {
    try {
      scanResult = JSON.parse(data);
    } catch (e) {
      console.error("Error parsing result data:", e);
    }
  }

  const backgroundColor = "#083D04";
  const cardColor = "rgba(255, 255, 255, 0.1)";
  const redColor = "#FF4D4D";
  const brightGreenColor = "#4ADE80";

  // -- TTS state (NO CHANGES) --
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const isMounted = useRef(true);

  // --  Suggest-crop modal state --
  // showSuggestModal: controls modal visibility
  // isAddingCrop: true while the POST /api/crops/my-crops call is in flight
  // addCropSuccess: true once the crop was added successfully
  // addCropError: holds an error message string if the call fails
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [isAddingCrop, setIsAddingCrop] = useState(false);
  const [addCropSuccess, setAddCropSuccess] = useState(false);
  const [addCropError, setAddCropError] = useState<string | null>(null);

  // TypeScript: cast the suggest object through our SuggestCrop interface
  // so downstream code gets proper type checking.
  const suggestPayload: SuggestCrop | null =
    scanResult?.suggestAddToMyCrops ?? null;

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    setIsPlaying(status.playing || false);
  }, [status.playing]);

  //  Auto-open the modal when the screen mounts if the backend
  // returned suggested === true. We use a short delay (300ms) so the result
  // screen has time to finish rendering before the modal appears -- this feels
  // more natural to the user than an instant pop-up.
  useEffect(() => {
    if (suggestPayload?.suggested === true) {
      const timer = setTimeout(() => {
        setShowSuggestModal(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [suggestPayload?.suggested]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      try {
        player.pause();
      } catch (e) {
        console.log("Audio cleanup completed (expected on unmount)");
      }
    };
  }, [player]);

  //  formatting/action helpers
  const formatConfidence = (conf: any) => {
    if (conf === undefined || conf === null) return "92%";
    const val = Number(conf);
    if (isNaN(val)) return String(conf);
    if (val <= 1) return `${(val * 100).toFixed(0)}%`;
    return `${val.toFixed(0)}%`;
  };

  const getActions = () => {
    if (!scanResult) {
      return [
        "Remove affected leaves",
        "Apply recommended fungicide",
        "Ensure good ventilation",
        "Avoid overhead watering",
      ];
    }
    const actions: string[] = [];
    if (scanResult.organicTreatments)
      actions.push(`Organic: ${scanResult.organicTreatments}`);
    if (scanResult.chemicalOptions)
      actions.push(`Chemical: ${scanResult.chemicalOptions}`);
    if (scanResult.prevention)
      actions.push(`Prevention: ${scanResult.prevention}`);
    return actions.length > 0 ? actions : ["No recommendations provided."];
  };

  const handleListen = () => {
    router.push({
      pathname: "/listening",
      params: {
        diseaseName: scanResult?.diseaseName || "Unknown",
        recommendations: getActions().join(" "),
      },
    });
  };

  //  TTS logic
  // UPDATED: this now calls GhanaNLP's Khaya AI TTS endpoint directly from the
  // device instead of going through our Render backend. We're doing this because
  // Cloudflare in front of translation-api.ghananlp.org blocks Render's
  // datacenter IP range but allows normal mobile/residential IPs through, so
  // calling it from the phone itself avoids the block entirely.
  const toggleTts = async () => {
    if (!scanResult) return;

    const descriptionText =
      scanResult.symptoms ||
      scanResult.causes ||
      "No detailed description available for this detection.";

    if (isPlaying) {
      player.pause();
      return;
    }

    setIsTtsLoading(true);
    try {
      // NEW ADDITION: calling GhanaNLP directly with axios (imported separately
      // from our own `API` instance, since this request should NOT include our
      // own backend's Authorization header or baseURL).
      const response = await axios.post(
        "https://translation-api.ghananlp.org/tts/v1/synthesize",
        {
          text: descriptionText,
          language: "tw",
        },
        {
          headers: {
            "Content-Type": "application/json",
            // TypeScript: process.env.EXPO_PUBLIC_* is typed as string | undefined
            // by default, so we fall back to an empty string if it's somehow
            // missing at build time, rather than letting `undefined` reach the header.
            "Ocp-Apim-Subscription-Key": EXPO_PUBLIC_GHANANLP_API_KEY || "",
          },
          responseType: "arraybuffer",
        },
      );

      // Guard: make sure we actually got audio back, not an HTML/JSON error page.
      const contentType = response.headers["content-type"] || "";
      if (!contentType.includes("audio")) {
        console.error("TTS Error: unexpected content-type:", contentType);
        return;
      }

      // Convert the raw ArrayBuffer to base64 so it can be used as a data URI.
      // React Native doesn't have Node's Buffer by default, so we do this
      // manually with a small binary-to-base64 loop instead of Buffer.from().
      const bytes = new Uint8Array(response.data);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const audioBase64 = btoa(binary);

      if (isMounted.current) {
        const audioUri = `data:audio/wav;base64,${audioBase64}`;
        player.replace(audioUri);
        await player.play();
      }
    } catch (error) {
      console.error("TTS Error:", error);
    } finally {
      if (isMounted.current) {
        setIsTtsLoading(false);
      }
    }
  };

  //  Calls POST /api/crops/my-crops with the cropType from
  // the backend suggest payload. All interactive elements in the modal are
  // disabled while this is in-flight (isAddingCrop === true).
  const handleAddToCrops = async () => {
    if (!suggestPayload?.cropType) return;

    setIsAddingCrop(true);
    setAddCropError(null);

    try {
      const response = await API.post("/api/crops/my-crops", {
        cropType: suggestPayload.cropType,
      });

      if (response.data?.success) {
        setAddCropSuccess(true);
      } else {
        // Backend returned a non-success without throwing -- treat as error
        setAddCropError(
          response.data?.message || "Could not add crop. Please try again.",
        );
      }
    } catch (error: any) {
      // TypeScript: error is typed as any because Axios errors don't have a
      // fixed shape at compile time; we narrow to the .response path manually.
      const serverMessage = error?.response?.data?.message;
      setAddCropError(
        serverMessage || "Something went wrong. Please try again.",
      );
    } finally {
      setIsAddingCrop(false);
    }
  };

  //  Dismiss modal and reset all modal-specific state so it
  // starts fresh if somehow re-opened in the same session.
  const handleDismissModal = () => {
    if (isAddingCrop) return; // Block dismiss while a request is in-flight
    setShowSuggestModal(false);
    setAddCropSuccess(false);
    setAddCropError(null);
  };

  return (
    // TypeScript: SafeAreaView accepts a standard ViewStyle, backgroundColor
    // is a valid string here because React Native accepts any CSS color string.
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      {/*
         Suggest-crop modal
        ---------------------------------
        - transparent={true} keeps the native Modal container clear so our
          BlurView fills the full screen as the backdrop.
        - animationType="fade" gives a smooth entrance instead of a slide
          which would feel jarring right after seeing results.
        - statusBarTranslucent lets the blur extend behind the status bar on
          Android so the overlay truly covers the whole screen.
        - All buttons and inputs inside are disabled when isAddingCrop is true.
      */}
      <Modal
        visible={showSuggestModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleDismissModal}
      >
        {/* BlurView fills the whole screen and acts as the dimmed backdrop.
            intensity 55 gives a strong enough blur to push the background into
            the periphery without making it invisible. */}
        <BlurView intensity={55} tint="dark" style={styles.modalBackdrop}>
          {/* Tapping the backdrop area (outside the card) dismisses the modal,
              but only when no request is in-flight. */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleDismissModal}
            disabled={isAddingCrop}
          />

          {/* Modal card -- sits on top of the blur backdrop */}
          <View style={styles.modalCard}>
            {/* Icon at the top of the card */}
            <View style={styles.modalIconWrapper}>
              <Ionicons
                name={addCropSuccess ? "checkmark-circle" : "leaf"}
                size={moderateScale(40)}
                color={addCropSuccess ? "#4ADE80" : "#094A04"}
              />
            </View>

            {addCropSuccess ? (
              /*
                SUCCESS STATE: shown after the crop was added.
                Displays a confirmation message and a single "Done" button.
              */
              <>
                <Text style={styles.modalTitle}>Crop Added!</Text>
                <Text style={styles.modalMessage}>
                  {suggestPayload?.cropType} has been added to My Crops. You can
                  now track its history and get personalised insights.
                </Text>
                <TouchableOpacity
                  style={styles.modalPrimaryButton}
                  onPress={handleDismissModal}
                >
                  <Text style={styles.modalPrimaryButtonText}>Done</Text>
                </TouchableOpacity>
              </>
            ) : (
              /*
                DEFAULT / ERROR STATE: shown immediately when the modal opens,
                and also if the API call returns an error.
              */
              <>
                <Text style={styles.modalTitle}>Add to My Crops?</Text>

                {/* The message string comes directly from the backend payload */}
                <Text style={styles.modalMessage}>
                  {suggestPayload?.message}
                </Text>

                {/* Error banner -- only shown when addCropError is set */}
                {addCropError ? (
                  <View style={styles.errorBanner}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={moderateScale(16)}
                      color="#FF4D4D"
                    />
                    <Text style={styles.errorBannerText}>{addCropError}</Text>
                  </View>
                ) : null}

                {/* Primary CTA: adds the crop */}
                <TouchableOpacity
                  style={[
                    styles.modalPrimaryButton,
                    isAddingCrop && styles.buttonDisabled,
                  ]}
                  onPress={handleAddToCrops}
                  disabled={isAddingCrop}
                >
                  {isAddingCrop ? (
                    <ActivityIndicator size="small" color="#FFFFE7" />
                  ) : (
                    <Text style={styles.modalPrimaryButtonText}>
                      Yes, Add Crop
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Secondary CTA: dismisses the modal without adding */}
                <TouchableOpacity
                  style={[
                    styles.modalSecondaryButton,
                    isAddingCrop && styles.buttonDisabled,
                  ]}
                  onPress={handleDismissModal}
                  disabled={isAddingCrop}
                >
                  <Text style={styles.modalSecondaryButtonText}>Not Now</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </BlurView>
      </Modal>

      {/* ---- The rest of the screen is unchanged below ---- */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        //  Prevent scroll interaction with background while modal
        // is open. scrollEnabled false when modal is showing avoids the user
        // accidentally interacting with content behind the overlay.
        scrollEnabled={!showSuggestModal}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconButton}
            disabled={isTtsLoading || showSuggestModal}
          >
            <Ionicons
              name="arrow-back-circle-outline"
              size={moderateScale(32)}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.circleIconBg}
              disabled={showSuggestModal}
            >
              <Ionicons
                name="bookmark"
                size={moderateScale(18)}
                color="#FFFFFF"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.circleIconBg}
              disabled={showSuggestModal}
            >
              <Ionicons
                name="share-social"
                size={moderateScale(18)}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.mainTitle}>Result</Text>

        {/* Disease Info Card */}
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          {scanResult?.imageUrl ? (
            <Image
              source={{ uri: scanResult.imageUrl }}
              style={styles.diseaseImage}
              contentFit="cover"
            />
          ) : (
            <Image
              source={require("@/assets/images/septorialeaf.png")}
              style={styles.diseaseImage}
              contentFit="cover"
            />
          )}
          <View style={styles.diseaseInfo}>
            <Text style={[styles.alertText, { color: redColor }]}>
              Disease Detected
            </Text>
            <Text style={styles.diseaseName}>
              {scanResult?.diseaseName || "Unknown"}
            </Text>
            <Text style={styles.diseaseSubtitle}>
              {scanResult?.detectedCrop
                ? `On ${scanResult.detectedCrop}`
                : "No specific crop identified"}
            </Text>
            <View style={styles.confidenceRow}>
              <Text style={styles.confidenceLabel}>Confidence: </Text>
              <Text
                style={[styles.confidenceValue, { color: brightGreenColor }]}
              >
                {formatConfidence(scanResult?.confidence)}
              </Text>
            </View>
          </View>
        </View>

        {/* Description Card with TTS */}
        <View
          style={[
            styles.card,
            { backgroundColor: cardColor, flexDirection: "column" },
          ]}
        >
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Description</Text>
            {user?.language === "tw" && (
              <TouchableOpacity
                onPress={toggleTts}
                disabled={isTtsLoading || showSuggestModal}
                style={styles.ttsButton}
              >
                {isTtsLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons
                    name={isPlaying ? "pause-circle" : "volume-medium"}
                    size={moderateScale(24)}
                    color="#FFFFFF"
                  />
                )}
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.cardText}>
            {scanResult?.symptoms ||
              scanResult?.causes ||
              "No detailed description available for this detection."}
          </Text>
        </View>

        {/* Recommended Actions */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: cardColor,
              flexDirection: "column",
              marginBottom: verticalScale(30),
            },
          ]}
        >
          <Text style={styles.cardTitle}>Recommended Actions</Text>
          {getActions().map((action, index) => (
            <View key={index} style={styles.actionItem}>
              <Ionicons
                name="checkmark"
                size={moderateScale(20)}
                color="#FFFFFF"
              />
              <Text style={styles.actionText}>{action}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              showSuggestModal && styles.buttonDisabled,
            ]}
            disabled={isTtsLoading || showSuggestModal}
          >
            <Text style={styles.primaryButtonText}>View Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              showSuggestModal && styles.buttonDisabled,
            ]}
            onPress={handleListen}
            disabled={isTtsLoading || showSuggestModal}
          >
            <Ionicons
              name="volume-medium"
              size={moderateScale(20)}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
            <Text style={styles.secondaryButtonText}>Listen(Twi)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContainer: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(30),
  },

  // -- NO CHANGES: existing styles --
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(10),
  },
  iconButton: { padding: scale(4) },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  circleIconBg: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  mainTitle: {
    fontSize: moderateScale(28),
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: verticalScale(20),
  },
  card: {
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: verticalScale(16),
    flexDirection: "row",
  },
  diseaseImage: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(8),
  },
  diseaseInfo: {
    flex: 1,
    marginLeft: scale(16),
    justifyContent: "center",
  },
  alertText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    marginBottom: verticalScale(4),
  },
  diseaseName: {
    color: "#FFFFFF",
    fontSize: moderateScale(20),
    fontWeight: "600",
    marginBottom: verticalScale(2),
  },
  diseaseSubtitle: {
    color: "#E5E7EB",
    fontSize: moderateScale(14),
    marginBottom: verticalScale(10),
  },
  confidenceRow: { flexDirection: "row", alignItems: "center" },
  confidenceLabel: {
    color: "#FFFFFF",
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
  confidenceValue: { fontSize: moderateScale(13), fontWeight: "700" },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: moderateScale(16),
    fontWeight: "600",
  },
  cardText: {
    color: "#E5E7EB",
    fontSize: moderateScale(14),
    lineHeight: moderateScale(22),
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    marginLeft: scale(12),
  },
  bottomButtonsContainer: { gap: verticalScale(16) },
  primaryButton: {
    backgroundColor: "#FFFFE7",
    borderRadius: moderateScale(30),
    paddingVertical: verticalScale(14),
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#094A04",
    fontSize: moderateScale(16),
    fontWeight: "700",
  },
  secondaryButton: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: moderateScale(30),
    paddingVertical: verticalScale(14),
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(16),
    fontWeight: "700",
  },
  buttonIcon: { marginRight: scale(8) },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  ttsButton: { padding: scale(4) },

  // --  modal styles --

  // Full-screen BlurView that acts as the backdrop
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(24),
  },

  // The white card that floats on top of the blur
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(20),
    padding: moderateScale(24),
    width: "100%",
    alignItems: "center",
    // Subtle shadow so the card lifts off the blurred background
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },

  // Circular icon container at the top of the card
  modalIconWrapper: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    backgroundColor: "#F0FFF4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(16),
  },

  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: "700",
    color: "#094A04",
    textAlign: "center",
    marginBottom: verticalScale(10),
  },

  modalMessage: {
    fontSize: moderateScale(14),
    color: "#374151",
    textAlign: "center",
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(20),
  },

  // Red error banner shown below the message when the API call fails
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    marginBottom: verticalScale(14),
    gap: scale(6),
    width: "100%",
  },
  errorBannerText: {
    color: "#FF4D4D",
    fontSize: moderateScale(13),
    flex: 1,
  },

  // Green "Yes, Add Crop" button
  modalPrimaryButton: {
    backgroundColor: "#094A04",
    borderRadius: moderateScale(30),
    paddingVertical: verticalScale(13),
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(10),
    minHeight: verticalScale(48),
  },
  modalPrimaryButtonText: {
    color: "#FFFFE7",
    fontSize: moderateScale(15),
    fontWeight: "700",
  },

  // Ghost "Not Now" button
  modalSecondaryButton: {
    borderRadius: moderateScale(30),
    paddingVertical: verticalScale(13),
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    minHeight: verticalScale(48),
  },
  modalSecondaryButtonText: {
    color: "#6B7280",
    fontSize: moderateScale(15),
    fontWeight: "600",
  },

  // Applied to any button that should appear disabled
  buttonDisabled: {
    opacity: 0.5,
  },
});
