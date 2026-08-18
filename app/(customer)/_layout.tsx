import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { StateView } from '../../src/components/Screen';
import { useSession } from '../../src/providers/AuthProvider';

export default function CustomerLayout() {
  const { session, user, loading } = useSession();
  if (loading) return <StateView title="Loading your account…" loading />;
  if (!session) return <Redirect href="/(auth)/phone" />;
  if (!user) return <Redirect href="/(auth)/onboarding" />;
  return <Stack><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="task/new" options={{ title: 'Post a task', presentation: 'modal' }} /><Stack.Screen name="task/[id]" options={{ title: 'Task details' }} /><Stack.Screen name="thread/[id]" options={{ title: 'Conversation' }} /><Stack.Screen name="support" options={{ title: 'Support' }} /></Stack>;
}
