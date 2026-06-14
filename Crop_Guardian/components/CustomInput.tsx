import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

interface CustomInputProps extends TextInputProps {
  leftIcon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  label?: string;
  containerStyle?: object;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  leftIcon,
  isPassword = false,
  label,
  containerStyle,
  ...props
}) => {
  // Manage the visibility state for passwords
  const [isPasswordVisible, setIsPasswordVisible] = useState(!isPassword);

  // Get current color scheme to apply correct theme colors
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {/* Optional Label rendering above the input */}
      {label && (
        <Text style={[styles.label, { color: theme.primary }]}>{label}</Text>
      )}

      {/* The main input container with borders */}
      <View
        style={[
          styles.container,
          { borderColor: theme.inputBorder, backgroundColor: theme.surface },
        ]}
      >
        {/* Optional Left Icon */}
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={moderateScale(20)}
            color={theme.icon}
            style={styles.leftIcon}
          />
        )}

        {/* The actual text input element */}
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholderTextColor={theme.placeholder}
          secureTextEntry={!isPasswordVisible}
          {...props}
        />

        {/* Optional Password Visibility Toggle (Right Icon) */}
        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIcon}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-outline" : "eye-off-outline"}
              size={moderateScale(20)}
              color={theme.icon}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: verticalScale(16),
  },
  label: {
    fontSize: moderateScale(12),
    marginBottom: verticalScale(4),
    fontWeight: "600",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(12),
    height: verticalScale(50),
  },
  leftIcon: {
    marginRight: scale(10),
  },
  rightIcon: {
    marginLeft: scale(10),
  },
  input: {
    flex: 1,
    fontSize: moderateScale(14),
    height: "100%",
  },
});
