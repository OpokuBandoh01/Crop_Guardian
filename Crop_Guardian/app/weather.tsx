import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

export default function WeatherScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // Dummy navigation handlers for floating menu
  const handleNavPress = (tabName: string) => {
    if (tabName === 'Home') {
      router.navigate('/');
    } else if (tabName === 'My Crops') {
      router.navigate('/my-crops');
    } else if (tabName === 'Alerts') {
      router.navigate('/alerts');
    } else if (tabName === 'Profile') {
      router.navigate('/profile');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      
      {/* ================= HEADER SECTION ================= */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={moderateScale(18)} color="#094A04" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Weather</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={moderateScale(12)} color="#094A04" style={styles.locationIcon} />
            <Text style={styles.locationText}>Kumasi, Ghana</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.notificationButton} activeOpacity={0.7}>
          <View style={styles.notificationIconWrapper}>
            <Ionicons name="notifications-outline" size={moderateScale(22)} color="#094A04" />
            <View style={styles.notificationBadge} />
          </View>
        </TouchableOpacity>
      </View>

      {/* ================= MAIN CONTENT ================= */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        {/* ================= TODAY'S WEATHER CARD ================= */}
        <ImageBackground
          source={require('@/assets/images/weatherbackground.png')}
          style={styles.weatherCard}
          imageStyle={styles.weatherCardImage}
        >
          {/* Top text */}
          <Text style={styles.todayDateText}>Today, 24 May</Text>
          
          {/* Main layout */}
          <View style={styles.weatherCardMiddle}>
            <Text style={styles.todayTempText}>28°C</Text>
            
            {/* Custom High-Fidelity Weather Icon Overlay */}
            <View style={styles.weatherIconOverlay}>
              <View style={styles.sunCloudWrapper}>
                <Ionicons name="sunny" size={moderateScale(38)} color="#FFD54F" style={styles.overlaySun} />
                <Ionicons name="cloud" size={moderateScale(48)} color="#FFFFFF" style={styles.overlayCloud} />
              </View>
              {/* Rainy drops */}
              <View style={styles.rainDropsWrapper}>
                <Ionicons name="ellipse" size={moderateScale(4)} color="#A5D6A7" style={styles.rainDrop1} />
                <Ionicons name="ellipse" size={moderateScale(4)} color="#A5D6A7" style={styles.rainDrop2} />
                <Ionicons name="ellipse" size={moderateScale(4)} color="#A5D6A7" style={styles.rainDrop3} />
              </View>
            </View>
          </View>

          {/* Bottom text */}
          <Text style={styles.todayConditionText}>Partly Cloudy</Text>
        </ImageBackground>

        {/* ================= WEATHER STATS GRID ================= */}
        <View style={[styles.statsCard, { backgroundColor: colorScheme === 'light' ? '#FFFFE1' : '#1E2C20' }]}>
          {/* Humidity */}
          <View style={styles.statCol}>
            <View style={styles.statIconBg}>
              <Ionicons name="water-outline" size={moderateScale(18)} color="#094A04" />
            </View>
            <View style={styles.statTextGroup}>
              <Text style={styles.statLabel}>Humidity</Text>
              <Text style={styles.statValue}>70%</Text>
              <Text style={styles.statDesc}>Moderate</Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          {/* Rain Chance */}
          <View style={styles.statCol}>
            <View style={styles.statIconBg}>
              <Ionicons name="rainy-outline" size={moderateScale(18)} color="#094A04" />
            </View>
            <View style={styles.statTextGroup}>
              <Text style={styles.statLabel}>Rain Chance</Text>
              <Text style={styles.statValue}>40%</Text>
              <Text style={styles.statDesc}>Possible showers</Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          {/* Wind */}
          <View style={styles.statCol}>
            <View style={styles.statIconBg}>
              <Ionicons name="leaf-outline" size={moderateScale(18)} color="#094A04" />
            </View>
            <View style={styles.statTextGroup}>
              <Text style={styles.statLabel}>Wind</Text>
              <Text style={styles.statValue}>12km/h</Text>
              <Text style={styles.statDesc}>Light breeze</Text>
            </View>
          </View>
        </View>

        {/* ================= WEATHER ADVICE FOR MAIZE ================= */}
        <ImageBackground
          source={require('@/assets/images/weatheradvice.png')}
          style={styles.adviceCard}
          imageStyle={styles.adviceCardImage}
        >
          <View style={styles.adviceLeft}>
            <Text style={styles.adviceTitle}>Weather Advice for Maize</Text>
            <Text style={styles.adviceBody}>
              Rain is expected tomorrow. Good for your crop. Ensure proper drainage to avoid water logging
            </Text>
          </View>
          
          <View style={styles.adviceRight}>
            <View style={styles.shieldWrapper}>
              <Ionicons name="shield-checkmark" size={moderateScale(24)} color="#FFFFFF" />
            </View>
          </View>
        </ImageBackground>

        {/* ================= HOURLY FORECAST ================= */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Hourly Forecast</Text>
          <TouchableOpacity activeOpacity={0.7} style={styles.viewFullRow}>
            <Text style={styles.viewFullText}>View Full forecast</Text>
            <Ionicons name="chevron-forward" size={moderateScale(10)} color="#094A04" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.hourlyScrollView}
          contentContainerStyle={styles.hourlyScrollContent}
        >
          {/* Active Card: Now */}
          <View style={styles.activeHourlyCard}>
            <Text style={styles.activeHourlyTime}>Now</Text>
            <Ionicons name="partly-sunny" size={moderateScale(24)} color="#094A04" style={styles.hourlyIcon} />
            <Text style={styles.activeHourlyTemp}>28°</Text>
            <View style={styles.activeHourlyDot} />
          </View>

          {/* Inactive Cards */}
          <View style={[styles.inactiveHourlyCard, { backgroundColor: colorScheme === 'light' ? '#FFFFF0' : '#1F2937' }]}>
            <Text style={styles.inactiveHourlyTime}>11 AM</Text>
            <Ionicons name="cloud" size={moderateScale(24)} color="#A3C89E" style={styles.hourlyIcon} />
            <Text style={styles.inactiveHourlyTemp}>29°</Text>
          </View>

          <View style={[styles.inactiveHourlyCard, { backgroundColor: colorScheme === 'light' ? '#FFFFF0' : '#1F2937' }]}>
            <Text style={styles.inactiveHourlyTime}>12 PM</Text>
            <Ionicons name="cloud" size={moderateScale(24)} color="#A3C89E" style={styles.hourlyIcon} />
            <Text style={styles.inactiveHourlyTemp}>30°</Text>
          </View>

          <View style={[styles.inactiveHourlyCard, { backgroundColor: colorScheme === 'light' ? '#FFFFF0' : '#1F2937' }]}>
            <Text style={styles.inactiveHourlyTime}>1 PM</Text>
            <Ionicons name="sunny-outline" size={moderateScale(24)} color="#FFB300" style={styles.hourlyIcon} />
            <Text style={styles.inactiveHourlyTemp}>31°</Text>
          </View>

          <View style={[styles.inactiveHourlyCard, { backgroundColor: colorScheme === 'light' ? '#FFFFF0' : '#1F2937' }]}>
            <Text style={styles.inactiveHourlyTime}>2 PM</Text>
            <Ionicons name="cloud" size={moderateScale(24)} color="#A3C89E" style={styles.hourlyIcon} />
            <Text style={styles.inactiveHourlyTemp}>31°</Text>
          </View>

          <View style={[styles.inactiveHourlyCard, { backgroundColor: colorScheme === 'light' ? '#FFFFF0' : '#1F2937' }]}>
            <Text style={styles.inactiveHourlyTime}>3 AM</Text>
            <Ionicons name="rainy-outline" size={moderateScale(24)} color="#094A04" style={styles.hourlyIcon} />
            <Text style={styles.inactiveHourlyTemp}>30°</Text>
          </View>
        </ScrollView>

        {/* ================= 7-DAY FORECAST ================= */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: verticalScale(16), marginBottom: verticalScale(8) }]}>
          7-Day Forecast
        </Text>

        <View style={[styles.forecastContainer, { backgroundColor: colorScheme === 'light' ? '#FFFFED' : '#1F2937' }]}>
          {/* Row 1: Tomorrow */}
          <View style={styles.forecastRow}>
            <View style={styles.forecastDayCol}>
              <Text style={styles.forecastDayText}>Tomorrow</Text>
              <Text style={styles.forecastDateText}>25 May</Text>
            </View>
            <Ionicons name="rainy-outline" size={moderateScale(20)} color="#094A04" style={styles.forecastRowIcon} />
            <Text style={styles.forecastDescText}>Light Rain</Text>
            <Text style={styles.forecastChanceText}>70%</Text>
            <Text style={styles.forecastTempRangeText}>24°/29°</Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Row 2: Monday */}
          <View style={styles.forecastRow}>
            <View style={styles.forecastDayCol}>
              <Text style={styles.forecastDayText}>Monday</Text>
              <Text style={styles.forecastDateText}>26 May</Text>
            </View>
            <Ionicons name="cloud-outline" size={moderateScale(20)} color="#A3C89E" style={styles.forecastRowIcon} />
            <Text style={styles.forecastDescText}>Cloudy</Text>
            <Text style={styles.forecastChanceText}>30%</Text>
            <Text style={styles.forecastTempRangeText}>24°/30°</Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Row 3: Tuesday */}
          <View style={styles.forecastRow}>
            <View style={styles.forecastDayCol}>
              <Text style={styles.forecastDayText}>Tuesday</Text>
              <Text style={styles.forecastDateText}>27 May</Text>
            </View>
            <Ionicons name="partly-sunny-outline" size={moderateScale(20)} color="#FFB300" style={styles.forecastRowIcon} />
            <Text style={styles.forecastDescText}>Partly Cloudy</Text>
            <Text style={styles.forecastChanceText}>20%</Text>
            <Text style={styles.forecastTempRangeText}>24°/31°</Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Row 4: Wednesday */}
          <View style={styles.forecastRow}>
            <View style={styles.forecastDayCol}>
              <Text style={styles.forecastDayText}>Wednesday</Text>
              <Text style={styles.forecastDateText}>28 May</Text>
            </View>
            <Ionicons name="sunny-outline" size={moderateScale(20)} color="#FFB300" style={styles.forecastRowIcon} />
            <Text style={styles.forecastDescText}>Sunny</Text>
            <Text style={styles.forecastChanceText}>10%</Text>
            <Text style={styles.forecastTempRangeText}>24°/32°</Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Row 5: Thursday */}
          <View style={styles.forecastRow}>
            <View style={styles.forecastDayCol}>
              <Text style={styles.forecastDayText}>Thursday</Text>
              <Text style={styles.forecastDateText}>29 May</Text>
            </View>
            <Ionicons name="partly-sunny-outline" size={moderateScale(20)} color="#FFB300" style={styles.forecastRowIcon} />
            <Text style={styles.forecastDescText}>Partly Cloudy</Text>
            <Text style={styles.forecastChanceText}>20%</Text>
            <Text style={styles.forecastTempRangeText}>24°/31°</Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Row 6: Friday */}
          <View style={styles.forecastRow}>
            <View style={styles.forecastDayCol}>
              <Text style={styles.forecastDayText}>Friday</Text>
              <Text style={styles.forecastDateText}>30 May</Text>
            </View>
            <Ionicons name="rainy-outline" size={moderateScale(20)} color="#094A04" style={styles.forecastRowIcon} />
            <Text style={styles.forecastDescText}>Light Rain</Text>
            <Text style={styles.forecastChanceText}>60%</Text>
            <Text style={styles.forecastTempRangeText}>24°/29°</Text>
          </View>
        </View>

      </ScrollView>

      {/* ================= FLOATING BOTTOM NAVIGATION ================= */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          
          {/* Home Tab */}
          <TouchableOpacity 
            style={styles.tabItem} 
            activeOpacity={0.8}
            onPress={() => handleNavPress('Home')}
          >
            <Image
              source={require('@/assets/icons/homeicon.png')}
              style={[styles.tabIcon, { tintColor: '#FFFFFF' }]}
              resizeMode="contain"
            />
            <View style={styles.labelWrapper}>
              <Text style={[styles.tabLabel, { color: '#FFFFFF' }]}>Home</Text>
              <View style={styles.activeDot} />
            </View>
          </TouchableOpacity>

          {/* My Crops Tab */}
          <TouchableOpacity 
            style={styles.tabItem} 
            activeOpacity={0.8}
            onPress={() => handleNavPress('My Crops')}
          >
            <Image
              source={require('@/assets/icons/mycropstabicon.png')}
              style={[styles.tabIcon, { tintColor: '#A3C89E' }]}
              resizeMode="contain"
            />
            <Text style={[styles.tabLabel, { color: '#A3C89E' }]}>My Crops</Text>
          </TouchableOpacity>

          {/* Alerts Tab */}
          <TouchableOpacity 
            style={styles.tabItem} 
            activeOpacity={0.8}
            onPress={() => handleNavPress('Alerts')}
          >
            <Image
              source={require('@/assets/icons/alertstabicon.png')}
              style={[styles.tabIcon, { tintColor: '#A3C89E' }]}
              resizeMode="contain"
            />
            <Text style={[styles.tabLabel, { color: '#A3C89E' }]}>Alerts</Text>
          </TouchableOpacity>

          {/* Profile Tab */}
          <TouchableOpacity 
            style={styles.tabItem} 
            activeOpacity={0.8}
            onPress={() => handleNavPress('Profile')}
          >
            <Image
              source={require('@/assets/icons/profileicon.png')}
              style={[styles.tabIcon, { tintColor: '#A3C89E' }]}
              resizeMode="contain"
            />
            <Text style={[styles.tabLabel, { color: '#A3C89E' }]}>Profile</Text>
          </TouchableOpacity>

        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(100), // Height of navigation capsule plus spacing
  },

  // ================= HEADER SECTION =================
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
    borderColor: '#094A04',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#094A04',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(2),
  },
  locationIcon: {
    marginRight: scale(3),
  },
  locationText: {
    fontSize: moderateScale(11),
    color: '#666',
    fontWeight: '600',
  },
  notificationButton: {
    padding: scale(4),
  },
  notificationIconWrapper: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    right: scale(1),
    top: verticalScale(1),
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(3.5),
    backgroundColor: '#EF4444',
  },

  // ================= TODAY'S WEATHER CARD =================
  weatherCard: {
    height: verticalScale(170),
    borderRadius: moderateScale(16),
    padding: scale(16),
    justifyContent: 'space-between',
    marginBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  weatherCardImage: {
    borderRadius: moderateScale(16),
  },
  todayDateText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  weatherCardMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayTempText: {
    fontSize: moderateScale(48),
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
  weatherIconOverlay: {
    position: 'relative',
    width: moderateScale(70),
    height: moderateScale(60),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sunCloudWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  overlaySun: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  overlayCloud: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    zIndex: 2,
  },
  rainDropsWrapper: {
    position: 'absolute',
    bottom: verticalScale(-8),
    left: scale(10),
    flexDirection: 'row',
    gap: scale(6),
    zIndex: 3,
  },
  rainDrop1: {
    transform: [{ translateY: verticalScale(2) }],
  },
  rainDrop2: {
    transform: [{ translateY: 0 }],
  },
  rainDrop3: {
    transform: [{ translateY: verticalScale(3) }],
  },
  todayConditionText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // ================= WEATHER STATS GRID =================
  statsCard: {
    flexDirection: 'row',
    borderRadius: moderateScale(16),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(12),
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statIconBg: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: '#EBF7E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(6),
  },
  statTextGroup: {
    flex: 1,
  },
  statLabel: {
    fontSize: moderateScale(9),
    color: '#666',
    fontWeight: '500',
  },
  statValue: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#11181C',
    marginVertical: verticalScale(1),
  },
  statDesc: {
    fontSize: moderateScale(9),
    color: '#888',
    fontWeight: '400',
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#E5E7EB',
    marginHorizontal: scale(4),
  },

  // ================= WEATHER ADVICE FOR MAIZE =================
  adviceCard: {
    height: verticalScale(90),
    borderRadius: moderateScale(16),
    paddingHorizontal: scale(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  adviceCardImage: {
    borderRadius: moderateScale(16),
  },
  adviceLeft: {
    flex: 1.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adviceTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: verticalScale(4),
    textAlign: 'center',
  },
  adviceBody: {
    fontSize: moderateScale(10.5),
    color: '#FFFFFF',
    lineHeight: verticalScale(14),
    opacity: 0.95,
    textAlign: 'center',
  },
  adviceRight: {
    flex: 0.4,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  shieldWrapper: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ================= HOURLY FORECAST =================
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: '700',
  },
  viewFullRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewFullText: {
    fontSize: moderateScale(11),
    color: '#094A04',
    fontWeight: '600',
    marginRight: scale(3),
  },
  hourlyScrollView: {
    marginHorizontal: scale(-16),
  },
  hourlyScrollContent: {
    paddingHorizontal: scale(16),
    gap: scale(8),
    paddingBottom: verticalScale(4),
  },
  activeHourlyCard: {
    width: scale(62),
    height: verticalScale(90),
    borderRadius: moderateScale(12),
    backgroundColor: '#BDE3B8',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(8),
    position: 'relative',
  },
  activeHourlyTime: {
    fontSize: moderateScale(11),
    color: '#094A04',
    fontWeight: '600',
  },
  activeHourlyIconWrapper: {
    position: 'relative',
    width: moderateScale(32),
    height: moderateScale(26),
  },
  hourlySun: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  hourlyCloud: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  activeHourlyTemp: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#094A04',
  },
  activeHourlyDot: {
    width: scale(16),
    height: verticalScale(2),
    borderRadius: 1,
    backgroundColor: '#094A04',
  },
  inactiveHourlyCard: {
    width: scale(62),
    height: verticalScale(90),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(8),
    borderWidth: 1,
    borderColor: '#F2F2F2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  inactiveHourlyTime: {
    fontSize: moderateScale(11),
    color: '#666',
    fontWeight: '500',
  },
  hourlyIcon: {
    marginVertical: verticalScale(2),
  },
  inactiveHourlyTemp: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#11181C',
  },

  // ================= 7-DAY FORECAST =================
  forecastContainer: {
    borderRadius: moderateScale(16),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(4),
    marginBottom: verticalScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
  },
  forecastDayCol: {
    width: scale(80),
  },
  forecastDayText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#11181C',
  },
  forecastDateText: {
    fontSize: moderateScale(10),
    color: '#888',
    marginTop: verticalScale(1),
  },
  forecastRowIcon: {
    width: scale(36),
    textAlign: 'center',
  },
  forecastRowIconPlaceholder: {
    width: scale(36),
  },
  forecastDescText: {
    flex: 1.2,
    fontSize: moderateScale(12),
    color: '#11181C',
    fontWeight: '500',
    paddingLeft: scale(4),
  },
  forecastChanceText: {
    width: scale(45),
    fontSize: moderateScale(12),
    color: '#A3C89E',
    fontWeight: '600',
    textAlign: 'center',
  },
  forecastTempRangeText: {
    width: scale(55),
    fontSize: moderateScale(12),
    color: '#11181C',
    fontWeight: '700',
    textAlign: 'right',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F2F2F2',
  },

  // ================= FLOATING BOTTOM NAVIGATION =================
  tabBarContainer: {
    position: 'absolute',
    bottom: verticalScale(16),
    left: scale(16),
    right: scale(16),
    zIndex: 999,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#094A04',
    height: verticalScale(64),
    borderRadius: moderateScale(28),
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: verticalScale(4),
    // Floating premium shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingTop: verticalScale(4),
  },
  labelWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
  },
  activeDot: {
    width: moderateScale(4),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: '#FFFFFF',
    marginTop: verticalScale(2),
  },
  tabLabel: {
    fontSize: moderateScale(9),
    fontWeight: '600',
    marginTop: verticalScale(2),
  },
});
