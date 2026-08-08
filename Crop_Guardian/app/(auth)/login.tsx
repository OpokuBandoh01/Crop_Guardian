// app/(auth)/login.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { LoginFormData, loginSchema } from "@/schemas/authShemas";
import API, { forgotPassword } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // isLoading tracks the network request so we can disable everything
  const [isLoading, setIsLoading] = useState(false);

  const loginUser = useAuthStore((state) => state.login);

  // useForm wires up react-hook-form with our Zod schema.
  // zodResolver translates Zod errors into react-hook-form's error format.
  const {
    control, // passes field control down to <Controller>
    handleSubmit, // wraps our handler and prevents call if form is invalid
    formState: { errors }, // field-level error messages from Zod
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSignIn = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await API.post("/api/auth/login", {
        email: data.email.trim(),
        password: data.password,
      });

      const { token, user } = response.data;
      loginUser(token, user);

      if (user?.isEmailVerified === false) {
        try {
          await forgotPassword(user.phoneNumber);
        } catch (err) {
          console.warn("Could not resend verification code:", err);
        }

        setTimeout(() => {
          router.replace({
            pathname: "/(auth)/verify-email",
            params: {
              phoneNumber: user.phoneNumber ?? "",
              origin: "signup",
            },
          });
        }, 50);
        return;
      }

      setTimeout(() => {
        router.replace("/(tabs)");
      }, 50);
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
        // Prevent background scroll interaction while loading
        scrollEnabled={!isLoading}
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

        {/* Email Field */}
        {/* Controller bridges react-hook-form state with our CustomInput */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <View collapsable={false}>
              <CustomInput
                placeholder="Email"
                leftIcon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                editable={!isLoading}
              />
              {/* Show Zod error message below the field */}
              {errors.email && (
                <Text
                  style={[
                    styles.errorText,
                    { color: theme.error ?? "#E53E3E" },
                  ]}
                >
                  {errors.email.message}
                </Text>
              )}
            </View>
          )}
        />

        {/* Password Field */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <View collapsable={false}>
              <CustomInput
                placeholder="Password"
                leftIcon="lock-closed-outline"
                isPassword
                value={value}
                onChangeText={onChange}
                editable={!isLoading}
              />
              {errors.password && (
                <Text
                  style={[
                    styles.errorText,
                    { color: theme.error ?? "#E53E3E" },
                  ]}
                >
                  {errors.password.message}
                </Text>
              )}
            </View>
          )}
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

        {/* Submit — handleSubmit runs Zod first, then calls handleSignIn */}
        <CustomButton
          title="SIGN IN"
          loading={isLoading}
          disabled={isLoading}
          onPress={handleSubmit(handleSignIn)}
        />

        {/* Footer Link */}
        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: theme.icon }]}>
            {"Don't have an account? "}
          </Text>
          <Link href="/(onboarding)/user-role" asChild>
            <TouchableOpacity disabled={isLoading}>
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
    marginTop: verticalScale(4),
    marginBottom: verticalScale(16),
  },
  forgotPasswordText: {
    fontSize: moderateScale(12),
    fontWeight: "500",
  },
  errorText: {
    fontSize: moderateScale(11),
    marginTop: verticalScale(-8),
    marginBottom: verticalScale(8),
    marginLeft: scale(4),
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
