// app\(tabs)\_layout.tsx
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/stores/authStore";

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.isEmailVerified === false) {
    return (
      <Redirect
        href={{
          pathname: "/(auth)/verify-email",
          params: {
            phoneNumber: user.phoneNumber ?? "",
            // "origin" tells verify-email.tsx this is a signup/login
            // verification, not a password-reset OTP, so it knows to
            // send the user into (tabs) on success instead of reset-password.
            origin: "signup",
          },
        }}
      />
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#A3C89E",
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/icons/homeicon.png")}
              style={[styles.tabIcon, { tintColor: color }]}
              resizeMode="contain"
            />
          ),
          tabBarLabel: ({ focused, color }) => (
            <View style={styles.labelWrapper}>
              <Text style={[styles.tabLabel, { color }]}>Home</Text>
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="my-crops"
        options={{
          title: "My Crops",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/icons/mycropstabicon.png")}
              style={[styles.tabIcon, { tintColor: color }]}
              resizeMode="contain"
            />
          ),
          tabBarLabel: ({ focused, color }) => (
            <View style={styles.labelWrapper}>
              <Text style={[styles.tabLabel, { color }]}>My Crops</Text>
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/icons/alertstabicon.png")}
              style={[styles.tabIcon, { tintColor: color }]}
              resizeMode="contain"
            />
          ),
          tabBarLabel: ({ focused, color }) => (
            <View style={styles.labelWrapper}>
              <Text style={[styles.tabLabel, { color }]}>Alerts</Text>
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/icons/profileicon.png")}
              style={[styles.tabIcon, { tintColor: color }]}
              resizeMode="contain"
            />
          ),
          tabBarLabel: ({ focused, color }) => (
            <View style={styles.labelWrapper}>
              <Text style={[styles.tabLabel, { color }]}>Profile</Text>
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      {/* Hide the default explore screen tab from our customized capsule */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#094A04",
    borderTopWidth: 0,
    height: verticalScale(68),
    position: "absolute",
    bottom: verticalScale(16),
    left: scale(16),
    right: scale(16),
    borderRadius: moderateScale(28),
    paddingBottom: verticalScale(8),
    paddingTop: verticalScale(8),
    // Shadow for premium floating look
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  tabLabel: {
    fontSize: moderateScale(10),
    fontWeight: "600",
    marginTop: verticalScale(2),
  },
  labelWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabIcon: {
    width: moderateScale(22),
    height: moderateScale(22),
  },
  activeDot: {
    width: moderateScale(4),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: "#FFFFFF",
    marginTop: verticalScale(2),
  },
});
