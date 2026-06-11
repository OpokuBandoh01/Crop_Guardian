import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        setHasToken(!!token);

        if (token) {
          const cached = await AsyncStorage.getItem('userData');
          if (cached) {
            const parsed = JSON.parse(cached);
            setIsOnboarded(!!parsed.isOnboarded);
          }
        }
      } catch (e) {
        console.error('Error reading token/onboarding status:', e);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFE7' }}>
        <ActivityIndicator size="large" color="#094A04" />
      </View>
    );
  }

  if (hasToken) {
    return isOnboarded ? <Redirect href="/(tabs)" /> : <Redirect href="/(onboarding)/user-role" />;
  } else {
    return <Redirect href="/login" />;
  }
}
