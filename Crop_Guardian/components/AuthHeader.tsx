import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AuthHeaderProps {
  title?: string;
  showBackButton?: boolean;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ title, showBackButton = true }) => {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={styles.container}>
      {showBackButton ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-circle-outline" size={moderateScale(32)} color={theme.primary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.rightSpacer} /> // Placeholder to keep title centered
      )}
      
      {title && (
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        </View>
      )}
      
      {/* Invisible view to balance the flex layout and keep the title perfectly centered */}
      <View style={styles.rightSpacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(16),
    marginBottom: verticalScale(20),
  },
  backButton: {
    padding: scale(4),
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  rightSpacer: {
    width: moderateScale(40), // Same width as the back button + padding to balance it
  },
});
