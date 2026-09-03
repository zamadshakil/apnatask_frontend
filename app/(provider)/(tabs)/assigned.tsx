import type { components } from '../../../src/api/schema';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Phone, Route, Sparkles } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import Badge from '../../../src/components/Badge';
import Button from '../../../src/components/Button';
import Card from '../../../src/components/Card';
import EmptyState from '../../../src/components/EmptyState';
import { FadeIn } from '../../../src/components/Motion';
import { Screen, StateView } from '../../../src/components/Screen';
import { createIdempotencyKey, typedApi } from '../../../src/services/api';
import { Theme } from '../../../src/styles/theme';
import i18n from '../../../src/i18n';
import { useSession } from '../../../src/providers/AuthProvider';
import { assignedToProvider, liveQueryOptions, problemDetail } from '../../../src/utils/marketplace';
import TaskPhotos from '../../../src/components/TaskPhotos';
type Booking = components['schemas']['BookingResponse'];
const nextAction: Record<string, { action: 'start_travel' | 'start_work' | 'request_completion'; labelKey: string }> = { accepted: { action: 'start_travel', labelKey: 'onWay' }, en_route: { action: 'start_work', labelKey: 'start' }, in_progress: { action: 'request_completion', labelKey: 'request' } };

export default function AssignedWork() {
  const cache = useQueryClient();
  const { user } = useSession();
  const [feedback, setFeedback] = useState<string>();
  const [busyId, setBusyId] = useState<string>();
  const actionKeys = useRef<Record<string, string>>({});
  const query = useQuery({ ...liveQueryOptions, queryKey: ['provider-assigned', user?.provider_id], enabled: Boolean(user?.provider_id), queryFn: async () => {
    const { data, error } = await typedApi.GET('/api/v2/bookings'); if (error) throw error;
    return assignedToProvider(data ?? [], user?.provider_id);
  } });
  const advance = async (task: Booking) => {
    const config = nextAction[task.status]; if (!config || busyId) return;
    setBusyId(task.id); setFeedback(undefined);
    const key = task.id + ':' + config.action;
    try {
      const { error } = await typedApi.POST('/api/v2/bookings/{booking_id}/transition', { params: { path: { booking_id: task.id } }, headers: { 'Idempotency-Key': actionKeys.current[key] ??= createIdempotencyKey() }, body: { action: config.action } });
      if (error) throw error;
    } catch (error) { setFeedback(problemDetail(error, i18n.t('flow.retry'))); }
    finally { setBusyId(undefined); await cache.invalidateQueries({ queryKey: ['provider-assigned'] }); }
  };
  if (query.isLoading) return <StateView title={i18n.t('experience.assigned.loading')} loading />;
  if (query.isError) return <StateView title={i18n.t('experience.assigned.unavailable')} onRetry={() => query.refetch()} />;
  return (
    <Screen>
      {!!feedback && <Text accessibilityRole="alert" style={styles.subtitle}>{feedback}</Text>}
      <FadeIn><Text style={styles.title}>{i18n.t('experience.assigned.title')}</Text><Text style={styles.subtitle}>{i18n.t('experience.assigned.subtitle')}</Text></FadeIn>
      {query.data?.length ? query.data.map((task, index) => (
        <FadeIn key={task.id} delay={70 + index * 45}>
          <Card elevation="md">
            <View style={styles.cardTop}><Text style={styles.taskTitle}>{task.title}</Text><Badge label={i18n.t(`experience.task.status.${task.status}`, { defaultValue: task.status.replaceAll('_', ' ') })} variant="info" /></View>
            {task.exact_address && <View style={styles.address}><View style={styles.pin}><MapPin color={Theme.colors.primary} size={18} /></View><View style={styles.addressCopy}><Text style={styles.addressLabel}>{i18n.t('experience.assigned.exactAddress')}</Text><Text style={styles.addressText}>{task.exact_address.address_line}, {task.exact_address.city}</Text></View></View>}
            <TaskPhotos images={task.images} />
            <View style={styles.actions}>
              {task.customer_phone && <Button title={i18n.t('experience.assigned.call')} type="outline" icon={<Phone size={17} color={Theme.colors.primary} />} onPress={() => void Linking.openURL(`tel:${task.customer_phone}`)} />}
              {nextAction[task.status] && <Button loading={busyId === task.id} disabled={Boolean(busyId)} title={i18n.t(`experience.assigned.${nextAction[task.status].labelKey}`)} icon={<Route size={17} color={Theme.colors.white} />} onPress={() => void advance(task)} />}
            </View>
          </Card>
        </FadeIn>
      )) : <EmptyState icon={Sparkles} title={i18n.t('experience.assigned.empty')} detail={i18n.t('experience.assigned.emptyDetail')} />}
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
