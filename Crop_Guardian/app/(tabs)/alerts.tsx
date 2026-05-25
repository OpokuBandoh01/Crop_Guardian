import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale } from 'react-native-size-matters';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AlertsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.primary }]}>Alerts</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>
          Receive weather warnings, disease outbreak alerts, and action items.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    marginBottom: moderateScale(8),
  },
  subtitle: {
    fontSize: moderateScale(14),
    textAlign: 'center',
  },
});
