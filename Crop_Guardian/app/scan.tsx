import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

export default function ScanScreen() {
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
        <Text style={[styles.headerTitle, { color: theme.primary }]}>Scan Your Crop</Text>
        <View style={styles.rightSpacer} />
      </View>

      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image 
          source={require('@/assets/images/plant.png')} 
          style={styles.image}
          contentFit="cover"
        />
        {/* Frame Overlays */}
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
      </View>

      {/* Instruction Text */}
      <Text style={[styles.instructionText, { color: theme.text }]}>Align the leaf in frame</Text>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.iconButton}>
          <Image 
            source={require('@/assets/icons/galleryicon.png')} 
            style={styles.controlIcon} 
            contentFit="contain" 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.captureButtonOuter, { borderColor: theme.primary }]}
          onPress={() => router.push('/result')}
        >
          <View style={[styles.captureButtonInner, { backgroundColor: theme.primary }]} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.iconButton, styles.invertButton, { borderColor: theme.text }]}>
          <Image 
            source={require('@/assets/icons/invertcameraicon.png')} 
            style={styles.controlIcon} 
            contentFit="contain" 
          />
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
  imageContainer: {
    width: width - scale(32),
    height: verticalScale(450),
    alignSelf: 'center',
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  corner: {
    position: 'absolute',
    width: moderateScale(40),
    height: moderateScale(40),
    borderColor: '#E5E7EB', // Slightly off-white to match the design's semi-transparent frame
  },
  topLeft: {
    top: moderateScale(20),
    left: moderateScale(20),
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  topRight: {
    top: moderateScale(20),
    right: moderateScale(20),
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bottomLeft: {
    bottom: moderateScale(20),
    left: moderateScale(20),
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bottomRight: {
    bottom: moderateScale(20),
    right: moderateScale(20),
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  instructionText: {
    textAlign: 'center',
    fontSize: moderateScale(18),
    marginTop: verticalScale(16),
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginTop: verticalScale(40),
    paddingHorizontal: scale(20),
  },
  iconButton: {
    padding: scale(8),
  },
  invertButton: {
    borderWidth: 1,
    borderRadius: moderateScale(30),
    padding: moderateScale(8),
  },
  controlIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
  },
  captureButtonOuter: {
    width: moderateScale(68),
    height: moderateScale(68),
    borderRadius: moderateScale(34),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
  },
});
