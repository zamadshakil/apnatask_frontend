import { Inbox } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../styles/theme';
import Button from './Button';

interface EmptyStateProps {
  title: string;
  detail: string;
  icon?: React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ title, detail, icon: Icon = Inbox, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <View style={styles.iconHalo}><Icon color={Theme.colors.primary} size={28} strokeWidth={1.8} /></View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.detail}>{detail}</Text>
      {actionLabel && onAction && <Button title={actionLabel} onPress={onAction} type="outline" size="sm" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minHeight: 250, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, paddingVertical: 42 },
  iconHalo: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.colors.primaryMist, borderWidth: 1, borderColor: 'rgba(7,94,84,0.08)', marginBottom: 18 },
  title: { ...Theme.typography.h3, color: Theme.colors.textPrimary, textAlign: 'center' },
  detail: { ...Theme.typography.bodySmall, color: Theme.colors.textSecondary, textAlign: 'center', maxWidth: 340, marginTop: 7, marginBottom: 18 },
});
