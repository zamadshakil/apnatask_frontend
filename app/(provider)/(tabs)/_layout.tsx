import { Redirect, Tabs } from 'expo-router';
import { BriefcaseBusiness, ClipboardCheck, Coins, UserRound } from 'lucide-react-native';
import React from 'react';
import GlassTabBar from '../../../src/components/GlassTabBar';
import { StateView } from '../../../src/components/Screen';
import { useSession } from '../../../src/providers/AuthProvider';
import { Theme } from '../../../src/styles/theme';

export default function ProviderTabs() {
  const { user, loading } = useSession();
  if (loading) return <StateView title="Checking provider access…" loading />;
  if (!user?.capabilities.includes('provider')) return <Redirect href="/(customer)/(tabs)/account" />;
  return <Tabs tabBar={(props) => <GlassTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: Theme.colors.background }, tabBarHideOnKeyboard: true }}>
    <Tabs.Screen name="index" options={{ title: 'Find jobs', tabBarIcon: ({ color }) => <BriefcaseBusiness color={color} /> }} />
    <Tabs.Screen name="assigned" options={{ title: 'My work', tabBarIcon: ({ color }) => <ClipboardCheck color={color} /> }} />
    <Tabs.Screen name="credits" options={{ title: 'Credits', tabBarIcon: ({ color }) => <Coins color={color} /> }} />
    <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: ({ color }) => <UserRound color={color} /> }} />
  </Tabs>;
}
