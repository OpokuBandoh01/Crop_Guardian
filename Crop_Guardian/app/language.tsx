import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CustomButton } from '@/components/CustomButton';
import { useAuthStore } from '@/stores/authStore';
import API from '@/services/api';

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'tw', name: 'Twi', nativeName: 'Akan (Twi)', flag: '🇬🇭' },
];

export default function LanguageScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [selectedLanguage, setSelectedLanguage] = useState(user?.language || 'en');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      updateUser({ language: selectedLanguage });
      try {
        await API.put('/api/auth/me', {
          language: selectedLanguage,
        });
      } catch (err) {
        console.warn("Backend language update failed:", err);
      }
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Save language error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderLanguageItem = (lang: LanguageOption) => {
    const isSelected = selectedLanguage === lang.code;
    return (
      <TouchableOpacity
        key={lang.code}
        style={[
          styles.langItemRow,
          { borderColor: isSelected ? theme.primary : 'rgba(9, 74, 4, 0.06)' },
          isSelected && { backgroundColor: colorScheme === 'light' ? '#F4F9F3' : '#1A231C' }
        ]}
        onPress={() => setSelectedLanguage(lang.code)}
        activeOpacity={0.7}
      >
        <View style={styles.langLeft}>
          <Text style={styles.flagIcon}>{lang.flag}</Text>
          <View style={styles.langNameContainer}>
            <Text style={[styles.langNativeName, { color: theme.text }]}>
              {lang.nativeName}
            </Text>
            <Text style={[styles.langEnglishName, { color: colorScheme === 'light' ? '#687076' : '#9BA1A6' }]}>
              {lang.name}
            </Text>
          </View>
        </View>

        <View style={[
          styles.radioOuter,
          isSelected ? styles.radioOuterSelected : styles.radioOuterUnselected,
          isSelected && { borderColor: theme.primary }
        ]}>
          {isSelected && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={[styles.backButton, { borderColor: theme.primary }]} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={moderateScale(18)} color={theme.primary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.primary }]}>Language</Text>

        <View style={styles.rightSpacer} />
      </View>

      {/* Success Banner */}
      {showSuccess && (
        <View style={styles.successBanner}>
          <View style={styles.successIconWrapper}>
            <Ionicons name="checkmark" size={moderateScale(14)} color="#FFFFFF" />
          </View>
          <Text style={styles.successText}>Language preferences saved successfully!</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.groupContainer}>
          <Text style={[styles.groupTitle, { color: theme.primary }]}>Available Languages</Text>
          <View style={[styles.groupCard, { backgroundColor: theme.surface }]}>
            {LANGUAGES.map((lang, idx) => (
              <View key={lang.code}>
                {renderLanguageItem(lang)}
                {idx < LANGUAGES.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Action Button */}
        <CustomButton
          title="Save Language"
          loading={isSaving}
          onPress={handleSave}
          style={styles.saveButton}
        />
      </ScrollView>
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    borderRadius: moderateScale(10),
    marginHorizontal: scale(16),
    marginTop: verticalScale(5),
    marginBottom: verticalScale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(40),
  },
  groupContainer: {
    marginBottom: verticalScale(18),
  },
  groupTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: '700',
    marginBottom: verticalScale(8),
    paddingLeft: scale(4),
  },
  groupCard: {
    borderRadius: moderateScale(14),
    borderWidth: 1.2,
    borderColor: 'rgba(9, 74, 4, 0.06)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  langItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    borderLeftWidth: 3,
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flagIcon: {
    fontSize: moderateScale(22),
    marginRight: scale(12),
  },
  langNameContainer: {
    flex: 1,
  },
  langNativeName: {
    fontSize: moderateScale(13.5),
    fontWeight: '700',
    marginBottom: verticalScale(2),
  },
  langEnglishName: {
    fontSize: moderateScale(11),
  },
  radioOuter: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {},
  radioOuterUnselected: {
    borderColor: '#9CA3AF',
  },
  radioInner: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(9, 74, 4, 0.05)',
    marginHorizontal: scale(14),
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
