import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface OTPInputProps {
  length?: number;
  onCodeFilled?: (code: string) => void;
}

export const OTPInput: React.FC<OTPInputProps> = ({ length = 6, onCodeFilled }) => {
  const [code, setCode] = useState<string[]>(new Array(length).fill(''));
  const inputs = useRef<TextInput[]>([]);
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const handleTextChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-advance to next input
    if (text !== '' && index < length - 1) {
      inputs.current[index + 1].focus();
    }

    // Check if code is fully filled
    if (newCode.every((digit) => digit !== '') && newCode.length === length) {
      if (onCodeFilled) {
        onCodeFilled(newCode.join(''));
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace to go to previous input
    if (e.nativeEvent.key === 'Backspace' && index > 0 && code[index] === '') {
      inputs.current[index - 1].focus();
      // Also clear the previous input when jumping back
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
    }
  };

  return (
    <View style={styles.container}>
      {code.map((digit, index) => (
        <TextInput
          key={index}
          style={[
            styles.inputBox,
            { 
              borderColor: theme.inputBorder, 
              backgroundColor: theme.surface,
              color: theme.text 
            }
          ]}
          value={digit}
          onChangeText={(text) => handleTextChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="numeric"
          maxLength={1}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: verticalScale(30),
  },
  inputBox: {
    width: scale(45),
    height: verticalScale(55),
    borderWidth: 1,
    borderRadius: moderateScale(8),
    textAlign: 'center',
    fontSize: moderateScale(24),
    fontWeight: '600',
  },
});
