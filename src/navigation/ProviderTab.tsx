// src/navigation/ProviderTab.tsx — Premium provider bottom tab navigator with strict TypeScript types
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Wallet, LogOut, Home } from 'lucide-react-native';
import ProviderHomeScreen from '../screens/provider/ProviderHomeScreen';
import FindJobsScreen from '../screens/provider/FindJobsScreen';
import WalletScreen from '../screens/provider/WalletScreen';
import { useAuth } from './AuthContext';
import { Theme } from '../styles/theme';
import { ProviderTabParamList } from '../types/navigation';

export type ProviderTabType = keyof ProviderTabParamList;

export const ProviderTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProviderTabType>('ProviderHome');
  const { logout } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.darkSlate} />

      {/* Top Header Bar — Dark Slate variant for provider */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.headerTitle}>ApnaTask Pro</Text>
          <Text style={styles.headerSubtitle}>Logged in securely</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
          <LogOut size={16} color={Theme.colors.textOnDark} style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Screen Content */}
      <View style={styles.content}>
        {activeTab === 'ProviderHome' ? (
          <ProviderHomeScreen
            onNavigateToFindJobs={() => setActiveTab('FindJobs')}
            onNavigateToWallet={() => setActiveTab('ProviderWallet')}
            providerName="Ali Khan"
            walletBalance={2450}
          />
        ) : activeTab === 'FindJobs' ? (
          <FindJobsScreen />
        ) : (
          <WalletScreen />
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('ProviderHome')}
          style={styles.tabItem}
          activeOpacity={0.7}
          testID="tab-home"
        >
          <Home size={20} color={activeTab === 'ProviderHome' ? Theme.colors.primary : Theme.colors.textTertiary} />
          <Text style={[styles.tabLabel, activeTab === 'ProviderHome' && styles.tabLabelActive]}>
            Home
          </Text>
          {activeTab === 'ProviderHome' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('FindJobs')}
          style={styles.tabItem}
          activeOpacity={0.7}
          testID="tab-findJobs"
        >
          <Search size={20} color={activeTab === 'FindJobs' ? Theme.colors.primary : Theme.colors.textTertiary} />
          <Text style={[styles.tabLabel, activeTab === 'FindJobs' && styles.tabLabelActive]}>
            Find Jobs
          </Text>
          {activeTab === 'FindJobs' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('ProviderWallet')}
          style={styles.tabItem}
          activeOpacity={0.7}
          testID="tab-wallet"
        >
          <Wallet size={20} color={activeTab === 'ProviderWallet' ? Theme.colors.primary : Theme.colors.textTertiary} />
          <Text style={[styles.tabLabel, activeTab === 'ProviderWallet' && styles.tabLabelActive]}>
            Wallet
          </Text>
          {activeTab === 'ProviderWallet' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
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
    paddingVertical: 14,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 6,
    borderRadius: Theme.radius.full,
    gap: 4,
  },
  logoutIcon: {
    marginRight: 2,
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
    paddingVertical: 12,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textTertiary,
    letterSpacing: 0.2,
    marginTop: 4,
  },
  tabLabelActive: {
    color: Theme.colors.primary,
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
