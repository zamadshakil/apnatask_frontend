import { Tabs } from 'expo-router';
import { Home, ListTodo, MessageCircle, UserRound } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import ActiveTaskDock from '../../../src/components/ActiveTaskDock';
import GlassTabBar from '../../../src/components/GlassTabBar';
import { Theme } from '../../../src/styles/theme';
import i18n from '../../../src/i18n';

export default function CustomerTabs() {
  return <View style={styles.root}><Tabs tabBar={(props) => <View><ActiveTaskDock role="customer" /><GlassTabBar {...props} /></View>} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: Theme.colors.background }, tabBarHideOnKeyboard: true }}>
      <Tabs.Screen name="index" options={{ title: i18n.t('tabs.home'), tabBarIcon: ({ color }) => <Home color={color} /> }} />
      <Tabs.Screen name="tasks" options={{ title: i18n.t('tabs.tasks'), tabBarIcon: ({ color }) => <ListTodo color={color} /> }} />
      <Tabs.Screen name="messages" options={{ title: i18n.t('tabs.messages'), tabBarIcon: ({ color }) => <MessageCircle color={color} /> }} />
      <Tabs.Screen name="account" options={{ title: i18n.t('tabs.account'), tabBarIcon: ({ color }) => <UserRound color={color} /> }} />
    </Tabs></View>;
}

const styles = StyleSheet.create({ root: { flex: 1 } });
