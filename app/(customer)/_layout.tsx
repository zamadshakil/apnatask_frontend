import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { StateView } from '../../src/components/Screen';
import { useSession } from '../../src/providers/AuthProvider';
import { Theme } from '../../src/styles/theme';

export default function CustomerLayout() {
  const { session, user, loading } = useSession();
  if (loading) return <StateView title="Loading your account…" loading />;
  if (!session) return <Redirect href="/(auth)/phone" />;
  if (!user) return <Redirect href="/(auth)/onboarding" />;
  return <Stack screenOptions={{ animation: 'slide_from_right', headerShadowVisible: false, headerTintColor: Theme.colors.primary, headerStyle: { backgroundColor: Theme.colors.background }, headerTitleStyle: { color: Theme.colors.textPrimary, fontWeight: '600' }, contentStyle: { backgroundColor: Theme.colors.background } }}><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="task/new" options={{ title: 'Post a task', presentation: 'modal', animation: 'slide_from_bottom' }} /><Stack.Screen name="task/[id]" options={{ title: 'Task details' }} /><Stack.Screen name="thread/[id]" options={{ title: 'Conversation' }} /><Stack.Screen name="support" options={{ title: 'Support', presentation: 'modal', animation: 'slide_from_bottom' }} /></Stack>;
}
