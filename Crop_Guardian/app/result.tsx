import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react"; // UPDATED: Hooks for TTS
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

// NEW ADDITION: Modern expo-audio + status hook
import API from "@/services/api"; // UPDATED: For proxy call
import { useAuthStore } from "@/stores/authStore"; // UPDATED: Language check
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

export default function ResultScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams<{ data?: string }>();

  const user = useAuthStore((state) => state.user);

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

  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const isMounted = useRef(true);

  useEffect(() => {
    setIsPlaying(status.playing || false);
  }, [status.playing]);

  // // NEW ADDITION: Cleanup
  // useEffect(() => {
  //   return () => {
  //     player.pause();
  //   };
  // }, [player]);

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

  // NEW ADDITION: Secure Proxy TTS (recommended)
  const toggleTts = async () => {
    if (
      !scanResult
      // || user?.language !== "tw"
    )
      return;

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
      const response = await API.post("api/tts/generate", {
        text: descriptionText,
        language: "tw",
      });

      if (
        response.data.success &&
        response.data.audioBase64 &&
        isMounted.current
      ) {
        const audioUri = `data:audio/wav;base64,${response.data.audioBase64}`;
        player.replace(audioUri);
        await player.play();
      } else {
        console.error("TTS failed:", response.data.message);
      }
    } catch (error) {
      console.error("TTS Error:", error);
    } finally {
      if (isMounted.current) {
        setIsTtsLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconButton}
            disabled={isTtsLoading}
          >
            <Ionicons
              name="arrow-back-circle-outline"
              size={moderateScale(32)}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.circleIconBg}>
              <Ionicons
                name="bookmark"
                size={moderateScale(18)}
                color="#FFFFFF"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleIconBg}>
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
            {user?.language === "tw" ||
              (user?.language === "en" && (
                <TouchableOpacity
                  onPress={toggleTts}
                  disabled={isTtsLoading}
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
              ))}
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
            style={styles.primaryButton}
            disabled={isTtsLoading}
          >
            <Text style={styles.primaryButtonText}>View Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleListen}
            disabled={isTtsLoading}
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

  // NEW ADDITION: TTS styles
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  ttsButton: { padding: scale(4) },
});
