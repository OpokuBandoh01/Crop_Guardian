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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CustomButton } from '@/components/CustomButton';

export default function UnitSettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // Unit States
  const [temperature, setTemperature] = useState<'celsius' | 'fahrenheit'>('celsius');
  const [landArea, setLandArea] = useState<'acres' | 'hectares' | 'sqmeters'>('acres');
  const [yieldWeight, setYieldWeight] = useState<'kg' | 'tons' | 'bags'>('kg');

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

        <Text style={[styles.headerTitle, { color: theme.primary }]}>Unit Settings</Text>

        <View style={styles.rightSpacer} />
      </View>

      {/* Success Banner */}
      {showSuccess && (
        <View style={styles.successBanner}>
          <View style={styles.successIconWrapper}>
            <Ionicons name="checkmark" size={moderateScale(14)} color="#FFFFFF" />
          </View>
          <Text style={styles.successText}>Measurement units saved successfully!</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <Text style={[styles.introText, { color: colorScheme === 'light' ? '#4B5563' : '#ECEDEE' }]}>
            Customize the units used for displaying temperatures, measuring farm plots, and tracking crop yield.
          </Text>
        </View>

        {/* 1. TEMPERATURE UNIT */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="thermometer-outline" size={moderateScale(18)} color={theme.primary} />
            <Text style={[styles.sectionTitleText, { color: theme.text }]}>Temperature</Text>
          </View>

          <View style={styles.selectorsRow}>
            {/* Celsius */}
            <TouchableOpacity
              style={[
                styles.selectorCard,
                { backgroundColor: theme.surface },
                temperature === 'celsius' ? { borderColor: theme.primary, borderWidth: 1.8 } : styles.inactiveBorder,
              ]}
              onPress={() => setTemperature('celsius')}
              activeOpacity={0.8}
            >
              <View style={styles.selectorCardTop}>
                <Text style={[styles.unitAbbr, { color: theme.text }]}>°C</Text>
                <View style={[
                  styles.radioOuter,
                  temperature === 'celsius' ? styles.radioOuterSelected : styles.radioOuterUnselected,
                  temperature === 'celsius' && { borderColor: theme.primary }
                ]}>
                  {temperature === 'celsius' && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                </View>
              </View>
              <Text style={[styles.unitLabel, { color: theme.text }]}>Celsius</Text>
              <Text style={[styles.unitDesc, { color: colorScheme === 'light' ? '#687076' : '#9BA1A6' }]}>
                Recommended. Standard metric for agricultural models.
              </Text>
            </TouchableOpacity>

            {/* Fahrenheit */}
            <TouchableOpacity
              style={[
                styles.selectorCard,
                { backgroundColor: theme.surface },
                temperature === 'fahrenheit' ? { borderColor: theme.primary, borderWidth: 1.8 } : styles.inactiveBorder,
              ]}
              onPress={() => setTemperature('fahrenheit')}
              activeOpacity={0.8}
            >
              <View style={styles.selectorCardTop}>
                <Text style={[styles.unitAbbr, { color: theme.text }]}>°F</Text>
                <View style={[
                  styles.radioOuter,
                  temperature === 'fahrenheit' ? styles.radioOuterSelected : styles.radioOuterUnselected,
                  temperature === 'fahrenheit' && { borderColor: theme.primary }
                ]}>
                  {temperature === 'fahrenheit' && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                </View>
              </View>
              <Text style={[styles.unitLabel, { color: theme.text }]}>Fahrenheit</Text>
              <Text style={[styles.unitDesc, { color: colorScheme === 'light' ? '#687076' : '#9BA1A6' }]}>
                Imperial measurement unit.
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. LAND AREA UNIT */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="ruler-square" size={moderateScale(18)} color={theme.primary} />
            <Text style={[styles.sectionTitleText, { color: theme.text }]}>Land Area</Text>
          </View>

          <View style={styles.selectorsColumn}>
            {/* Acres */}
            <TouchableOpacity
              style={[
                styles.fullWidthCard,
                { backgroundColor: theme.surface },
                landArea === 'acres' ? { borderColor: theme.primary, borderWidth: 1.8 } : styles.inactiveBorder,
              ]}
              onPress={() => setLandArea('acres')}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleLeft}>
                  <Text style={[styles.fullCardTitle, { color: theme.text }]}>Acres (ac)</Text>
                  <View style={[styles.badgeContainer, { backgroundColor: colorScheme === 'light' ? '#F4F9F3' : '#1E2C20' }]}>
                    <Text style={[styles.badgeText, { color: theme.primary }]}>Local Traditional</Text>
                  </View>
                </View>
                <View style={[
                  styles.radioOuter,
                  landArea === 'acres' ? styles.radioOuterSelected : styles.radioOuterUnselected,
                  landArea === 'acres' && { borderColor: theme.primary }
                ]}>
                  {landArea === 'acres' && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                </View>
              </View>
              <Text style={[styles.fullCardDesc, { color: colorScheme === 'light' ? '#687076' : '#9BA1A6' }]}>
                Standard farm scale indicator widely understood in regional trade.
              </Text>
            </TouchableOpacity>

            {/* Hectares */}
            <TouchableOpacity
              style={[
                styles.fullWidthCard,
                { backgroundColor: theme.surface },
                landArea === 'hectares' ? { borderColor: theme.primary, borderWidth: 1.8 } : styles.inactiveBorder,
              ]}
              onPress={() => setLandArea('hectares')}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleLeft}>
                  <Text style={[styles.fullCardTitle, { color: theme.text }]}>Hectares (ha)</Text>
                  <View style={[styles.badgeContainer, { backgroundColor: colorScheme === 'light' ? '#E9F5FE' : '#1A2E3B' }]}>
                    <Text style={[styles.badgeText, { color: '#0284C7' }]}>Scientific Metric</Text>
                  </View>
                </View>
                <View style={[
                  styles.radioOuter,
                  landArea === 'hectares' ? styles.radioOuterSelected : styles.radioOuterUnselected,
                  landArea === 'hectares' && { borderColor: theme.primary }
                ]}>
                  {landArea === 'hectares' && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                </View>
              </View>
              <Text style={[styles.fullCardDesc, { color: colorScheme === 'light' ? '#687076' : '#9BA1A6' }]}>
                Official metric units. Equivalent to approximately 2.47 acres.
              </Text>
            </TouchableOpacity>

            {/* Sq Meters */}
            <TouchableOpacity
              style={[
                styles.fullWidthCard,
                { backgroundColor: theme.surface },
                landArea === 'sqmeters' ? { borderColor: theme.primary, borderWidth: 1.8 } : styles.inactiveBorder,
              ]}
              onPress={() => setLandArea('sqmeters')}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.fullCardTitle, { color: theme.text }]}>Square Meters (m²)</Text>
                <View style={[
                  styles.radioOuter,
                  landArea === 'sqmeters' ? styles.radioOuterSelected : styles.radioOuterUnselected,
                  landArea === 'sqmeters' && { borderColor: theme.primary }
                ]}>
                  {landArea === 'sqmeters' && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                </View>
              </View>
              <Text style={[styles.fullCardDesc, { color: colorScheme === 'light' ? '#687076' : '#9BA1A6' }]}>
                Used primarily for small greenhouse trials or seed beds.
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. YIELD & WEIGHT */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="scale-outline" size={moderateScale(18)} color={theme.primary} />
            <Text style={[styles.sectionTitleText, { color: theme.text }]}>Yield &amp; Weight</Text>
          </View>

          <View style={styles.selectorsColumn}>
            {/* Kilograms */}
            <TouchableOpacity
              style={[
                styles.fullWidthCard,
                { backgroundColor: theme.surface },
                yieldWeight === 'kg' ? { borderColor: theme.primary, borderWidth: 1.8 } : styles.inactiveBorder,
              ]}
              onPress={() => setYieldWeight('kg')}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.fullCardTitle, { color: theme.text }]}>Kilograms (kg)</Text>
                <View style={[
                  styles.radioOuter,
                  yieldWeight === 'kg' ? styles.radioOuterSelected : styles.radioOuterUnselected,
                  yieldWeight === 'kg' && { borderColor: theme.primary }
                ]}>
                  {yieldWeight === 'kg' && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                </View>
              </View>
              <Text style={[styles.fullCardDesc, { color: colorScheme === 'light' ? '#687076' : '#9BA1A6' }]}>
                Standard international reference unit. Perfect for high accuracy weight.
              </Text>
            </TouchableOpacity>

            {/* Tons */}
            <TouchableOpacity
              style={[
                styles.fullWidthCard,
                { backgroundColor: theme.surface },
                yieldWeight === 'tons' ? { borderColor: theme.primary, borderWidth: 1.8 } : styles.inactiveBorder,
              ]}
              onPress={() => setYieldWeight('tons')}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.fullCardTitle, { color: theme.text }]}>Metric Tons (t)</Text>
                <View style={[
                  styles.radioOuter,
                  yieldWeight === 'tons' ? styles.radioOuterSelected : styles.radioOuterUnselected,
                  yieldWeight === 'tons' && { borderColor: theme.primary }
                ]}>
                  {yieldWeight === 'tons' && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                </View>
              </View>
              <Text style={[styles.fullCardDesc, { color: colorScheme === 'light' ? '#687076' : '#9BA1A6' }]}>
                Ideal for large commercial bulk harvests (1 ton = 1,000 kg).
              </Text>
            </TouchableOpacity>

            {/* Bags */}
            <TouchableOpacity
              style={[
                styles.fullWidthCard,
                { backgroundColor: theme.surface },
                yieldWeight === 'bags' ? { borderColor: theme.primary, borderWidth: 1.8 } : styles.inactiveBorder,
              ]}
              onPress={() => setYieldWeight('bags')}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleLeft}>
                  <Text style={[styles.fullCardTitle, { color: theme.text }]}>Bags (approx. 50kg/100kg)</Text>
                  <View style={[styles.badgeContainer, { backgroundColor: colorScheme === 'light' ? '#FFFBEB' : '#2D2816' }]}>
                    <Text style={[styles.badgeText, { color: '#D97706' }]}>Ghana Trade Standard</Text>
                  </View>
                </View>
                <View style={[
                  styles.radioOuter,
                  yieldWeight === 'bags' ? styles.radioOuterSelected : styles.radioOuterUnselected,
                  yieldWeight === 'bags' && { borderColor: theme.primary }
                ]}>
                  {yieldWeight === 'bags' && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                </View>
              </View>
              <Text style={[styles.fullCardDesc, { color: colorScheme === 'light' ? '#687076' : '#9BA1A6' }]}>
                Estimated based on common crop bags (e.g. 50kg bag of Maize or 64kg bag of Cocoa).
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save button */}
        <CustomButton
          title="Save Unit Preferences"
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
  sectionContainer: {
    marginBottom: verticalScale(20),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(10),
    paddingLeft: scale(4),
  },
  sectionTitleText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    marginLeft: scale(8),
  },
  selectorsRow: {
    flexDirection: 'row',
    gap: scale(12),
  },
  selectorCard: {
    flex: 1,
    borderRadius: moderateScale(12),
    padding: scale(12),
    borderWidth: 1.2,
  },
  inactiveBorder: {
    borderColor: 'rgba(9, 74, 4, 0.06)',
  },
  selectorCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  unitAbbr: {
    fontSize: moderateScale(16),
    fontWeight: '800',
  },
  unitLabel: {
    fontSize: moderateScale(12.5),
    fontWeight: '700',
    marginBottom: verticalScale(3),
  },
  unitDesc: {
    fontSize: moderateScale(10),
    lineHeight: verticalScale(13),
  },

  // Full Width Choice Cards
  selectorsColumn: {
    gap: verticalScale(10),
  },
  fullWidthCard: {
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(14),
    borderWidth: 1.2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  cardTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  fullCardTitle: {
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
  badgeContainer: {
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(4),
  },
  badgeText: {
    fontSize: moderateScale(9),
    fontWeight: '700',
  },
  fullCardDesc: {
    fontSize: moderateScale(10.5),
    lineHeight: verticalScale(14),
  },

  // Radio button designs
  radioOuter: {
    width: moderateScale(16),
    height: moderateScale(16),
    borderRadius: moderateScale(8),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {},
  radioOuterUnselected: {
    borderColor: '#9CA3AF',
  },
  radioInner: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
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
