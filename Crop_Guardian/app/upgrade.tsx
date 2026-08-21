// Thin entry route so scan/weather/profile can deep-link to /upgrade
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function UpgradeRedirectScreen() {
  const router = useRouter();

  useEffect(() => {
    // Replace so back does not land on this empty redirect
    router.replace("/subscription");
  }, [router]);

  return <View style={{ flex: 1 }} />;
}
