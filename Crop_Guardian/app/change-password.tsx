import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CustomInput } from '@/components/CustomInput';
import { CustomButton } from '@/components/CustomButton';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Password validation checks
  const isLengthValid = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSave = () => {
    // Basic validation
    if (!currentPassword) {
      setErrorMessage('Please enter your current password.');
      return;
    }
    if (!isLengthValid || !hasNumber || !hasSpecialChar) {
      setErrorMessage('Please make sure your new password meets the security requirements.');
      return;
    }
    if (!passwordsMatch) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    setErrorMessage('');
    setIsSaving(true);

    // Simulate saving
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }, 1500);
  };

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

        <Text style={[styles.headerTitle, { color: theme.primary }]}>Change Password</Text>

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
          {/* ================= SUCCESS BANNER ================= */}
          {showSuccess && (
            <View style={styles.successBanner}>
              <View style={styles.successIconWrapper}>
                <Ionicons name="checkmark-sharp" size={moderateScale(15)} color="#FFFFFF" />
              </View>
              <Text style={styles.successText}>Password updated successfully!</Text>
            </View>
          )}

          {/* ================= ERROR BANNER ================= */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={moderateScale(18)} color="#FFFFFF" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* ================= SECURITY ICON SECTION ================= */}
          <View style={styles.securityHeader}>
            <View style={[styles.iconWrapper, { backgroundColor: colorScheme === 'light' ? '#EBF7E9' : '#1E2C20' }]}>
              <Ionicons name="lock-closed" size={moderateScale(32)} color="#094A04" />
            </View>
            <Text style={[styles.securityTitle, { color: theme.text }]}>Update Password</Text>
            <Text style={[styles.securitySub, { color: colorScheme === 'light' ? '#687076' : '#9BA1A6' }]}>
              Choose a strong password to protect your Crop Guardian account.
            </Text>
          </View>

          {/* ================= PASSWORD FORM CARD ================= */}
          <View style={[styles.formCard, { backgroundColor: theme.surface }]}>
            <CustomInput
              label="CURRENT PASSWORD"
              placeholder="Enter current password"
              leftIcon="lock-closed-outline"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              isPassword={true}
              containerStyle={styles.inputStyle}
            />

            <CustomInput
              label="NEW PASSWORD"
              placeholder="Enter new password"
              leftIcon="lock-closed-outline"
              value={newPassword}
              onChangeText={setNewPassword}
              isPassword={true}
              containerStyle={styles.inputStyle}
            />

            <CustomInput
              label="CONFIRM NEW PASSWORD"
              placeholder="Re-enter new password"
              leftIcon="lock-closed-outline"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword={true}
              containerStyle={{ marginBottom: verticalScale(10) }}
            />

            {/* Password rules indicator list */}
            <View style={styles.requirementsContainer}>
              <Text style={[styles.requirementsHeader, { color: theme.primary }]}>SECURITY REQUIREMENTS:</Text>
              
              {/* Check 1: Length */}
              <View style={styles.requirementRow}>
                <Ionicons 
                  name={isLengthValid ? "checkmark-circle" : "ellipse-outline"} 
                  size={moderateScale(14)} 
                  color={isLengthValid ? "#2E7D32" : "#9CA3AF"} 
                />
                <Text style={[styles.requirementText, isLengthValid && styles.requirementActiveText]}>
                  At least 8 characters long
                </Text>
              </View>

              {/* Check 2: Numbers */}
              <View style={styles.requirementRow}>
                <Ionicons 
                  name={hasNumber ? "checkmark-circle" : "ellipse-outline"} 
                  size={moderateScale(14)} 
                  color={hasNumber ? "#2E7D32" : "#9CA3AF"} 
                />
                <Text style={[styles.requirementText, hasNumber && styles.requirementActiveText]}>
                  Contains at least one number
                </Text>
              </View>

              {/* Check 3: Special Character */}
              <View style={styles.requirementRow}>
                <Ionicons 
                  name={hasSpecialChar ? "checkmark-circle" : "ellipse-outline"} 
                  size={moderateScale(14)} 
                  color={hasSpecialChar ? "#2E7D32" : "#9CA3AF"} 
                />
                <Text style={[styles.requirementText, hasSpecialChar && styles.requirementActiveText]}>
                  Contains a special character (e.g. !, @, #, $)
                </Text>
              </View>

              {/* Check 4: Match */}
              <View style={styles.requirementRow}>
                <Ionicons 
                  name={passwordsMatch ? "checkmark-circle" : "ellipse-outline"} 
                  size={moderateScale(14)} 
                  color={passwordsMatch ? "#2E7D32" : "#9CA3AF"} 
                />
                <Text style={[styles.requirementText, passwordsMatch && styles.requirementActiveText]}>
                  Passwords match exactly
                </Text>
              </View>
            </View>

            {/* Save Button */}
            <CustomButton
              title="Update Password"
              loading={isSaving}
              onPress={handleSave}
              style={styles.saveButton}
            />
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
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(40),
  },

  // Banner Alerts
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C62828',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    borderRadius: moderateScale(10),
    marginBottom: verticalScale(16),
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginLeft: scale(8),
    flex: 1,
  },

  // Security Lock Header Illustration
  securityHeader: {
    alignItems: 'center',
    marginVertical: verticalScale(16),
    paddingHorizontal: scale(20),
  },
  iconWrapper: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  securityTitle: {
    fontSize: moderateScale(17),
    fontWeight: '800',
    marginBottom: verticalScale(4),
  },
  securitySub: {
    fontSize: moderateScale(11.5),
    textAlign: 'center',
    lineHeight: verticalScale(16),
  },

  // Main Card Wrapper
  formCard: {
    borderRadius: moderateScale(16),
    padding: scale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1.2,
    borderColor: 'rgba(9, 74, 4, 0.06)',
  },
  inputStyle: {
    marginBottom: verticalScale(12),
  },

  // Requirements Indicator
  requirementsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: moderateScale(10),
    padding: scale(12),
    marginVertical: verticalScale(8),
    gap: verticalScale(6),
  },
  requirementsHeader: {
    fontSize: moderateScale(10.5),
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: verticalScale(2),
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  requirementText: {
    fontSize: moderateScale(11),
    color: '#9CA3AF',
    fontWeight: '500',
  },
  requirementActiveText: {
    color: '#2E7D32',
    fontWeight: '600',
  },

  saveButton: {
    marginTop: verticalScale(12),
    shadowColor: '#094A04',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
});
