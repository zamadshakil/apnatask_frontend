import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { BriefcaseBusiness, Clock3, MapPin, Navigation, Search } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Badge from '../../../src/components/Badge';
import Input from '../../../src/components/Input';
import Card from '../../../src/components/Card';
import EmptyState from '../../../src/components/EmptyState';
import { FadeIn } from '../../../src/components/Motion';
import TactilePressable from '../../../src/components/TactilePressable';
import { Screen, StateView } from '../../../src/components/Screen';
import { typedApi } from '../../../src/services/api';
import { Theme } from '../../../src/styles/theme';
import { formatPkr } from '../../../src/utils/format';

type Category = { id: string; name_en: string };
type Job = { id: string; title: string; description: string; budget_paisa: number | null; approximate_area: string; distance_km: number; expires_at: string };

export default function JobsScreen() {
  const [categoryId, setCategoryId] = useState('');
  const [radiusKm, setRadiusKm] = useState('12');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

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
      return ((data as { items?: Job[] })?.items ?? []);
    },
  });
  const jobs = useMemo(() => query.data ?? [], [query.data]);
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
      </View>
      {jobs.length ? jobs.map((job, index) => (
        <FadeIn key={job.id} delay={60 + index * 45}>
          <Card elevation="md" onPress={() => router.push({ pathname: '/(provider)/job/[id]', params: { id: job.id } })} style={styles.jobCard}>
            <View style={styles.cardTop}><View style={styles.jobIcon}><BriefcaseBusiness color={Theme.colors.primary} size={21} /></View><Text style={styles.money}>{formatPkr(job.budget_paisa)}</Text></View>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text numberOfLines={2} style={styles.description}>{job.description}</Text>
            <View style={styles.metaRow}><View style={styles.meta}><MapPin size={15} color={Theme.colors.textTertiary} /><Text style={styles.metaText}>{job.approximate_area}</Text></View><View style={styles.meta}><Navigation size={14} color={Theme.colors.textTertiary} /><Text style={styles.metaText}>{job.distance_km} km</Text></View></View>
            <View style={styles.scoreRow}><Search size={14} color={Theme.colors.textTertiary} /><Text style={styles.scoreText}>Priority score: {Math.round(((job as { score?: number }).score ?? 0) * 100) / 100}</Text></View>
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
  scoreText: { ...Theme.typography.caption, color: Theme.colors.textTertiary },
  expiry: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xs, marginTop: Theme.spacing.lg, paddingTop: Theme.spacing.md, borderTopWidth: 1, borderTopColor: Theme.colors.divider },
  expiryText: { ...Theme.typography.caption, color: Theme.colors.textSecondary },
});
