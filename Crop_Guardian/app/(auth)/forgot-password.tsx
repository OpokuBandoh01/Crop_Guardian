import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CustomInput } from '@/components/CustomInput';
import { CustomButton } from '@/components/CustomButton';
import { AuthHeader } from '@/components/AuthHeader';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Reusable Auth Header */}
        <AuthHeader title="CropGuardian" />

        {/* App Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/icons/leaflogoicon.png')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.text }]}>
          Forgot Your Password{'\n'}and Continue
        </Text>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          <CustomInput
            placeholder="Enter your email"
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <CustomButton title="Submit Now" onPress={() => router.push('/verify-email')} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(40),
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: verticalScale(40),
    marginBottom: verticalScale(24),
  },
  logoImage: {
    width: moderateScale(80),
    height: moderateScale(80),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: verticalScale(40),
    lineHeight: moderateScale(32),
  },
  formContainer: {
    marginTop: verticalScale(10),
  },
});
