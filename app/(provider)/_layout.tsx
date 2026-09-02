import { Stack } from 'expo-router';
import React from 'react';
import { Theme } from '../../src/styles/theme';
import i18n from '../../src/i18n';

export default function ProviderLayout() {
  return (
    <Stack screenOptions={{ animation: 'slide_from_right', contentStyle: { backgroundColor: Theme.colors.background }, headerShadowVisible: false, headerStyle: { backgroundColor: Theme.colors.background }, headerTitleStyle: { color: Theme.colors.textPrimary } }}>
      <Stack.Screen name="apply" options={{ title: i18n.t('nav.becomeProvider') }} />
      <Stack.Screen name="kyc" options={{ title: i18n.t('nav.identity') }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="job/[id]" options={{ title: i18n.t('nav.taskOffer') }} />
      <Stack.Screen name="thread/[id]" options={{ title: i18n.t('nav.conversation') }} />
    </Stack>
  );
}
