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
import i18n from '../../../src/i18n';

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
  const [punctuality, setPunctuality] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [workmanship, setWorkmanship] = useState(5);
  const task = useQuery({ queryKey: ['booking', id], queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/bookings/{booking_id}', { params: { path: { booking_id: id } } }); if (error || !data) throw error; return data; } });
  const bids = useQuery({ queryKey: ['booking-bids', id], enabled: task.data?.status === 'open', queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/bookings/{booking_id}/bids', { params: { path: { booking_id: id } } }); if (error) throw error; return (data ?? []) as Bid[]; } });
  const accept = async (bid: Bid) => { const { data, error } = await typedApi.POST('/api/v2/bookings/{booking_id}/bids/{bid_id}/accept', { params: { path: { booking_id: id, bid_id: bid.id } }, headers: { 'Idempotency-Key': createIdempotencyKey() } }); if (error || !data) return Alert.alert(i18n.t('experience.task.selectFailed'), i18n.t('experience.task.selectFailedDetail')); const result = data as { completion_code?: string }; if (result.completion_code) { await SecureStore.setItemAsync(`completion.${id}`, result.completion_code); Alert.alert(i18n.t('experience.task.selected'), i18n.t('experience.task.codeMessage', { code: result.completion_code })); } await cache.invalidateQueries({ queryKey: ['booking', id] }); };
  const confirmCompletion = async () => { const code = await SecureStore.getItemAsync(`completion.${id}`); if (!code) return Alert.alert(i18n.t('experience.task.codeUnavailable'), i18n.t('experience.task.supportOverride')); const { error } = await typedApi.POST('/api/v2/bookings/{booking_id}/transition', { params: { path: { booking_id: id } }, headers: { 'Idempotency-Key': createIdempotencyKey() }, body: { action: 'confirm_completion', completion_code: code } }); if (error) return Alert.alert(i18n.t('experience.task.completionFailed'), i18n.t('experience.task.completionFailedDetail')); await cache.invalidateQueries({ queryKey: ['booking', id] }); };
  const submitReview = async () => { const { error } = await typedApi.POST('/api/v2/bookings/{booking_id}/reviews', { params: { path: { booking_id: id } }, headers: { 'Idempotency-Key': createIdempotencyKey() }, body: { rating, punctuality_rating: punctuality, communication_rating: communication, workmanship_rating: workmanship, comment: review.trim() || null } }); Alert.alert(error ? i18n.t('experience.task.reviewFailed') : i18n.t('experience.task.thanks'), error ? i18n.t('experience.task.reviewExisting') : i18n.t('experience.task.reviewPublished')); };
  if (task.isLoading) return <StateView title={i18n.t('experience.task.loading')} loading />;
  if (task.isError || !task.data) return <StateView title={i18n.t('experience.task.unavailable')} onRetry={() => task.refetch()} />;
  const value = task.data;
  const timeline = value.timeline ?? [];
  const address = value.exact_address ? `${value.exact_address.address_line}, ${value.exact_address.city}` : i18n.t('experience.task.privateAddress');

  return <Screen topInset={false}>
    <FadeIn>
      <View style={styles.titleRow}><Text style={styles.eyebrow}>{i18n.t('experience.task.eyebrow')}</Text><Badge label={i18n.t(`experience.task.status.${value.status}`, { defaultValue: value.status.replaceAll('_', ' ') })} variant={statusVariant(value.status)} size="md" /></View>
      <Text style={styles.title}>{value.title}</Text>
      <Text style={styles.description}>{value.description}</Text>
    </FadeIn>

    <FadeIn delay={40}>
      <Card variant="glass" style={styles.timelineCard}>
        <Text style={styles.timelineTitle}>{i18n.t('experience.task.progress')}</Text>
        {timeline.map((event, index) => <View key={String(event.key)} style={styles.timelineRow}><View style={styles.timelineRail}><View style={[styles.timelineDot, event.complete && styles.timelineDotComplete, event.current && styles.timelineDotCurrent]} />{index < timeline.length - 1 && <View style={[styles.timelineLine, event.complete && styles.timelineLineComplete]} />}</View><View style={styles.timelineCopy}><Text style={[styles.timelineLabel, (event.current || event.complete) && styles.timelineLabelActive]}>{i18n.t(`experience.task.timeline.${String(event.key)}`, { defaultValue: String(event.label) })}</Text>{event.current && <Text style={styles.timelineCurrent}>{i18n.t('experience.task.current')}</Text>}</View></View>)}
      </Card>
    </FadeIn>

    <FadeIn delay={70}>
      <Card elevation="md" style={styles.infoCard}>
        <InfoRow icon={MapPin} label={i18n.t('experience.task.locality')} value={value.approximate_area} />
        <View style={styles.divider} />
        <InfoRow icon={WalletCards} label={i18n.t('experience.task.budget')} value={formatPkr(value.budget_paisa)} emphasized />
        <View style={styles.divider} />
        <InfoRow icon={ShieldCheck} label={i18n.t('experience.task.exactAddress')} value={address} />
      </Card>
    </FadeIn>

    {value.status === 'open' && <FadeIn delay={120}>
      <SectionHeader title={i18n.t('experience.task.offers')} detail={i18n.t('experience.task.offersDetail')} />
      {bids.isLoading ? <StateView title={i18n.t('experience.task.checkingOffers')} loading /> : bids.data?.length ? bids.data.map((bid) => <Card key={bid.id} elevation="md" style={styles.bidCard}><View style={styles.bidTop}><View><Text style={styles.bidLabel}>{bid.provider_display_name}</Text><Text style={styles.bidAmount}>{formatPkr(bid.amount_paisa)}</Text></View><View style={styles.verified}><ShieldCheck color={Theme.colors.primary} size={18} /><Text style={styles.verifiedText}>{i18n.t('experience.task.kyc')}</Text></View></View><View style={styles.reputation}><Star color={Theme.colors.warning} fill={Theme.colors.warning} size={16} /><Text style={styles.reputationText}>{bid.provider_rating_count ? `${bid.provider_rating_average.toFixed(1)} · ${i18n.t('experience.task.verifiedReviews', { count: bid.provider_rating_count })}` : i18n.t('experience.task.newProvider')} · {i18n.t('experience.task.completedJobs', { count: bid.provider_completed_jobs })}{bid.arrival_minutes ? ` · ${bid.arrival_minutes < 60 ? i18n.t('experience.task.arrivesMinutes', { count: bid.arrival_minutes }) : i18n.t('experience.task.arrivesHours', { count: Math.round(bid.arrival_minutes / 60) })}` : ''}</Text></View>{bid.note && <Text style={styles.bidNote}>{bid.note}</Text>}<View style={styles.bidActions}><Button title={i18n.t('experience.task.message')} type="outline" style={styles.bidAction} onPress={() => router.push({ pathname: '/(customer)/thread/[id]', params: { id: bid.thread_id } })} /><Button title={i18n.t('experience.task.select')} style={styles.bidAction} onPress={() => void accept(bid)} /></View></Card>) : <Card variant="glass" style={styles.emptyCard}><EmptyState icon={MessageCircleMore} title={i18n.t('experience.task.noOffers')} detail={i18n.t('experience.task.noOffersDetail')} /></Card>}
    </FadeIn>}

    {value.status === 'completion_requested' && <Card variant="tinted" elevation="md"><View style={styles.actionIcon}><Clock3 color={Theme.colors.primary} /></View><Text style={styles.actionTitle}>{i18n.t('experience.task.workFinished')}</Text><Text style={styles.actionCopy}>{i18n.t('experience.task.confirmCopy')}</Text><Button title={i18n.t('experience.task.confirm')} onPress={() => void confirmCompletion()} /></Card>}
    {value.status === 'completed' && <Card elevation="md"><Text style={styles.actionTitle}>{i18n.t('experience.task.reviewWork')}</Text><Text style={styles.actionCopy}>{i18n.t('experience.task.reviewCopy')}</Text><RatingRow label={i18n.t('experience.task.overall')} value={rating} onChange={setRating} /><RatingRow label={i18n.t('experience.task.punctuality')} value={punctuality} onChange={setPunctuality} /><RatingRow label={i18n.t('experience.task.communication')} value={communication} onChange={setCommunication} /><RatingRow label={i18n.t('experience.task.workmanship')} value={workmanship} onChange={setWorkmanship} /><Input label={i18n.t('experience.task.comment')} value={review} onChangeText={setReview} multiline /><Button title={i18n.t('experience.task.publishReview')} onPress={() => void submitReview()} /></Card>}
  </Screen>;
}

function RatingRow({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <View style={styles.ratingRow}><Text style={styles.ratingLabel}>{label}</Text><View accessibilityRole="radiogroup" style={styles.rating}>{[1, 2, 3, 4, 5].map((option) => <TactilePressable key={option} onPress={() => onChange(option)} accessibilityRole="radio" accessibilityLabel={i18n.t('experience.task.stars', { label, count: option })} accessibilityState={{ checked: value === option }}><Star color={Theme.colors.warning} fill={option <= value ? Theme.colors.warning : 'transparent'} size={27} /></TactilePressable>)}</View></View>;
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Theme.spacing.md, marginBottom: Theme.spacing.md },
  eyebrow: { ...Theme.typography.overline, color: Theme.colors.primary },
  title: { ...Theme.typography.display, color: Theme.colors.textPrimary, maxWidth: 620 },
  description: { ...Theme.typography.body, color: Theme.colors.textSecondary, marginTop: Theme.spacing.md, maxWidth: 620 },
  timelineCard: { marginTop: Theme.spacing.xl },
  timelineTitle: { ...Theme.typography.h3, color: Theme.colors.textPrimary, marginBottom: Theme.spacing.md },
  timelineRow: { minHeight: 47, flexDirection: 'row' },
  timelineRail: { width: 26, alignItems: 'center' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 5, backgroundColor: Theme.colors.border },
  timelineDotComplete: { backgroundColor: Theme.colors.primaryLight },
  timelineDotCurrent: { width: 16, height: 16, borderRadius: 8, marginTop: 3, backgroundColor: Theme.colors.primary, borderWidth: 3, borderColor: Theme.colors.primaryMist },
  timelineLine: { width: 2, flex: 1, backgroundColor: Theme.colors.divider },
  timelineLineComplete: { backgroundColor: Theme.colors.primaryLight },
  timelineCopy: { flex: 1, paddingLeft: Theme.spacing.sm },
  timelineLabel: { ...Theme.typography.bodySmall, color: Theme.colors.textTertiary },
  timelineLabelActive: { color: Theme.colors.textPrimary, fontWeight: '700' },
  timelineCurrent: { ...Theme.typography.caption, color: Theme.colors.primary, marginTop: 1 },
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
  ratingRow: { marginBottom: Theme.spacing.sm },
  ratingLabel: { ...Theme.typography.caption, color: Theme.colors.textSecondary, marginBottom: Theme.spacing.xs },
  emptyCard: { padding: 0 },
  actionIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: Theme.colors.surfaceGlass, alignItems: 'center', justifyContent: 'center', marginBottom: Theme.spacing.lg },
  actionTitle: { ...Theme.typography.h2, color: Theme.colors.textPrimary },
  actionCopy: { ...Theme.typography.body, color: Theme.colors.textSecondary, marginTop: 7, marginBottom: Theme.spacing.lg },
});
