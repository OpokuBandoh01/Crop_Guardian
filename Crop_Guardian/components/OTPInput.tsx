import React, { useRef, useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { scale, verticalScale, moderateScale } from "react-native-size-matters";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface OTPInputProps {
  length?: number;
  onCodeFilled?: (code: string) => void;
  //  parent can lock inputs while verify/resend is loading
  editable?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  onCodeFilled,
  editable = true,
}) => {
  const [code, setCode] = useState<string[]>(new Array(length).fill(""));
  const inputs = useRef<TextInput[]>([]);
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const handleTextChange = (text: string, index: number) => {
    //  ignore keystrokes while locked
    if (!editable) return;

    const newCode = [...code];
    // keep only last digit if paste sends more
    newCode[index] = text.slice(-1);
    setCode(newCode);

    if (text !== "" && index < length - 1) {
      inputs.current[index + 1]?.focus(); // optional chaining for safety
    }

    if (newCode.every((digit) => digit !== "") && newCode.length === length) {
      onCodeFilled?.(newCode.join(""));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (!editable) return;
    if (e.nativeEvent.key === "Backspace" && index > 0 && code[index] === "") {
      inputs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
    }
  };

  return (
    <View style={styles.container}>
      {code.map((digit, index) => (
        <TextInput
          key={`otp-${index}`} // stable string key helps Fabric
          style={[
            styles.inputBox,
            {
              borderColor: theme.inputBorder,
              backgroundColor: theme.surface,
              color: theme.text,
              opacity: editable ? 1 : 0.6, //  visual disabled state
            },
          ]}
          value={digit}
          onChangeText={(text) => handleTextChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="numeric"
          maxLength={1}
          editable={editable}
          ref={(ref) => {
            if (ref) {
              inputs.current[index] = ref;
            }
          }}
          selectTextOnFocus
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: verticalScale(30),
  },
  inputBox: {
    width: scale(45),
    height: verticalScale(55),
    borderWidth: 1,
    borderRadius: moderateScale(8),
    textAlign: "center",
    fontSize: moderateScale(24),
    fontWeight: "600",
  },
});
