import type { components } from '../../../src/api/schema';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ClipboardList, MapPin, Plus, WalletCards } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Badge from '../../../src/components/Badge';
import Button from '../../../src/components/Button';
import Card from '../../../src/components/Card';
import EmptyState from '../../../src/components/EmptyState';
import { FadeIn } from '../../../src/components/Motion';
import { Screen, StateView } from '../../../src/components/Screen';
import { typedApi } from '../../../src/services/api';
import { Theme } from '../../../src/styles/theme';
import { formatPkr } from '../../../src/utils/format';
type Booking = components['schemas']['BookingResponse'];

export default function TasksScreen() {
  const query = useQuery({ queryKey: ['my-bookings'], queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/bookings'); if (error) throw error; return data; } });
  if (query.isLoading) return <StateView title="Loading your tasks…" loading />;
  if (query.isError) return <StateView title="Couldn’t load tasks" detail="Check your connection and try again." onRetry={() => query.refetch()} />;
  return <Screen>
    <FadeIn><View style={styles.header}><View><Text style={styles.eyebrow}>YOUR REQUESTS</Text><Text style={styles.heading}>My tasks</Text></View><Button title="New" size="sm" icon={<Plus color={Theme.colors.white} size={17} />} onPress={() => router.push('/(customer)/task/new')} /></View></FadeIn>
    {query.data?.length ? query.data.map((task: Booking, index: number) => <FadeIn key={task.id} delay={55 + index * 35}><Card onPress={() => router.push({ pathname: '/(customer)/task/[id]', params: { id: task.id } })} elevation="sm" style={styles.taskCard}><View style={styles.cardTop}><Text numberOfLines={2} style={styles.title}>{task.title}</Text><Badge label={task.status.replaceAll('_', ' ')} variant={task.status === 'open' || task.status === 'completed' ? 'success' : 'neutral'} /></View><View style={styles.metaRow}><MapPin color={Theme.colors.textTertiary} size={16} /><Text style={styles.meta}>{task.approximate_area}</Text></View><View style={styles.metaRow}><WalletCards color={Theme.colors.textTertiary} size={16} /><Text style={styles.price}>{formatPkr(task.budget_paisa)}</Text></View></Card></FadeIn>) : <Card variant="glass" style={styles.empty}><EmptyState icon={ClipboardList} title="No tasks yet" detail="Post what you need and nearby verified providers can offer a private price." actionLabel="Post your first task" onAction={() => router.push('/(customer)/task/new')} /></Card>}
  </Screen>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: Theme.spacing.xl },
  eyebrow: { ...Theme.typography.overline, color: Theme.colors.primary },
  heading: { ...Theme.typography.display, color: Theme.colors.textPrimary, marginTop: 3 },
  taskCard: { padding: Theme.spacing.xl, marginBottom: 5 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Theme.spacing.md, marginBottom: Theme.spacing.lg },
  title: { ...Theme.typography.h3, color: Theme.colors.textPrimary, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 7 },
  meta: { ...Theme.typography.bodySmall, color: Theme.colors.textSecondary },
  price: { ...Theme.typography.bodySmall, color: Theme.colors.moneyGreen, fontWeight: '700' },
  empty: { padding: 0 },
});
