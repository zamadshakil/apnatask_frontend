// src/navigation/CustomerTab.tsx — Premium customer bottom tab navigator
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, StatusBar } from 'react-native';
import CreateTaskScreen from '../screens/customer/CreateTaskScreen';
import ActiveBookingsScreen from '../screens/customer/ActiveBookingsScreen';
import { useAuth } from './AuthContext';
import { Theme } from '../styles/theme';

interface TabItem {
  key: 'create' | 'bookings';
  label: string;
  icon: string;
  activeIcon: string;
}

const TABS: TabItem[] = [
  { key: 'create', label: 'Post Task', icon: '📝', activeIcon: '📝' },
  { key: 'bookings', label: 'My Bookings', icon: '📋', activeIcon: '📋' },
];

export const CustomerTab = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'bookings'>('create');
  const { logout } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />

      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>ApnaTask</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Screen Content */}
      <View style={styles.content}>
        {activeTab === 'create' ? <CreateTaskScreen /> : <ActiveBookingsScreen />}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              activeOpacity={0.7}
              testID={`tab-${tab.key}`}
            >
              <Text style={styles.tabIcon}>{isActive ? tab.activeIcon : tab.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.md,
    ...Theme.shadows.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.textOnPrimary,
    letterSpacing: -0.3,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 6,
    borderRadius: Theme.radius.full,
  },
  logoutText: {
    color: Theme.colors.textOnPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
    paddingBottom: 4,
    ...Theme.shadows.lg,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.sm,
    position: 'relative',
  },
  tabItemActive: {
    // active styling handled by children
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Theme.colors.textTertiary,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: Theme.colors.primary,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
});

export default CustomerTab;
