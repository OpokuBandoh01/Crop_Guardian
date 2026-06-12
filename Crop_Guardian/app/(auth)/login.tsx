// app/(auth)/login
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

import { CustomButton } from "@/components/CustomButton";
import { CustomInput } from "@/components/CustomInput";
import { Divider } from "@/components/Divider";
import { SocialButton } from "@/components/SocialButton";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import API from "@/services/api";
import { useAuthStore } from "@/stores/authStore";

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // NEW ADDITION: save authenticated user
  const loginUser = useAuthStore((state) => state.login);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await API.post("/api/auth/login", { email, password });
      const { token } = response.data;

      // UPDATED: save auth data in Zustand
      loginUser(token, response.data.user);
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMsg =
        error.response?.data?.message ||
        "An error occurred during login. Please try again.";
      Alert.alert("Login Failed", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/icons/leaflogoicon.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Headers */}
        <Text style={[styles.title, { color: theme.primary }]}>
          Welcome Back
        </Text>
        <Text style={[styles.subtitle, { color: theme.icon }]}>
          Sign in to continue your plant care journey
        </Text>

        {/* Form Fields */}
        <CustomInput
          placeholder="Email"
          leftIcon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
        />

        <CustomInput
          placeholder="Password"
          leftIcon="lock-closed-outline"
          isPassword
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
        />

        {/* Forgot Password Link */}
        <Link href="/forgot-password" asChild>
          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            disabled={isLoading}
          >
            <Text style={[styles.forgotPasswordText, { color: theme.icon }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>
        </Link>

        {/* Submit Button */}
        <CustomButton
          title="SIGN IN"
          loading={isLoading}
          disabled={isLoading}
          onPress={handleSignIn}
        />

        {/* Divider */}
        <Divider text="OR" />

        {/* Social Logins */}
        <SocialButton
          title="Continue with Google"
          onPress={() => console.log("Google login")}
          iconSource={require("@/assets/icons/googleicon.png")}
          variant="outline"
        />

        <SocialButton
          title="Continue with Apple"
          onPress={() => console.log("Apple login")}
          iconName="logo-apple"
          variant="solid"
        />

        {/* Footer Link */}
        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: theme.icon }]}>
            {"Don't have an account? "}
          </Text>
          <Link href="/signup" asChild>
            <TouchableOpacity>
              <Text style={[styles.footerLink, { color: theme.primary }]}>
                Sign up!
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(40),
    paddingBottom: verticalScale(40),
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: verticalScale(16),
  },
  logoImage: {
    width: moderateScale(80),
    height: moderateScale(80),
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: "700",
    textAlign: "center",
    marginBottom: verticalScale(8),
  },
  subtitle: {
    fontSize: moderateScale(14),
    textAlign: "center",
    marginBottom: verticalScale(40),
    paddingHorizontal: scale(20),
  },
  forgotPasswordContainer: {
    alignSelf: "flex-start",
    marginTop: verticalScale(-8),
    marginBottom: verticalScale(16),
  },
  forgotPasswordText: {
    fontSize: moderateScale(12),
    fontWeight: "500",
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: verticalScale(20),
  },
  footerText: {
    fontSize: moderateScale(14),
  },
  footerLink: {
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
});
