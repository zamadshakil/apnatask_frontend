import { Stack } from 'expo-router';
import React from 'react';
export default function ProviderLayout() { return <Stack><Stack.Screen name="apply" options={{ title: 'Become a provider' }} /><Stack.Screen name="kyc" options={{ title: 'Identity verification' }} /><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="job/[id]" options={{ title: 'Task offer' }} /></Stack>; }
