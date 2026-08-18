import type { components } from '../../../src/api/schema';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Button from '../../../src/components/Button';
import Card from '../../../src/components/Card';
import { Screen, StateView } from '../../../src/components/Screen';
import { typedApi } from '../../../src/services/api';
import { Theme } from '../../../src/styles/theme';
import { formatPkr } from '../../../src/utils/format';
type Booking = components['schemas']['BookingResponse'];

export default function TasksScreen() {
  const query = useQuery({ queryKey: ['my-bookings'], queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/bookings'); if (error) throw error; return data; } });
  if (query.isLoading) return <StateView title="Loading your tasks…" loading />;
  if (query.isError) return <StateView title="Couldn’t load tasks" detail="Check your connection and try again." onRetry={() => query.refetch()} />;
  return <Screen>{query.data?.length ? query.data.map((task: Booking) => <Link key={task.id} href={{ pathname: '/(customer)/task/[id]', params: { id: task.id } }} asChild><Pressable><Card><Text style={styles.title}>{task.title}</Text><Text style={styles.area}>{task.approximate_area} · {formatPkr(task.budget_paisa)}</Text><Text style={styles.status}>{task.status.replaceAll('_', ' ')}</Text></Card></Pressable></Link>) : <StateView title="No tasks yet" detail="Post what you need and nearby verified providers can offer a price." />}
    <Link href="/(customer)/task/new" asChild><Button title="Post a new task" onPress={() => undefined} /></Link></Screen>;
}
const styles = StyleSheet.create({ title: { ...Theme.typography.h3, color: Theme.colors.textPrimary }, area: { color: Theme.colors.textSecondary, marginVertical: 6 }, status: { color: Theme.colors.primary, fontWeight: '700', textTransform: 'capitalize' } });
