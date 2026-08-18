import type { components } from '../../../src/api/schema';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Phone, Route, Sparkles } from 'lucide-react-native';
import React from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import Badge from '../../../src/components/Badge';
import Button from '../../../src/components/Button';
import Card from '../../../src/components/Card';
import EmptyState from '../../../src/components/EmptyState';
import { FadeIn } from '../../../src/components/Motion';
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
  return (
    <Screen>
      <FadeIn><Text style={styles.title}>Your work</Text><Text style={styles.subtitle}>Everything you need for tasks customers selected you for.</Text></FadeIn>
      {query.data?.length ? query.data.map((task, index) => (
        <FadeIn key={task.id} delay={70 + index * 45}>
          <Card elevation="md">
            <View style={styles.cardTop}><Text style={styles.taskTitle}>{task.title}</Text><Badge label={task.status.replaceAll('_', ' ')} variant="info" /></View>
            {task.exact_address && <View style={styles.address}><View style={styles.pin}><MapPin color={Theme.colors.primary} size={18} /></View><View style={styles.addressCopy}><Text style={styles.addressLabel}>Exact address</Text><Text style={styles.addressText}>{task.exact_address.address_line}, {task.exact_address.city}</Text></View></View>}
            <View style={styles.actions}>
              {task.customer_phone && <Button title="Call customer" type="outline" icon={<Phone size={17} color={Theme.colors.primary} />} onPress={() => void Linking.openURL(`tel:${task.customer_phone}`)} />}
              {nextAction[task.status] && <Button title={nextAction[task.status].label} icon={<Route size={17} color={Theme.colors.white} />} onPress={() => void advance(task)} />}
            </View>
          </Card>
        </FadeIn>
      )) : <EmptyState icon={Sparkles} title="No assigned work" detail="When a customer selects your offer, the task and private contact details will appear here." />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...Theme.typography.display, color: Theme.colors.textPrimary },
  subtitle: { ...Theme.typography.body, color: Theme.colors.textSecondary, marginTop: Theme.spacing.xs, marginBottom: Theme.spacing.xl },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Theme.spacing.md },
  taskTitle: { ...Theme.typography.h3, color: Theme.colors.textPrimary, flex: 1 },
  address: { flexDirection: 'row', gap: Theme.spacing.md, marginTop: Theme.spacing.xl, padding: Theme.spacing.lg, backgroundColor: Theme.colors.surfaceMuted, borderRadius: Theme.radius.md },
  pin: { width: 36, height: 36, borderRadius: 12, backgroundColor: Theme.colors.primaryMist, alignItems: 'center', justifyContent: 'center' },
  addressCopy: { flex: 1 },
  addressLabel: { ...Theme.typography.caption, color: Theme.colors.textTertiary },
  addressText: { ...Theme.typography.bodySmall, color: Theme.colors.textPrimary, marginTop: 2 },
  actions: { gap: Theme.spacing.sm, marginTop: Theme.spacing.lg },
});
