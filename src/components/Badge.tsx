// src/components/Badge.tsx — Status and verification badges
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Theme } from '../styles/theme';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'verified';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const variantColors: Record<string, { bg: string; text: string }> = {
  success: { bg: '#E8F5E9', text: '#2E7D32' },
  warning: { bg: '#FFF8E1', text: '#F57F17' },
  error: { bg: '#FFEBEE', text: '#C62828' },
  info: { bg: '#E3F2FD', text: '#1565C0' },
  neutral: { bg: '#F0F2F5', text: '#667781' },
  verified: { bg: '#E3F2FD', text: '#039BE5' },
};

export default function Badge({ label, variant = 'neutral', size = 'sm', style }: BadgeProps) {
  const colors = variantColors[variant];

  return (
    <View style={[
      styles.badge,
      size === 'md' && styles.badgeMd,
      { backgroundColor: colors.bg },
      style,
    ]}>
      {variant === 'verified' && <Text style={styles.icon}>✓</Text>}
      <Text style={[
        styles.text,
        size === 'md' && styles.textMd,
        { color: colors.text },
      ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.full,
    gap: 3,
  },
  badgeMd: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  icon: {
    fontSize: 10,
    fontWeight: '700',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  textMd: {
    fontSize: 13,
  },
});
