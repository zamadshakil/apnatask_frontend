// src/components/Header.tsx — Branded app header (WhatsApp-style)
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar } from 'react-native';
import { Theme } from '../styles/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: {
    label: string;
    onPress: () => void;
  };
  rightAction?: {
    label: string;
    onPress: () => void;
  };
  variant?: 'primary' | 'dark';
}

export default function Header({
  title,
  subtitle,
  leftAction,
  rightAction,
  variant = 'primary',
}: HeaderProps) {
  const isDark = variant === 'dark';
  const bgColor = isDark ? Theme.colors.darkSlate : Theme.colors.primary;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={bgColor} />
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.leftSection}>
          {leftAction && (
            <TouchableOpacity onPress={leftAction.onPress} style={styles.actionButton}>
              <Text style={styles.actionText}>{leftAction.label}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.centerSection}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>
        <View style={styles.rightSection}>
          {rightAction && (
            <TouchableOpacity onPress={rightAction.onPress} style={styles.actionButton}>
              <Text style={styles.actionText}>{rightAction.label}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 48, // Safe area for status bar
    paddingBottom: Theme.spacing.md,
    ...Theme.shadows.md,
  },
  leftSection: {
    width: 60,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 60,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.textOnPrimary,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  actionText: {
    color: Theme.colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
