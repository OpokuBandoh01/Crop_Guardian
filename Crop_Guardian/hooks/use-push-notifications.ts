// hooks/use-push-notifications.ts
import API from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

// Key used to remember this device's token locally, so logout can unregister the exact same one
export const PUSH_TOKEN_STORAGE_KEY = "expoPushToken";

/**
 * Call this once, after the user is authenticated AND phone-verified.
 * It requests permission, sets up the Android notification channel,
 * fetches this device's Expo push token, and saves it on the backend.
 */
export function usePushNotifications() {
  const hasRegistered = useRef(false);

  useEffect(() => {
    if (hasRegistered.current) return; //  guards against double calls (e.g. React StrictMode)
    hasRegistered.current = true;

    registerForPushNotificationsAsync();
  }, []);
}

async function registerForPushNotificationsAsync() {
  // Push tokens don't exist on simulators/emulators, only real hardware
  if (!Device.isDevice) {
    console.log("📵 Push notifications require a physical device, skipping.");
    return;
  }

  // Android silently drops notifications with no channel, this must run before requesting permission
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.HIGH, // HIGH = shows as a heads-up banner, not just in the shade
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#094A04", // matches the app's primary brand color
    });
  }

  // Check the current permission state first - iOS only allows the system prompt once
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("🔕 User denied notification permission.");
    return;
  }

  // The EAS projectId ties this token to this specific Expo project - already present in your app.json
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (!projectId) {
    console.error("❌ No EAS projectId found, cannot generate a push token.");
    return;
  }

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const expoPushToken = tokenResponse.data;

    // Save locally so we know exactly which token to remove on logout
    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, expoPushToken);

    // Send it to the backend, tied to whichever user is currently logged in
    await API.put("/api/notifications/push-token", { token: expoPushToken });

    console.log("✅ Push token registered:", expoPushToken);
  } catch (error) {
    console.error("❌ Failed to register push token:", error);
  }
}

/**
 * Call this during logout, so this device stops receiving alerts
 * for the account that just signed out.
 */
export async function unregisterPushToken() {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    if (!token) return; // nothing to remove

    await API.delete("/api/notifications/push-token", { data: { token } });
    await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
  } catch (error) {
    // Best-effort only - a failed unregister should never block logout itself
    console.error("⚠️ Failed to unregister push token:", error);
  }
}
