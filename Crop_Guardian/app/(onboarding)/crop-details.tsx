import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthHeader } from '@/components/AuthHeader';
import { CustomButton } from '@/components/CustomButton';

type GrowthStage = 'Planting' | 'Growing' | 'Harvesting';

export default function CropDetailsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [cropStages, setCropStages] = useState<Record<string, GrowthStage>>({});

  useEffect(() => {
    const loadCrops = async () => {
      try {
        const cropsRaw = await AsyncStorage.getItem('onboarding_preferredCrops');
        if (cropsRaw) {
          const parsed = JSON.parse(cropsRaw) as string[];
          setSelectedCrops(parsed);
          
          const initialStages: Record<string, GrowthStage> = {};
          parsed.forEach((crop) => {
            initialStages[crop] = 'Growing';
          });
          setCropStages(initialStages);
        } else {
          setSelectedCrops(['MAIZE']);
          setCropStages({ 'MAIZE': 'Growing' });
        }
      } catch (e) {
        console.error('Error loading onboarding crops:', e);
      }
    };
    loadCrops();
  }, []);

  const handleSave = async () => {
    try {
      const onboardingRole = await AsyncStorage.getItem('onboarding_role');
      
      const cached = await AsyncStorage.getItem('userData');
      let parsedUserData: any = {};
      if (cached) {
        parsedUserData = JSON.parse(cached);
      }

      if (!parsedUserData.profile) {
        parsedUserData.profile = {};
      }
      parsedUserData.profile.preferredCrops = selectedCrops;
      parsedUserData.role = onboardingRole || 'FARMER';
      parsedUserData.isOnboarded = true;

      await AsyncStorage.setItem('onboarding_cropStages', JSON.stringify(cropStages));
      await AsyncStorage.setItem('userData', JSON.stringify(parsedUserData));
    } catch (err) {
      console.error('Error saving onboarding data:', err);
    }

    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.headerWrapper}>
        <AuthHeader />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: theme.text }]}>
            Tell us more(optional)
          </Text>
          <Text style={[styles.subtitle, { color: theme.text }]}>
            Helps us give better advice
          </Text>
        </View>

        <View style={styles.formContainer}>
          
          {selectedCrops.map((cropKey) => {
            const cropDisplayName = cropKey.charAt(0).toUpperCase() + cropKey.slice(1).toLowerCase();
            const currentStage = cropStages[cropKey] || 'Growing';

            return (
              <View key={cropKey} style={[styles.cropCardContainer, { backgroundColor: theme.surface, borderColor: theme.inputBorder }]}>
                <View style={styles.cropCardHeader}>
                  <Ionicons name="leaf-outline" size={moderateScale(18)} color={theme.primary} />
                  <Text style={[styles.cropTitleText, { color: theme.text }]}>
                    {cropDisplayName}
                  </Text>
                </View>

                {/* Growth Stage Selector */}
                <View style={styles.stageFieldContainer}>
                  <Text style={[styles.stageLabel, { color: theme.icon }]}>Select Growth Stage</Text>
                  <View style={styles.stageButtonsContainer}>
                    {(['Planting', 'Growing', 'Harvesting'] as GrowthStage[]).map((stage) => {
                      const isSelected = currentStage === stage;
                      return (
                        <TouchableOpacity
                          key={stage}
                          style={[
                            styles.stageButton,
                            { 
                              borderColor: theme.primary, 
                              backgroundColor: isSelected ? theme.primary : theme.surface 
                            }
                          ]}
                          onPress={() => {
                            setCropStages(prev => ({
                              ...prev,
                              [cropKey]: stage
                            }));
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.stageButtonText, 
                            { color: isSelected ? '#FFFFFF' : theme.text }
                          ]}>
                            {stage}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            );
          })}

          {/* Location Selector */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Location</Text>
            <TouchableOpacity 
              style={[styles.inputBox, { borderColor: theme.primary, backgroundColor: theme.surface }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.inputText, { color: theme.text }]}>Select your location</Text>
              <Ionicons name="location-outline" size={moderateScale(20)} color={theme.primary} />
            </TouchableOpacity>
          </View>

        </View>

      </ScrollView>

      <View style={styles.footer}>
        <CustomButton 
          title="Save Crop" 
          onPress={handleSave} 
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
    marginTop: verticalScale(0),
    marginBottom: verticalScale(40),
  },
  title: {
    fontSize: moderateScale(26),
    fontWeight: '700',
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: moderateScale(14),
    fontWeight: '400',
    textAlign: 'center',
  },
  formContainer: {
    gap: verticalScale(30),
  },
  fieldContainer: {
    gap: verticalScale(10),
  },
  label: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginLeft: scale(2),
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    height: verticalScale(50),
    borderWidth: 1,
    borderRadius: moderateScale(8),
    // Drop shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputText: {
    fontSize: moderateScale(14),
  },
  stageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(10),
  },
  stageButton: {
    flex: 1,
    height: verticalScale(45),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: moderateScale(8),
    // Drop shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stageButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(20),
  },
  cropCardContainer: {
    borderRadius: moderateScale(12),
    borderWidth: 1,
    padding: scale(14),
    marginBottom: verticalScale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cropCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
    gap: scale(6),
  },
  cropTitleText: {
    fontSize: moderateScale(15),
    fontWeight: '700',
  },
  stageFieldContainer: {
    gap: verticalScale(8),
  },
  stageLabel: {
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
});
