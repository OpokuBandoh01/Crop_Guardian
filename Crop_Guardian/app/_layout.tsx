// app/_layout.tsx

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useNotificationStore } from "@/stores/notificationStore";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import "react-native-reanimated";

// Without this, Android/iOS won't show a banner while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const fetchNotifications = useNotificationStore(
    (state) => state.fetchNotifications,
  );

  const receivedListenerRef = useRef<Notifications.Subscription | null>(null);
  const responseListenerRef = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // fires while the app is open and a push notification arrives.
    // We use it to refresh the in-app notification list/unread badge instantly,
    // this is the "real-time while the app is open" behavior on top of the OS push.
    receivedListenerRef.current = Notifications.addNotificationReceivedListener(
      () => {
        fetchNotifications();
      },
    );

    // fires when the user taps a notification, whether the app
    // was open, backgrounded, or fully killed at the time.
    responseListenerRef.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const actionLink = response.notification.request.content.data
          ?.actionLink as string | undefined;

        if (actionLink) {
          router.push(actionLink as any); // 'as any': actionLink is a dynamic string from the backend, not a route expo-router's types know about ahead of time
        }
      });

    // cleanup, removes both listeners on unmount so they don't stack up
    return () => {
      receivedListenerRef.current?.remove();
      responseListenerRef.current?.remove();
    };
  }, [fetchNotifications, router]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scan" options={{ headerShown: false }} />
        <Stack.Screen name="result" options={{ headerShown: false }} />
        <Stack.Screen name="weather" options={{ headerShown: false }} />
        <Stack.Screen name="listening" options={{ headerShown: false }} />
        <Stack.Screen name="personal-info" options={{ headerShown: false }} />
        <Stack.Screen name="farm-info" options={{ headerShown: false }} />
        <Stack.Screen name="change-password" options={{ headerShown: false }} />
        <Stack.Screen
          name="offline-database"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="appearance" options={{ headerShown: false }} />
        <Stack.Screen name="language" options={{ headerShown: false }} />
        <Stack.Screen
          name="notification-settings"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="unit-settings" options={{ headerShown: false }} />
        <Stack.Screen name="help-support" options={{ headerShown: false }} />
        <Stack.Screen name="about-us" options={{ headerShown: false }} />
        <Stack.Screen name="rate-us" options={{ headerShown: false }} />
        {/* <Stack.Screen name="logout" options={{ headerShown: false }} /> */}
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
