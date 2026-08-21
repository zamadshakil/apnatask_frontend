import type { components } from '../../../src/api/schema';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { router, useLocalSearchParams } from 'expo-router';
import { Clock3, MapPin, MessageCircleMore, ShieldCheck, Star, WalletCards } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Badge from '../../../src/components/Badge';
import Button from '../../../src/components/Button';
import Card from '../../../src/components/Card';
import EmptyState from '../../../src/components/EmptyState';
import Input from '../../../src/components/Input';
import { FadeIn } from '../../../src/components/Motion';
import { Screen, StateView } from '../../../src/components/Screen';
import SectionHeader from '../../../src/components/SectionHeader';
import TactilePressable from '../../../src/components/TactilePressable';
import { createIdempotencyKey, typedApi } from '../../../src/services/api';
import { Theme } from '../../../src/styles/theme';
import { formatPkr } from '../../../src/utils/format';

type Bid = components['schemas']['BidResponse'];
const statusVariant = (status: string): 'success' | 'warning' | 'info' | 'neutral' => status === 'open' || status === 'completed' ? 'success' : status === 'in_progress' || status === 'en_route' ? 'info' : status === 'completion_requested' ? 'warning' : 'neutral';

function InfoRow({ icon: Icon, label, value, emphasized }: { icon: React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>; label: string; value: string; emphasized?: boolean }) {
  return <View style={styles.infoRow}><View style={styles.infoIcon}><Icon color={Theme.colors.primary} size={20} strokeWidth={1.9} /></View><View style={styles.infoText}><Text style={styles.infoLabel}>{label}</Text><Text style={[styles.infoValue, emphasized && styles.emphasized]}>{value}</Text></View></View>;
}

export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cache = useQueryClient();
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(5);
  const task = useQuery({ queryKey: ['booking', id], queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/bookings/{booking_id}', { params: { path: { booking_id: id } } }); if (error || !data) throw error; return data; } });
  const bids = useQuery({ queryKey: ['booking-bids', id], enabled: task.data?.status === 'open', queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/bookings/{booking_id}/bids', { params: { path: { booking_id: id } } }); if (error) throw error; return (data ?? []) as Bid[]; } });
  const accept = async (bid: Bid) => { const { data, error } = await typedApi.POST('/api/v2/bookings/{booking_id}/bids/{bid_id}/accept', { params: { path: { booking_id: id, bid_id: bid.id } }, headers: { 'Idempotency-Key': createIdempotencyKey() } }); if (error || !data) return Alert.alert('Could not select provider', 'The task may already have changed. Refresh and retry.'); const result = data as { completion_code?: string }; if (result.completion_code) { await SecureStore.setItemAsync(`completion.${id}`, result.completion_code); Alert.alert('Provider selected', `Your completion code is ${result.completion_code}. Only share it after the work is finished.`); } await cache.invalidateQueries({ queryKey: ['booking', id] }); };
  const confirmCompletion = async () => { const code = await SecureStore.getItemAsync(`completion.${id}`); if (!code) return Alert.alert('Completion code unavailable', 'Contact support for an auditable override.'); const { error } = await typedApi.POST('/api/v2/bookings/{booking_id}/transition', { params: { path: { booking_id: id } }, headers: { 'Idempotency-Key': createIdempotencyKey() }, body: { action: 'confirm_completion', completion_code: code } }); if (error) return Alert.alert('Could not complete task', 'The code was rejected or task status changed.'); await cache.invalidateQueries({ queryKey: ['booking', id] }); };
  const submitReview = async () => { const { error } = await typedApi.POST('/api/v2/bookings/{booking_id}/reviews', { params: { path: { booking_id: id } }, headers: { 'Idempotency-Key': createIdempotencyKey() }, body: { rating, comment: review.trim() || null } }); Alert.alert(error ? 'Review not submitted' : 'Thank you', error ? 'A review may already exist.' : 'Your verified-work review is published.'); };
  if (task.isLoading) return <StateView title="Loading task…" loading />;
  if (task.isError || !task.data) return <StateView title="Task unavailable" onRetry={() => task.refetch()} />;
  const value = task.data;
  const address = value.exact_address ? `${value.exact_address.address_line}, ${value.exact_address.city}` : 'Private until you select a provider';

  return <Screen topInset={false}>
    <FadeIn>
      <View style={styles.titleRow}><Text style={styles.eyebrow}>YOUR TASK</Text><Badge label={value.status.replaceAll('_', ' ')} variant={statusVariant(value.status)} size="md" /></View>
      <Text style={styles.title}>{value.title}</Text>
      <Text style={styles.description}>{value.description}</Text>
    </FadeIn>

    <FadeIn delay={70}>
      <Card elevation="md" style={styles.infoCard}>
        <InfoRow icon={MapPin} label="Locality" value={value.approximate_area} />
        <View style={styles.divider} />
        <InfoRow icon={WalletCards} label="Customer budget" value={formatPkr(value.budget_paisa)} emphasized />
        <View style={styles.divider} />
        <InfoRow icon={ShieldCheck} label="Exact address" value={address} />
      </Card>
    </FadeIn>

    {value.status === 'open' && <FadeIn delay={120}>
      <SectionHeader title="Provider offers" detail="Private offers from KYC-reviewed providers." />
      {bids.isLoading ? <StateView title="Checking offers…" loading /> : bids.data?.length ? bids.data.map((bid) => <Card key={bid.id} elevation="md" style={styles.bidCard}><View style={styles.bidTop}><View><Text style={styles.bidLabel}>{bid.provider_display_name}</Text><Text style={styles.bidAmount}>{formatPkr(bid.amount_paisa)}</Text></View><View style={styles.verified}><ShieldCheck color={Theme.colors.primary} size={18} /><Text style={styles.verifiedText}>KYC reviewed</Text></View></View><View style={styles.reputation}><Star color={Theme.colors.warning} fill={Theme.colors.warning} size={16} /><Text style={styles.reputationText}>{bid.provider_rating_count ? `${bid.provider_rating_average.toFixed(1)} · ${bid.provider_rating_count} review${bid.provider_rating_count === 1 ? '' : 's'}` : 'New provider'} · {bid.provider_completed_jobs} completed</Text></View>{bid.note && <Text style={styles.bidNote}>{bid.note}</Text>}<View style={styles.bidActions}><Button title="Message" type="outline" style={styles.bidAction} onPress={() => router.push({ pathname: '/(customer)/thread/[id]', params: { id: bid.thread_id } })} /><Button title="Select provider" style={styles.bidAction} onPress={() => void accept(bid)} /></View></Card>) : <Card variant="glass" style={styles.emptyCard}><EmptyState icon={MessageCircleMore} title="No offers yet" detail="Verified providers nearby can still submit an offer until this task expires." /></Card>}
    </FadeIn>}

    {value.status === 'completion_requested' && <Card variant="tinted" elevation="md"><View style={styles.actionIcon}><Clock3 color={Theme.colors.primary} /></View><Text style={styles.actionTitle}>Is the work finished?</Text><Text style={styles.actionCopy}>Confirm only after checking the work. Payment is cash directly to the provider.</Text><Button title="Confirm completion" onPress={() => void confirmCompletion()} /></Card>}
    {value.status === 'completed' && <Card elevation="md"><Text style={styles.actionTitle}>Review completed work</Text><Text style={styles.actionCopy}>Your review is tied to verified completed work.</Text><View accessibilityRole="radiogroup" style={styles.rating}>{[1, 2, 3, 4, 5].map((value) => <TactilePressable key={value} onPress={() => setRating(value)} accessibilityRole="radio" accessibilityState={{ checked: rating === value }}><Star color={Theme.colors.warning} fill={value <= rating ? Theme.colors.warning : 'transparent'} size={31} /></TactilePressable>)}</View><Input label="Comment (optional)" value={review} onChangeText={setReview} multiline /><Button title={`Submit ${rating}-star review`} onPress={() => void submitReview()} /></Card>}
  </Screen>;
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Theme.spacing.md, marginBottom: Theme.spacing.md },
  eyebrow: { ...Theme.typography.overline, color: Theme.colors.primary },
  title: { ...Theme.typography.display, color: Theme.colors.textPrimary, maxWidth: 620 },
  description: { ...Theme.typography.body, color: Theme.colors.textSecondary, marginTop: Theme.spacing.md, maxWidth: 620 },
  infoCard: { marginTop: Theme.spacing.xxl, paddingVertical: Theme.spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Theme.spacing.md },
  infoIcon: { width: 43, height: 43, borderRadius: 15, backgroundColor: Theme.colors.primaryMist, alignItems: 'center', justifyContent: 'center', marginRight: Theme.spacing.md },
  infoText: { flex: 1 },
  infoLabel: { ...Theme.typography.caption, color: Theme.colors.textTertiary },
  infoValue: { ...Theme.typography.body, color: Theme.colors.textPrimary, marginTop: 2 },
  emphasized: { color: Theme.colors.moneyGreen, fontSize: 21, lineHeight: 27, fontWeight: '700' },
  divider: { height: 1, backgroundColor: Theme.colors.divider, marginLeft: 56 },
  bidCard: { marginBottom: Theme.spacing.md },
  bidTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.md },
  bidLabel: { ...Theme.typography.overline, color: Theme.colors.textTertiary },
  bidAmount: { fontSize: 27, lineHeight: 33, fontWeight: '700', letterSpacing: -0.6, color: Theme.colors.moneyGreen, marginTop: 4 },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Theme.colors.primaryMist, borderRadius: Theme.radius.full, paddingHorizontal: 10, paddingVertical: 6 },
  verifiedText: { ...Theme.typography.metadata, color: Theme.colors.primary },
  bidNote: { ...Theme.typography.body, color: Theme.colors.textSecondary, marginBottom: Theme.spacing.lg },
  reputation: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xs, marginBottom: Theme.spacing.md },
  reputationText: { ...Theme.typography.caption, color: Theme.colors.textSecondary },
  bidActions: { flexDirection: 'row', gap: Theme.spacing.sm },
  bidAction: { flex: 1 },
  rating: { flexDirection: 'row', gap: Theme.spacing.sm, marginBottom: Theme.spacing.lg },
  emptyCard: { padding: 0 },
  actionIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: Theme.colors.surfaceGlass, alignItems: 'center', justifyContent: 'center', marginBottom: Theme.spacing.lg },
  actionTitle: { ...Theme.typography.h2, color: Theme.colors.textPrimary },
  actionCopy: { ...Theme.typography.body, color: Theme.colors.textSecondary, marginTop: 7, marginBottom: Theme.spacing.lg },
});
