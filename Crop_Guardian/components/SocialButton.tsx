import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Image, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SocialButtonProps {
  title: string;
  onPress: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconSource?: ImageSourcePropType;
  variant?: 'outline' | 'solid';
}

export const SocialButton: React.FC<SocialButtonProps> = ({ 
  title, 
  onPress, 
  iconName, 
  iconSource,
  variant = 'outline' 
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // Determine styles based on variant
  const isOutline = variant === 'outline';
  
  const backgroundColor = isOutline ? theme.surface : '#000000'; // Black for Apple
  const textColor = isOutline ? theme.text : '#FFFFFF';
  const borderColor = isOutline ? theme.primary : 'transparent';
  
  return (
    <TouchableOpacity
      style={[
        styles.button, 
        { 
          backgroundColor,
          borderColor,
          borderWidth: isOutline ? 1 : 0
        }
      ]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.contentContainer}>
        {/* Render Image if provided, else render vector icon */}
        {iconSource ? (
          <Image source={iconSource} style={styles.imageIcon} resizeMode="contain" />
        ) : iconName ? (
          <Ionicons name={iconName} size={moderateScale(20)} color={textColor} style={styles.vectorIcon} />
        ) : null}
        
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: verticalScale(50),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    marginBottom: verticalScale(16),
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    marginRight: scale(10),
  },
  vectorIcon: {
    marginRight: scale(10),
  },
  text: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
});
