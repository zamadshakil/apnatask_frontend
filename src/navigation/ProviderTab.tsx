// src/navigation/ProviderTab.tsx — Premium provider bottom tab navigator
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, StatusBar } from 'react-native';
import FindJobsScreen from '../screens/provider/FindJobsScreen';
import WalletScreen from '../screens/provider/WalletScreen';
import { useAuth } from './AuthContext';
import { Theme } from '../styles/theme';

interface TabItem {
  key: 'findJobs' | 'wallet';
  label: string;
  icon: string;
  activeIcon: string;
}

const TABS: TabItem[] = [
  { key: 'findJobs', label: 'Find Jobs', icon: '🔍', activeIcon: '🔍' },
  { key: 'wallet', label: 'Wallet', icon: '💰', activeIcon: '💰' },
];

export const ProviderTab = () => {
  const [activeTab, setActiveTab] = useState<'findJobs' | 'wallet'>('findJobs');
  const { logout, userId } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.darkSlate} />

      {/* Top Header Bar — Dark Slate variant for provider */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.headerTitle}>ApnaTask Pro</Text>
          <Text style={styles.headerSubtitle}>Provider #{userId}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Screen Content */}
      <View style={styles.content}>
        {activeTab === 'findJobs' ? <FindJobsScreen /> : <WalletScreen />}
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
    backgroundColor: Theme.colors.darkSlate,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.darkSlate,
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.md,
    ...Theme.shadows.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.textOnDark,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(233,237,239,0.6)',
    marginTop: 1,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 6,
    borderRadius: Theme.radius.full,
  },
  logoutText: {
    color: Theme.colors.textOnDark,
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

export default ProviderTab;
