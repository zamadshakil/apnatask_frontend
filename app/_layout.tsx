import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { AppProviders } from '../src/providers/AppProviders';
import { runtime } from '../src/config/runtime';
import { Theme } from '../src/styles/theme';

Sentry.init({
  dsn: runtime.sentryDsn,
  enabled: Boolean(runtime.sentryDsn),
  environment: runtime.appVariant,
  sendDefaultPii: false,
  tracesSampleRate: runtime.isProduction ? 0.1 : runtime.isHosted ? 0.05 : 1,
  beforeSend(event) {
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
      delete event.request.headers;
      if (event.request.url) event.request.url = event.request.url.split('?')[0];
    }
    event.breadcrumbs = event.breadcrumbs?.map((breadcrumb) => ({
      ...breadcrumb,
      message: breadcrumb.category === 'ui.click' ? 'UI interaction' : breadcrumb.message,
      data: undefined,
    }));
    return event;
  },
});

function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="auto" />
      <Stack screenOptions={{ animation: 'fade', contentStyle: { backgroundColor: Theme.colors.background }, headerShadowVisible: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(customer)" options={{ headerShown: false }} />
        <Stack.Screen name="(provider)" options={{ headerShown: false }} />
        <Stack.Screen name="provider" options={{ headerShown: false }} />
        <Stack.Screen name="(public)" options={{ headerShown: false }} />
      </Stack>
    </AppProviders>
  );
}

export default Sentry.wrap(RootLayout);
