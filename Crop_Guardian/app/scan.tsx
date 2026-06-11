import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import * as ImagePicker from 'expo-image-picker';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import API from '@/services/api';

const { width } = Dimensions.get('window');

const CROP_TYPES = [
  { id: 'maize', name: 'Maize' },
  { id: 'cassava', name: 'Cassava' },
  { id: 'cocoa', name: 'Cocoa' },
  { id: 'plantain', name: 'Plantain' },
  { id: 'tomato', name: 'Tomato' },
  { id: 'pepper', name: 'Pepper' }
];

export default function ScanScreen() {
  const router = useRouter();
  const { action } = useLocalSearchParams<{ action?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (action === 'camera') {
      takePhoto();
    } else if (action === 'gallery') {
      uploadImage();
    }
  }, [action]);

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Camera access permission is required to take photos.');
        return;
      }

      const pickerResult = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        setImageUri(pickerResult.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to launch camera.');
    }
  };

  const uploadImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Gallery access permission is required to upload images.');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        setImageUri(pickerResult.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open media library.');
    }
  };

  const handleSubmit = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please capture or select an image first.');
      return;
    }
    if (!selectedCrop) {
      Alert.alert('Crop Type Required', 'Please select a crop type from the list above before diagnosing.');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'crop_image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('image', {
        uri: imageUri,
        name: filename,
        type,
      } as any);
      formData.append('cropType', selectedCrop);

      const response = await API.post('/api/detect', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success) {
        router.push({
          pathname: '/result',
          params: { data: JSON.stringify(response.data) }
        });
      } else {
        Alert.alert('Detection Failed', 'No result returned from backend.');
      }
    } catch (error: any) {
      console.error('Detect error:', error);
      if (error.response?.data?.errorType === 'CROP_MISMATCH') {
        const errorMsg = error.response.data.message || 'The uploaded image does not match the selected crop.';
        const detected = error.response.data.detectedCrop || 'Unknown';
        Alert.alert('Crop Mismatch', `${errorMsg}\n\nDetected Crop: ${detected}`);
      } else {
        const errorMsg = error.response?.data?.message || 'An error occurred while uploading. Please check your network and try again.';
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} disabled={isLoading}>
          <Ionicons name="arrow-back-circle-outline" size={moderateScale(32)} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>Scan Your Crop</Text>
        <View style={styles.rightSpacer} />
      </View>

      {/* Crop Selector */}
      <View style={styles.cropSelectorContainer}>
        <Text style={[styles.selectorLabel, { color: theme.text }]}>Select Crop to Scan:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cropScroll}>
          {CROP_TYPES.map(crop => {
            const isSelected = selectedCrop === crop.id;
            return (
              <TouchableOpacity
                key={crop.id}
                style={[
                  styles.cropTab,
                  { borderColor: theme.primary },
                  isSelected && { backgroundColor: theme.primary }
                ]}
                onPress={() => setSelectedCrop(crop.id)}
                disabled={isLoading}
              >
                <Text style={[styles.cropTabText, { color: isSelected ? '#FFFFFF' : theme.text }]}>
                  {crop.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Image Container */}
      <View style={[styles.imageContainer, !imageUri && { backgroundColor: colorScheme === 'light' ? '#F3F4F6' : '#1F2937', justifyContent: 'center', alignItems: 'center' }]}>
        {imageUri ? (
          <Image 
            source={{ uri: imageUri }} 
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="camera-outline" size={moderateScale(48)} color={theme.icon} />
            <Text style={[styles.placeholderText, { color: theme.text }]}>No Image Selected</Text>
            <Text style={[styles.placeholderSubtext, { color: theme.icon }]}>Tap the gallery or camera button below to scan.</Text>
          </View>
        )}
        {/* Frame Overlays */}
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
      </View>

      {/* Instruction Text */}
      <Text style={[styles.instructionText, { color: theme.text }]}>
        {imageUri ? 'Photo selected. Tap check button to diagnose' : 'Align the leaf in frame'}
      </Text>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.iconButton} onPress={uploadImage} disabled={isLoading}>
          <Image 
            source={require('@/assets/icons/galleryicon.png')} 
            style={styles.controlIcon} 
            contentFit="contain" 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.captureButtonOuter, { borderColor: theme.primary }]}
          onPress={imageUri ? handleSubmit : takePhoto}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.primary} size="small" />
          ) : (
            <View style={[styles.captureButtonInner, { backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }]}>
              {imageUri && <Ionicons name="checkmark" size={moderateScale(32)} color="#FFFFFF" />}
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.iconButton, styles.invertButton, { borderColor: theme.text }]}
          onPress={takePhoto}
          disabled={isLoading}
        >
          <Image 
            source={require('@/assets/icons/invertcameraicon.png')} 
            style={styles.controlIcon} 
            contentFit="contain" 
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(16),
  },
  backButton: {
    padding: scale(4),
  },
  headerTitle: {
    fontSize: moderateScale(22),
    fontWeight: '700',
  },
  rightSpacer: {
    width: moderateScale(40),
  },
  cropSelectorContainer: {
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(16),
  },
  selectorLabel: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    marginBottom: verticalScale(6),
  },
  cropScroll: {
    gap: scale(8),
    paddingBottom: verticalScale(4),
  },
  cropTab: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(16),
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropTabText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
  imageContainer: {
    width: width - scale(32),
    height: verticalScale(380),
    alignSelf: 'center',
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  corner: {
    position: 'absolute',
    width: moderateScale(40),
    height: moderateScale(40),
    borderColor: '#E5E7EB',
  },
  topLeft: {
    top: moderateScale(20),
    left: moderateScale(20),
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  topRight: {
    top: moderateScale(20),
    right: moderateScale(20),
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bottomLeft: {
    bottom: moderateScale(20),
    left: moderateScale(20),
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bottomRight: {
    bottom: moderateScale(20),
    right: moderateScale(20),
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  instructionText: {
    textAlign: 'center',
    fontSize: moderateScale(16),
    marginTop: verticalScale(12),
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginTop: verticalScale(20),
    paddingHorizontal: scale(20),
  },
  iconButton: {
    padding: scale(8),
  },
  invertButton: {
    borderWidth: 1,
    borderRadius: moderateScale(30),
    padding: moderateScale(8),
  },
  controlIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
  },
  captureButtonOuter: {
    width: moderateScale(68),
    height: moderateScale(68),
    borderRadius: moderateScale(34),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(20),
  },
  placeholderText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    marginTop: verticalScale(12),
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: moderateScale(12),
    fontWeight: '400',
    marginTop: verticalScale(6),
    textAlign: 'center',
    lineHeight: verticalScale(16),
    opacity: 0.7,
  },
});
