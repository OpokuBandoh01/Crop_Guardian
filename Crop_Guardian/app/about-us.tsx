import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AboutUsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const features = [
    {
      icon: 'camera-outline',
      title: 'AI Disease Scan',
      description: 'Analyze leaf patterns in real-time to detect crop diseases instantly.',
      type: 'ionicons',
    },
    {
      icon: 'cloud-offline-outline',
      title: 'Offline-First Engine',
      description: 'Run diagnostic machine learning models without cellular reception.',
      type: 'ionicons',
    },
    {
      icon: 'weather-partly-cloudy',
      title: 'Agri-Weather Advice',
      description: 'Localized crop-specific instructions synced with current forecasts.',
      type: 'material',
    },
    {
      icon: 'volume-medium-outline',
      title: 'Local Language Voice',
      description: 'Listen to treatments in local languages like Twi and Akan.',
      type: 'ionicons',
    },
  ];

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

        <Text style={[styles.headerTitle, { color: theme.primary }]}>About Us</Text>

        <View style={styles.rightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= APP LOGO & BRANDING ================= */}
        <View style={styles.brandingSection}>
          <View style={[styles.logoContainer, { backgroundColor: theme.logoBackground }]}>
            <Image
              source={require('@/assets/icons/seedlingicon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>CropGuardian</Text>
          <Text style={[styles.appVersion, { color: colorScheme === 'light' ? '#687076' : '#9BA1A6' }]}>
            Version 1.0.0 (Build 42)
          </Text>
        </View>

        {/* ================= MISSION DETAILS ================= */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardHeaderTitle, { color: theme.primary }]}>OUR MISSION</Text>
          <Text style={[styles.cardText, { color: theme.text }]}>
            CropGuardian is a research-backed agricultural assistant created to combat crop failure and increase yields for smallholder farmers, gardeners, and agricultural students in West Africa.
          </Text>
          <Text style={[styles.cardText, { color: theme.text }]}>
            By leveraging local-language audio output and offline-first neural network designs, we bridge the technology gap to ensure food security for all, even in remote farm environments.
          </Text>
        </View>

        {/* ================= CORE FEATURES LIST ================= */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>KEY FEATURES</Text>
        
        <View style={styles.featuresList}>
          {features.map((item, index) => (
            <View 
              key={index} 
              style={[styles.featureRow, { backgroundColor: theme.surface }]}
            >
              <View style={[styles.featureIconWrapper, { backgroundColor: colorScheme === 'light' ? '#EBF7E9' : '#2E3D30' }]}>
                {item.type === 'ionicons' ? (
                  <Ionicons name={item.icon as any} size={moderateScale(18)} color="#094A04" />
                ) : (
                  <MaterialCommunityIcons name={item.icon as any} size={moderateScale(18)} color="#094A04" />
                )}
              </View>
              <View style={styles.featureInfo}>
                <Text style={[styles.featureTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.featureDescription, { color: colorScheme === 'light' ? '#687076' : '#9BA1A6' }]}>
                  {item.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ================= COPYRIGHT / CREDITS FOOTER ================= */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colorScheme === 'light' ? '#9CA3AF' : '#6B7280' }]}>
            &copy; {new Date().getFullYear()} CropGuardian Project. All rights reserved.
          </Text>
          <Text style={[styles.footerText, { color: colorScheme === 'light' ? '#9CA3AF' : '#6B7280', marginTop: verticalScale(4) }]}>
            Designed & Developed for Sustainable Agriculture
          </Text>
        </View>

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
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(40),
  },

  // Branding section
  brandingSection: {
    alignItems: 'center',
    marginVertical: verticalScale(20),
  },
  logoContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(10),
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  logoImage: {
    width: moderateScale(44),
    height: moderateScale(44),
  },
  appName: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    marginBottom: verticalScale(2),
  },
  appVersion: {
    fontSize: moderateScale(11.5),
    fontWeight: '600',
  },

  // Info Card
  card: {
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginBottom: verticalScale(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1.2,
    borderColor: 'rgba(9, 74, 4, 0.06)',
  },
  cardHeaderTitle: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: verticalScale(10),
  },
  cardText: {
    fontSize: moderateScale(12.5),
    lineHeight: verticalScale(18),
    marginBottom: verticalScale(12),
  },

  // Section Title
  sectionTitle: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#094A04',
    letterSpacing: 1.5,
    marginBottom: verticalScale(12),
  },

  // Features list
  featuresList: {
    gap: verticalScale(10),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: moderateScale(12),
    borderWidth: 1.2,
    borderColor: 'rgba(9, 74, 4, 0.06)',
    padding: scale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  featureIconWrapper: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    marginBottom: verticalScale(2),
  },
  featureDescription: {
    fontSize: moderateScale(11),
    lineHeight: verticalScale(15),
  },

  // Footer text
  footer: {
    alignItems: 'center',
    marginTop: verticalScale(30),
    paddingBottom: verticalScale(10),
  },
  footerText: {
    fontSize: moderateScale(10),
    fontWeight: '500',
    textAlign: 'center',
  },
});
