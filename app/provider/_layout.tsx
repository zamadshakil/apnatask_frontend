import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { StateView } from '../../src/components/Screen';
import { useSession } from '../../src/providers/AuthProvider';
import { Theme } from '../../src/styles/theme';

export default function CanonicalProviderLayout() {
  const { user, loading } = useSession();
  if (loading) return <StateView title="Checking provider access…" loading />;
  if (!user?.capabilities.includes('provider')) return <Redirect href="/account" />;
  return <Stack screenOptions={{ animation: 'slide_from_right', contentStyle: { backgroundColor: Theme.colors.background }, headerShadowVisible: false, headerStyle: { backgroundColor: Theme.colors.background }, headerTitleStyle: { color: Theme.colors.textPrimary } }}><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="job/[id]" options={{ title: 'Task offer' }} /><Stack.Screen name="thread/[id]" options={{ title: 'Conversation' }} /></Stack>;
}
