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

const variantColors: Record<string, { bg: string; text: string; border: string }> = {
  success: { bg: 'rgba(37,211,102,0.11)', text: '#147B43', border: 'rgba(37,211,102,0.18)' },
  warning: { bg: 'rgba(233,175,40,0.12)', text: '#98690A', border: 'rgba(233,175,40,0.2)' },
  error: { bg: 'rgba(217,45,79,0.09)', text: '#B72043', border: 'rgba(217,45,79,0.16)' },
  info: { bg: 'rgba(33,136,217,0.09)', text: '#176CA9', border: 'rgba(33,136,217,0.16)' },
  neutral: { bg: 'rgba(95,113,108,0.08)', text: '#5F716C', border: 'rgba(95,113,108,0.12)' },
  verified: { bg: 'rgba(33,136,217,0.09)', text: '#176CA9', border: 'rgba(33,136,217,0.16)' },
};

export default function Badge({ label, variant = 'neutral', size = 'sm', style }: BadgeProps) {
  const colors = variantColors[variant];

  return (
    <View style={[
      styles.badge,
      size === 'md' && styles.badgeMd,
      { backgroundColor: colors.bg, borderColor: colors.border },
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
    borderWidth: 1,
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
    fontWeight: '700',
    letterSpacing: 0.15,
  },
  textMd: {
    fontSize: 13,
  },
});
