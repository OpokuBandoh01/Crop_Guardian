import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CustomButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'solid' | 'outline';
}

export const CustomButton: React.FC<CustomButtonProps> = ({ 
  title, 
  loading = false, 
  variant = 'solid',
  style, 
  ...props 
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const isOutline = variant === 'outline';
  const backgroundColor = isOutline ? theme.surface : theme.primary;
  const textColor = isOutline ? theme.text : theme.background;
  const borderColor = isOutline ? theme.inputBorder : 'transparent';

  return (
    <TouchableOpacity
      style={[
        styles.button, 
        { 
          backgroundColor,
          borderColor,
          borderWidth: isOutline ? 1 : 0
        }, 
        style
      ]}
      activeOpacity={0.8}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: verticalScale(50),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(8),
    marginBottom: verticalScale(16),
  },
  text: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
});
