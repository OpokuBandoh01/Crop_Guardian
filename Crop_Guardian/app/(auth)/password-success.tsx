import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CustomButton } from '@/components/CustomButton';

export default function PasswordSuccessScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        
        <View style={styles.content}>
          <Image 
            source={require('@/assets/icons/sucessicon.png')} 
            style={styles.icon}
            resizeMode="contain"
          />
          
          <Text style={[styles.title, { color: theme.primary }]}>
            Successful
          </Text>
          
          <Text style={[styles.message, { color: theme.text }]}>
            Congratulations! Your password has been successfully{'\n'}
            updated. Click Continue to login
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <CustomButton 
            title="Continue" 
            onPress={() => router.replace('/login')} 
          />
        </View>
        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: scale(20),
    justifyContent: 'space-between',
    paddingBottom: verticalScale(40),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: moderateScale(100),
    height: moderateScale(100),
    marginBottom: verticalScale(24),
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: verticalScale(12),
  },
  message: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    lineHeight: moderateScale(20),
    paddingHorizontal: scale(10),
  },
  buttonContainer: {
    width: '100%',
  },
});
