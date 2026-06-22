// src/components/Input.tsx — Premium form input
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TextInputProps, ViewStyle } from 'react-native';
import { Theme } from '../styles/theme';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  hint,
  containerStyle,
  icon,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[
        styles.inputWrapper,
        isFocused ? styles.inputFocused : null,
        error ? styles.inputError : null,
      ]}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <TextInput
          style={[styles.input, icon ? styles.inputWithIcon : null, style]}
          placeholderTextColor={Theme.colors.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.lg,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.md,
    overflow: 'hidden',
  },
  inputFocused: {
    borderColor: Theme.colors.primary,
    backgroundColor: '#F8FFFD',
  },
  inputError: {
    borderColor: Theme.colors.error,
    backgroundColor: Theme.colors.errorLight,
  },
  iconWrapper: {
    paddingLeft: Theme.spacing.md,
  },
  input: {
    flex: 1,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: Theme.colors.textPrimary,
  },
  inputWithIcon: {
    paddingLeft: Theme.spacing.sm,
  },
  errorText: {
    fontSize: 12,
    color: Theme.colors.error,
    marginTop: 4,
    fontWeight: '500',
  },
  hintText: {
    fontSize: 12,
    color: Theme.colors.textTertiary,
    marginTop: 4,
  },
});
