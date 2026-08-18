import { Tabs } from 'expo-router';
import { Home, ListTodo, MessageCircle, UserRound } from 'lucide-react-native';
import React from 'react';
import GlassTabBar from '../../../src/components/GlassTabBar';
import { Theme } from '../../../src/styles/theme';

export default function CustomerTabs() {
  return <Tabs tabBar={(props) => <GlassTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: Theme.colors.background }, tabBarHideOnKeyboard: true }}>
    <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Home color={color} /> }} />
    <Tabs.Screen name="tasks" options={{ title: 'My tasks', tabBarIcon: ({ color }) => <ListTodo color={color} /> }} />
    <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarIcon: ({ color }) => <MessageCircle color={color} /> }} />
    <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: ({ color }) => <UserRound color={color} /> }} />
  </Tabs>;
}
