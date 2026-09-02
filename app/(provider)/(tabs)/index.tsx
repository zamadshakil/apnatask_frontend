import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import * as Location from 'expo-location';
import { BriefcaseBusiness, Clock3, List, LocateFixed, Map, MapPin, Navigation, Search } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Badge from '../../../src/components/Badge';
import Card from '../../../src/components/Card';
import Button from '../../../src/components/Button';
import DynamicMap from '../../../src/components/maps/DynamicMap';
import EmptyState from '../../../src/components/EmptyState';
import { FadeIn } from '../../../src/components/Motion';
import TactilePressable from '../../../src/components/TactilePressable';
import { Screen, StateView } from '../../../src/components/Screen';
import { typedApi } from '../../../src/services/api';
import { trackEvent } from '../../../src/services/analytics';
import { Theme } from '../../../src/styles/theme';
import { formatPkr } from '../../../src/utils/format';
import i18n from '../../../src/i18n';

type Category = { id: string; slug: string; name_en: string; name_ur: string };
type Job = { id: string; title: string; description: string; budget_paisa: number | null; approximate_area: string; approximate_latitude: number; approximate_longitude: number; distance_km: number; expires_at: string; score: number; match_reason_code: string; match_reason: string; matching_model: string; active_bid_count: number };
type JobsResponse = { items: Job[]; search_origin: { latitude: number; longitude: number }; radius_km: number; approved_category_ids: string[] };

function compactBudget(value: number | null) {
  if (value == null) return 'Open';
  const rupees = value / 100;
  return rupees >= 1000 ? `Rs ${(rupees / 1000).toFixed(rupees >= 10_000 ? 0 : 1)}k` : `Rs ${Math.round(rupees)}`;
}

function categoryLabel(category: Category) {
  return i18n.t(`categories.${category.slug}`, { defaultValue: category.name_en });
}

export default function JobsScreen() {
  const [categoryId, setCategoryId] = useState('');
  const [radiusKm, setRadiusKm] = useState(12);
  const [available, setAvailable] = useState(true);
  const [updatingPresence, setUpdatingPresence] = useState(false);
  const [presenceMessage, setPresenceMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await typedApi.GET('/api/v2/categories');
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });
  const query = useQuery({
    queryKey: ['provider-jobs', categoryId, radiusKm],
    queryFn: async () => {
      const params: { category_id?: string; radius_km?: number } = {};
      if (categoryId) params.category_id = categoryId;
      params.radius_km = radiusKm;
      const { data, error } = await typedApi.GET('/api/v2/jobs', { params: { query: params } });
      if (error) throw error;
      return data as unknown as JobsResponse;
    },
  });
  const jobs = useMemo(() => query.data?.items ?? [], [query.data]);
  useEffect(() => {
    if (!jobs.length) return setSelectedJobId(undefined);
    if (!selectedJobId || !jobs.some((job) => job.id === selectedJobId)) setSelectedJobId(jobs[0].id);
  }, [jobs, selectedJobId]);
  const selectedJob = jobs.find((job) => job.id === selectedJobId);
  const approvedCategories = categories.data?.filter((category) => !query.data || query.data.approved_category_ids.includes(category.id)) ?? [];
  const center = query.data?.search_origin ?? { latitude: 31.5204, longitude: 74.3587 };
  const updatePresence = async (nextAvailable: boolean) => {
    setUpdatingPresence(true);
    setPresenceMessage(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setAvailable(false);
        setPresenceMessage(i18n.t('experience.provider.locationRequired'));
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { error } = await typedApi.PUT('/api/v2/provider/location', { body: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy_m: position.coords.accuracy ?? null,
        captured_at: new Date(position.timestamp).toISOString(),
        is_available: nextAvailable,
        service_radius_km: radiusKm,
      } });
      if (error) throw error;
      setAvailable(nextAvailable);
      setPresenceMessage(nextAvailable ? i18n.t('experience.provider.visible') : i18n.t('experience.provider.pausedMessage'));
      await query.refetch();
    } catch {
      setPresenceMessage(i18n.t('experience.provider.locationFailed'));
    } finally {
      setUpdatingPresence(false);
    }
  };
  useEffect(() => {
    if (!available) return;
    const heartbeat = async () => {
      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) return;
      const position = await Location.getLastKnownPositionAsync({ maxAge: 180_000, requiredAccuracy: 2_000 });
      if (!position) return;
      await typedApi.PUT('/api/v2/provider/location', { body: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy_m: position.coords.accuracy ?? null,
        captured_at: new Date(position.timestamp).toISOString(),
        is_available: true,
        service_radius_km: radiusKm,
      } });
    };
    const interval = setInterval(() => void heartbeat(), 120_000);
    return () => clearInterval(interval);
  }, [available, radiusKm]);
  return (
    <Screen>
      <FadeIn>
        <View style={styles.topline}><Badge label={available ? i18n.t('experience.provider.available') : i18n.t('experience.provider.paused')} variant={available ? 'success' : 'neutral'} /><Text style={styles.liveText}>{i18n.t('experience.provider.live')}</Text></View>
        <Text style={styles.title}>{i18n.t('experience.provider.nearby')}</Text>
        <Text style={styles.subtitle}>{i18n.t('experience.provider.subtitle')}</Text>
      </FadeIn>
      <Card variant="glass" style={styles.presenceCard}>
        <View style={styles.presenceRow}><View style={{ flex: 1 }}><Text style={styles.presenceTitle}>{i18n.t('experience.provider.availableForWork')}</Text><Text style={styles.presenceCopy}>{i18n.t('experience.provider.presenceCopy')}</Text></View><Switch accessibilityLabel={i18n.t('experience.provider.availabilityLabel')} value={available} disabled={updatingPresence} onValueChange={(value) => void updatePresence(value)} trackColor={{ false: Theme.colors.border, true: Theme.colors.primaryLight }} /></View>
        <Button title={updatingPresence ? i18n.t('experience.provider.updatingLocation') : i18n.t('experience.provider.updateLocation')} type="outline" icon={<LocateFixed size={17} color={Theme.colors.primary} />} loading={updatingPresence} onPress={() => void updatePresence(available)} />
        {!!presenceMessage && <Text accessibilityRole="alert" style={styles.presenceMessage}>{presenceMessage}</Text>}
      </Card>
      <View style={styles.filters}>
        <Text style={styles.filterLabel}>{i18n.t('experience.provider.radius')}</Text>
        <View style={styles.radiusRow}>{[5, 12, 25, 50].map((value) => <TactilePressable key={value} accessibilityRole="button" accessibilityLabel={i18n.t('experience.provider.radiusA11y', { count: value })} accessibilityState={{ selected: radiusKm === value }} onPress={() => { setRadiusKm(value); void trackEvent('provider_feed', { outcome: 'radius_changed', radius_km: value, result_count: jobs.length }); }} style={[styles.radiusChip, radiusKm === value && styles.radiusChipActive]}><Text style={[styles.radiusText, radiusKm === value && styles.radiusTextActive]}>{value} km</Text></TactilePressable>)}</View>
        <Text style={styles.filterLabel}>{i18n.t('experience.provider.approvedServices')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsWrap}>
          <TactilePressable accessibilityRole="button" accessibilityLabel={i18n.t('experience.provider.allA11y')} accessibilityState={{ selected: !categoryId }} onPress={() => setCategoryId('')} style={styles.chipPressable}>
            <Badge label={i18n.t('experience.provider.all')} variant={categoryId ? 'neutral' : 'success'} />
          </TactilePressable>
          {approvedCategories.map((category) => (
            <TactilePressable accessibilityRole="button" accessibilityLabel={categoryLabel(category)} accessibilityState={{ selected: categoryId === category.id }} key={category.id} onPress={() => setCategoryId(category.id === categoryId ? '' : category.id)} style={styles.chipPressable}>
              <Badge label={categoryLabel(category)} variant={categoryId === category.id ? 'success' : 'neutral'} />
            </TactilePressable>
          ))}
        </ScrollView>
        <View accessibilityRole="tablist" style={styles.viewSwitch}>
          <TactilePressable accessibilityRole="tab" accessibilityState={{ selected: viewMode === 'map' }} onPress={() => setViewMode('map')} style={[styles.viewOption, viewMode === 'map' && styles.viewOptionActive]}>
            <Map size={16} color={viewMode === 'map' ? Theme.colors.textOnPrimary : Theme.colors.textSecondary} />
            <Text style={[styles.viewText, viewMode === 'map' && styles.viewTextActive]}>{i18n.t('experience.provider.map')}</Text>
          </TactilePressable>
          <TactilePressable accessibilityRole="tab" accessibilityState={{ selected: viewMode === 'list' }} onPress={() => setViewMode('list')} style={[styles.viewOption, viewMode === 'list' && styles.viewOptionActive]}>
            <List size={16} color={viewMode === 'list' ? Theme.colors.textOnPrimary : Theme.colors.textSecondary} />
            <Text style={[styles.viewText, viewMode === 'list' && styles.viewTextActive]}>{i18n.t('experience.provider.list')}</Text>
          </TactilePressable>
        </View>
      </View>
      {viewMode === 'map' ? (
        <FadeIn delay={60}>
          <View style={styles.mapWrap}>
            <DynamicMap
              center={center}
              height={430}
              markers={[
                { id: '__provider_origin__', ...center, title: i18n.t('experience.provider.origin'), variant: 'origin' },
                ...jobs.map((job) => ({ id: job.id, latitude: job.approximate_latitude, longitude: job.approximate_longitude, title: `${job.title}, ${job.approximate_area}`, label: compactBudget(job.budget_paisa), variant: 'task' as const })),
              ]}
              mode="markers"
              onMarkerPress={(id) => id !== '__provider_origin__' && setSelectedJobId(id)}
              selectedMarkerId={selectedJobId}
              zoom={radiusKm > 25 ? 9 : radiusKm > 12 ? 10 : 11.5}
            />
            <Text style={styles.privacyNote}>{i18n.t('experience.provider.privacy')}</Text>
          </View>
          {selectedJob && (
            <Card elevation="md" style={styles.selectedCard}>
              <View style={styles.cardTop}><Badge label={i18n.t('experience.provider.away', { distance: selectedJob.distance_km })} variant="success" /><Text style={styles.money}>{formatPkr(selectedJob.budget_paisa)}</Text></View>
              <Text style={styles.jobTitle}>{selectedJob.title}</Text>
              <Text numberOfLines={2} style={styles.description}>{selectedJob.description}</Text>
              <View style={styles.meta}><MapPin size={15} color={Theme.colors.textTertiary} /><Text style={styles.metaText}>{selectedJob.approximate_area}</Text></View>
              <Text style={styles.scoreText}>{i18n.t(`experience.provider.reasons.${selectedJob.match_reason_code}`, { defaultValue: selectedJob.match_reason })}</Text>
              <Button title={i18n.t('experience.provider.viewBid')} onPress={() => router.push(`/provider/job/${selectedJob.id}` as Href)} style={styles.viewTaskButton} />
            </Card>
          )}
          {query.isLoading && <StateView title={i18n.t('experience.provider.finding')} loading />}
          {query.isError && <Card variant="tinted" style={styles.recoveryCard}><EmptyState icon={LocateFixed} title={i18n.t('experience.provider.noFeed')} detail={i18n.t('experience.provider.noFeedDetail')} /><Button title={i18n.t('experience.provider.retryLocation')} onPress={() => void updatePresence(true)} /></Card>}
          {!query.isLoading && !query.isError && !jobs.length && <Card variant="tinted" style={styles.recoveryCard}><EmptyState icon={BriefcaseBusiness} title={i18n.t('experience.provider.noMatches')} detail={i18n.t('experience.provider.noMatchesDetail')} /><View style={styles.recoveryActions}><Button title={i18n.t('experience.provider.expand')} type="outline" onPress={() => setRadiusKm(25)} style={styles.actionFlex} /><Button title={i18n.t('experience.provider.refresh')} onPress={() => void query.refetch()} style={styles.actionFlex} /></View></Card>}
        </FadeIn>
      ) : jobs.length ? jobs.map((job, index) => (
        <FadeIn key={job.id} delay={60 + index * 45}>
          <Card elevation="md" onPress={() => router.push(`/provider/job/${job.id}` as Href)} style={styles.jobCard}>
            <View style={styles.cardTop}><View style={styles.jobIcon}><BriefcaseBusiness color={Theme.colors.primary} size={21} /></View><Text style={styles.money}>{formatPkr(job.budget_paisa)}</Text></View>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text numberOfLines={2} style={styles.description}>{job.description}</Text>
            <View style={styles.metaRow}><View style={styles.meta}><MapPin size={15} color={Theme.colors.textTertiary} /><Text style={styles.metaText}>{job.approximate_area}</Text></View><View style={styles.meta}><Navigation size={14} color={Theme.colors.textTertiary} /><Text style={styles.metaText}>{job.distance_km} km</Text></View></View>
            <View style={styles.scoreRow}><Search size={14} color={Theme.colors.primary} /><Text style={styles.scoreText}>{i18n.t(`experience.provider.reasons.${job.match_reason_code}`, { defaultValue: job.match_reason })}</Text></View>
            <Text style={styles.responseCount}>{job.active_bid_count ? i18n.t(job.active_bid_count === 1 ? 'experience.provider.offers' : 'experience.provider.offers_plural', { count: job.active_bid_count }) : i18n.t('experience.provider.first')}</Text>
            <View style={styles.expiry}><Clock3 size={14} color={Theme.colors.warning} /><Text style={styles.expiryText}>{i18n.t('experience.provider.limited')}</Text></View>
          </Card>
        </FadeIn>
      )) : query.isLoading ? <StateView title={i18n.t('experience.provider.finding')} loading /> : query.isError ? <StateView title={i18n.t('experience.provider.feedUnavailable')} detail={i18n.t('experience.provider.retryLocation')} onRetry={() => void updatePresence(true)} /> : <EmptyState icon={BriefcaseBusiness} title={i18n.t('experience.provider.noMatches')} detail={i18n.t('experience.provider.noMatchesDetail')} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topline: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm, marginBottom: Theme.spacing.md },
  liveText: { ...Theme.typography.caption, color: Theme.colors.textTertiary },
  title: { ...Theme.typography.display, color: Theme.colors.textPrimary },
  subtitle: { ...Theme.typography.body, color: Theme.colors.textSecondary, marginTop: Theme.spacing.xs, marginBottom: Theme.spacing.xl },
  presenceCard: { marginBottom: Theme.spacing.lg },
  presenceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Theme.spacing.md },
  presenceTitle: { ...Theme.typography.h3, color: Theme.colors.textPrimary },
  presenceCopy: { ...Theme.typography.caption, color: Theme.colors.textSecondary, marginTop: 3, paddingRight: Theme.spacing.md },
  presenceMessage: { ...Theme.typography.caption, color: Theme.colors.primary, marginTop: Theme.spacing.sm },
  jobCard: { padding: Theme.spacing.xl },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filters: { marginBottom: Theme.spacing.md, gap: Theme.spacing.md },
  filterLabel: { ...Theme.typography.overline, color: Theme.colors.textTertiary },
  radiusRow: { flexDirection: 'row', gap: Theme.spacing.sm, flexWrap: 'wrap' },
  radiusChip: { minHeight: 44, minWidth: 68, borderRadius: Theme.radius.full, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Theme.spacing.md },
  radiusChipActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  radiusText: { ...Theme.typography.caption, color: Theme.colors.textSecondary, fontWeight: '700' },
  radiusTextActive: { color: Theme.colors.white },
  viewSwitch: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: Theme.colors.surfaceMuted, borderRadius: Theme.radius.full, padding: 4, gap: 3 },
  viewOption: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 15, paddingVertical: 9, borderRadius: Theme.radius.full },
  viewOptionActive: { backgroundColor: Theme.colors.primary },
  viewText: { ...Theme.typography.caption, color: Theme.colors.textSecondary, fontWeight: '700' },
  viewTextActive: { color: Theme.colors.textOnPrimary },
  chipsWrap: { flexDirection: 'row', gap: Theme.spacing.xs, paddingRight: Theme.spacing.xl },
  chipPressable: { borderRadius: Theme.radius.full },
  jobIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: Theme.colors.primaryMist, alignItems: 'center', justifyContent: 'center' },
  money: { ...Theme.typography.h3, color: Theme.colors.moneyGreen },
  jobTitle: { ...Theme.typography.h3, color: Theme.colors.textPrimary, marginTop: Theme.spacing.lg },
  description: { ...Theme.typography.bodySmall, color: Theme.colors.textSecondary, marginTop: Theme.spacing.xs },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.lg, marginTop: Theme.spacing.lg },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xs },
  metaText: { ...Theme.typography.caption, color: Theme.colors.textSecondary },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xs, marginTop: Theme.spacing.xs },
  scoreText: { ...Theme.typography.caption, color: Theme.colors.primary, fontWeight: '600' },
  mapWrap: { marginBottom: Theme.spacing.md },
  privacyNote: { ...Theme.typography.caption, color: Theme.colors.textTertiary, marginTop: Theme.spacing.sm },
  selectedCard: { padding: Theme.spacing.xl, marginBottom: Theme.spacing.md },
  viewTaskButton: { marginTop: Theme.spacing.lg },
  responseCount: { ...Theme.typography.caption, color: Theme.colors.textTertiary, marginTop: 3 },
  expiry: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xs, marginTop: Theme.spacing.lg, paddingTop: Theme.spacing.md, borderTopWidth: 1, borderTopColor: Theme.colors.divider },
  expiryText: { ...Theme.typography.caption, color: Theme.colors.textSecondary },
  recoveryCard: { marginTop: Theme.spacing.md },
  recoveryActions: { flexDirection: 'row', gap: Theme.spacing.sm, marginTop: Theme.spacing.md },
  actionFlex: { flex: 1 },
});
