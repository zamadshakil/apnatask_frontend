import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronRight, MessageCircleMore } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../../../src/components/Card';
import EmptyState from '../../../src/components/EmptyState';
import { FadeIn } from '../../../src/components/Motion';
import { Screen, StateView } from '../../../src/components/Screen';
import { typedApi } from '../../../src/services/api';
import { Theme } from '../../../src/styles/theme';

type Thread = { id: string; booking_title: string; booking_status: string; updated_at: string };
export default function MessagesScreen() {
  const query = useQuery({ queryKey: ['threads'], queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/threads'); if (error) throw error; return (data ?? []) as Thread[]; } });
  if (query.isLoading) return <StateView title="Loading messages…" loading />;
  if (query.isError) return <StateView title="Messages unavailable" onRetry={() => query.refetch()} />;
  return <Screen>
    <FadeIn><Text style={styles.eyebrow}>PRIVATE NEGOTIATIONS</Text><Text style={styles.heading}>Messages</Text><Text style={styles.subheading}>Your task conversations stay private between you and each provider.</Text></FadeIn>
    <View style={styles.list}>{query.data?.length ? query.data.map((thread, index) => <FadeIn key={thread.id} delay={70 + index * 35}><Card onPress={() => router.push({ pathname: '/(customer)/thread/[id]', params: { id: thread.id } })} style={styles.thread}><View style={styles.avatar}><MessageCircleMore color={Theme.colors.primary} size={22} /></View><View style={styles.copy}><Text style={styles.title}>{thread.booking_title}</Text><Text style={styles.status}>{thread.booking_status.replaceAll('_', ' ')}</Text></View><ChevronRight color={Theme.colors.textTertiary} size={20} /></Card></FadeIn>) : <Card variant="glass" style={styles.empty}><EmptyState icon={MessageCircleMore} title="No conversations" detail="A private conversation appears after a provider submits an offer." /></Card>}</View>
  </Screen>;
}

const styles = StyleSheet.create({
  eyebrow: { ...Theme.typography.overline, color: Theme.colors.primary },
  heading: { ...Theme.typography.display, color: Theme.colors.textPrimary, marginTop: 3 },
  subheading: { ...Theme.typography.body, color: Theme.colors.textSecondary, marginTop: 8, maxWidth: 520 },
  list: { marginTop: Theme.spacing.xxl },
  thread: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.md, padding: Theme.spacing.lg },
  avatar: { width: 48, height: 48, borderRadius: 17, backgroundColor: Theme.colors.primaryMist, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  title: { ...Theme.typography.h3, fontSize: 16, color: Theme.colors.textPrimary },
  status: { ...Theme.typography.caption, color: Theme.colors.textSecondary, textTransform: 'capitalize', marginTop: 3 },
  empty: { padding: 0 },
});
