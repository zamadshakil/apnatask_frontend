import { Redirect } from 'expo-router';
import React from 'react';
import { StateView } from '../src/components/Screen';
import { useSession } from '../src/providers/AuthProvider';

export default function Index() {
  const { session, user, loading, profileMissing } = useSession();
  if (loading) return <StateView title="Opening ApnaTask…" loading />;
  if (!session) return <Redirect href="/(auth)/phone" />;
  if (profileMissing || !user) return <Redirect href="/(auth)/onboarding" />;
  return <Redirect href="/(customer)/(tabs)" />;
}
