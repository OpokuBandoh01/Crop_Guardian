// app/(onboarding)/_layout
import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="user-role" />
    </Stack>
  );
}
