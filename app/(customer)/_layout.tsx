import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { StateView } from '../../src/components/Screen';
import { useSession } from '../../src/providers/AuthProvider';
import { Theme } from '../../src/styles/theme';
import i18n from '../../src/i18n';

export default function CustomerLayout() {
  const { session, user, loading } = useSession();
  if (loading) return <StateView title={i18n.t('nav.loadingAccount')} loading />;
  if (!session) return <Redirect href="/(auth)/phone" />;
  if (!user) return <Redirect href="/(auth)/onboarding" />;
  return <Stack screenOptions={{ animation: 'slide_from_right', headerShadowVisible: false, headerTintColor: Theme.colors.primary, headerStyle: { backgroundColor: Theme.colors.background }, headerTitleStyle: { color: Theme.colors.textPrimary, fontWeight: '600' }, contentStyle: { backgroundColor: Theme.colors.background } }}><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="task/new" options={{ title: i18n.t('nav.postTask'), presentation: 'modal', animation: 'slide_from_bottom' }} /><Stack.Screen name="task/[id]" options={{ title: i18n.t('nav.taskDetails') }} /><Stack.Screen name="thread/[id]" options={{ title: i18n.t('nav.conversation') }} /><Stack.Screen name="support" options={{ title: i18n.t('nav.support'), presentation: 'modal', animation: 'slide_from_bottom' }} /></Stack>;
}
