import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Link } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CustomInput } from '@/components/CustomInput';
import { CustomButton } from '@/components/CustomButton';
import { SocialButton } from '@/components/SocialButton';
import { Divider } from '@/components/Divider';

export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/icons/leaflogoicon.png')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
        </View>

        {/* Headers */}
        <Text style={[styles.title, { color: theme.primary }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: theme.icon }]}>
          Sign in to continue your plant care journey
        </Text>

        {/* Form Fields */}
        <CustomInput
          placeholder="Email"
          leftIcon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <CustomInput
          placeholder="Password"
          leftIcon="lock-closed-outline"
          isPassword
        />

        {/* Forgot Password Link */}
        <Link href="/forgot-password" asChild>
          <TouchableOpacity style={styles.forgotPasswordContainer}>
            <Text style={[styles.forgotPasswordText, { color: theme.icon }]}>Forgot password?</Text>
          </TouchableOpacity>
        </Link>

        {/* Submit Button */}
        <CustomButton title="SIGN IN" onPress={() => console.log('Sign In pressed')} />

        {/* Divider */}
        <Divider text="OR" />

        {/* Social Logins */}
        <SocialButton 
          title="Continue with Google" 
          onPress={() => console.log('Google login')}
          iconSource={require('@/assets/icons/googleicon.png')}
          variant="outline"
        />

        <SocialButton 
          title="Continue with Apple" 
          onPress={() => console.log('Apple login')}
          iconName="logo-apple"
          variant="solid"
        />

        {/* Footer Link */}
        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: theme.icon }]}>Don't have an account? </Text>
          <Link href="/signup" asChild>
            <TouchableOpacity>
              <Text style={[styles.footerLink, { color: theme.primary }]}>Sign up!</Text>
            </TouchableOpacity>
          </Link>
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
    paddingTop: verticalScale(40),
    paddingBottom: verticalScale(40),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  logoImage: {
    width: moderateScale(80),
    height: moderateScale(80),
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: verticalScale(8),
  },
  subtitle: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    marginBottom: verticalScale(40),
    paddingHorizontal: scale(20),
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-start',
    marginTop: verticalScale(-8),
    marginBottom: verticalScale(16),
  },
  forgotPasswordText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: verticalScale(20),
  },
  footerText: {
    fontSize: moderateScale(14),
  },
  footerLink: {
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
});
