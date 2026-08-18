import type { components } from '../../../src/api/schema';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import Button from '../../../src/components/Button';
import Card from '../../../src/components/Card';
import Input from '../../../src/components/Input';
import { Screen, StateView } from '../../../src/components/Screen';
import { createIdempotencyKey, typedApi } from '../../../src/services/api';
import { Theme } from '../../../src/styles/theme';
import { formatPkr } from '../../../src/utils/format';
type Bid = components['schemas']['BidResponse'];

export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(); const cache = useQueryClient();
  const [review, setReview] = useState('');
  const task = useQuery({ queryKey: ['booking', id], queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/bookings/{booking_id}', { params: { path: { booking_id: id } } }); if (error || !data) throw error; return data; } });
  const bids = useQuery({ queryKey: ['booking-bids', id], enabled: task.data?.status === 'open', queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/bookings/{booking_id}/bids', { params: { path: { booking_id: id } } }); if (error) throw error; return (data ?? []) as Bid[]; } });
  const accept = async (bid: Bid) => { const { data, error } = await typedApi.POST('/api/v2/bookings/{booking_id}/bids/{bid_id}/accept', { params: { path: { booking_id: id, bid_id: bid.id } }, headers: { 'Idempotency-Key': createIdempotencyKey() } }); if (error || !data) return Alert.alert('Could not select provider', 'The task may already have changed. Refresh and retry.'); const result = data as { completion_code?: string }; if (result.completion_code) { await SecureStore.setItemAsync(`completion.${id}`, result.completion_code); Alert.alert('Provider selected', `Your completion code is ${result.completion_code}. Only share it after the work is finished.`); } await cache.invalidateQueries({ queryKey: ['booking', id] }); };
  const confirmCompletion = async () => { const code = await SecureStore.getItemAsync(`completion.${id}`); if (!code) return Alert.alert('Completion code unavailable', 'Contact support for an auditable override.'); const { error } = await typedApi.POST('/api/v2/bookings/{booking_id}/transition', { params: { path: { booking_id: id } }, headers: { 'Idempotency-Key': createIdempotencyKey() }, body: { action: 'confirm_completion', completion_code: code } }); if (error) return Alert.alert('Could not complete task', 'The code was rejected or task status changed.'); await cache.invalidateQueries({ queryKey: ['booking', id] }); };
  const submitReview = async () => { const { error } = await typedApi.POST('/api/v2/bookings/{booking_id}/reviews', { params: { path: { booking_id: id } }, headers: { 'Idempotency-Key': createIdempotencyKey() }, body: { rating: 5, comment: review || null } }); Alert.alert(error ? 'Review not submitted' : 'Thank you', error ? 'A review may already exist.' : 'Your verified-work review is published.'); };
  if (task.isLoading) return <StateView title="Loading task…" loading />; if (task.isError || !task.data) return <StateView title="Task unavailable" onRetry={() => task.refetch()} />;
  const value = task.data;
  return <Screen><Text style={styles.title}>{value.title}</Text><Text style={styles.status}>{value.status.replaceAll('_', ' ')}</Text><Text style={styles.description}>{value.description}</Text><Card><Text>{value.approximate_area}</Text><Text style={styles.money}>{formatPkr(value.budget_paisa)}</Text>{value.exact_address && <Text style={styles.private}>{value.exact_address.address_line}, {value.exact_address.city}</Text>}</Card>
    {value.status === 'open' && <><Text style={styles.heading}>Provider offers</Text>{bids.isLoading ? <StateView title="Checking offers…" loading /> : bids.data?.length ? bids.data.map((bid) => <Card key={bid.id}><Text style={styles.money}>{formatPkr(bid.amount_paisa)}</Text>{bid.note && <Text style={styles.description}>{bid.note}</Text>}<Button title="Select this provider" onPress={() => void accept(bid)} /></Card>) : <StateView title="No offers yet" detail="Verified providers nearby can still submit an offer until the task expires." />}</>}
    {value.status === 'completion_requested' && <Card><Text style={styles.heading}>Is the work finished?</Text><Text style={styles.description}>Confirm only after checking the work. Payment is cash directly to the provider.</Text><Button title="Confirm completion" onPress={() => void confirmCompletion()} /></Card>}
    {value.status === 'completed' && <Card><Text style={styles.heading}>Review completed work</Text><Input label="Comment (optional)" value={review} onChangeText={setReview} multiline /><Button title="Submit 5-star review" onPress={() => void submitReview()} /></Card>}
  </Screen>;
}
const styles = StyleSheet.create({ title: { ...Theme.typography.h1, color: Theme.colors.textPrimary }, status: { color: Theme.colors.primary, fontWeight: '800', textTransform: 'capitalize', marginVertical: 6 }, description: { ...Theme.typography.body, color: Theme.colors.textSecondary, marginVertical: 8 }, money: { fontSize: 20, fontWeight: '800', color: Theme.colors.moneyGreen, marginVertical: 6 }, private: { color: Theme.colors.textPrimary, marginTop: 8 }, heading: { ...Theme.typography.h2, marginTop: 20 } });
