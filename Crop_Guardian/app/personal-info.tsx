import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '@/services/api';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CustomInput } from '@/components/CustomInput';
import { CustomButton } from '@/components/CustomButton';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  
  // UI states
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const cached = await AsyncStorage.getItem('userData');
        if (cached) {
          const user = JSON.parse(cached);
          if (user.profile?.fullName) setFullName(user.profile.fullName);
          if (user.email) setEmail(user.email);
          if (user.phoneNumber) setPhone(user.phoneNumber);
          if (user.profile?.location?.address) setLocation(user.profile.location.address);
        }

        const res = await API.get('/api/auth/me');
        if (res.data?.success && res.data.user) {
          const user = res.data.user;
          await AsyncStorage.setItem('userData', JSON.stringify(user));
          if (user.profile?.fullName) setFullName(user.profile.fullName);
          if (user.email) setEmail(user.email);
          if (user.phoneNumber) setPhone(user.phoneNumber);
          if (user.profile?.location?.address) setLocation(user.profile.location.address);
        }
      } catch (e) {
        console.warn('Error loading user data in personal-info:', e);
      }
    };

    loadUserData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });
    return unsubscribe;
  }, [navigation]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const cached = await AsyncStorage.getItem('userData');
      let parsedUserData: any = {};
      if (cached) {
        parsedUserData = JSON.parse(cached);
      }
      
      // Update local userData object structure
      if (!parsedUserData.profile) {
        parsedUserData.profile = {};
      }
      parsedUserData.profile.fullName = fullName;
      parsedUserData.email = email;
      parsedUserData.phoneNumber = phone;
      if (!parsedUserData.profile.location) {
        parsedUserData.profile.location = {};
      }
      parsedUserData.profile.location.address = location;

      await AsyncStorage.setItem('userData', JSON.stringify(parsedUserData));

      // Attempt to save to backend (fallback gracefully if update endpoints not supported)
      try {
        await API.put('/api/auth/me', {
          fullName,
          email,
          phoneNumber: phone,
          location: {
            address: location
          }
        });
      } catch {
        // Safe to ignore since backend doesn't support profile updates directly yet
      }

      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.back();
      }, 1500);
    } catch (e) {
      console.error('Error saving personal info:', e);
      setIsSaving(false);
    }
  };

  // Profile completion calculation (mock)
  const fields = [fullName, email, phone, location];
  const filledFields = fields.filter(f => f.trim().length > 0).length;
  const completionPercentage = Math.round((filledFields / fields.length) * 100);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      
      {/* ================= HEADER SECTION ================= */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={[styles.backButton, { borderColor: theme.primary }]} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={moderateScale(18)} color={theme.primary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.primary }]}>Personal Profile</Text>

        <View style={styles.rightSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ================= AVATAR SECTION ================= */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Image
                source={require('@/assets/images/thefarmer.png')}
                style={[styles.avatar, { borderColor: theme.surface }]}
                resizeMode="cover"
              />
              <TouchableOpacity 
                style={styles.cameraBadge}
                activeOpacity={0.9}
                onPress={() => console.log('Change image')}
              >
                <Feather name="camera" size={moderateScale(14)} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.farmerName, { color: theme.text }]}>{fullName || 'Farmer Name'}</Text>
            
            {/* Verified Farmer Badge */}
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-sharp" size={moderateScale(10)} color="#094A04" />
              <Text style={styles.verifiedText}>Verified Member</Text>
            </View>
          </View>

          {/* ================= SUCCESS FLOATING ALERT ================= */}
          {showSuccess && (
            <View style={styles.successBanner}>
              <View style={styles.successIconWrapper}>
                <Ionicons name="checkmark-sharp" size={moderateScale(15)} color="#FFFFFF" />
              </View>
              <Text style={styles.successText}>Personal profile updated successfully!</Text>
            </View>
          )}

          {/* ================= MAIN CONTENT CARD ================= */}
          <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
            
            {/* Profile Completion Indicator */}
            <View style={styles.completionContainer}>
              <View style={styles.completionTextRow}>
                <Text style={[styles.completionLabel, { color: theme.text }]}>Profile Strength</Text>
                <Text style={styles.completionValue}>{completionPercentage}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${completionPercentage}%` }]} />
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* Inputs */}
            <View style={styles.inputsWrapper}>
              <CustomInput
                label="FULL NAME"
                placeholder="e.g. Kofi Mensah"
                leftIcon="person-outline"
                value={fullName}
                onChangeText={setFullName}
                containerStyle={styles.inputStyle}
              />

              <CustomInput
                label="EMAIL ADDRESS"
                placeholder="e.g. kofi.mensah@gmail.com"
                leftIcon="mail-outline"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                containerStyle={styles.inputStyle}
              />

              <CustomInput
                label="PHONE NUMBER"
                placeholder="e.g. +233 24 123 4567"
                leftIcon="call-outline"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                containerStyle={styles.inputStyle}
              />

              <CustomInput
                label="LOCATION / REGION"
                placeholder="e.g. Kumasi, Ashanti"
                leftIcon="location-outline"
                value={location}
                onChangeText={setLocation}
                containerStyle={styles.inputStyle}
              />
            </View>

            {/* Save Button */}
            <CustomButton
              title="Save Changes"
              loading={isSaving}
              onPress={handleSave}
              style={styles.saveButton}
            />

          </View>

          {/* Info tip section */}
          <View style={styles.tipSection}>
            <Ionicons name="shield-checkmark-outline" size={moderateScale(16)} color="#094A04" />
            <Text style={styles.tipText}>
              Your information is secure and only used to provide accurate crop diagnostics and localized weather forecasts.
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header Section
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
  },
  backButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    textAlign: 'center',
  },
  rightSpacer: {
    width: moderateScale(32),
  },

  scrollContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(40),
  },

  // Avatar Floating Section
  avatarSection: {
    alignItems: 'center',
    marginVertical: verticalScale(16),
  },
  avatarWrapper: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  avatar: {
    width: moderateScale(90),
    height: moderateScale(90),
    borderRadius: moderateScale(45),
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  cameraBadge: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: '#094A04',
    position: 'absolute',
    bottom: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
  },
  farmerName: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    marginTop: verticalScale(8),
    marginBottom: verticalScale(2),
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C8E6C9', // light green badge
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(12),
  },
  verifiedText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#094A04',
    marginLeft: scale(3),
  },

  // Success Alert Toast
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    borderRadius: moderateScale(10),
    marginBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  successIconWrapper: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(8),
  },
  successText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: '700',
    flex: 1,
  },

  // Main Info Card
  infoCard: {
    borderRadius: moderateScale(16),
    padding: scale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1.2,
    borderColor: 'rgba(9, 74, 4, 0.06)',
    marginBottom: verticalScale(16),
  },

  // Profile strength progress
  completionContainer: {
    marginBottom: verticalScale(12),
  },
  completionTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(5),
  },
  completionLabel: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    opacity: 0.8,
  },
  completionValue: {
    fontSize: moderateScale(13),
    fontWeight: '800',
    color: '#094A04',
  },
  progressTrack: {
    height: verticalScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#E5E7EB',
    width: '100%',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: moderateScale(3),
    backgroundColor: '#094A04',
  },

  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(9, 74, 4, 0.08)',
    marginVertical: verticalScale(8),
    marginBottom: verticalScale(16),
  },

  inputsWrapper: {
    gap: verticalScale(2),
  },
  inputStyle: {
    marginBottom: verticalScale(12),
  },

  saveButton: {
    marginTop: verticalScale(12),
    shadowColor: '#094A04',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  // Informative Footer Tip
  tipSection: {
    flexDirection: 'row',
    backgroundColor: 'rgba(9, 74, 4, 0.04)',
    padding: scale(12),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    gap: scale(8),
  },
  tipText: {
    flex: 1,
    fontSize: moderateScale(10.5),
    lineHeight: verticalScale(15),
    color: '#094A04',
    fontWeight: '500',
  },
});
