import { Stack } from 'expo-router';
import React from 'react';
import { Theme } from '../../src/styles/theme';

export default function ProviderLayout() {
  return (
    <Stack screenOptions={{ animation: 'slide_from_right', contentStyle: { backgroundColor: Theme.colors.background }, headerShadowVisible: false, headerStyle: { backgroundColor: Theme.colors.background }, headerTitleStyle: { color: Theme.colors.textPrimary } }}>
      <Stack.Screen name="apply" options={{ title: 'Become a provider' }} />
      <Stack.Screen name="kyc" options={{ title: 'Identity verification' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="job/[id]" options={{ title: 'Task offer' }} />
    </Stack>
  );
}
