import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CustomInput } from '@/components/CustomInput';
import { CustomButton } from '@/components/CustomButton';

// Mock list of crops available for selection
const AVAILABLE_CROPS = [
  { id: 'maize', name: 'Maize', image: require('@/assets/images/maize.png') },
  { id: 'cassava', name: 'Cassava', image: require('@/assets/images/cassava.png') },
  { id: 'tomato', name: 'Tomato', image: require('@/assets/images/tomato.png') },
  { id: 'pepper', name: 'Pepper', image: require('@/assets/images/pepper.png') },
  { id: 'plantain', name: 'Plantain', image: require('@/assets/images/plantain.png') },
  { id: 'cocoa', name: 'Cocoa', image: require('@/assets/images/cocoa.png') },
];

const SOIL_TYPES = ['Sandy Loam', 'Clay loam', 'Silt loam', 'Peat', 'Laterite'];
const IRRIGATION_TYPES = ['Rain-fed', 'Drip system', 'Sprinklers', 'Manual / Watering can'];

export default function FarmInfoScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // Form states
  const [farmName, setFarmName] = useState('Mensah Green Fields');
  const [farmSize, setFarmSize] = useState('12');
  const [sizeUnit, setSizeUnit] = useState<'Acres' | 'Hectares'>('Acres');
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['maize', 'cassava']);
  const [soilType, setSoilType] = useState('Sandy Loam');
  const [irrigation, setIrrigation] = useState('Rain-fed');

  // Dropdown open states
  const [soilDropdownOpen, setSoilDropdownOpen] = useState(false);
  const [irrigationDropdownOpen, setIrrigationDropdownOpen] = useState(false);

  // UI status states
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
    }, 1200);
  };

  const toggleCropSelection = (cropId: string) => {
    if (selectedCrops.includes(cropId)) {
      // Keep at least one crop selected
      if (selectedCrops.length > 1) {
        setSelectedCrops(selectedCrops.filter(id => id !== cropId));
      }
    } else {
      setSelectedCrops([...selectedCrops, cropId]);
    }
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

        <Text style={[styles.headerTitle, { color: theme.primary }]}>Farm Information</Text>

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
          {/* ================= SUCCESS ALERTS ================= */}
          {showSuccess && (
            <View style={styles.successBanner}>
              <View style={styles.successIconWrapper}>
                <Ionicons name="checkmark-sharp" size={moderateScale(15)} color="#FFFFFF" />
              </View>
              <Text style={styles.successText}>Farm information updated successfully!</Text>
            </View>
          )}

          {/* ================= FARM SUMMARY OVERVIEW CARD ================= */}
          <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
            <View style={styles.summaryTopRow}>
              <View>
                <Text style={[styles.summaryTitle, { color: theme.text }]}>
                  {farmName || 'My Farm'}
                </Text>
                <Text style={[styles.summarySub, { color: colorScheme === 'light' ? '#687076' : '#9BA1A6' }]}>
                  Location: Kumasi, Ashanti Region
                </Text>
              </View>
              <View style={styles.boundaryBadge}>
                <Ionicons name="location-outline" size={moderateScale(12)} color="#094A04" />
                <Text style={styles.boundaryBadgeText}>Geotagged</Text>
              </View>
            </View>

            <View style={styles.summaryStatsRow}>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatVal}>{farmSize} {sizeUnit}</Text>
                <Text style={styles.summaryStatLabel}>Total Area</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatVal}>{selectedCrops.length}</Text>
                <Text style={styles.summaryStatLabel}>Crops Grown</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatVal}>Healthy</Text>
                <Text style={styles.summaryStatLabel}>Status</Text>
              </View>
            </View>
          </View>

          {/* ================= FARM FORM CARD ================= */}
          <View style={[styles.formCard, { backgroundColor: theme.surface }]}>
            <Text style={styles.cardHeaderTitle}>FARM PROFILE DETAILS</Text>
            
            {/* Input: Farm Name */}
            <CustomInput
              label="FARM NAME"
              placeholder="e.g. Green Fields Farm"
              leftIcon="business-outline"
              value={farmName}
              onChangeText={setFarmName}
              containerStyle={styles.inputStyle}
            />

            {/* Input: Farm Size with segment selector */}
            <View style={styles.sizeSection}>
              <View style={{ flex: 1.2 }}>
                <CustomInput
                  label="FARM SIZE"
                  placeholder="e.g. 10"
                  leftIcon="resize-outline"
                  value={farmSize}
                  onChangeText={setFarmSize}
                  keyboardType="numeric"
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
              <View style={styles.unitSelectorContainer}>
                <Text style={[styles.unitLabel, { color: theme.primary }]}>UNIT</Text>
                <View style={styles.segmentContainer}>
                  <TouchableOpacity
                    style={[
                      styles.segmentButton,
                      sizeUnit === 'Acres' && styles.segmentButtonActive,
                    ]}
                    onPress={() => setSizeUnit('Acres')}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.segmentText,
                      sizeUnit === 'Acres' ? styles.segmentTextActive : { color: theme.text },
                    ]}>Acres</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.segmentButton,
                      sizeUnit === 'Hectares' && styles.segmentButtonActive,
                    ]}
                    onPress={() => setSizeUnit('Hectares')}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.segmentText,
                      sizeUnit === 'Hectares' ? styles.segmentTextActive : { color: theme.text },
                    ]}>Hectares</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Selector: Crop Selection */}
            <View style={styles.cropSelectionSection}>
              <Text style={[styles.inputLabel, { color: theme.primary }]}>CROPS CULTIVATED (Tap to Select)</Text>
              
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.cropListScroll}
                contentContainerStyle={styles.cropListContent}
              >
                {AVAILABLE_CROPS.map((crop) => {
                  const isSelected = selectedCrops.includes(crop.id);
                  return (
                    <TouchableOpacity
                      key={crop.id}
                      style={[
                        styles.cropCard,
                        isSelected
                          ? styles.cropCardSelected
                          : [styles.cropCardUnselected, { backgroundColor: colorScheme === 'light' ? '#FFFFE7' : '#1F2937' }],
                      ]}
                      onPress={() => toggleCropSelection(crop.id)}
                      activeOpacity={0.8}
                    >
                      <Image source={crop.image} style={styles.cropImage} resizeMode="contain" />
                      <Text style={[
                        styles.cropName,
                        isSelected ? styles.cropNameSelected : { color: theme.text },
                      ]}>
                        {crop.name}
                      </Text>
                      {isSelected && (
                        <View style={styles.cropCheckmark}>
                          <Ionicons name="checkmark-circle" size={moderateScale(14)} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Dropdown: Soil Type */}
            <View style={styles.dropdownWrapper}>
              <Text style={[styles.inputLabel, { color: theme.primary }]}>SOIL TYPE</Text>
              <TouchableOpacity
                style={[styles.dropdownBtn, { borderColor: theme.inputBorder, backgroundColor: theme.surface }]}
                onPress={() => {
                  setSoilDropdownOpen(!soilDropdownOpen);
                  setIrrigationDropdownOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="earth-outline" size={moderateScale(18)} color={theme.icon} style={styles.dropdownLeftIcon} />
                <Text style={[styles.dropdownText, { color: theme.text }]}>{soilType}</Text>
                <Ionicons name={soilDropdownOpen ? "chevron-up" : "chevron-down"} size={moderateScale(16)} color={theme.icon} />
              </TouchableOpacity>

              {soilDropdownOpen && (
                <View style={[styles.dropdownList, { borderColor: theme.inputBorder, backgroundColor: theme.surface }]}>
                  {SOIL_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={styles.dropdownListItem}
                      onPress={() => {
                        setSoilType(type);
                        setSoilDropdownOpen(false);
                      }}
                    >
                      <Text style={[styles.dropdownListItemText, { color: theme.text }]}>{type}</Text>
                      {soilType === type && <Ionicons name="checkmark" size={16} color="#094A04" />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Dropdown: Irrigation System */}
            <View style={styles.dropdownWrapper}>
              <Text style={[styles.inputLabel, { color: theme.primary }]}>IRRIGATION METHOD</Text>
              <TouchableOpacity
                style={[styles.dropdownBtn, { borderColor: theme.inputBorder, backgroundColor: theme.surface }]}
                onPress={() => {
                  setIrrigationDropdownOpen(!irrigationDropdownOpen);
                  setSoilDropdownOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="water-outline" size={moderateScale(18)} color={theme.icon} style={styles.dropdownLeftIcon} />
                <Text style={[styles.dropdownText, { color: theme.text }]}>{irrigation}</Text>
                <Ionicons name={irrigationDropdownOpen ? "chevron-up" : "chevron-down"} size={moderateScale(16)} color={theme.icon} />
              </TouchableOpacity>

              {irrigationDropdownOpen && (
                <View style={[styles.dropdownList, { borderColor: theme.inputBorder, backgroundColor: theme.surface }]}>
                  {IRRIGATION_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={styles.dropdownListItem}
                      onPress={() => {
                        setIrrigation(type);
                        setIrrigationDropdownOpen(false);
                      }}
                    >
                      <Text style={[styles.dropdownListItemText, { color: theme.text }]}>{type}</Text>
                      {irrigation === type && <Ionicons name="checkmark" size={16} color="#094A04" />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Save Button */}
            <CustomButton
              title="Save Farm Settings"
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
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(40),
  },

  // Success Banner
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

  // Farm Summary card
  summaryCard: {
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1.2,
    borderColor: 'rgba(9, 74, 4, 0.06)',
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(14),
  },
  summaryTitle: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    marginBottom: verticalScale(2),
  },
  summarySub: {
    fontSize: moderateScale(11),
  },
  boundaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF7E9',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(6),
  },
  boundaryBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#094A04',
    marginLeft: scale(3),
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: verticalScale(4),
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatVal: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: '#094A04',
    marginBottom: verticalScale(2),
  },
  summaryStatLabel: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#687076',
  },
  summaryDivider: {
    width: 1,
    height: verticalScale(20),
    backgroundColor: '#E5E7EB',
  },

  // Main Form Card
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
    marginBottom: verticalScale(16),
  },
  cardHeaderTitle: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#094A04',
    letterSpacing: 1.5,
    marginBottom: verticalScale(16),
  },
  inputStyle: {
    marginBottom: verticalScale(14),
  },

  // Size row with units segment
  sizeSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: scale(12),
    marginBottom: verticalScale(14),
  },
  unitSelectorContainer: {
    flex: 1,
  },
  unitLabel: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginBottom: verticalScale(4),
  },
  segmentContainer: {
    flexDirection: 'row',
    height: verticalScale(50),
    borderWidth: 1.2,
    borderColor: '#094A04',
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(6),
  },
  segmentButtonActive: {
    backgroundColor: '#094A04',
  },
  segmentText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },

  // Crop Selection Horizontal list
  cropSelectionSection: {
    marginBottom: verticalScale(16),
  },
  inputLabel: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginBottom: verticalScale(8),
  },
  cropListScroll: {
    marginHorizontal: scale(-16),
  },
  cropListContent: {
    paddingHorizontal: scale(16),
    gap: scale(10),
    paddingBottom: verticalScale(4),
  },
  cropCard: {
    width: scale(72),
    height: scale(88),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(6),
    borderWidth: 1.5,
    position: 'relative',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cropCardSelected: {
    borderColor: '#094A04',
    backgroundColor: '#EBF7E9',
  },
  cropCardUnselected: {
    borderColor: 'rgba(9, 74, 4, 0.08)',
  },
  cropImage: {
    width: scale(32),
    height: scale(32),
    marginBottom: verticalScale(6),
  },
  cropName: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    textAlign: 'center',
  },
  cropNameSelected: {
    color: '#094A04',
  },
  cropCheckmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: moderateScale(16),
    height: moderateScale(16),
    borderRadius: moderateScale(8),
    backgroundColor: '#094A04',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Dropdown Component Styling
  dropdownWrapper: {
    marginBottom: verticalScale(14),
    position: 'relative',
    zIndex: 100, // Make sure list drops on top of other content
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(12),
    height: verticalScale(50),
    justifyContent: 'space-between',
  },
  dropdownLeftIcon: {
    marginRight: scale(10),
  },
  dropdownText: {
    flex: 1,
    fontSize: moderateScale(13),
    fontWeight: '500',
  },
  dropdownList: {
    position: 'absolute',
    top: verticalScale(74),
    left: 0,
    right: 0,
    borderRadius: moderateScale(8),
    borderWidth: 1.2,
    zIndex: 200,
    paddingVertical: verticalScale(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
  },
  dropdownListItemText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
  },

  saveButton: {
    marginTop: verticalScale(12),
    shadowColor: '#094A04',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 1, // ensure it displays behind dropdown lists
  },
});
