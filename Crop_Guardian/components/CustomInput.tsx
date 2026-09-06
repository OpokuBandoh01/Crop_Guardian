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

  // NEW ADDITION: read editable without restructuring the view tree
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
            // UPDATED: muted look when locked — visual only, no extra children
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
            // NEW ADDITION: block eye toggle while the field is locked
            disabled={isLocked}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-outline" : "eye-off-outline"}
              size={moderateScale(20)}
              color={theme.icon}
            />
          </TouchableOpacity>
        )}

        {/* UPDATED: lock icon removed as a conditional mount.
            Mounting/unmounting Ionicons here while navigating caused the
            Fabric crash: "addViewAt: View already has a parent".
            Locked state is already shown via opacity + backgroundColor. */}
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
