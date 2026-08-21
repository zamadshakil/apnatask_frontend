import { useQuery } from '@tanstack/react-query';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import { LockKeyhole, MapPin, MessageCircleMore, WalletCards, Zap } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Badge from '../../../src/components/Badge';
import Button from '../../../src/components/Button';
import Card from '../../../src/components/Card';
import Input from '../../../src/components/Input';
import { FadeIn } from '../../../src/components/Motion';
import { Screen, StateView } from '../../../src/components/Screen';
import TactilePressable from '../../../src/components/TactilePressable';
import { createIdempotencyKey, typedApi } from '../../../src/services/api';
import { Theme } from '../../../src/styles/theme';
import { formatPkr } from '../../../src/utils/format';

export default function ProviderJob() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const initializedOffer = useRef(false);
  const query = useQuery({ queryKey: ['booking', id], queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/bookings/{booking_id}', { params: { path: { booking_id: id } } }); if (error || !data) throw error; return data; } });
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
    if (!Number.isFinite(parsedAmount) || parsedAmount < 1) return Alert.alert('Enter your offer', 'Use a clear price in PKR.');
    setBusy(true);
    const { data, error } = await typedApi.POST('/api/v2/bookings/{booking_id}/bids', { params: { path: { booking_id: id } }, headers: { 'Idempotency-Key': createIdempotencyKey() }, body: { amount_paisa: Math.round(parsedAmount * 100), note: note.trim() || null } });
    setBusy(false);
    if (error || !data) return Alert.alert('Offer not sent', 'The task may have expired or your credit floor may have been reached.');
    Alert.alert('Offer sent', data.charged_paisa ? `${formatPkr(data.charged_paisa)} was charged.` : 'No bid credit was charged.');
    router.replace(`/provider/thread/${data.thread_id}` as Href);
  };
  if (query.isLoading) return <StateView title="Loading task…" loading />;
  if (query.isError || !query.data) return <StateView title="Task unavailable" />;
  return (
    <Screen topInset={false}>
      <FadeIn>
        <Badge label="Open task" variant="success" />
        <Text style={styles.title}>{query.data.title}</Text>
        <View style={styles.area}><MapPin color={Theme.colors.primary} size={17} /><Text style={styles.areaText}>{query.data.approximate_area}</Text></View>
        <Text style={styles.description}>{query.data.description}</Text>
      </FadeIn>
      <FadeIn delay={70}>
        <Card variant="tinted" style={styles.budget}><View><Text style={styles.budgetLabel}>CUSTOMER BUDGET</Text><Text style={styles.money}>{formatPkr(query.data.budget_paisa)}</Text></View><WalletCards color={Theme.colors.primary} size={27} /></Card>
      </FadeIn>
      <FadeIn delay={130}>
        <Card elevation="md">
          <View style={styles.offerHeading}><Zap color={Theme.colors.primary} size={20} /><View><Text style={styles.offerTitle}>Quick offer</Text><Text style={styles.offerHint}>Pick a price and send—one tap after selection.</Text></View></View>
          <View style={styles.quickOffers}>
            {quickOffers.map((value) => (
              <TactilePressable key={value} onPress={() => setAmount(String(value))} style={[styles.quickOffer, amount === String(value) && styles.quickOfferSelected]}>
                <Text style={[styles.quickOfferText, amount === String(value) && styles.quickOfferTextSelected]}>{formatPkr(value * 100)}</Text>
              </TactilePressable>
            ))}
          </View>
          <Input label="Your offer (PKR)" keyboardType="number-pad" value={amount} onChangeText={(value) => setAmount(value.replace(/\D/g, ''))} placeholder="e.g. 2500" />
          <Input label="Short note (optional)" value={note} onChangeText={setNote} multiline placeholder="e.g. I can arrive in 30 minutes" />
          <Button title={`Send ${amount ? formatPkr(Number(amount) * 100) : 'offer'}`} loading={busy} onPress={() => void submit()} icon={<MessageCircleMore color={Theme.colors.white} size={18} />} />
        </Card>
        <View style={styles.privacy}><LockKeyhole color={Theme.colors.textTertiary} size={16} /><Text style={styles.privacyText}>The exact address and customer phone remain private until you are selected.</Text></View>
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
  privacy: { flexDirection: 'row', alignItems: 'flex-start', gap: Theme.spacing.sm, padding: Theme.spacing.lg },
  privacyText: { ...Theme.typography.caption, color: Theme.colors.textTertiary, flex: 1 },
});
