import React, { useRef } from 'react';
import { ActivityIndicator, Animated, Platform, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { Theme } from '../styles/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'outline' | 'accent' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Button({ title, onPress, type = 'primary', size = 'md', loading = false, disabled = false, icon, style, textStyle, testID }: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (toValue: number) => Animated.spring(scale, { toValue, damping: 18, stiffness: 240, mass: 0.72, useNativeDriver: Platform.OS !== 'web' }).start();
  const foreground = type === 'outline' || type === 'glass' ? Theme.colors.primary : Theme.colors.white;

  return (
    <AnimatedTouchable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      accessibilityLabel={title}
      style={[styles.button, sizeStyles[size], typeStyles[type], type === 'primary' && styles.primaryDepth, disabled && styles.disabled, { transform: [{ scale }] }, style]}
      onPress={onPress}
      onPressIn={() => animate(0.975)}
      onPressOut={() => animate(1)}
      disabled={disabled || loading}
      activeOpacity={0.94}
    >
      {loading ? <ActivityIndicator size="small" color={foreground} /> : <>{icon}<Text style={[styles.text, sizeTextStyles[size], { color: foreground }, disabled && styles.disabledText, textStyle]}>{title}</Text></>}
    </AnimatedTouchable>
  );
}

const sizeStyles: Record<string, ViewStyle> = {
  sm: { minHeight: 42, paddingVertical: 10, paddingHorizontal: 17, borderRadius: Theme.radius.sm },
  md: { minHeight: 52, paddingVertical: 14, paddingHorizontal: 22, borderRadius: Theme.radius.md },
  lg: { minHeight: 58, paddingVertical: 17, paddingHorizontal: 28, borderRadius: Theme.radius.lg },
};
const sizeTextStyles: Record<string, TextStyle> = { sm: { fontSize: 13 }, md: { fontSize: 16 }, lg: { fontSize: 17 } };
const typeStyles: Record<string, ViewStyle> = {
  primary: { backgroundColor: Theme.colors.primary, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  secondary: { backgroundColor: Theme.colors.primaryLight },
  outline: { backgroundColor: Theme.colors.surfaceGlassStrong, borderWidth: 1, borderColor: 'rgba(7,94,84,0.22)' },
  accent: { backgroundColor: Theme.colors.accent },
  danger: { backgroundColor: Theme.colors.error },
  glass: { backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: Theme.colors.glassBorder },
};

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryDepth: Platform.OS === 'web' ? ({ boxShadow: Theme.webShadows.md } as ViewStyle) : Theme.shadows.md,
  text: { ...Theme.typography.button },
  disabled: { opacity: 0.45 },
  disabledText: { opacity: 0.8 },
});
