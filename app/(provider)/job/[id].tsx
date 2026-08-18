import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { LockKeyhole, MapPin, MessageCircleMore, WalletCards } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Badge from '../../../src/components/Badge';
import Button from '../../../src/components/Button';
import Card from '../../../src/components/Card';
import Input from '../../../src/components/Input';
import { FadeIn } from '../../../src/components/Motion';
import { Screen, StateView } from '../../../src/components/Screen';
import { createIdempotencyKey, typedApi } from '../../../src/services/api';
import { Theme } from '../../../src/styles/theme';
import { formatPkr } from '../../../src/utils/format';

export default function ProviderJob() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const query = useQuery({ queryKey: ['booking', id], queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/bookings/{booking_id}', { params: { path: { booking_id: id } } }); if (error || !data) throw error; return data; } });
  const submit = async () => {
    if (Number(amount) < 1) return Alert.alert('Enter your offer', 'Use a clear price in PKR.');
    setBusy(true);
    const { data, error } = await typedApi.POST('/api/v2/bookings/{booking_id}/bids', { params: { path: { booking_id: id } }, headers: { 'Idempotency-Key': createIdempotencyKey() }, body: { amount_paisa: Math.round(Number(amount) * 100), note: note || null } });
    setBusy(false);
    if (error || !data) return Alert.alert('Offer not sent', 'The task may have expired or your credit floor may have been reached.');
    Alert.alert('Offer sent', data.charged_paisa ? `${formatPkr(data.charged_paisa)} was charged.` : 'No bid credit was charged.');
    router.replace({ pathname: '/(customer)/thread/[id]', params: { id: data.thread_id } });
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
          <View style={styles.offerHeading}><MessageCircleMore color={Theme.colors.primary} size={20} /><Text style={styles.offerTitle}>Make your offer</Text></View>
          <Input label="Your offer (PKR)" keyboardType="number-pad" value={amount} onChangeText={(value) => setAmount(value.replace(/\D/g, ''))} placeholder="e.g. 2500" />
          <Input label="Note (optional)" value={note} onChangeText={setNote} multiline placeholder="Explain what your price includes" />
          <Button title="Submit offer" loading={busy} onPress={() => void submit()} />
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
  privacy: { flexDirection: 'row', alignItems: 'flex-start', gap: Theme.spacing.sm, padding: Theme.spacing.lg },
  privacyText: { ...Theme.typography.caption, color: Theme.colors.textTertiary, flex: 1 },
});
