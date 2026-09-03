import { useQuery } from '@tanstack/react-query';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import { Flag, LockKeyhole, MapPin, MessageCircleMore, WalletCards, Zap } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Badge from '../../../src/components/Badge';
import Button from '../../../src/components/Button';
import Card from '../../../src/components/Card';
import Input from '../../../src/components/Input';
import { FadeIn } from '../../../src/components/Motion';
import { Screen, StateView } from '../../../src/components/Screen';
import TactilePressable from '../../../src/components/TactilePressable';
import { createIdempotencyKey, typedApi } from '../../../src/services/api';
import { trackEvent } from '../../../src/services/analytics';
import { Theme } from '../../../src/styles/theme';
import { formatPkr } from '../../../src/utils/format';
import i18n from '../../../src/i18n';

import TaskPhotos from '../../../src/components/TaskPhotos';
import { liveQueryOptions, problemDetail } from '../../../src/utils/marketplace';

export default function ProviderJob() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [arrivalMinutes, setArrivalMinutes] = useState(60);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [matchFeedbackOpen, setMatchFeedbackOpen] = useState(false);
  const [matchFeedbackReason, setMatchFeedbackReason] = useState('');
  const [reportingMatch, setReportingMatch] = useState(false);
  const [busy, setBusy] = useState(false);
  const offerRequest = useRef<{ fingerprint: string; key: string } | null>(null);
  const initializedOffer = useRef(false);
  const query = useQuery({ ...liveQueryOptions, queryKey: ['booking', id], queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/bookings/{booking_id}', { params: { path: { booking_id: id } } }); if (error || !data) throw error; return data; } });
  const credits = useQuery({ queryKey: ['credit-balance'], queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/credits'); if (error || !data) throw error; return data; } });
  const quickOffers = useMemo(() => {
    const budget = (query.data?.budget_paisa ?? 0) / 100;
    if (!budget) return [1000, 1500, 2500];
    const rounded = (value: number) => Math.max(100, Math.round(value / 100) * 100);
    return [...new Set([rounded(budget * 0.9), rounded(budget), rounded(budget * 1.1)])];
  }, [query.data?.budget_paisa]);
  useEffect(() => {
    if (!initializedOffer.current && query.data && quickOffers.length) {
      initializedOffer.current = true;
      setAmount(String(quickOffers[Math.floor(quickOffers.length / 2)]));
    }
  }, [query.data, quickOffers]);
  const submit = async () => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
      setFeedback(i18n.t('experience.job.invalidOffer'));
      return;
    }
    setFeedback(null);
    setBusy(true);
    const body = { amount_paisa: Math.round(parsedAmount * 100), note: note.trim() || null, arrival_minutes: arrivalMinutes };
    const fingerprint = JSON.stringify([id, body]);
    if (offerRequest.current?.fingerprint !== fingerprint) offerRequest.current = { fingerprint, key: createIdempotencyKey() };
    try {
      const { data, error } = await typedApi.POST('/api/v2/bookings/{booking_id}/bids', { params: { path: { booking_id: id } }, headers: { 'Idempotency-Key': offerRequest.current.key }, body });
      if (error || !data) throw error;
      offerRequest.current = null;
      void trackEvent('bid_sheet', { outcome: 'submitted', arrival_minutes: arrivalMinutes, has_note: Boolean(note.trim()) });
      router.replace(('/provider/thread/' + data.thread_id) as Href);
    } catch (error) { setFeedback(problemDetail(error, i18n.t('experience.job.offerFailed'))); }
    finally { setBusy(false); }
  };
  const reportMatch = async () => {
    if (!matchFeedbackReason) return;
    setReportingMatch(true);
    const { error } = await typedApi.POST('/api/v2/reports', {
      headers: { 'Idempotency-Key': createIdempotencyKey() },
      body: {
        booking_id: id,
        reason: `irrelevant_match:${matchFeedbackReason}`,
        details: 'Provider-submitted relevance feedback from the opportunity screen.',
      },
    });
    setReportingMatch(false);
    if (error) {
      setFeedback(i18n.t('experience.job.feedbackFailed'));
      return;
    }
    setFeedback(i18n.t('experience.job.feedbackThanks'));
    setMatchFeedbackOpen(false);
    void trackEvent('provider_feed', { outcome: 'irrelevant_match_reported', feedback_reason: matchFeedbackReason });
  };
  if (query.isLoading) return <StateView title={i18n.t('experience.job.loading')} loading />;
  if (query.isError || !query.data) return <StateView title={i18n.t('experience.job.unavailable')} />;
  return (
    <Screen topInset={false}>
      <FadeIn>
        <Badge label={i18n.t('experience.task.status.' + query.data.status, { defaultValue: query.data.status })} variant="success" />
        <Text style={styles.title}>{query.data.title}</Text>
        <View style={styles.area}><MapPin color={Theme.colors.primary} size={17} /><Text style={styles.areaText}>{query.data.approximate_area}</Text></View>
        <Text style={styles.description}>{query.data.description}</Text>
        <TaskPhotos images={query.data.images} />
      </FadeIn>
      <FadeIn delay={70}>
        <Card variant="tinted" style={styles.budget}><View><Text style={styles.budgetLabel}>{i18n.t('experience.job.customerBudget')}</Text><Text style={styles.money}>{formatPkr(query.data.budget_paisa)}</Text></View><WalletCards color={Theme.colors.primary} size={27} /></Card>
      </FadeIn>
      <FadeIn delay={130}>
        <Card elevation="md">
          <View style={styles.offerHeading}><Zap color={Theme.colors.primary} size={20} /><View><Text style={styles.offerTitle}>{i18n.t('experience.job.quick')}</Text><Text style={styles.offerHint}>{i18n.t('experience.job.quickHint')}</Text></View></View>
          <View style={styles.quickOffers}>
            {quickOffers.map((value) => (
              <TactilePressable accessibilityRole="button" accessibilityLabel={i18n.t('experience.job.offerA11y', { amount: formatPkr(value * 100) })} accessibilityState={{ selected: amount === String(value) }} key={value} onPress={() => setAmount(String(value))} style={[styles.quickOffer, amount === String(value) && styles.quickOfferSelected]}>
                <Text style={[styles.quickOfferText, amount === String(value) && styles.quickOfferTextSelected]}>{formatPkr(value * 100)}</Text>
              </TactilePressable>
            ))}
          </View>
          <Input label={i18n.t('experience.job.yourOffer')} keyboardType="number-pad" value={amount} onChangeText={(value) => setAmount(value.replace(/\D/g, ''))} placeholder={i18n.t('experience.job.offerPlaceholder')} />
          <Text style={styles.fieldLabel}>{i18n.t('experience.job.arrival')}</Text>
          <View style={styles.arrivalOptions}>{[[30, i18n.t('experience.job.min30')], [60, i18n.t('experience.job.hour1')], [120, i18n.t('experience.job.hour2')], [240, i18n.t('experience.job.hour4')]] .map(([value, label]) => <TactilePressable accessibilityRole="button" accessibilityLabel={i18n.t('experience.job.arriveIn', { time: label })} accessibilityState={{ selected: arrivalMinutes === value }} key={value} onPress={() => setArrivalMinutes(value as number)} style={[styles.arrivalChip, arrivalMinutes === value && styles.quickOfferSelected]}><Text style={[styles.arrivalText, arrivalMinutes === value && styles.quickOfferTextSelected]}>{label}</Text></TactilePressable>)}</View>
          <Input label={i18n.t('experience.job.note')} value={note} onChangeText={setNote} multiline placeholder={i18n.t('experience.job.notePlaceholder')} />
          <View style={styles.chargePanel}><Text style={styles.chargeLabel}>{i18n.t('experience.job.firstCost')}</Text><Text style={styles.chargeValue}>{credits.data?.paid_bids_enabled ? formatPkr(credits.data.bid_fee_paisa) : i18n.t('experience.job.freeLaunch')}</Text><Text style={styles.chargeCopy}>{credits.data?.paid_bids_enabled ? i18n.t('experience.job.revisionsFree') : i18n.t('experience.job.chargeNotice')}</Text></View>
          {!!feedback && <View accessibilityRole="alert" style={styles.feedback}><Text style={styles.feedbackText}>{feedback}</Text></View>}
          <Button title={i18n.t('experience.job.send', { amount: amount ? formatPkr(Number(amount) * 100) : i18n.t('experience.job.offerWord') })} disabled={query.data.status !== 'open' || query.data.verification_status !== 'verified'} loading={busy} onPress={() => void submit()} icon={<MessageCircleMore color={Theme.colors.white} size={18} />} />
        </Card>
        <View style={styles.privacy}><LockKeyhole color={Theme.colors.textTertiary} size={16} /><Text style={styles.privacyText}>{i18n.t('experience.job.privacy')}</Text></View>
        <Button title={matchFeedbackOpen ? i18n.t('experience.job.closeFeedback') : i18n.t('experience.job.irrelevant')} type="outline" icon={<Flag color={Theme.colors.primary} size={17} />} onPress={() => setMatchFeedbackOpen((value) => !value)} />
        {matchFeedbackOpen && <Card variant="tinted" style={styles.matchFeedback}>
          <Text style={styles.matchFeedbackTitle}>{i18n.t('experience.job.why')}</Text>
          <Text style={styles.matchFeedbackCopy}>{i18n.t('experience.job.improve')}</Text>
          <View style={styles.feedbackReasons}>{[
            ['wrong_service', i18n.t('experience.job.wrongService')],
            ['too_far', i18n.t('experience.job.tooFar')],
            ['timing', i18n.t('experience.job.timing')],
            ['scope_unclear', i18n.t('experience.job.unclear')],
          ].map(([value, label]) => <TactilePressable key={value} accessibilityRole="button" accessibilityState={{ selected: matchFeedbackReason === value }} onPress={() => setMatchFeedbackReason(value)} style={[styles.reasonChip, matchFeedbackReason === value && styles.quickOfferSelected]}><Text style={[styles.arrivalText, matchFeedbackReason === value && styles.quickOfferTextSelected]}>{label}</Text></TactilePressable>)}</View>
          <Button title={i18n.t('experience.job.sendFeedback')} disabled={!matchFeedbackReason} loading={reportingMatch} onPress={() => void reportMatch()} />
        </Card>}
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...Theme.typography.h1, color: Theme.colors.textPrimary, marginTop: Theme.spacing.md },
  area: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xs, marginTop: Theme.spacing.sm },
  areaText: { ...Theme.typography.bodySmall, color: Theme.colors.primary, fontWeight: '600' },
  description: { ...Theme.typography.body, color: Theme.colors.textSecondary, marginVertical: Theme.spacing.xl },
  budget: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetLabel: { ...Theme.typography.overline, color: Theme.colors.textTertiary },
  money: { ...Theme.typography.h1, color: Theme.colors.moneyGreen, marginTop: Theme.spacing.xs },
  offerHeading: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm, marginBottom: Theme.spacing.md },
  offerTitle: { ...Theme.typography.h3, color: Theme.colors.textPrimary },
  offerHint: { ...Theme.typography.caption, color: Theme.colors.textTertiary, marginTop: 2 },
  quickOffers: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.sm, marginBottom: Theme.spacing.md },
  quickOffer: { flexGrow: 1, minHeight: 44, paddingHorizontal: Theme.spacing.md, borderRadius: Theme.radius.md, borderWidth: 1, borderColor: Theme.colors.divider, alignItems: 'center', justifyContent: 'center' },
  quickOfferSelected: { backgroundColor: Theme.colors.primaryMist, borderColor: Theme.colors.primary },
  quickOfferText: { ...Theme.typography.button, color: Theme.colors.textSecondary },
  quickOfferTextSelected: { color: Theme.colors.primary },
  fieldLabel: { ...Theme.typography.overline, color: Theme.colors.textTertiary, marginBottom: Theme.spacing.sm },
  arrivalOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.sm, marginBottom: Theme.spacing.lg },
  arrivalChip: { minWidth: 72, minHeight: 44, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.radius.full, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Theme.spacing.md },
  arrivalText: { ...Theme.typography.caption, color: Theme.colors.textSecondary, fontWeight: '700' },
  chargePanel: { backgroundColor: Theme.colors.primaryMist, borderRadius: Theme.radius.md, padding: Theme.spacing.md, marginBottom: Theme.spacing.md },
  chargeLabel: { ...Theme.typography.overline, color: Theme.colors.textTertiary },
  chargeValue: { ...Theme.typography.h3, color: Theme.colors.moneyGreen, marginTop: 3 },
  chargeCopy: { ...Theme.typography.caption, color: Theme.colors.textSecondary, marginTop: 3 },
  feedback: { backgroundColor: Theme.colors.errorLight, borderLeftWidth: 4, borderLeftColor: Theme.colors.error, borderRadius: Theme.radius.sm, padding: Theme.spacing.md, marginBottom: Theme.spacing.md },
  feedbackText: { ...Theme.typography.bodySmall, color: Theme.colors.textPrimary },
  privacy: { flexDirection: 'row', alignItems: 'flex-start', gap: Theme.spacing.sm, padding: Theme.spacing.lg },
  privacyText: { ...Theme.typography.caption, color: Theme.colors.textTertiary, flex: 1 },
  matchFeedback: { marginTop: Theme.spacing.md },
  matchFeedbackTitle: { ...Theme.typography.h3, color: Theme.colors.textPrimary },
  matchFeedbackCopy: { ...Theme.typography.bodySmall, color: Theme.colors.textSecondary, marginTop: Theme.spacing.xs, marginBottom: Theme.spacing.md },
  feedbackReasons: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.sm, marginBottom: Theme.spacing.md },
  reasonChip: { minHeight: 44, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.radius.full, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Theme.spacing.md },
});
