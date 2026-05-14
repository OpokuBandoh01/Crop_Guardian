import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface DividerProps {
  text?: string;
}

export const Divider: React.FC<DividerProps> = ({ text }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: theme.inputBorder }]} />
      {text && (
        <Text style={[styles.text, { color: theme.text }]}>{text}</Text>
      )}
      <View style={[styles.line, { backgroundColor: theme.inputBorder }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: verticalScale(20),
  },
  line: {
    flex: 1,
    height: 1,
  },
  text: {
    marginHorizontal: scale(10),
    fontSize: moderateScale(12),
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
