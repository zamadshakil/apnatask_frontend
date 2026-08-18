import { Tabs } from 'expo-router';
import { Home, ListTodo, MessageCircle, UserRound } from 'lucide-react-native';
import React from 'react';
import { Theme } from '../../../src/styles/theme';

export default function CustomerTabs() {
  return <Tabs screenOptions={{ headerStyle: { backgroundColor: Theme.colors.primary }, headerTintColor: '#fff', tabBarActiveTintColor: Theme.colors.primary }}>
    <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Home color={color} /> }} />
    <Tabs.Screen name="tasks" options={{ title: 'My tasks', tabBarIcon: ({ color }) => <ListTodo color={color} /> }} />
    <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarIcon: ({ color }) => <MessageCircle color={color} /> }} />
    <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: ({ color }) => <UserRound color={color} /> }} />
  </Tabs>;
}
