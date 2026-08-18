import React, { ReactNode } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Theme } from '../styles/theme';
import TactilePressable from './TactilePressable';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  elevation?: 'sm' | 'md' | 'lg';
  variant?: 'surface' | 'glass' | 'tinted';
  onPress?: () => void;
  testID?: string;
}

export default function Card({ children, style, elevation = 'sm', variant = 'surface', onPress, testID }: CardProps) {
  const depth = Platform.OS === 'web' ? ({ boxShadow: Theme.webShadows[elevation] } as ViewStyle) : Theme.shadows[elevation];
  const cardStyle = [styles.card, styles[variant], depth, style];
  if (onPress) return <TactilePressable testID={testID} accessibilityRole="button" style={cardStyle} onPress={onPress}>{children}</TactilePressable>;
  return <View testID={testID} style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: Theme.radius.lg, padding: Theme.spacing.xl, marginVertical: Theme.spacing.sm, borderWidth: 1 },
  surface: { backgroundColor: Theme.colors.surface, borderColor: Theme.colors.borderLight },
  glass: { backgroundColor: Theme.colors.surfaceGlass, borderColor: Theme.colors.glassBorder },
  tinted: { backgroundColor: Theme.colors.primaryMist, borderColor: 'rgba(7,94,84,0.08)' },
});
