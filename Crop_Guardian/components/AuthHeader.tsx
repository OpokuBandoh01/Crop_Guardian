import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

interface AuthHeaderProps {
  title?: string;
  showBackButton?: boolean;
  /** Shows a "Login" link on the left side (ideal for onboarding screens) */
  showLoginLink?: boolean;
  /** Custom route for the login link (defaults to login screen) */
  loginRoute?: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title,
  showBackButton = true,
  showLoginLink = false,
  loginRoute = "/(auth)/login",
}) => {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const handleLoginPress = () => {
    router.push(loginRoute as any);
  };

  return (
    <View style={styles.container}>
      {/* Left Section: Back button OR Login link OR Spacer */}
      {showBackButton ? (
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          disabled={false} // Will be controlled by parent loading state if needed
        >
          <Ionicons
            name="arrow-back-circle-outline"
            size={moderateScale(32)}
            color={theme.primary}
          />
        </TouchableOpacity>
      ) : showLoginLink ? (
        <TouchableOpacity
          onPress={handleLoginPress}
          style={styles.loginButton}
          activeOpacity={0.7}
        >
          <Text style={[styles.loginText, { color: theme.primary }]}>
            Login
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.rightSpacer} /> // Placeholder to maintain centering
      )}

      {/* Title - Centered */}
      {title && (
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        </View>
      )}

      {/* Right Spacer - Keeps title perfectly centered */}
      <View style={styles.rightSpacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: verticalScale(16),
    marginBottom: verticalScale(20),
  },
  backButton: {
    padding: scale(4),
  },
  loginButton: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    // Subtle modern styling
    borderRadius: moderateScale(8),
  },
  loginText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    textTransform: "capitalize",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    textTransform: "uppercase",
  },
  rightSpacer: {
    width: moderateScale(52), // Slightly increased to accommodate "Login" text width
  },
});
