// src/components/Card.tsx — Premium card with shadow variants
import React, { ReactNode } from 'react';
import { Platform, StyleSheet, View, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { Theme } from '../styles/theme';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  elevation?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  testID?: string;
}

export default function Card({
  children,
  style,
  elevation = 'md',
  onPress,
  testID,
}: CardProps) {
  const webShadows = { sm: '0 1px 2px rgba(0,0,0,0.08)', md: '0 2px 4px rgba(0,0,0,0.12)', lg: '0 4px 8px rgba(0,0,0,0.15)' } as const;
  const shadowStyle = Platform.OS === 'web' ? { boxShadow: webShadows[elevation] } : Theme.shadows[elevation];
  const cardStyle = [styles.card, shadowStyle, style];

  if (onPress) {
    return (
      <TouchableOpacity
        testID={testID}
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View testID={testID} style={cardStyle}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
    marginVertical: Theme.spacing.sm,
  },
});
