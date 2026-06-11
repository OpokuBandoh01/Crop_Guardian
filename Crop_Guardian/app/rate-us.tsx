import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CustomButton } from '@/components/CustomButton';

export default function RateUsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 1:
        return 'Terrible';
      case 2:
        return 'Poor';
      case 3:
        return 'Average';
      case 4:
        return 'Good';
      case 5:
        return 'Excellent!';
      default:
        return 'Tap a star to rate';
    }
  };

  const handleSubmit = () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      setComment('');
      setRating(0);
      setTimeout(() => {
        setShowSuccess(false);
        router.back();
      }, 2500);
    }, 1500);
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

        <Text style={[styles.headerTitle, { color: theme.primary }]}>Rate Us</Text>

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
          
          {/* ================= SUCCESS BANNER ================= */}
          {showSuccess && (
            <View style={styles.successBanner}>
              <View style={styles.successIconWrapper}>
                <Ionicons name="checkmark-sharp" size={moderateScale(15)} color="#FFFFFF" />
              </View>
              <Text style={styles.successText}>Thank you for your rating! Your review was sent successfully.</Text>
            </View>
          )}

          {/* ================= ILLUSTRATION HEADER ================= */}
          <View style={styles.heroSection}>
            <View style={[styles.iconCircle, { backgroundColor: colorScheme === 'light' ? '#FFFFE1' : '#1E2C20' }]}>
              <Ionicons name="star" size={moderateScale(32)} color="#FFB300" />
            </View>
            <Text style={[styles.heroTitle, { color: theme.text }]}>Share Your Experience</Text>
            <Text style={[styles.heroSub, { color: colorScheme === 'light' ? '#687076' : '#9BA1A6' }]}>
              Your feedback is crucial in helping us improve CropGuardian for farmers and gardeners worldwide.
            </Text>
          </View>

          {/* ================= RATING CARD ================= */}
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            
            {/* Stars Row */}
            <View style={styles.starsWrapper}>
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isActive = rating >= starValue;
                return (
                  <TouchableOpacity
                    key={starValue}
                    onPress={() => setRating(starValue)}
                    activeOpacity={0.7}
                    style={styles.starTouch}
                  >
                    <Ionicons
                      name={isActive ? 'star' : 'star-outline'}
                      size={moderateScale(38)}
                      color="#FFB300"
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Rating text label description */}
            <Text style={[styles.ratingLabel, { color: rating > 0 ? theme.primary : theme.placeholder }]}>
              {getRatingLabel(rating)}
            </Text>

            <View style={styles.divider} />

            {/* Multiline comments input */}
            <Text style={[styles.inputTitle, { color: theme.primary }]}>TELL US MORE (OPTIONAL)</Text>
            <View style={[styles.textInputContainer, { borderColor: theme.inputBorder }]}>
              <TextInput
                placeholder="What do you like about the app? Any features you would like to see added?"
                placeholderTextColor={theme.placeholder}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                style={[styles.textInput, { color: theme.text }]}
              />
            </View>

            {/* Submit Button */}
            <CustomButton
              title="Submit Feedback"
              disabled={rating === 0}
              loading={isSubmitting}
              onPress={handleSubmit}
              style={[styles.submitButton, { opacity: rating === 0 ? 0.6 : 1 }]}
            />

          </View>

          {/* Tip Section */}
          <View style={styles.tipSection}>
            <Ionicons name="chatbubble-ellipses-outline" size={moderateScale(16)} color="#094A04" />
            <Text style={styles.tipText}>
              We read every single review! Your feedback helps us shape future updates and build models for new crops.
            </Text>
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

  // Hero section
  heroSection: {
    alignItems: 'center',
    marginVertical: verticalScale(16),
    paddingHorizontal: scale(16),
  },
  iconCircle: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  heroTitle: {
    fontSize: moderateScale(17),
    fontWeight: '800',
    marginBottom: verticalScale(4),
  },
  heroSub: {
    fontSize: moderateScale(11.5),
    textAlign: 'center',
    lineHeight: verticalScale(16),
  },

  // Card
  card: {
    borderRadius: moderateScale(16),
    padding: scale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1.2,
    borderColor: 'rgba(9, 74, 4, 0.06)',
    marginBottom: verticalScale(20),
    alignItems: 'center',
  },
  starsWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(6),
    marginVertical: verticalScale(10),
  },
  starTouch: {
    padding: scale(4),
  },
  ratingLabel: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    marginVertical: verticalScale(6),
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(9, 74, 4, 0.06)',
    width: '100%',
    marginVertical: verticalScale(12),
  },
  inputTitle: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: verticalScale(10),
    alignSelf: 'flex-start',
  },
  textInputContainer: {
    borderWidth: 1.2,
    borderRadius: moderateScale(8),
    width: '100%',
    padding: scale(10),
    marginBottom: verticalScale(16),
  },
  textInput: {
    fontSize: moderateScale(13),
    height: verticalScale(100),
    lineHeight: verticalScale(18),
  },
  submitButton: {
    width: '100%',
    shadowColor: '#094A04',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  // tip
  tipSection: {
    flexDirection: 'row',
    backgroundColor: 'rgba(9, 74, 4, 0.04)',
    padding: scale(12),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    gap: scale(8),
  },
  tipText: {
    flex: 1,
    fontSize: moderateScale(10.5),
    lineHeight: verticalScale(15),
    color: '#094A04',
    fontWeight: '500',
  },
});
