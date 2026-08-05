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
  const [isPasswordVisible, setIsPasswordVisible] = useState(!isPassword);
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // NEW ADDITION: TextInputProps already includes an `editable?: boolean`
  // field (that is how ...props already lets callers lock a field), we
  // are just reading it here too so we can style it differently.
  // `props.editable !== false` means: locked only when editable is
  // explicitly set to false, every existing screen that never passed
  // `editable` at all keeps working exactly as before.
  const isLocked = props.editable === false;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.primary }]}>{label}</Text>
      )}

      <View
        style={[
          styles.container,
          {
            borderColor: theme.inputBorder,
            // NEW ADDITION: a slightly muted background communicates
            // "you can't edit this" at a glance, before the user even
            // taps in, this is a small comfort/trust cue for the user.
            backgroundColor: isLocked ? theme.background : theme.surface,
            opacity: isLocked ? 0.6 : 1,
          },
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={moderateScale(20)}
            color={theme.icon}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholderTextColor={theme.placeholder}
          secureTextEntry={!isPasswordVisible}
          {...props}
        />

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

        {/* NEW ADDITION: lock icon shown only for non-password, locked
            fields (email/phone), so it never collides with the password
            eye icon above. */}
        {isLocked && !isPassword && (
          <Ionicons
            name="lock-closed-outline"
            size={moderateScale(16)}
            color={theme.icon}
            style={styles.rightIcon}
          />
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
