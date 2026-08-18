import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { BriefcaseBusiness, Clock3, MapPin, Navigation } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Badge from '../../../src/components/Badge';
import Card from '../../../src/components/Card';
import EmptyState from '../../../src/components/EmptyState';
import { FadeIn } from '../../../src/components/Motion';
import { Screen, StateView } from '../../../src/components/Screen';
import { typedApi } from '../../../src/services/api';
import { Theme } from '../../../src/styles/theme';
import { formatPkr } from '../../../src/utils/format';

type Job = { id: string; title: string; description: string; budget_paisa: number | null; approximate_area: string; distance_km: number; expires_at: string };

export default function JobsScreen() {
  const query = useQuery({ queryKey: ['provider-jobs'], queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/jobs'); if (error) throw error; return ((data as { items?: Job[] })?.items ?? []); } });
  if (query.isLoading) return <StateView title="Finding nearby work…" loading />;
  if (query.isError) return <StateView title="Jobs unavailable" detail="Make sure location and availability are enabled." onRetry={() => query.refetch()} />;
  return (
    <Screen>
      <FadeIn>
        <View style={styles.topline}><Badge label="Available" variant="success" /><Text style={styles.liveText}>Live opportunities</Text></View>
        <Text style={styles.title}>Nearby work</Text>
        <Text style={styles.subtitle}>New tasks matched to your verified services and area.</Text>
      </FadeIn>
      {query.data?.length ? query.data.map((job, index) => (
        <FadeIn key={job.id} delay={60 + index * 45}>
          <Card elevation="md" onPress={() => router.push({ pathname: '/(provider)/job/[id]', params: { id: job.id } })} style={styles.jobCard}>
            <View style={styles.cardTop}><View style={styles.jobIcon}><BriefcaseBusiness color={Theme.colors.primary} size={21} /></View><Text style={styles.money}>{formatPkr(job.budget_paisa)}</Text></View>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text numberOfLines={2} style={styles.description}>{job.description}</Text>
            <View style={styles.metaRow}><View style={styles.meta}><MapPin size={15} color={Theme.colors.textTertiary} /><Text style={styles.metaText}>{job.approximate_area}</Text></View><View style={styles.meta}><Navigation size={14} color={Theme.colors.textTertiary} /><Text style={styles.metaText}>{job.distance_km} km</Text></View></View>
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
  jobIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: Theme.colors.primaryMist, alignItems: 'center', justifyContent: 'center' },
  money: { ...Theme.typography.h3, color: Theme.colors.moneyGreen },
  jobTitle: { ...Theme.typography.h3, color: Theme.colors.textPrimary, marginTop: Theme.spacing.lg },
  description: { ...Theme.typography.bodySmall, color: Theme.colors.textSecondary, marginTop: Theme.spacing.xs },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.lg, marginTop: Theme.spacing.lg },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xs },
  metaText: { ...Theme.typography.caption, color: Theme.colors.textSecondary },
  expiry: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xs, marginTop: Theme.spacing.lg, paddingTop: Theme.spacing.md, borderTopWidth: 1, borderTopColor: Theme.colors.divider },
  expiryText: { ...Theme.typography.caption, color: Theme.colors.textSecondary },
});
