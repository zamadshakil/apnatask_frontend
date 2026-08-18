import type { components } from '../../../src/api/schema';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { Alert, Linking, StyleSheet, Text } from 'react-native';
import Button from '../../../src/components/Button';
import Card from '../../../src/components/Card';
import { Screen, StateView } from '../../../src/components/Screen';
import { createIdempotencyKey, typedApi } from '../../../src/services/api';
import { Theme } from '../../../src/styles/theme';
type Booking = components['schemas']['BookingResponse'];
const nextAction: Record<string, { action: 'start_travel' | 'start_work' | 'request_completion'; label: string }> = { accepted: { action: 'start_travel', label: 'I am on the way' }, en_route: { action: 'start_work', label: 'Start work' }, in_progress: { action: 'request_completion', label: 'Request completion' } };

export default function AssignedWork() {
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ['provider-assigned'], queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/bookings'); if (error) throw error; return (data ?? []).filter((item: Booking) => item.selected_provider_id) as Booking[]; } });
  const advance = async (task: Booking) => { const config = nextAction[task.status]; if (!config) return; const { error } = await typedApi.POST('/api/v2/bookings/{booking_id}/transition', { params: { path: { booking_id: task.id } }, headers: { 'Idempotency-Key': createIdempotencyKey() }, body: { action: config.action } }); if (error) return Alert.alert('Status not updated', 'Refresh and retry.'); await cache.invalidateQueries({ queryKey: ['provider-assigned'] }); };
  if (query.isLoading) return <StateView title="Loading assigned work…" loading />;
  if (query.isError) return <StateView title="Assigned work unavailable" onRetry={() => query.refetch()} />;
  return <Screen>{query.data?.length ? query.data.map((task) => <Card key={task.id}><Text style={styles.title}>{task.title}</Text><Text style={styles.status}>{task.status.replaceAll('_', ' ')}</Text>{task.exact_address && <Text>{task.exact_address.address_line}, {task.exact_address.city}</Text>}{task.customer_phone && <Button title="Call customer" type="outline" onPress={() => void Linking.openURL(`tel:${task.customer_phone}`)} />}{nextAction[task.status] && <Button title={nextAction[task.status].label} onPress={() => void advance(task)} />}</Card>) : <StateView title="No assigned work" detail="Selected offers appear here with the exact address and customer phone." />}</Screen>;
}
const styles = StyleSheet.create({ title: { ...Theme.typography.h3 }, status: { color: Theme.colors.primary, fontWeight: '800', textTransform: 'capitalize', marginVertical: 8 } });
