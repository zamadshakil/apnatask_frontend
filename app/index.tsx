import { Redirect, type Href, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StateView } from '../src/components/Screen';
import { parseEntryIntent, resolveEntryDestination } from '../src/navigation/entryIntent';
import { useSession } from '../src/providers/AuthProvider';

export default function Index() {
  const params = useLocalSearchParams<{ intent?: string | string[] }>();
  const intent = parseEntryIntent(params.intent);
  const { session, user, loading, profileMissing } = useSession();
  if (loading) return <StateView title="Opening ApnaTask…" loading />;
  if (!session) return <Redirect href={{ pathname: '/(auth)/phone', params: { intent } }} />;
  if (profileMissing || !user) return <Redirect href={{ pathname: '/(auth)/onboarding', params: { intent } }} />;
  // `/provider` is a real canonical route, but Expo's generated union currently
  // omits it because the legacy route-group tree exposes the same provider tabs.
  return <Redirect href={resolveEntryDestination(intent, user) as Href} />;
}
