import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import React from 'react';
import { Pressable, Text } from 'react-native';
import Card from '../../../src/components/Card';
import { Screen, StateView } from '../../../src/components/Screen';
import { typedApi } from '../../../src/services/api';
import { Theme } from '../../../src/styles/theme';

type Thread = { id: string; booking_title: string; booking_status: string; updated_at: string };
export default function MessagesScreen() {
  const query = useQuery({ queryKey: ['threads'], queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/threads'); if (error) throw error; return (data ?? []) as Thread[]; } });
  if (query.isLoading) return <StateView title="Loading messages…" loading />;
  if (query.isError) return <StateView title="Messages unavailable" onRetry={() => query.refetch()} />;
  return <Screen>{query.data?.length ? query.data.map((thread) => <Link key={thread.id} href={{ pathname: '/(customer)/thread/[id]', params: { id: thread.id } }} asChild><Pressable><Card><Text style={{ ...Theme.typography.h3 }}>{thread.booking_title}</Text><Text style={{ color: Theme.colors.textSecondary, marginTop: 5 }}>{thread.booking_status.replaceAll('_', ' ')}</Text></Card></Pressable></Link>) : <StateView title="No conversations" detail="A private conversation appears after a provider submits an offer." />}</Screen>;
}
