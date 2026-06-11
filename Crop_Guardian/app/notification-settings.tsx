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

interface CustomSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  activeColor: string;
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({ value, onValueChange, activeColor }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      style={[
        styles.switchOuter,
        {
          backgroundColor: value ? activeColor : 'rgba(120, 120, 128, 0.16)',
          alignItems: value ? 'flex-end' : 'flex-start',
        }
      ]}
    >
      <View style={styles.switchInner} />
    </TouchableOpacity>
  );
};

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // Notification States
  const [diseaseAlerts, setDiseaseAlerts] = useState(true);
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [pestAlerts, setPestAlerts] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [tipsNotification, setTipsNotification] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }, 1000);
  };

  const renderToggleRow = (
    title: string,
    description: string,
    value: boolean,
    onValueChange: (val: boolean) => void,
    iconName: string
  ) => {
    return (
      <View style={[styles.toggleRow, { borderBottomColor: 'rgba(9, 74, 4, 0.05)' }]}>
        <View style={styles.rowLeft}>
          <View style={[styles.iconWrapper, { backgroundColor: colorScheme === 'light' ? '#EBF7E9' : '#1A231C' }]}>
            <Ionicons name={iconName as any} size={moderateScale(18)} color={theme.primary} />
          </View>
          <View style={styles.textWrapper}>
            <Text style={[styles.toggleTitle, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.toggleDescription, { color: colorScheme === 'light' ? '#687076' : '#9BA1A6' }]}>
              {description}
            </Text>
          </View>
        </View>
        <CustomSwitch value={value} onValueChange={onValueChange} activeColor={theme.primary} />
      </View>
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

        <Text style={[styles.headerTitle, { color: theme.primary }]}>Notifications</Text>

        <View style={styles.rightSpacer} />
      </View>

      {/* Success Banner */}
      {showSuccess && (
        <View style={styles.successBanner}>
          <View style={styles.successIconWrapper}>
            <Ionicons name="checkmark" size={moderateScale(14)} color="#FFFFFF" />
          </View>
          <Text style={styles.successText}>Notification preferences updated!</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <Text style={[styles.introText, { color: colorScheme === 'light' ? '#4B5563' : '#ECEDEE' }]}>
            Stay informed about your farm. Choose what alerts and digests you want to receive.
          </Text>
        </View>

        {/* Group 1: Critical Alerts */}
        <View style={styles.groupContainer}>
          <Text style={[styles.groupTitle, { color: theme.primary }]}>Critical Safety Alerts</Text>
          <View style={[styles.groupCard, { backgroundColor: theme.surface }]}>
            {renderToggleRow(
              'Disease Outbreaks',
              'Immediate warnings if crop diseases are reported in your region.',
              diseaseAlerts,
              setDiseaseAlerts,
              'alert-circle-outline'
            )}
            {renderToggleRow(
              'Weather Alerts',
              'Rainfall warnings, high winds, or dry spells targeting your crops.',
              weatherAlerts,
              setWeatherAlerts,
              'thunderstorm-outline'
            )}
            {renderToggleRow(
              'Pest Activity Alerts',
              'Track local infestations (e.g. Fall Armyworm) near your farm.',
              pestAlerts,
              setPestAlerts,
              'bug-outline'
            )}
          </View>
        </View>

        {/* Group 2: Digest & Tips */}
        <View style={styles.groupContainer}>
          <Text style={[styles.groupTitle, { color: theme.primary }]}>Updates &amp; Digests</Text>
          <View style={[styles.groupCard, { backgroundColor: theme.surface }]}>
            {renderToggleRow(
              'Weekly Farm Digest',
              'A summary of scan statistics, weather reviews, and crop health advice.',
              weeklyDigest,
              setWeeklyDigest,
              'calendar-outline'
            )}
            {renderToggleRow(
              'Productivity & Farm Tips',
              'Daily hints on soil enrichment, fertilizer use, and harvesting.',
              tipsNotification,
              setTipsNotification,
              'bulb-outline'
            )}
          </View>
        </View>

        {/* Save button */}
        <CustomButton
          title="Save Notification Settings"
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
    paddingBottom: verticalScale(40),
  },
  introSection: {
    marginBottom: verticalScale(16),
    paddingHorizontal: scale(4),
  },
  introText: {
    fontSize: moderateScale(12),
    lineHeight: verticalScale(16),
  },
  groupContainer: {
    marginBottom: verticalScale(20),
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(14),
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: scale(12),
  },
  iconWrapper: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  textWrapper: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    marginBottom: verticalScale(2),
  },
  toggleDescription: {
    fontSize: moderateScale(10.5),
    lineHeight: verticalScale(14),
  },

  // Premium Switch Design
  switchOuter: {
    width: moderateScale(42),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    padding: scale(2.5),
    justifyContent: 'center',
  },
  switchInner: {
    width: moderateScale(19),
    height: moderateScale(19),
    borderRadius: moderateScale(9.5),
    backgroundColor: '#FFFFFF',
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },

  saveButton: {
    marginTop: verticalScale(8),
    shadowColor: '#094A04',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
});
