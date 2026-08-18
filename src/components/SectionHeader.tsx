import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../styles/theme';

export default function SectionHeader({ title, detail }: { title: string; detail?: string }) {
  return <View style={styles.container}><Text style={styles.title}>{title}</Text>{detail && <Text style={styles.detail}>{detail}</Text>}</View>;
}

const styles = StyleSheet.create({
  container: { marginTop: Theme.spacing.xxl, marginBottom: Theme.spacing.md },
  title: { ...Theme.typography.h2, color: Theme.colors.textPrimary },
  detail: { ...Theme.typography.bodySmall, color: Theme.colors.textSecondary, marginTop: 4 },
});
