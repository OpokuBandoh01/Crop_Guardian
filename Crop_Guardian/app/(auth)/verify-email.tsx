import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CustomButton } from '@/components/CustomButton';
import { AuthHeader } from '@/components/AuthHeader';
import { OTPInput } from '@/components/OTPInput';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Reusable Auth Header (No Back Button) */}
        <AuthHeader title="CropGuardian" showBackButton={false} />

        {/* Logo Placeholder */}
        <View style={styles.logoContainer}>
          <View style={[styles.logoBackground, { backgroundColor: theme.logoBackground }]}>
            <Ionicons name="mail-outline" size={moderateScale(32)} color={theme.primary} />
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.text }]}>
          Verify Your Email
        </Text>
        <Text style={[styles.subtitle, { color: theme.icon }]}>
          Enter the 6-digit verification code
        </Text>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          
          <OTPInput onCodeFilled={(code) => console.log('Code entered:', code)} />

          <CustomButton title="Continue" onPress={() => router.push('/reset-password')} />
        </View>

        {/* Footer Link */}
        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: theme.text }]}>Didn't you receive any code? </Text>
          <TouchableOpacity onPress={() => console.log('Resend code')}>
            <Text style={[styles.footerLink, { color: theme.primary }]}>Resend code</Text>
          </TouchableOpacity>
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
    marginTop: verticalScale(20),
    marginBottom: verticalScale(24),
  },
  logoBackground: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: verticalScale(8),
  },
  subtitle: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    marginBottom: verticalScale(40),
  },
  formContainer: {
    marginTop: verticalScale(10),
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: verticalScale(30),
  },
  footerText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  footerLink: {
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
});
