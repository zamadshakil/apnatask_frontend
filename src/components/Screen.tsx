import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../styles/theme';
import { subscribeToConnectivity } from '../services/connectivity';
import Button from './Button';

export function Screen({ children, scroll = true, style }: React.PropsWithChildren<{ scroll?: boolean; style?: ViewStyle }>) {
  const [offline, setOffline] = useState(false);
  useEffect(() => subscribeToConnectivity((online) => setOffline(!online)), []);
  const content = <View style={[styles.content, style]}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      {offline && <Text accessibilityRole="alert" style={styles.offline}>Offline — actions will resume when connected</Text>}
      {scroll ? <ScrollView contentContainerStyle={styles.scroll}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

export function StateView({ title, detail, loading, onRetry }: { title: string; detail?: string; loading?: boolean; onRetry?: () => void }) {
  return (
    <View style={styles.state} accessibilityLiveRegion="polite">
      {loading && <ActivityIndicator color={Theme.colors.primary} />}
      <Text style={styles.stateTitle}>{title}</Text>
      {detail && <Text style={styles.stateDetail}>{detail}</Text>}
      {onRetry && <Button title="Try again" onPress={onRetry} type="outline" size="sm" />}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  scroll: { flexGrow: 1 },
  content: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center', padding: Theme.spacing.lg },
  offline: { backgroundColor: Theme.colors.warningLight, color: Theme.colors.textPrimary, padding: 8, textAlign: 'center' },
  state: { flex: 1, minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  stateTitle: { ...Theme.typography.h3, color: Theme.colors.textPrimary, textAlign: 'center' },
  stateDetail: { ...Theme.typography.bodySmall, color: Theme.colors.textSecondary, textAlign: 'center' },
});
