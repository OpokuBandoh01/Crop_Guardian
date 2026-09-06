// app/result.tsx

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

import { BlurView } from "expo-blur";

import API, { EXPO_PUBLIC_GHANANLP_API_KEY } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import axios from "axios";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

import AnimatedScreen from "@/components/AnimatedScreen";
import { cacheNewDetection } from "@/services/detectionApi";
import * as Speech from "expo-speech";

interface SuggestCrop {
  suggested: boolean;
  cropType: string;
  message: string;
}

type TtsSection = "description" | "actions";

export default function ResultScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams<{ data?: string }>();

  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);

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

  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [isAddingCrop, setIsAddingCrop] = useState(false);
  const [addCropSuccess, setAddCropSuccess] = useState(false);
  const [addCropError, setAddCropError] = useState<string | null>(null);

  const suggestPayload: SuggestCrop | null =
    scanResult?.suggestAddToMyCrops ?? null;

  const [isDescriptionTtsLoading, setIsDescriptionTtsLoading] = useState(false);
  const [isDescriptionPlaying, setIsDescriptionPlaying] = useState(false);
  const [isActionsTtsLoading, setIsActionsTtsLoading] = useState(false);
  const [isActionsPlaying, setIsActionsPlaying] = useState(false);

  const isTwi = user?.language === "tw";

  const [descriptionTtsError, setDescriptionTtsError] = useState<string | null>(
    null,
  );
  const [actionsTtsError, setActionsTtsError] = useState<string | null>(null);

  const [descriptionSpeechProgress, setDescriptionSpeechProgress] = useState(0);
  const [actionsSpeechProgress, setActionsSpeechProgress] = useState(0);

  const isAnyTtsLoading = isDescriptionTtsLoading || isActionsTtsLoading;

  const descriptionPlayer = useAudioPlayer();
  const descriptionStatus = useAudioPlayerStatus(descriptionPlayer);
  const actionsPlayer = useAudioPlayer();
  const actionsStatus = useAudioPlayerStatus(actionsPlayer);

  const isMounted = useRef(true);

  const audioCacheRef = useRef<Partial<Record<TtsSection, string>>>({});

  const hasAutoPlayedRef = useRef(false);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const isAnnouncingNameRef = useRef(false);

  useEffect(() => {
    if (!isAnnouncingNameRef.current) {
      setIsDescriptionPlaying(descriptionStatus.playing || false);
    }
  }, [descriptionStatus.playing]);

  useEffect(() => {
    setIsActionsPlaying(actionsStatus.playing || false);
  }, [actionsStatus.playing]);

  useEffect(() => {
    if (suggestPayload?.suggested === true) {
      const timer = setTimeout(() => {
        setShowSuggestModal(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [suggestPayload?.suggested]);

  const playersRef = useRef({ descriptionPlayer, actionsPlayer });
  playersRef.current = { descriptionPlayer, actionsPlayer };

  useEffect(() => {
    return () => {
      isMounted.current = false;
      try {
        playersRef.current.descriptionPlayer.pause();
        playersRef.current.actionsPlayer.pause();
        Speech.stop();
      } catch (e) {
        console.log("Audio cleanup completed (expected on unmount)");
      }
    };
  }, []);

  useEffect(() => {
    if (!scanResult?.success || !scanResult?.id) return;

    cacheNewDetection({
      id: scanResult.id,
      imageUrl: scanResult.imageUrl,
      cropType: scanResult.cropType ?? scanResult.detectedCropEnum ?? "FREE",
      diseaseName: scanResult.diseaseName,
      confidence: scanResult.confidence,
      symptoms: scanResult.symptoms,
      causes: scanResult.causes,
      organicTreatments: scanResult.organicTreatments,
      chemicalOptions: scanResult.chemicalOptions,
      prevention: scanResult.prevention,
      localNotes: scanResult.localNotes,
      possibleDiseases: scanResult.possibleDiseases,
      aiProvider: scanResult.aiProvider,
      createdAt: scanResult.timestamp || scanResult.createdAt,
    }).catch((err) => {
      // Non-blocking — caching must never break the result screen
      console.warn("cacheNewDetection failed:", err);
    });
  }, [scanResult?.id]);

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

  const descriptionText: string =
    scanResult?.symptoms ||
    scanResult?.causes ||
    "No detailed description available for this detection.";

  const actionsText: string = getActions().join(". ");

  const MAX_TTS_CHARACTERS = 350;
  const truncateForTts = (text: string): string => {
    if (text.length <= MAX_TTS_CHARACTERS) return text;

    const cut = text.slice(0, MAX_TTS_CHARACTERS);
    const lastPeriodIndex = cut.lastIndexOf(".");

    if (lastPeriodIndex > MAX_TTS_CHARACTERS * 0.4) {
      return cut.slice(0, lastPeriodIndex + 1);
    }
    return `${cut.trim()}...`;
  };

  const synthesizeSpeech = async (text: string): Promise<string> => {
    const response = await axios.post(
      "https://translation-api.ghananlp.org/tts/v1/synthesize",
      {
        text: truncateForTts(text),
        language: "tw",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": EXPO_PUBLIC_GHANANLP_API_KEY || "",
        },
        responseType: "arraybuffer",
        timeout: 20000,
      },
    );

    const contentType = response.headers["content-type"] || "";
    if (!contentType.includes("audio")) {
      throw new Error(
        `Unexpected content-type from TTS endpoint: ${contentType}`,
      );
    }

    const bytes = new Uint8Array(response.data);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const audioBase64 = btoa(binary);
    return `data:audio/wav;base64,${audioBase64}`;
  };

  const synthesizeSpeechWithRetry = async (
    text: string,
    maxAttempts: number = 2,
  ): Promise<string> => {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await synthesizeSpeech(text);
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
    throw lastError;
  };

  const speakEnglishSection = (section: TtsSection) => {
    const isPlaying =
      section === "description" ? isDescriptionPlaying : isActionsPlaying;
    const setPlaying =
      section === "description" ? setIsDescriptionPlaying : setIsActionsPlaying;
    const setOtherPlaying =
      section === "description" ? setIsActionsPlaying : setIsDescriptionPlaying;
    const setError =
      section === "description" ? setDescriptionTtsError : setActionsTtsError;
    const setProgress =
      section === "description"
        ? setDescriptionSpeechProgress
        : setActionsSpeechProgress;
    const setOtherProgress =
      section === "description"
        ? setActionsSpeechProgress
        : setDescriptionSpeechProgress;
    const text = section === "description" ? descriptionText : actionsText;

    Speech.stop();
    setOtherPlaying(false);
    setOtherProgress(0);

    if (isPlaying) {
      setPlaying(false);
      setProgress(0);
      return;
    }

    if (!text) return;

    setError(null);
    setPlaying(true);
    setProgress(0);

    Speech.speak(text, {
      language: "en-US",
      onDone: () => {
        setPlaying(false);
        setProgress(0);
      },
      onStopped: () => {
        setPlaying(false);
        setProgress(0);
      },
      onError: () => {
        setPlaying(false);
        setProgress(0);
        setError("Could not play audio. Tap to try again.");
      },
      onBoundary: (boundary: any) => {
        if (text.length > 0 && typeof boundary?.charIndex === "number") {
          setProgress(Math.min(boundary.charIndex / text.length, 1));
        }
      },
    });
  };

  const handleSectionTts = async (section: TtsSection) => {
    if (!isTwi) {
      speakEnglishSection(section);
      return;
    }

    const player =
      section === "description" ? descriptionPlayer : actionsPlayer;
    const otherPlayer =
      section === "description" ? actionsPlayer : descriptionPlayer;
    const isPlaying =
      section === "description" ? isDescriptionPlaying : isActionsPlaying;
    const setLoading =
      section === "description"
        ? setIsDescriptionTtsLoading
        : setIsActionsTtsLoading;
    const setError =
      section === "description" ? setDescriptionTtsError : setActionsTtsError;
    const text = section === "description" ? descriptionText : actionsText;

    if (isPlaying) {
      player.pause();
      return;
    }

    otherPlayer.pause();

    setError(null);

    const cachedUri = audioCacheRef.current[section];
    if (cachedUri) {
      try {
        await player.seekTo(0);
      } catch (e) {}
      await player.play();
      return;
    }

    if (!text) return;

    setLoading(true);
    try {
      const audioUri = await synthesizeSpeechWithRetry(text);
      audioCacheRef.current[section] = audioUri;
      if (isMounted.current) {
        player.replace(audioUri);
        await player.play();
      }
    } catch (error) {
      console.error(`TTS Error (${section}):`, error);
      if (isMounted.current) {
        setError("Could not load audio. Tap to try again.");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const descriptionPlaybackIdRef = useRef(0);

  const speakOnDevice = (
    text: string,
    language: string,
    onProgress?: (progress: number) => void,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      Speech.speak(text, {
        language,
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: (error) =>
          reject(error instanceof Error ? error : new Error("Speech error")),

        onBoundary: onProgress
          ? (boundary: any) => {
              if (text.length > 0 && typeof boundary?.charIndex === "number") {
                onProgress(Math.min(boundary.charIndex / text.length, 1));
              }
            }
          : undefined,
      });
    });
  };

  const handleDescriptionTts = async () => {
    if (isDescriptionPlaying) {
      isAnnouncingNameRef.current = false;
      descriptionPlaybackIdRef.current += 1;
      Speech.stop();
      descriptionPlayer.pause();
      setIsDescriptionPlaying(false);
      setDescriptionSpeechProgress(0);
      return;
    }

    if (isTwi) {
      actionsPlayer.pause();
    } else {
      Speech.stop();
    }
    setIsActionsPlaying(false);
    setActionsSpeechProgress(0);

    setDescriptionTtsError(null);
    setDescriptionSpeechProgress(0);
    setIsDescriptionPlaying(true);

    const playbackId = ++descriptionPlaybackIdRef.current;
    const diseaseName = scanResult?.diseaseName || "Unknown disease";

    try {
      isAnnouncingNameRef.current = true;
      await speakOnDevice(`${diseaseName}.`, "en-US");
      isAnnouncingNameRef.current = false;

      if (
        playbackId !== descriptionPlaybackIdRef.current ||
        !isMounted.current
      ) {
        return;
      }

      if (isTwi) {
        const cachedUri = audioCacheRef.current.description;
        if (cachedUri) {
          try {
            await descriptionPlayer.seekTo(0);
          } catch (e) {
            // Safe to ignore; play() below still works even if seek fails.
          }
          await descriptionPlayer.play();
          return;
        }

        if (!descriptionText) {
          setIsDescriptionPlaying(false);
          return;
        }

        setIsDescriptionTtsLoading(true);
        try {
          const audioUri = await synthesizeSpeechWithRetry(descriptionText);
          audioCacheRef.current.description = audioUri;
          if (
            playbackId === descriptionPlaybackIdRef.current &&
            isMounted.current
          ) {
            descriptionPlayer.replace(audioUri);
            await descriptionPlayer.play();
          }
        } catch (error) {
          console.error("TTS Error (description):", error);
          if (
            playbackId === descriptionPlaybackIdRef.current &&
            isMounted.current
          ) {
            setDescriptionTtsError("Could not load audio. Tap to try again.");
            setIsDescriptionPlaying(false);
          }
        } finally {
          if (
            playbackId === descriptionPlaybackIdRef.current &&
            isMounted.current
          ) {
            setIsDescriptionTtsLoading(false);
          }
        }
      } else {
        if (descriptionText) {
          await speakOnDevice(descriptionText, "en-US", (progress) => {
            if (playbackId === descriptionPlaybackIdRef.current) {
              setDescriptionSpeechProgress(progress);
            }
          });
        }
        if (playbackId === descriptionPlaybackIdRef.current) {
          setIsDescriptionPlaying(false);
          setDescriptionSpeechProgress(0);
        }
      }
    } catch (error) {
      console.error("TTS Error (description name announcement):", error);
      isAnnouncingNameRef.current = false;
      if (
        playbackId === descriptionPlaybackIdRef.current &&
        isMounted.current
      ) {
        setDescriptionTtsError("Could not play audio. Tap to try again.");
        setIsDescriptionPlaying(false);
      }
    }
  };

  useEffect(() => {
    if (!hasAutoPlayedRef.current && scanResult) {
      hasAutoPlayedRef.current = true;
      const timer = setTimeout(() => {
        handleDescriptionTts();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [scanResult, user?.language]);

  const descriptionProgress = isTwi
    ? descriptionStatus.duration > 0
      ? Math.min(descriptionStatus.currentTime / descriptionStatus.duration, 1)
      : 0
    : descriptionSpeechProgress;
  const actionsProgress = isTwi
    ? actionsStatus.duration > 0
      ? Math.min(actionsStatus.currentTime / actionsStatus.duration, 1)
      : 0
    : actionsSpeechProgress;

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
        setAddCropError(
          response.data?.message || "Could not add crop. Please try again.",
        );
      }
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message;
      setAddCropError(
        serverMessage || "Something went wrong. Please try again.",
      );
    } finally {
      setIsAddingCrop(false);
    }
  };

  const handleDismissModal = () => {
    if (isAddingCrop) return;
    setShowSuggestModal(false);
    setAddCropSuccess(false);
    setAddCropError(null);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      {/* Suggest-crop modal */}
      <Modal
        visible={showSuggestModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleDismissModal}
      >
        <BlurView intensity={55} tint="dark" style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleDismissModal}
            disabled={isAddingCrop}
          />

          <View style={styles.modalCard}>
            <View style={styles.modalIconWrapper}>
              <Ionicons
                name={addCropSuccess ? "checkmark-circle" : "leaf"}
                size={moderateScale(40)}
                color={addCropSuccess ? "#4ADE80" : "#094A04"}
              />
            </View>

            {addCropSuccess ? (
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
              <>
                <Text style={styles.modalTitle}>Add to My Crops?</Text>

                <Text style={styles.modalMessage}>
                  {suggestPayload?.message}
                </Text>

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

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!showSuggestModal}
      >
        {/* Header */}
        <AnimatedScreen delay={0} style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconButton}
            disabled={isAnyTtsLoading || showSuggestModal}
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
        </AnimatedScreen>

        <Text style={styles.mainTitle}>Result</Text>

        {/* Disease Info Card  */}
        <AnimatedScreen
          delay={80}
          style={[styles.card, { backgroundColor: cardColor }]}
        >
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
        </AnimatedScreen>

        {/* Description Card with TTS */}
        <AnimatedScreen
          delay={160}
          style={[
            styles.card,
            { backgroundColor: cardColor, flexDirection: "column" },
          ]}
        >
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Description</Text>

            <TouchableOpacity
              onPress={handleDescriptionTts}
              disabled={isAnyTtsLoading || showSuggestModal}
              style={styles.ttsButton}
            >
              {isDescriptionTtsLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name={isDescriptionPlaying ? "pause-circle" : "volume-medium"}
                  size={moderateScale(24)}
                  color="#FFFFFF"
                />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.cardText}>{descriptionText}</Text>

          {isDescriptionPlaying && (
            <View style={styles.nowPlayingRow}>
              <Ionicons
                name="ear-outline"
                size={moderateScale(13)}
                color="#4ADE80"
              />
              <Text style={styles.nowPlayingText}>
                {isTwi ? "Playing in Twi" : "Playing"}
              </Text>
            </View>
          )}

          {isDescriptionPlaying && (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${descriptionProgress * 100}%` },
                ]}
              />
            </View>
          )}

          {descriptionTtsError && (
            <TouchableOpacity
              style={styles.ttsErrorRow}
              onPress={handleDescriptionTts}
              disabled={isAnyTtsLoading}
            >
              <Ionicons
                name="refresh-circle-outline"
                size={moderateScale(15)}
                color="#FF4D4D"
              />
              <Text style={styles.ttsErrorText}>{descriptionTtsError}</Text>
            </TouchableOpacity>
          )}
        </AnimatedScreen>

        {/* Recommended Actions */}
        <AnimatedScreen
          delay={240}
          style={[
            styles.card,
            {
              backgroundColor: cardColor,
              flexDirection: "column",
              marginBottom: verticalScale(30),
            },
          ]}
        >
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Recommended Actions</Text>
            <TouchableOpacity
              onPress={() => handleSectionTts("actions")}
              disabled={isAnyTtsLoading || showSuggestModal}
              style={styles.ttsButton}
            >
              {isActionsTtsLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name={isActionsPlaying ? "pause-circle" : "volume-medium"}
                  size={moderateScale(24)}
                  color="#FFFFFF"
                />
              )}
            </TouchableOpacity>
          </View>

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

          {isActionsPlaying && (
            <View style={styles.nowPlayingRow}>
              <Ionicons
                name="ear-outline"
                size={moderateScale(13)}
                color="#4ADE80"
              />
              <Text style={styles.nowPlayingText}>
                {isTwi ? "Playing in Twi" : "Playing"}
              </Text>
            </View>
          )}

          {isActionsPlaying && (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${actionsProgress * 100}%` },
                ]}
              />
            </View>
          )}

          {actionsTtsError && (
            <TouchableOpacity
              style={styles.ttsErrorRow}
              onPress={() => handleSectionTts("actions")}
              disabled={isAnyTtsLoading}
            >
              <Ionicons
                name="refresh-circle-outline"
                size={moderateScale(15)}
                color="#FF4D4D"
              />
              <Text style={styles.ttsErrorText}>{actionsTtsError}</Text>
            </TouchableOpacity>
          )}
        </AnimatedScreen>
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
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  ttsButton: { padding: scale(4) },

  nowPlayingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginTop: verticalScale(10),
  },
  nowPlayingText: {
    color: "#4ADE80",
    fontSize: moderateScale(12),
    fontWeight: "600",
  },

  progressTrack: {
    height: verticalScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: "rgba(255,255,255,0.2)",
    marginTop: verticalScale(8),
    overflow: "hidden",
    width: "100%",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4ADE80",
    borderRadius: moderateScale(2),
  },

  ttsErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    marginTop: verticalScale(10),
  },
  ttsErrorText: {
    color: "#FF4D4D",
    fontSize: moderateScale(12),
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  // -- modal styles  --
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(24),
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(20),
    padding: moderateScale(24),
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
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
  buttonDisabled: {
    opacity: 0.5,
  },
});
