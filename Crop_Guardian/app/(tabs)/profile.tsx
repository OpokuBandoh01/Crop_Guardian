import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handlePress = (screen: string) => {
    if (screen === 'Log Out') {
      router.push('/logout');
    } else if (screen === 'Personal Information' || screen === 'Edit Profile') {
      router.push('/personal-info');
    } else if (screen === 'Farm Information') {
      router.push('/farm-info');
    } else if (screen === 'Change Password') {
      router.push('/change-password');
    } else if (screen === 'Offline Database') {
      router.push('/offline-database');
    } else if (screen === 'Appearance') {
      router.push('/appearance');
    } else if (screen === 'Language') {
      router.push('/language');
    } else if (screen === 'Notification Settings') {
      router.push('/notification-settings');
    } else if (screen === 'Unit Settings') {
      router.push('/unit-settings');
    } else if (screen === 'Help & Support') {
      router.push('/help-support');
    } else if (screen === 'About Us') {
      router.push('/about-us');
    } else if (screen === 'Rate Us') {
      router.push('/rate-us');
    } else {
      console.log(`Navigating to ${screen}`);
    }
  };

  const pillText = colorScheme === 'light' ? '#094A04' : '#4ADE80';
  const pillBg = colorScheme === 'light' ? '#EBF7E9' : '#2E3D30';
  const backdropBgColor = colorScheme === 'light' 
    ? 'rgba(255, 255, 255, 0.65)' 
    : 'rgba(0, 0, 0, 0.75)';

  const renderRow = (
    title: string,
    subtitle: string,
    iconConfig?: { name: string; type: 'ionicons' | 'feather' | 'material' },
    rightElement?: React.ReactNode,
    isDestructive?: boolean,
    onPress?: () => void
  ) => {
    const iconColor = isDestructive 
      ? '#EF4444' 
      : (colorScheme === 'light' ? '#094A04' : '#4ADE80');
    const titleColor = isDestructive ? '#EF4444' : theme.text;
    const subtitleColor = colorScheme === 'light' ? '#687076' : '#9BA1A6';

    return (
      <TouchableOpacity
        style={styles.rowContainer}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={!onPress}
      >
        {/* Left Icon */}
        {iconConfig ? (
          <View style={styles.rowIconContainer}>
            {iconConfig.type === 'ionicons' && (
              <Ionicons name={iconConfig.name as any} size={moderateScale(18)} color={iconColor} />
            )}
            {iconConfig.type === 'feather' && (
              <Feather name={iconConfig.name as any} size={moderateScale(18)} color={iconColor} />
            )}
            {iconConfig.type === 'material' && (
              <MaterialCommunityIcons name={iconConfig.name as any} size={moderateScale(19)} color={iconColor} />
            )}
          </View>
        ) : (
          // Align text if no icon is specified
          <View style={{ width: moderateScale(26) }} />
        )}

        {/* Text Details */}
        <View style={styles.rowTextContainer}>
          <Text style={[styles.rowTitle, { color: titleColor }]}>{title}</Text>
          <Text style={[styles.rowSubtitle, { color: subtitleColor }]}>{subtitle}</Text>
        </View>

        {/* Right Action Element */}
        {rightElement ? (
          <View style={styles.rowRightContainer}>{rightElement}</View>
        ) : (
          onPress && (
            <Ionicons
              name="chevron-forward"
              size={moderateScale(16)}
              color={colorScheme === 'light' ? '#094A04' : '#4ADE80'}
            />
          )
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      
      {/* ================= HEADER SECTION ================= */}
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= PROFILE CARD ================= */}
        <View style={styles.profileCard}>
          {/* Card Top Section */}
          <View style={styles.profileTopSection}>
            
            {/* Circular Avatar with Camera overlay badge */}
            <TouchableOpacity 
              style={styles.avatarWrapper}
              onPress={() => handlePress('Change Avatar')}
              activeOpacity={0.9}
            >
              <Image
                source={require('@/assets/images/thefarmer.png')}
                style={styles.avatar}
                resizeMode="cover"
              />
              <View style={styles.avatarBadge}>
                <Feather name="camera" size={moderateScale(10)} color="#094A04" />
              </View>
            </TouchableOpacity>

            {/* Farmer Info */}
            <View style={styles.farmerInfo}>
              <Text style={styles.farmerName}>Kofi Mensah</Text>
              
              {/* Crop Badge */}
              <View style={styles.cropBadge}>
                <Ionicons name="leaf" size={moderateScale(11)} color="#A3C89E" />
                <Text style={styles.cropBadgeText}>Maize farmer</Text>
              </View>

              {/* Location */}
              <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={moderateScale(12)} color="#A3C89E" />
                <Text style={styles.locationText}>Kumasi, Ashanti</Text>
              </View>
            </View>

            {/* Edit Profile Button */}
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handlePress('Edit Profile')}
              activeOpacity={0.8}
            >
              <Feather name="edit-3" size={moderateScale(12)} color="#094A04" style={styles.editIcon} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>

          </View>

          {/* Card Divider */}
          <View style={styles.cardDivider} />

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            
            {/* Stat Item: Crops */}
            <View style={styles.statCol}>
              <View style={styles.statHeaderRow}>
                <MaterialCommunityIcons name="sprout-outline" size={moderateScale(16)} color="#A3C89E" style={styles.statIcon} />
                <Text style={styles.statLabel}>My Crops</Text>
              </View>
              <Text style={styles.statValue}>5</Text>
            </View>

            <View style={styles.statDivider} />

            {/* Stat Item: Scans */}
            <View style={styles.statCol}>
              <View style={styles.statHeaderRow}>
                <Ionicons name="scan-outline" size={moderateScale(16)} color="#A3C89E" style={styles.statIcon} />
                <Text style={styles.statLabel}>Scans</Text>
              </View>
              <Text style={styles.statValue}>12</Text>
            </View>

            <View style={styles.statDivider} />

            {/* Stat Item: Alerts */}
            <View style={styles.statCol}>
              <View style={styles.statHeaderRow}>
                <Ionicons name="shield-checkmark-outline" size={moderateScale(16)} color="#A3C89E" style={styles.statIcon} />
                <Text style={styles.statLabel}>Alerts</Text>
              </View>
              <Text style={styles.statValue}>3</Text>
            </View>

            <View style={styles.statDivider} />

            {/* Stat Item: Tips Saved */}
            <View style={styles.statCol}>
              <View style={styles.statHeaderRow}>
                <Ionicons name="star-outline" size={moderateScale(16)} color="#A3C89E" style={styles.statIcon} />
                <Text style={styles.statLabel}>Tips Saved</Text>
              </View>
              <Text style={styles.statValue}>18</Text>
            </View>

          </View>

        </View>

        {/* ================= ACCOUNT SECTION ================= */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Account</Text>
        <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
          {renderRow(
            'Personal Information',
            'View and edit your personal details',
            { name: 'person-outline', type: 'ionicons' },
            undefined,
            false,
            () => handlePress('Personal Information')
          )}
          <View style={styles.rowDivider} />
          {renderRow(
            'Farm Information',
            'Manage your farm location and size',
            { name: 'sprout-outline', type: 'material' },
            undefined,
            false,
            () => handlePress('Farm Information')
          )}
          <View style={styles.rowDivider} />
          {renderRow(
            'Change Password',
            'Update your password security',
            { name: 'lock-closed-outline', type: 'ionicons' },
            undefined,
            false,
            () => handlePress('Change Password')
          )}
          <View style={styles.rowDivider} />
          {renderRow(
            'Offline Database',
            'Download and update crop diagnostic models',
            { name: 'download-outline', type: 'ionicons' },
            undefined,
            false,
            () => handlePress('Offline Database')
          )}
        </View>

        {/* ================= PREFERENCES SECTION ================= */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Preferences</Text>
        <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
          {renderRow(
            'Appearance',
            'Choose your theme',
            { name: 'moon-outline', type: 'ionicons' },
            (
              <View style={[styles.pillBadge, { backgroundColor: pillBg }]}>
                <Ionicons name="sunny-outline" size={moderateScale(11)} color={pillText} />
                <Text style={[styles.pillBadgeText, { color: pillText }]}>Light</Text>
                <Ionicons name="chevron-forward" size={moderateScale(11)} color={pillText} />
              </View>
            ),
            false,
            () => handlePress('Appearance')
          )}
          <View style={styles.rowDivider} />
          {renderRow(
            'Language',
            'Select your preferred language',
            { name: 'globe-outline', type: 'ionicons' },
            (
              <View style={[styles.pillBadge, { backgroundColor: pillBg }]}>
                <Text style={[styles.pillBadgeText, { color: pillText }]}>English</Text>
                <Ionicons name="chevron-forward" size={moderateScale(11)} color={pillText} />
              </View>
            ),
            false,
            () => handlePress('Language')
          )}
          <View style={styles.rowDivider} />
          {renderRow(
            'Notification Settings',
            'Manage alert and update preferences',
            { name: 'notifications-outline', type: 'ionicons' },
            undefined,
            false,
            () => handlePress('Notification Settings')
          )}
          <View style={styles.rowDivider} />
          {renderRow(
            'Unit Settings',
            'Change measurement units for temperature and area',
            { name: 'options-outline', type: 'ionicons' },
            (
              <View style={[styles.pillBadge, { backgroundColor: pillBg }]}>
                <Text style={[styles.pillBadgeText, { color: pillText }]}>Metric</Text>
                <Ionicons name="chevron-forward" size={moderateScale(11)} color={pillText} />
              </View>
            ),
            false,
            () => handlePress('Unit Settings')
          )}
        </View>

        {/* ================= SUPPORT & MORE SECTION ================= */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Support & More</Text>
        <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
          {renderRow(
            'Help & Support',
            'Get help and answers to common questions',
            { name: 'help-circle-outline', type: 'ionicons' },
            null,
            false,
            () => handlePress('Help & Support')
          )}
          <View style={styles.rowDivider} />
          {renderRow(
            'About Us',
            'Learn more about the Crop Guardian app',
            { name: 'information-circle-outline', type: 'ionicons' },
            null,
            false,
            () => handlePress('About Us')
          )}
          <View style={styles.rowDivider} />
          {renderRow(
            'Rate Us',
            'Support our work on the App Store',
            { name: 'star-outline', type: 'ionicons' },
            null,
            false,
            () => handlePress('Rate Us')
          )}
          <View style={styles.rowDivider} />
          {renderRow(
            'Log Out',
            'Sign out of your account',
            { name: 'log-out-outline', type: 'ionicons' },
            null,
            true,
            () => handlePress('Log Out')
          )}
        </View>

      </ScrollView>

      {/* ================= LOGOUT CONFIRMATION MODAL ================= */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: backdropBgColor }]}>
          {/* Background Blur View sibling overlay */}
          <BlurView
            style={StyleSheet.absoluteFill}
            intensity={100}
            tint={colorScheme === 'light' ? 'light' : 'dark'}
          />

          {/* Modal Container Card */}
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Are you sure you want to logout?
            </Text>
            <Text
              style={[
                styles.modalDescription,
                { color: colorScheme === 'light' ? '#4B5563' : '#9BA1A6' },
              ]}
            >
              You will be logged out of your account and returned to the login screen. Would you like to proceed?
            </Text>

            <View
              style={[
                styles.modalDivider,
                { backgroundColor: colorScheme === 'light' ? '#E5E7EB' : '#374151' },
              ]}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalCancelButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>

              <View
                style={[
                  styles.modalVerticalDivider,
                  { backgroundColor: colorScheme === 'light' ? '#E5E7EB' : '#374151' },
                ]}
              />

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => {
                  setLogoutModalVisible(false);
                  router.replace('/login');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalConfirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(10),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(6),
    paddingBottom: verticalScale(100), // padding to clear floating navigation bar
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#094A04',
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginBottom: verticalScale(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  profileTopSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: scale(12),
  },
  avatar: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarBadge: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 1.5,
    borderColor: '#094A04',
    alignItems: 'center',
    justifyContent: 'center',
    // Soft drop shadow to make it pop out
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  farmerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  farmerName: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: verticalScale(3),
  },
  cropBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(6),
    marginBottom: verticalScale(4),
  },
  cropBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: scale(4),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: moderateScale(11),
    color: '#A3C89E',
    marginLeft: scale(4),
  },
  editButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(6),
    alignSelf: 'center',
  },
  editIcon: {
    marginRight: scale(3),
  },
  editButtonText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#094A04',
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: verticalScale(14),
  },

  // Stats inside Profile Card
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  statIcon: {
    marginRight: scale(3),
  },
  statLabel: {
    fontSize: moderateScale(9),
    fontWeight: '600',
    color: '#A3C89E',
  },
  statValue: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statDivider: {
    width: 1,
    height: verticalScale(22),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  // Section styling
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    marginBottom: verticalScale(10),
    marginTop: verticalScale(4),
  },
  sectionCard: {
    borderRadius: moderateScale(12),
    borderWidth: 1.2,
    borderColor: 'rgba(9, 74, 4, 0.08)',
    marginBottom: verticalScale(20),
    overflow: 'hidden',
    // Premium soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(11),
  },
  rowIconContainer: {
    marginRight: scale(10),
    width: moderateScale(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextContainer: {
    flex: 1,
  },
  rowTitle: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    marginBottom: verticalScale(2),
  },
  rowSubtitle: {
    fontSize: moderateScale(10.5),
    fontWeight: '400',
  },
  rowRightContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(9, 74, 4, 0.06)',
    marginHorizontal: scale(14),
  },

  // Pill badge inside Preference rows
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(12),
  },
  pillBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    marginHorizontal: scale(4),
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(32),
  },
  modalCard: {
    width: '100%',
    borderRadius: moderateScale(14),
    paddingTop: verticalScale(20),
    // Soft shadow for the dialog card
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalTitle: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(10),
  },
  modalDescription: {
    fontSize: moderateScale(12),
    textAlign: 'center',
    lineHeight: verticalScale(16),
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(20),
  },
  modalDivider: {
    height: 1,
    width: '100%',
  },
  modalActionsRow: {
    flexDirection: 'row',
    height: verticalScale(46),
    alignItems: 'center',
  },
  modalCancelButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  modalVerticalDivider: {
    width: 1,
    height: '100%',
  },
  modalConfirmButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#EF4444', // Red for logout
  },
});

