import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { BriefcaseBusiness, Clock3, List, Map, MapPin, Navigation, Search } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Badge from '../../../src/components/Badge';
import Input from '../../../src/components/Input';
import Card from '../../../src/components/Card';
import Button from '../../../src/components/Button';
import DynamicMap from '../../../src/components/maps/DynamicMap';
import EmptyState from '../../../src/components/EmptyState';
import { FadeIn } from '../../../src/components/Motion';
import TactilePressable from '../../../src/components/TactilePressable';
import { Screen, StateView } from '../../../src/components/Screen';
import { typedApi } from '../../../src/services/api';
import { Theme } from '../../../src/styles/theme';
import { formatPkr } from '../../../src/utils/format';

type Category = { id: string; name_en: string };
type Job = { id: string; title: string; description: string; budget_paisa: number | null; approximate_area: string; approximate_latitude: number; approximate_longitude: number; distance_km: number; expires_at: string; score: number; match_reason: string; matching_model: string; active_bid_count: number };
type JobsResponse = { items: Job[]; search_origin: { latitude: number; longitude: number }; radius_km: number };

function compactBudget(value: number | null) {
  if (value == null) return 'Open';
  const rupees = value / 100;
  return rupees >= 1000 ? `Rs ${(rupees / 1000).toFixed(rupees >= 10_000 ? 0 : 1)}k` : `Rs ${Math.round(rupees)}`;
}

export default function JobsScreen() {
  const [categoryId, setCategoryId] = useState('');
  const [radiusKm, setRadiusKm] = useState('12');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(searchTerm), 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await typedApi.GET('/api/v2/categories');
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });
  const query = useQuery({
    queryKey: ['provider-jobs', categoryId, radiusKm, searchDebounced],
    queryFn: async () => {
      const requestRadius = Number(radiusKm);
      const params: { category_id?: string; radius_km?: number; search?: string } = {};
      if (categoryId) params.category_id = categoryId;
      if (Number.isFinite(requestRadius) && requestRadius >= 1) params.radius_km = requestRadius;
      if (searchDebounced.trim()) params.search = searchDebounced.trim();
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
  if (query.isLoading) return <StateView title="Finding nearby work…" loading />;
  if (query.isError) return <StateView title="Jobs unavailable" detail="Make sure location and availability are enabled." onRetry={() => query.refetch()} />;
  if (!categories.data?.length) return <StateView title="Categories unavailable" detail="Try again after refreshing." onRetry={() => categories.refetch()} />;
  return (
    <Screen>
      <FadeIn>
        <View style={styles.topline}><Badge label="Available" variant="success" /><Text style={styles.liveText}>Live opportunities</Text></View>
        <Text style={styles.title}>Nearby work</Text>
        <Text style={styles.subtitle}>New tasks matched to your verified services and area.</Text>
      </FadeIn>
      <View style={styles.filters}>
        <Input
          label="Area / locality"
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder='Try "DHA" or "Gulshan"'
          autoCorrect={false}
        />
        <Input
          label="Radius (km)"
          keyboardType="number-pad"
          value={radiusKm}
          onChangeText={(value) => setRadiusKm(value.replace(/\D/g, '').slice(0, 3))}
          placeholder="10"
          maxLength={3}
        />
        <View style={styles.chipsWrap}>
          <TactilePressable onPress={() => setCategoryId('')} style={styles.chipPressable}>
            <Badge label="All" variant={categoryId ? 'neutral' : 'success'} />
          </TactilePressable>
          {categories.data?.map((category) => (
            <TactilePressable key={category.id} onPress={() => setCategoryId(category.id === categoryId ? '' : category.id)} style={styles.chipPressable}>
              <Badge label={category.name_en} variant={categoryId === category.id ? 'success' : 'neutral'} />
            </TactilePressable>
          ))}
        </View>
        <View accessibilityRole="tablist" style={styles.viewSwitch}>
          <TactilePressable accessibilityRole="tab" accessibilityState={{ selected: viewMode === 'map' }} onPress={() => setViewMode('map')} style={[styles.viewOption, viewMode === 'map' && styles.viewOptionActive]}>
            <Map size={16} color={viewMode === 'map' ? Theme.colors.textOnPrimary : Theme.colors.textSecondary} />
            <Text style={[styles.viewText, viewMode === 'map' && styles.viewTextActive]}>Map</Text>
          </TactilePressable>
          <TactilePressable accessibilityRole="tab" accessibilityState={{ selected: viewMode === 'list' }} onPress={() => setViewMode('list')} style={[styles.viewOption, viewMode === 'list' && styles.viewOptionActive]}>
            <List size={16} color={viewMode === 'list' ? Theme.colors.textOnPrimary : Theme.colors.textSecondary} />
            <Text style={[styles.viewText, viewMode === 'list' && styles.viewTextActive]}>List</Text>
          </TactilePressable>
        </View>
      </View>
      {jobs.length && query.data && viewMode === 'map' ? (
        <FadeIn delay={60}>
          <View style={styles.mapWrap}>
            <DynamicMap
              center={query.data.search_origin}
              height={430}
              markers={[
                { id: '__provider_origin__', ...query.data.search_origin, title: 'Your service location', variant: 'origin' },
                ...jobs.map((job) => ({ id: job.id, latitude: job.approximate_latitude, longitude: job.approximate_longitude, title: `${job.title}, ${job.approximate_area}`, label: compactBudget(job.budget_paisa), variant: 'task' as const })),
              ]}
              mode="markers"
              onMarkerPress={(id) => id !== '__provider_origin__' && setSelectedJobId(id)}
              selectedMarkerId={selectedJobId}
              zoom={query.data.radius_km > 25 ? 9 : query.data.radius_km > 12 ? 10 : 11.5}
            />
            <Text style={styles.privacyNote}>Pins show approximate localities. Exact customer locations stay private until selection.</Text>
          </View>
          {selectedJob && (
            <Card elevation="md" style={styles.selectedCard}>
              <View style={styles.cardTop}><Badge label={`${selectedJob.distance_km} km away`} variant="success" /><Text style={styles.money}>{formatPkr(selectedJob.budget_paisa)}</Text></View>
              <Text style={styles.jobTitle}>{selectedJob.title}</Text>
              <Text numberOfLines={2} style={styles.description}>{selectedJob.description}</Text>
              <View style={styles.meta}><MapPin size={15} color={Theme.colors.textTertiary} /><Text style={styles.metaText}>{selectedJob.approximate_area}</Text></View>
              <Text style={styles.scoreText}>{selectedJob.match_reason}</Text>
              <Button title="View task & quick bid" onPress={() => router.push(`/provider/job/${selectedJob.id}` as Href)} style={styles.viewTaskButton} />
            </Card>
          )}
        </FadeIn>
      ) : jobs.length ? jobs.map((job, index) => (
        <FadeIn key={job.id} delay={60 + index * 45}>
          <Card elevation="md" onPress={() => router.push(`/provider/job/${job.id}` as Href)} style={styles.jobCard}>
            <View style={styles.cardTop}><View style={styles.jobIcon}><BriefcaseBusiness color={Theme.colors.primary} size={21} /></View><Text style={styles.money}>{formatPkr(job.budget_paisa)}</Text></View>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text numberOfLines={2} style={styles.description}>{job.description}</Text>
            <View style={styles.metaRow}><View style={styles.meta}><MapPin size={15} color={Theme.colors.textTertiary} /><Text style={styles.metaText}>{job.approximate_area}</Text></View><View style={styles.meta}><Navigation size={14} color={Theme.colors.textTertiary} /><Text style={styles.metaText}>{job.distance_km} km</Text></View></View>
            <View style={styles.scoreRow}><Search size={14} color={Theme.colors.primary} /><Text style={styles.scoreText}>{job.match_reason}</Text></View>
            <Text style={styles.responseCount}>{job.active_bid_count ? `${job.active_bid_count} active offer${job.active_bid_count === 1 ? '' : 's'}` : 'Be the first provider to respond'}</Text>
            <View style={styles.expiry}><Clock3 size={14} color={Theme.colors.warning} /><Text style={styles.expiryText}>Open for a limited time</Text></View>
          </Card>
        </FadeIn>
      )) : <EmptyState icon={BriefcaseBusiness} title="No matching tasks nearby" detail="Keep availability on. Fresh opportunities will appear here automatically." />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topline: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm, marginBottom: Theme.spacing.md },
  liveText: { ...Theme.typography.caption, color: Theme.colors.textTertiary },
  title: { ...Theme.typography.display, color: Theme.colors.textPrimary },
  subtitle: { ...Theme.typography.body, color: Theme.colors.textSecondary, marginTop: Theme.spacing.xs, marginBottom: Theme.spacing.xl },
  jobCard: { padding: Theme.spacing.xl },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filters: { marginBottom: Theme.spacing.md, gap: Theme.spacing.md },
  viewSwitch: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: Theme.colors.surfaceMuted, borderRadius: Theme.radius.full, padding: 4, gap: 3 },
  viewOption: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 15, paddingVertical: 9, borderRadius: Theme.radius.full },
  viewOptionActive: { backgroundColor: Theme.colors.primary },
  viewText: { ...Theme.typography.caption, color: Theme.colors.textSecondary, fontWeight: '700' },
  viewTextActive: { color: Theme.colors.textOnPrimary },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.xs },
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
});
