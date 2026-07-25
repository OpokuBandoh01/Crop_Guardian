// app/result.tsx

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal, // NO CHANGES: for the suggest-crop modal
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

// NO CHANGES: BlurView for modal backdrop blur
import { BlurView } from "expo-blur";

import API, { EXPO_PUBLIC_GHANANLP_API_KEY } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import axios from "axios";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
// NEW ADDITION: on-device text-to-speech for English. Unlike the GhanaNLP
// path used for Twi, this speaks directly through the phone's own TTS
// engine: no network call, no API quota, and no practical length limit
// worth truncating for.
import * as Speech from "expo-speech";

// NO CHANGES: describes the shape of the suggestAddToMyCrops object
// so TypeScript can validate every access to its properties.
interface SuggestCrop {
  suggested: boolean;
  cropType: string;
  message: string;
}

// NEW ADDITION: a union type (a value that can only be one of these two exact
// strings) representing which section's audio we are dealing with. Using a
// union type here means TypeScript will error out if we ever misspell
// "description" or "actions" anywhere in the file, instead of silently
// letting a typo through the way a plain `string` would.
type TtsSection = "description" | "actions";

export default function ResultScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams<{ data?: string }>();

  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);

  // NO CHANGES: scanResult is typed as any because the backend response
  // shape may grow over time -- strict typing is handled via SuggestCrop below.
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

  // -- Suggest-crop modal state (NO CHANGES) --
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [isAddingCrop, setIsAddingCrop] = useState(false);
  const [addCropSuccess, setAddCropSuccess] = useState(false);
  const [addCropError, setAddCropError] = useState<string | null>(null);

  // NO CHANGES: cast the suggest object through our SuggestCrop interface
  // so downstream code gets proper type checking.
  const suggestPayload: SuggestCrop | null =
    scanResult?.suggestAddToMyCrops ?? null;

  // UPDATED: split TTS loading/playing state into one pair per section
  // instead of a single shared pair. This lets the Description audio and
  // the Recommended Actions audio be tracked and controlled independently.
  const [isDescriptionTtsLoading, setIsDescriptionTtsLoading] = useState(false);
  const [isDescriptionPlaying, setIsDescriptionPlaying] = useState(false);
  const [isActionsTtsLoading, setIsActionsTtsLoading] = useState(false);
  const [isActionsPlaying, setIsActionsPlaying] = useState(false);

  // NEW ADDITION: which TTS engine to use is decided once per render based
  // on the user's saved language. `isTwi` being a plain boolean (not a
  // string comparison repeated everywhere) makes every branch below read
  // clearly as "Twi path" vs "English path".
  const isTwi = user?.language === "tw";

  // NEW ADDITION: per-section error message. `string | null` means this is
  // either a piece of text (something went wrong) or null (no error). Shown
  // inline with a retry button instead of failing silently to the console.
  const [descriptionTtsError, setDescriptionTtsError] = useState<string | null>(
    null,
  );
  const [actionsTtsError, setActionsTtsError] = useState<string | null>(null);

  // NEW ADDITION: expo-speech has no currentTime/duration to read (unlike
  // expo-audio's player status), so we track playback progress ourselves,
  // updated from the onBoundary callback as each word is spoken. Only used
  // on the English path; the Twi path keeps using descriptionStatus /
  // actionsStatus from expo-audio further below.
  const [descriptionSpeechProgress, setDescriptionSpeechProgress] = useState(0);
  const [actionsSpeechProgress, setActionsSpeechProgress] = useState(0);

  // NEW ADDITION: convenience flag combining both loading states. Used to
  // disable every other interactive element on the screen while any TTS
  // request is in flight, per the "always disable during loading" rule.
  const isAnyTtsLoading = isDescriptionTtsLoading || isActionsTtsLoading;

  // UPDATED: two separate audio player instances, one per section, so that
  // starting one does not have to fight over playback state with the other.
  const descriptionPlayer = useAudioPlayer();
  const descriptionStatus = useAudioPlayerStatus(descriptionPlayer);
  const actionsPlayer = useAudioPlayer();
  const actionsStatus = useAudioPlayerStatus(actionsPlayer);

  const isMounted = useRef(true);

  // NEW ADDITION: this ref caches the generated audio data URI per section,
  // for example { description: "data:audio/wav;base64,...." }.
  // TypeScript note: `Partial<Record<TtsSection, string>>` means "an object
  // whose keys are limited to 'description' | 'actions', where each key is
  // optional (Partial) and its value, if present, is a string." Using a ref
  // instead of state means updating the cache does NOT cause a re-render,
  // which is correct since the cache itself is not shown in the UI directly.
  const audioCacheRef = useRef<Partial<Record<TtsSection, string>>>({});

  // NEW ADDITION: guards the auto-play effect below so it only ever fires
  // once per screen visit, even if React re-runs effects (for example in
  // development StrictMode, which intentionally double-invokes effects).
  const hasAutoPlayedRef = useRef(false);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // NEW ADDITION: guards the effect below during the disease-name
  // announcement phase (see handleDescriptionTts further down). During that
  // phase isDescriptionPlaying is set manually and must NOT be overwritten
  // by the Twi audio player's status, since the player itself isn't playing
  // yet at that point.
  const isAnnouncingNameRef = useRef(false);

  // UPDATED: keep local "isPlaying" state in sync with each player's real
  // playback status, one effect per section. The description effect now
  // skips syncing while the disease name is being announced.
  useEffect(() => {
    if (!isAnnouncingNameRef.current) {
      setIsDescriptionPlaying(descriptionStatus.playing || false);
    }
  }, [descriptionStatus.playing]);

  useEffect(() => {
    setIsActionsPlaying(actionsStatus.playing || false);
  }, [actionsStatus.playing]);

  // NO CHANGES: auto-open the suggest-crop modal shortly after mount if the
  // backend returned suggested === true.
  useEffect(() => {
    if (suggestPayload?.suggested === true) {
      const timer = setTimeout(() => {
        setShowSuggestModal(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [suggestPayload?.suggested]);

  // UPDATED: pause BOTH players on unmount, not just one. The dependency
  // array is intentionally empty ([]) so this cleanup ONLY runs when the
  // screen truly unmounts, not on every re-render. Previously this watched
  // [descriptionPlayer, actionsPlayer]; if those hook instances were ever
  // recreated across renders, the cleanup could fire early and permanently
  // set isMounted.current to false, silently blocking every future
  // setLoading(false) call and leaving a spinner stuck forever. Using []
  // removes that risk entirely, at the small cost of referencing
  // descriptionPlayer/actionsPlayer via a ref so the cleanup always sees the
  // latest instance rather than a stale one captured at mount time.
  const playersRef = useRef({ descriptionPlayer, actionsPlayer });
  playersRef.current = { descriptionPlayer, actionsPlayer };

  useEffect(() => {
    return () => {
      isMounted.current = false;
      try {
        playersRef.current.descriptionPlayer.pause();
        playersRef.current.actionsPlayer.pause();
        // NEW ADDITION: also stop any in-progress on-device speech (the
        // English path), so navigating away doesn't leave the phone talking.
        Speech.stop();
      } catch (e) {
        console.log("Audio cleanup completed (expected on unmount)");
      }
    };
  }, []);

  // NO CHANGES: formatting/action helpers
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

  // REMOVED: handleListen and the "Listen(Twi)" bottom button that used it
  // have been taken out per request, along with the "View Details" button.

  // NEW ADDITION: the exact text that will be spoken for each section.
  // Kept as plain `const` (recomputed each render) since the source data
  // (scanResult) does not change after the screen mounts, so this is cheap.
  const descriptionText: string =
    scanResult?.symptoms ||
    scanResult?.causes ||
    "No detailed description available for this detection.";

  const actionsText: string = getActions().join(". ");

  // NEW ADDITION: the GhanaNLP TTS endpoint is known to stall or hang on
  // longer pieces of text (this is the same limitation that is why TTS was
  // already split into separate "description" and "actions" calls). This
  // helper trims text down to a safe character limit before it is ever sent,
  // cutting at the nearest sentence boundary (a period) instead of mid-word,
  // so the audio still ends on a complete sentence.
  const MAX_TTS_CHARACTERS = 350;
  const truncateForTts = (text: string): string => {
    if (text.length <= MAX_TTS_CHARACTERS) return text;

    const cut = text.slice(0, MAX_TTS_CHARACTERS);
    const lastPeriodIndex = cut.lastIndexOf(".");

    // If a period was found reasonably far into the cut text, end there.
    // Otherwise just hard-cut at the character limit.
    if (lastPeriodIndex > MAX_TTS_CHARACTERS * 0.4) {
      return cut.slice(0, lastPeriodIndex + 1);
    }
    return `${cut.trim()}...`;
  };

  // NEW ADDITION: extracted the raw "call GhanaNLP and return base64 audio"
  // logic into its own function, typed as `Promise<string>` (TypeScript's
  // way of saying "this async function eventually resolves to a string").
  // Both sections now share this single implementation instead of each
  // duplicating the same axios/base64 code.
  const synthesizeSpeech = async (text: string): Promise<string> => {
    // NOTE: calling GhanaNLP directly with axios (imported separately from
    // our own `API` instance) since this request should NOT include our own
    // backend's Authorization header or baseURL. Cloudflare in front of
    // translation-api.ghananlp.org blocks Render's datacenter IP range but
    // allows normal mobile/residential IPs through, hence calling from the
    // device itself.
    const response = await axios.post(
      "https://translation-api.ghananlp.org/tts/v1/synthesize",
      {
        // UPDATED: text is truncated before being sent, to keep requests
        // inside the range the endpoint can reliably handle.
        text: truncateForTts(text),
        language: "tw",
      },
      {
        headers: {
          "Content-Type": "application/json",
          // TypeScript note: EXPO_PUBLIC_GHANANLP_API_KEY is typed as
          // `string`, but we still fall back to "" defensively in case it is
          // ever empty at runtime, so we never send the literal word
          // "undefined" as a header value.
          "Ocp-Apim-Subscription-Key": EXPO_PUBLIC_GHANANLP_API_KEY || "",
        },
        responseType: "arraybuffer",
        // NEW ADDITION: fail after 20 seconds instead of waiting on
        // Cloudflare's own gateway timeout, which returns a 524 error after
        // roughly 100 seconds. This is what caused the "infinite" loading
        // spinner: the request was technically still pending, just for a
        // very long time, with nothing telling the user it had gone wrong.
        timeout: 20000,
      },
    );

    // Guard: make sure we actually got audio back, not an HTML/JSON error page.
    const contentType = response.headers["content-type"] || "";
    if (!contentType.includes("audio")) {
      throw new Error(
        `Unexpected content-type from TTS endpoint: ${contentType}`,
      );
    }

    // Convert the raw ArrayBuffer to base64 so it can be used as a data URI.
    // React Native doesn't have Node's Buffer by default, so this is done
    // manually with a small binary-to-base64 loop instead of Buffer.from().
    const bytes = new Uint8Array(response.data);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const audioBase64 = btoa(binary);
    return `data:audio/wav;base64,${audioBase64}`;
  };

  // NEW ADDITION: some failures against the TTS endpoint (a generic
  // "Network Error", meaning no response ever came back) are one-off blips
  // rather than a real config problem, especially on a free-tier third
  // party endpoint like GhanaNLP's. This wraps synthesizeSpeech with a
  // single automatic retry after a short pause, so the user doesn't have to
  // manually tap "try again" for something that would have succeeded on a
  // second attempt anyway. `maxAttempts = 2` means: try once, and if that
  // fails, try exactly one more time before giving up.
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
          // Brief pause before retrying, giving a flaky connection a moment
          // to recover instead of hammering the endpoint immediately.
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
    // TypeScript note: `throw lastError` re-throws whatever the final
    // attempt failed with, so the caller's catch block still sees the real
    // underlying error (e.g. the AxiosError) for logging purposes.
    throw lastError;
  };

  // NOTE: isTwi was already declared near the top of the component, right
  // after the loading/playing state. Referenced here to decide which TTS
  // engine handleSectionTts uses below.

  // NEW ADDITION: speaks the full section text on-device via expo-speech.
  // Unlike the GhanaNLP path, this needs no network call, no caching, and no
  // text truncation, since expo-speech has no request quota and handles far
  // more characters than either of our sections will ever contain.
  const speakEnglishSection = (section: TtsSection) => {
    const isPlaying =
      section === "description" ? isDescriptionPlaying : isActionsPlaying;
    const setPlaying =
      section === "description" ? setIsDescriptionPlaying : setIsActionsPlaying;
    const setOtherPlaying =
      section === "description" ? setIsActionsPlaying : setIsDescriptionPlaying;
    const setError =
      section === "description" ? setDescriptionTtsError : setActionsTtsError;
    // NEW ADDITION: progress setter for this section, driven by onBoundary
    // below since expo-speech has no currentTime/duration to read directly.
    const setProgress =
      section === "description"
        ? setDescriptionSpeechProgress
        : setActionsSpeechProgress;
    const setOtherProgress =
      section === "description"
        ? setActionsSpeechProgress
        : setDescriptionSpeechProgress;
    const text = section === "description" ? descriptionText : actionsText;

    // NOTE: Speech.stop() interrupts whatever is currently speaking. We call
    // it unconditionally before starting a new utterance so tapping one
    // section always stops the other, keeping only one voice active at a
    // time (mirrors the otherPlayer.pause() behaviour in the Twi path).
    Speech.stop();
    setOtherPlaying(false);
    setOtherProgress(0);

    // Tapping the same section again while it is speaking just stops it,
    // matching the "tap to pause/stop" behaviour of the Twi buttons. Note:
    // Speech.pause() only works on iOS and web (not Android), so we use
    // stop() everywhere for consistent cross-platform behaviour.
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
        // Secure, generic error message, same pattern as the Twi path.
        setError("Could not play audio. Tap to try again.");
      },
      // NEW ADDITION: fires as each word is reached. `boundary` is typed as
      // `any` here because its exact shape can vary slightly by platform,
      // but we only need `charIndex`, which every platform provides. Used
      // to drive the same progress bar the Twi path shows, just computed
      // from character position instead of audio currentTime/duration.
      onBoundary: (boundary: any) => {
        if (text.length > 0 && typeof boundary?.charIndex === "number") {
          setProgress(Math.min(boundary.charIndex / text.length, 1));
        }
      },
    });
  };

  // NEW ADDITION: single function that drives BOTH the Description and the
  // Recommended Actions TTS. `section: TtsSection` restricts the argument to
  // only "description" or "actions", so calling handleSectionTts("foo")
  // would be a compile-time TypeScript error, not a runtime bug.
  const handleSectionTts = async (section: TtsSection) => {
    // UPDATED: English users are routed to the on-device engine and never
    // touch the GhanaNLP network path below.
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
    // NEW ADDITION: pick the right error setter for this section, same
    // pattern as setLoading above.
    const setError =
      section === "description" ? setDescriptionTtsError : setActionsTtsError;
    const text = section === "description" ? descriptionText : actionsText;

    // If this section is already playing, tapping again just pauses it.
    if (isPlaying) {
      player.pause();
      return;
    }

    // Stop the other section first so the two audios never overlap.
    otherPlayer.pause();

    // NEW ADDITION: clear any previous error for this section every time the
    // user tries again, so a stale error message doesn't linger on screen.
    setError(null);

    // Serve from cache when we already generated this section's audio once.
    // This is the caching requirement: no repeat call to the TTS endpoint.
    const cachedUri = audioCacheRef.current[section];
    if (cachedUri) {
      try {
        // Rewind to the start in case this clip already finished playing.
        await player.seekTo(0);
      } catch (e) {
        // Seeking can occasionally fail depending on player state; safe to
        // ignore since play() below will still work.
      }
      await player.play();
      return;
    }

    if (!text) return;

    setLoading(true);
    try {
      const audioUri = await synthesizeSpeechWithRetry(text);
      // Cache it so the next tap on this section reuses this audio instead
      // of calling the endpoint again.
      audioCacheRef.current[section] = audioUri;
      if (isMounted.current) {
        player.replace(audioUri);
        await player.play();
      }
    } catch (error) {
      // NOTE: we log the real error to the console for debugging, but the
      // message shown to the user is a generic, non-revealing one, per the
      // "secure error messages" practice: never surface backend/network
      // internals (URLs, status codes, stack traces) directly in the UI.
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

  // NEW ADDITION: increments every time a new Description playback sequence
  // starts. The async sequence below checks this value before moving from
  // "announce the name" to "read the description" -- if the user stopped
  // playback (or started it again) in between, the id will have changed,
  // and the stale sequence knows to stop instead of continuing.
  const descriptionPlaybackIdRef = useRef(0);

  // NEW ADDITION: wraps Speech.speak in a Promise so we can `await` it
  // finishing before moving on to the next thing to say. TypeScript note:
  // `Promise<void>` means "resolves with no value, just signals completion."
  // onStopped also resolves (not rejects) because a manual stop is not an
  // error, it just means the sequence should end quietly.
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
        // TypeScript note: `boundary: any` because the exact event shape can
        // vary slightly by platform; we only rely on `charIndex`, which is
        // present everywhere expo-speech runs.
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

  // NEW ADDITION: this is the Description card's TTS entry point, used by
  // both the auto-play effect and the manual tap on the speaker icon. Unlike
  // handleSectionTts above, this ALWAYS announces the disease name first, in
  // English, on-device, regardless of whether the user's language is Twi or
  // English -- and only then reads the description itself, in whichever
  // language the user has set. Recommended Actions is untouched and keeps
  // using handleSectionTts("actions") exactly as before.
  const handleDescriptionTts = async () => {
    // Tapping while already playing (either the name or the description
    // part) stops the whole sequence immediately.
    if (isDescriptionPlaying) {
      isAnnouncingNameRef.current = false;
      // Invalidate any in-flight sequence so it doesn't continue into the
      // description after this stop.
      descriptionPlaybackIdRef.current += 1;
      Speech.stop();
      descriptionPlayer.pause();
      setIsDescriptionPlaying(false);
      setDescriptionSpeechProgress(0);
      return;
    }

    // Stop whatever the Recommended Actions section is doing, so only one
    // voice is ever active at a time.
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
      // PHASE 1: always announce the disease name in English, on-device,
      // no matter which language the rest of the screen is in.
      isAnnouncingNameRef.current = true;
      await speakOnDevice(`${diseaseName}.`, "en-US");
      isAnnouncingNameRef.current = false;

      // If the user stopped playback (or triggered a new one) while the
      // name was still being announced, do not continue into the
      // description -- this sequence is stale.
      if (
        playbackId !== descriptionPlaybackIdRef.current ||
        !isMounted.current
      ) {
        return;
      }

      if (isTwi) {
        // PHASE 2 (Twi): hand off to the existing GhanaNLP cache/network
        // flow for the description text itself, unchanged from before.
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
        // PHASE 2 (English): continue speaking the description text itself
        // on the same on-device engine (the name was already spoken above).
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
      // Covers a failure during the name announcement itself (rare, but
      // possible if the device's TTS engine errors out).
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

  // UPDATED: auto-play the Description sequence (disease name, then the
  // description itself) once, shortly after the result screen mounts. Fires
  // for everyone regardless of language, since the name is always announced
  // in English on-device and the description then follows in whichever
  // language the user has set.
  useEffect(() => {
    if (!hasAutoPlayedRef.current && scanResult) {
      hasAutoPlayedRef.current = true;
      // Small delay so the screen has finished rendering before audio
      // starts, matching the same feel as the suggest-crop modal delay.
      const timer = setTimeout(() => {
        handleDescriptionTts();
      }, 400);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanResult, user?.language]);

  // NEW ADDITION: 0 to 1 playback progress for each section, used to draw a
  // thin progress bar under the text while audio is playing. For Twi this
  // reads from expo-audio's real currentTime/duration; for English there is
  // no such status to read, so it falls back to the onBoundary-driven
  // percentage tracked in descriptionSpeechProgress / actionsSpeechProgress.
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

  // NO CHANGES: calls POST /api/crops/my-crops with the cropType from the
  // backend suggest payload.
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
      {/* NO CHANGES: Suggest-crop modal */}
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
        // UPDATED: also lock scroll while any TTS request is loading, on top
        // of the existing modal-open lock.
        scrollEnabled={!showSuggestModal}
      >
        {/* Header */}
        <View style={styles.header}>
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
        </View>

        <Text style={styles.mainTitle}>Result</Text>

        {/* Disease Info Card (NO CHANGES) */}
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
            {/* UPDATED: now calls handleDescriptionTts, which always
                announces the disease name in English first, then continues
                into the description in whichever language is set. */}
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

          {/* NEW ADDITION: subtle "now playing" indicator, only shown while
              this section's audio is actually playing. Label reflects
              which engine is speaking. */}
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

          {/* NEW ADDITION: thin progress bar reflecting playback position. */}
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

          {/* NEW ADDITION: error + retry row, only shown after a failed TTS
              attempt for this section. Tapping it calls handleDescriptionTts
              again, which also clears the error at the start of the call. */}
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
          {/* UPDATED: title sits in a row alongside its own TTS button,
              matching the Description card's layout. Now shown for all
              users, not just Twi. */}
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Recommended Actions</Text>
            <TouchableOpacity
              // NEW ADDITION: manually triggered TTS for this section only.
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

          {/* NEW ADDITION: same now-playing indicator and progress bar,
              scoped to the Recommended Actions audio. */}
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

          {/* NEW ADDITION: error + retry row for the Recommended Actions
              audio, same pattern as the Description card above. */}
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
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  ttsButton: { padding: scale(4) },

  // NEW ADDITION: "now playing" row shown under a section's text.
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

  // NEW ADDITION: thin progress bar track and fill for TTS playback.
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

  // NEW ADDITION: tappable error row shown when a TTS request fails.
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

  // -- modal styles (NO CHANGES) --
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
