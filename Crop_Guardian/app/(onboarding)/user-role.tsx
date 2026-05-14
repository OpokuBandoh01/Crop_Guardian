import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthHeader } from '@/components/AuthHeader';
import { CustomButton } from '@/components/CustomButton';

// Role Options
const ROLES = [
  { id: 'farmer', label: 'Farmer', icon: require('@/assets/icons/farmericon.png') },
  { id: 'beginner', label: 'Beginner', icon: require('@/assets/icons/beginnericon.png') },
  { id: 'gardener', label: 'Gardener', icon: require('@/assets/icons/gardenericon.png') },
  { id: 'student', label: 'Student', isIonicon: true, iconName: 'school' },
  { id: 'other', label: 'Other/ Just exploring', isIonicon: true, iconName: 'ellipsis-horizontal-circle-outline' },
];

export default function UserRoleScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleNext = () => {
    if (selectedRole) {
      router.push('/crop-selection');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.headerWrapper}>
        <AuthHeader />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: theme.text }]}>
            Who are you?
          </Text>
          <Text style={[styles.subtitle, { color: theme.text }]}>
            This helps us to serve you better
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {ROLES.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.optionButton,
                  { borderColor: theme.primary },
                  isSelected && { backgroundColor: theme.logoBackground, borderWidth: 2 }
                ]}
                onPress={() => setSelectedRole(role.id)}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  {role.isIonicon ? (
                    <Ionicons name={role.iconName as any} size={moderateScale(24)} color={theme.text} />
                  ) : (
                    <Image source={role.icon} style={styles.customIcon} resizeMode="contain" />
                  )}
                </View>
                <Text style={[
                  styles.optionLabel, 
                  { color: theme.text },
                  isSelected && { fontWeight: '600' }
                ]}>
                  {role.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <CustomButton 
          title="Next" 
          onPress={handleNext} 
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerWrapper: {
    paddingHorizontal: scale(20),
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(40),
  },
  headerTextContainer: {
    alignItems: 'center',
    marginTop: verticalScale(10),
    marginBottom: verticalScale(40),
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: '700',
    marginBottom: verticalScale(16),
  },
  subtitle: {
    fontSize: moderateScale(16),
    fontWeight: '400',
  },
  optionsContainer: {
    gap: verticalScale(20),
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(18),
    paddingHorizontal: scale(20),
    borderWidth: 1,
    borderRadius: moderateScale(8),
  },
  iconContainer: {
    width: moderateScale(30),
    alignItems: 'center',
    marginRight: scale(12),
  },
  customIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
  },
  optionLabel: {
    fontSize: moderateScale(16),
  },
  footer: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(20),
  },
});
