import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Link, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CustomInput } from '@/components/CustomInput';
import { CustomButton } from '@/components/CustomButton';
import API from '@/services/api';

export default function SignUpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [locationText, setLocationText] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: 6.6961, // Default Kumasi latitude
    longitude: -1.6152, // Default Kumasi longitude
  });

  // Fetch coordinates on mount
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let loc = await Location.getCurrentPositionAsync({});
          setCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          setLocationText('GPS Location Detected');
        }
      } catch (err) {
        console.warn('Could not get GPS location:', err);
      }
    })();
  }, []);

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare payload with default values for backend validation (actual onboarding happens next)
      const payload = {
        email,
        password,
        fullName: `${firstName} ${lastName}`.trim(),
        phoneNumber: phoneNumber || '+233241234567', // Standard validation fallback
        role: 'FARMER',
        preferredCrops: ['MAIZE'],
        location: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          address: locationText || 'Kumasi, Ashanti',
        },
      };

      const response = await API.post('/api/auth/register', payload);
      const { token } = response.data;
      await AsyncStorage.setItem('userToken', token);
      
      if (response.data.user) {
        const user = response.data.user;
        user.isOnboarded = false;
        await AsyncStorage.setItem('userData', JSON.stringify(user));
      }

      // Clear any previous cached onboarding settings
      await AsyncStorage.removeItem('onboarding_role');
      await AsyncStorage.removeItem('onboarding_preferredCrops');

      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => router.replace('/(onboarding)/user-role') }
      ]);
    } catch (error: any) {
      console.error('Signup error:', error);
      const errorMsg = error.response?.data?.message || 'An error occurred during sign up. Please try again.';
      Alert.alert('Registration Failed', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

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
        <Text style={[styles.title, { color: theme.primary }]}>Create An Account</Text>
        <Text style={[styles.subtitle, { color: theme.icon }]}>
          Join CropGuardian to start your plant care journey
        </Text>

        {/* Form Fields */}
        <View style={styles.row}>
          <CustomInput
            placeholder="First Name"
            leftIcon="person-outline"
            containerStyle={styles.halfInput}
            value={firstName}
            onChangeText={setFirstName}
            editable={!isLoading}
          />
          <CustomInput
            placeholder="Last Name"
            leftIcon="person-outline"
            containerStyle={styles.halfInput}
            value={lastName}
            onChangeText={setLastName}
            editable={!isLoading}
          />
        </View>

        <CustomInput
          placeholder="Email"
          leftIcon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
        />

        <CustomInput
          placeholder="Phone Number (Optional)"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          editable={!isLoading}
        />

        {/* Custom Country Code Field (Read Only) */}
        <View style={styles.countryCodeWrapper}>
          <Text style={[styles.floatingLabel, { backgroundColor: theme.background, color: theme.icon }]}>
            Country Code (Auto-detected)
          </Text>
          <View style={[styles.countryCodeContainer, { borderColor: theme.inputBorder, backgroundColor: theme.surface }]}>
            <Ionicons name="globe-outline" size={moderateScale(20)} color={theme.icon} style={styles.leftIcon} />
            <Text style={[styles.countryText, { color: theme.text }]}>GH</Text>
            <Ionicons name="checkmark-circle" size={moderateScale(20)} color={theme.primary} />
          </View>
          <Text style={[styles.helperText, { color: theme.icon }]}>2/2</Text>
        </View>

        <CustomInput
          placeholder="Location"
          label={locationText ? `Detected: ${locationText}` : 'Detected: Ghana'}
          value={locationText}
          onChangeText={setLocationText}
          editable={!isLoading}
        />

        <CustomInput
          placeholder="Password"
          leftIcon="lock-closed-outline"
          isPassword
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
        />

        <CustomInput
          placeholder="Confirm Password"
          leftIcon="lock-closed-outline"
          isPassword
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!isLoading}
        />

        {/* Terms and Conditions */}
        <View style={styles.termsContainer}>
          <Text style={[styles.termsText, { color: theme.text }]}>
            I agree to the <Text style={[styles.linkText, { color: theme.primary }]}>Terms and Conditions</Text> and <Text style={[styles.linkText, { color: theme.primary }]}>Privacy Policy</Text>
          </Text>
        </View>

        {/* Submit Button */}
        <CustomButton title="Create Account" loading={isLoading} disabled={isLoading} onPress={handleSignUp} />

        {/* Footer Link */}
        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: theme.icon }]}>Already have an account? </Text>
          <Link href="/login" asChild>
            <TouchableOpacity>
              <Text style={[styles.footerLink, { color: theme.primary }]}>Sign In</Text>
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
    fontSize: moderateScale(24),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: verticalScale(8),
  },
  subtitle: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    marginBottom: verticalScale(30),
    paddingHorizontal: scale(20),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48, // Takes up slightly less than half to leave a gap
  },
  countryCodeWrapper: {
    marginBottom: verticalScale(16),
    position: 'relative',
  },
  floatingLabel: {
    position: 'absolute',
    top: -verticalScale(8),
    left: scale(12),
    zIndex: 1,
    paddingHorizontal: scale(4),
    fontSize: moderateScale(10),
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(12),
    height: verticalScale(50),
  },
  leftIcon: {
    marginRight: scale(10),
  },
  countryText: {
    flex: 1,
    fontSize: moderateScale(14),
  },
  helperText: {
    textAlign: 'right',
    fontSize: moderateScale(10),
    marginTop: verticalScale(4),
  },
  termsContainer: {
    marginTop: verticalScale(8),
    marginBottom: verticalScale(20),
    paddingHorizontal: scale(20),
  },
  termsText: {
    fontSize: moderateScale(12),
    textAlign: 'center',
    lineHeight: moderateScale(18),
  },
  linkText: {
    fontWeight: '600',
    textDecorationLine: 'underline',
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
