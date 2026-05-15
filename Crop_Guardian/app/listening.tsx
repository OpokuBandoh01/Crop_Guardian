import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

export default function ListeningScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-circle-outline" size={moderateScale(32)} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>Listening(Twi)</Text>
        <View style={styles.rightSpacer} />
      </View>

      <View style={styles.content}>
        {/* Large Volume Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="volume-high" size={moderateScale(100)} color={theme.primary} />
        </View>

        {/* Text content */}
        <Text style={[styles.textContent, { color: theme.text }]}>
          Maize leaf blight disease{'\n'}
          detected. Remove the{'\n'}
          affected leaves. Apply{'\n'}
          recommended fungicide.{'\n'}
          Ensure good ventilation and{'\n'}
          avoid overhead watering.
        </Text>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBarFilled, { backgroundColor: theme.primary }]} />
          <View style={styles.progressBarUnfilled} />
        </View>
      </View>

      {/* Stop Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={[styles.stopButton, { borderColor: theme.primary }]} onPress={() => router.back()}>
          <Text style={[styles.stopButtonText, { color: theme.primary }]}>Stop</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(24),
  },
  backButton: {
    padding: scale(4),
  },
  headerTitle: {
    fontSize: moderateScale(22),
    fontWeight: '700',
  },
  rightSpacer: {
    width: moderateScale(40),
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: scale(24),
    marginTop: verticalScale(40),
  },
  iconContainer: {
    marginBottom: verticalScale(40),
  },
  textContent: {
    fontSize: moderateScale(16),
    lineHeight: moderateScale(28),
    textAlign: 'center',
    marginBottom: verticalScale(60),
    fontWeight: '400',
  },
  progressContainer: {
    width: '100%',
    height: moderateScale(6),
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: verticalScale(60),
  },
  progressBarFilled: {
    height: '100%',
    width: '60%', // 60% progress representation
    borderTopLeftRadius: moderateScale(3),
    borderBottomLeftRadius: moderateScale(3),
  },
  progressBarUnfilled: {
    height: '100%',
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB', // light gray border
    borderLeftWidth: 0,
    borderTopRightRadius: moderateScale(3),
    borderBottomRightRadius: moderateScale(3),
  },
  bottomContainer: {
    paddingHorizontal: scale(24),
    paddingBottom: verticalScale(40),
  },
  stopButton: {
    width: '100%',
    borderWidth: 1,
    borderRadius: moderateScale(16),
    paddingVertical: verticalScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
});
