import { Redirect, Tabs } from 'expo-router';
import { BriefcaseBusiness, ClipboardCheck, Coins, UserRound } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import ActiveTaskDock from '../../../src/components/ActiveTaskDock';
import GlassTabBar from '../../../src/components/GlassTabBar';
import { StateView } from '../../../src/components/Screen';
import { useSession } from '../../../src/providers/AuthProvider';
import { Theme } from '../../../src/styles/theme';
import i18n from '../../../src/i18n';

export default function ProviderTabs() {
  const { user, loading } = useSession();
  if (loading) return <StateView title={i18n.t('experience.provider.finding')} loading />;
  if (!user?.capabilities.includes('provider')) return <Redirect href="/(customer)/(tabs)/account" />;
  return <View style={styles.root}><Tabs tabBar={(props) => <GlassTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: Theme.colors.background }, tabBarHideOnKeyboard: true }}>
      <Tabs.Screen name="index" options={{ title: i18n.t('tabs.jobs'), tabBarIcon: ({ color }) => <BriefcaseBusiness color={color} /> }} />
      <Tabs.Screen name="assigned" options={{ title: i18n.t('experience.assigned.title'), tabBarIcon: ({ color }) => <ClipboardCheck color={color} /> }} />
      <Tabs.Screen name="credits" options={{ title: i18n.t('tabs.credits'), tabBarIcon: ({ color }) => <Coins color={color} /> }} />
      <Tabs.Screen name="account" options={{ title: i18n.t('tabs.account'), tabBarIcon: ({ color }) => <UserRound color={color} /> }} />
    </Tabs><ActiveTaskDock role="provider" floating /></View>;
}

const styles = StyleSheet.create({ root: { flex: 1 } });
