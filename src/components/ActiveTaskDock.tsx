import type { components } from '../api/schema';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { BriefcaseBusiness, ChevronRight, MapPin, Radio } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';
import i18n from '../i18n';
import { useSession } from '../providers/AuthProvider';
import { typedApi } from '../services/api';
import { Theme } from '../styles/theme';
import TactilePressable from './TactilePressable';

type Booking = components['schemas']['BookingResponse'];
type Role = 'customer' | 'provider';

const terminalStatuses = new Set(['completed', 'expired', 'cancelled', 'disputed']);
const progressByStatus: Record<string, number> = {
  draft: 8,
  open: 24,
  accepted: 43,
  en_route: 60,
  in_progress: 77,
  completion_requested: 91,
};

export function chooseActiveTask(tasks: Booking[], role: Role, userId?: string, providerId?: string | null) {
  return tasks.find((task) => {
    if (terminalStatuses.has(task.status)) return false;
    return role === 'customer' ? task.customer_id === userId : Boolean(providerId && task.selected_provider_id === providerId);
  });
}

export default function ActiveTaskDock({ role, overlap = false, floating = false }: { role: Role; overlap?: boolean; floating?: boolean }) {
  const { user } = useSession();
  const query = useQuery({
    queryKey: ['active-task-dock'],
    queryFn: async () => {
      const { data, error } = await typedApi.GET('/api/v2/bookings', { params: { query: { limit: 30 } } });
      if (error) throw error;
      return (data ?? []) as Booking[];
    },
    refetchInterval: 15_000,
    staleTime: 5_000,
  });
  const task = useMemo(
    () => chooseActiveTask(query.data ?? [], role, user?.id, user?.provider_id),
    [query.data, role, user?.id, user?.provider_id],
  );

  if (!task) return null;
  const visibleStatus = task.verification_status === 'pending' ? 'pending' : task.status;
  const progress = task.verification_status === 'pending' ? 12 : progressByStatus[task.status] ?? 12;
  const destination = role === 'customer'
    ? { pathname: '/(customer)/task/[id]' as const, params: { id: task.id } }
    : '/provider/(tabs)/assigned';

  return (
    <View pointerEvents="box-none" style={[styles.shell, overlap && styles.overlap, floating && styles.floatingShell]}>
      <View style={[styles.frame, floating && styles.floatingFrame]}>
        <TactilePressable
        accessibilityRole="button"
        accessibilityLabel={`${i18n.t('experience.active.eyebrow')}: ${task.title}`}
        onPress={() => router.push(destination as never)}
        style={styles.card}
      >
        <View style={styles.topRow}>
          <View style={styles.liveMark}><Radio color={Theme.colors.primary} size={16} /><Text style={styles.eyebrow}>{i18n.t('experience.active.eyebrow')}</Text></View>
          <View style={styles.statusPill}><Text style={styles.statusText}>{i18n.t(`experience.task.status.${visibleStatus}`, { defaultValue: visibleStatus.replaceAll('_', ' ') })}</Text></View>
        </View>
        <View style={styles.contentRow}>
          <View style={styles.icon}><BriefcaseBusiness color={Theme.colors.primary} size={22} /></View>
          <View style={styles.copy}>
            <Text numberOfLines={1} style={styles.title}>{task.title}</Text>
            <Text numberOfLines={1} style={styles.detail}>{i18n.t(`experience.active.detail.${visibleStatus}`)}</Text>
            <View style={styles.location}><MapPin color={Theme.colors.textTertiary} size={13} /><Text numberOfLines={1} style={styles.locationText}>{task.approximate_area}</Text></View>
          </View>
          <ChevronRight color={Theme.colors.textTertiary} size={22} />
        </View>
        <View style={styles.track}><View style={[styles.progress, { width: `${progress}%` }]} /></View>
        <Text style={styles.action}>{i18n.t(role === 'customer' ? 'experience.active.track' : 'experience.active.openWork')}</Text>
        </TactilePressable>
      </View>
    </View>
  );
}

const webDepth = Platform.OS === 'web' ? ({ boxShadow: Theme.webShadows.xl } as ViewStyle) : Theme.shadows.xl;
const styles = StyleSheet.create({
  shell: { zIndex: 4, marginBottom: Theme.spacing.md },
  overlap: { marginTop: -18 },
  frame: { width: '100%' },
  floatingShell: { position: 'absolute', left: 0, right: 0, bottom: 88, zIndex: 80, elevation: 20, marginBottom: 0, paddingHorizontal: Theme.spacing.lg, alignItems: 'center' },
  floatingFrame: { width: '100%', maxWidth: 720 },
  card: { backgroundColor: Theme.colors.surface, borderRadius: Theme.radius.xl, borderWidth: 1, borderColor: Theme.colors.borderLight, padding: Theme.spacing.lg, ...webDepth },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Theme.spacing.sm },
  liveMark: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrow: { ...Theme.typography.overline, color: Theme.colors.primary },
  statusPill: { backgroundColor: Theme.colors.primaryMist, borderRadius: Theme.radius.full, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { ...Theme.typography.metadata, color: Theme.colors.primaryDark, textTransform: 'capitalize' },
  contentRow: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.md, marginTop: Theme.spacing.md },
  icon: { width: 45, height: 45, borderRadius: 15, backgroundColor: Theme.colors.primaryMist, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  title: { ...Theme.typography.h3, color: Theme.colors.textPrimary, fontSize: 16 },
  detail: { ...Theme.typography.bodySmall, color: Theme.colors.textSecondary, marginTop: 1 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  locationText: { ...Theme.typography.caption, color: Theme.colors.textTertiary, flex: 1 },
  track: { height: 4, borderRadius: Theme.radius.full, backgroundColor: Theme.colors.surfaceMuted, overflow: 'hidden', marginTop: Theme.spacing.md },
  progress: { height: '100%', borderRadius: Theme.radius.full, backgroundColor: Theme.colors.primaryLight },
  action: { ...Theme.typography.caption, color: Theme.colors.primary, fontWeight: '700', marginTop: Theme.spacing.sm, textAlign: 'right' },
});
