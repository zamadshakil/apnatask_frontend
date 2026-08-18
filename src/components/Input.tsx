import React, { useRef, useState } from 'react';
import { Animated, Platform, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { Theme } from '../styles/theme';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

export default function Input({ label, error, hint, containerStyle, icon, style, onFocus, onBlur, multiline, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  const focus = useRef(new Animated.Value(0)).current;
  const setFocus = (value: boolean) => {
    setFocused(value);
    Animated.timing(focus, { toValue: value ? 1 : 0, duration: Theme.motion.quick, useNativeDriver: false }).start();
  };
  const borderColor = error ? Theme.colors.error : focus.interpolate({ inputRange: [0, 1], outputRange: [Theme.colors.border, Theme.colors.primaryLight] });

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={[styles.inputWrapper, multiline && styles.multilineWrapper, { borderColor }, focused && styles.focused, error && styles.errorSurface]}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <TextInput
          {...props}
          multiline={multiline}
          style={[styles.input, multiline && styles.multilineInput, icon ? styles.inputWithIcon : null, style]}
          placeholderTextColor={Theme.colors.textTertiary}
          selectionColor={Theme.colors.primaryLight}
          onFocus={(event) => { setFocus(true); onFocus?.(event); }}
          onBlur={(event) => { setFocus(false); onBlur?.(event); }}
        />
      </Animated.View>
      {error && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Theme.spacing.lg, width: '100%' },
  label: { ...Theme.typography.caption, color: Theme.colors.textSecondary, marginBottom: 7, paddingLeft: 2 },
  inputWrapper: { minHeight: 54, flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.surfaceGlassStrong, borderWidth: 1, borderRadius: Theme.radius.md, overflow: 'hidden' },
  multilineWrapper: { alignItems: 'flex-start', minHeight: 126 },
  focused: Platform.OS === 'web' ? ({ boxShadow: '0 0 0 3px rgba(18,140,126,0.12)' } as ViewStyle) : Theme.shadows.sm,
  errorSurface: { backgroundColor: Theme.colors.errorLight },
  iconWrapper: { paddingLeft: Theme.spacing.lg, paddingTop: 1 },
  input: { flex: 1, minHeight: 52, paddingHorizontal: Theme.spacing.lg, paddingVertical: 14, ...Theme.typography.body, color: Theme.colors.textPrimary, outlineStyle: 'none' } as never,
  multilineInput: { minHeight: 124, textAlignVertical: 'top', paddingTop: 15 },
  inputWithIcon: { paddingLeft: Theme.spacing.md },
  errorText: { ...Theme.typography.caption, color: Theme.colors.error, marginTop: 5, paddingLeft: 2 },
  hintText: { ...Theme.typography.caption, color: Theme.colors.textTertiary, marginTop: 5, paddingLeft: 2 },
});
