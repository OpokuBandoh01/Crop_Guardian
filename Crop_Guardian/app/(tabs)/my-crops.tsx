import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

export default function MyCropsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // State to hold the active filter
  const [activeFilter, setActiveFilter] = useState<'All' | 'Care' | 'Fertiliser' | 'Pests'>('All');

  // filter options array
  const filters: ('All' | 'Care' | 'Fertiliser' | 'Pests')[] = ['All', 'Care', 'Fertiliser', 'Pests'];

  // Card items array
  const adviceItems = [
    {
      id: '1',
      category: 'Care',
      title: 'How to prevent Maize Leaf Blight',
      icon: require('@/assets/icons/leafficon.png'),
    },
    {
      id: '2',
      category: 'Fertiliser',
      title: 'Best fertilizer for Maize at this stage',
      icon: require('@/assets/icons/fertilizericon.png'),
    },
    {
      id: '3',
      category: 'Care',
      title: 'Watering guide for Maize',
      icon: require('@/assets/icons/twoleaficon.png'),
    },
    {
      id: '4',
      category: 'Pests',
      title: 'Common pests and control',
      icon: require('@/assets/icons/farmericon.png'),
    },
  ];

  // Filter items based on active selection
  const filteredItems = activeFilter === 'All' 
    ? adviceItems 
    : adviceItems.filter(item => item.category === activeFilter);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      
      {/* ================= HEADER SECTION ================= */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.navigate('/')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={moderateScale(18)} color="#094A04" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Advice for Maize</Text>

        {/* Right spacer to perfectly center the title */}
        <View style={styles.rightSpacer} />
      </View>

      {/* ================= MAIN CONTENT ================= */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        {/* ================= FILTERS ROW ================= */}
        <View style={styles.filtersRow}>
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterPill,
                  isActive 
                    ? styles.filterPillActive 
                    : [styles.filterPillInactive, { backgroundColor: colorScheme === 'light' ? '#FFFFE7' : '#1F2937' }]
                ]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.8}
              >
                <Text 
                  style={[
                    styles.filterText,
                    isActive ? styles.filterTextActive : styles.filterTextInactive
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ================= ADVICE CARDS LIST ================= */}
        <View style={styles.cardsContainer}>
          {filteredItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.adviceCard,
                { backgroundColor: colorScheme === 'light' ? '#FFFFE7' : '#1E2C20' }
              ]}
              activeOpacity={0.9}
            >
              {/* Card Left: Icon */}
              <View style={styles.cardLeft}>
                <Image
                  source={item.icon}
                  style={styles.cardIcon}
                  resizeMode="contain"
                />
              </View>

              {/* Card Middle: Title */}
              <View style={styles.cardMiddle}>
                <Text style={[styles.cardTitleText, { color: theme.text }]}>
                  {item.title}
                </Text>
              </View>

              {/* Card Right: Chevron */}
              <View style={styles.cardRight}>
                <Ionicons name="chevron-forward" size={moderateScale(18)} color="#094A04" />
              </View>
            </TouchableOpacity>
          ))}
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
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(4),
    paddingBottom: verticalScale(100), // Account for floating bottom tab bar
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
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#094A04',
    textAlign: 'center',
  },
  rightSpacer: {
    width: moderateScale(32),
  },

  // ================= FILTERS ROW =================
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: verticalScale(16),
    gap: scale(6),
  },
  filterPill: {
    flex: 1,
    height: verticalScale(36),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  filterPillActive: {
    backgroundColor: '#094A04',
  },
  filterPillInactive: {
    borderWidth: 1.5,
    borderColor: '#094A04',
  },
  filterText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  filterTextInactive: {
    color: '#11181C',
  },

  // ================= ADVICE CARDS LIST =================
  cardsContainer: {
    gap: verticalScale(16),
  },
  adviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: moderateScale(14),
    borderWidth: 1.2,
    borderColor: '#094A04',
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(16),
    // Soft subtle shadow for premium look
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  cardLeft: {
    marginRight: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    width: scale(44),
    height: scale(44),
  },
  cardMiddle: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitleText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    lineHeight: verticalScale(18),
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: scale(8),
  },
});
