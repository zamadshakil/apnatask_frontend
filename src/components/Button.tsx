// src/components/Button.tsx — Premium branded button
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { Theme } from '../styles/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'outline' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export default function Button({
  title,
  onPress,
  type = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  testID,
}: ButtonProps) {
  const buttonStyles = [
    styles.button,
    sizeStyles[size],
    typeStyles[type],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    sizeTextStyles[size],
    typeTextStyles[type],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      testID={testID}
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={type === 'outline' ? Theme.colors.primary : Theme.colors.white}
        />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const sizeStyles: Record<string, ViewStyle> = {
  sm: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: Theme.radius.sm },
  md: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: Theme.radius.md },
  lg: { paddingVertical: 18, paddingHorizontal: 32, borderRadius: Theme.radius.lg },
};

const sizeTextStyles: Record<string, TextStyle> = {
  sm: { fontSize: 13 },
  md: { fontSize: 16 },
  lg: { fontSize: 18 },
};

const typeStyles: Record<string, ViewStyle> = {
  primary: { backgroundColor: Theme.colors.primary },
  secondary: { backgroundColor: Theme.colors.primaryLight },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Theme.colors.primary },
  accent: { backgroundColor: Theme.colors.accent },
  danger: { backgroundColor: Theme.colors.error },
};

const typeTextStyles: Record<string, TextStyle> = {
  primary: { color: Theme.colors.white },
  secondary: { color: Theme.colors.white },
  outline: { color: Theme.colors.primary },
  accent: { color: Theme.colors.white },
  danger: { color: Theme.colors.white },
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});
