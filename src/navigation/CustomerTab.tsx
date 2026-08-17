// src/navigation/CustomerTab.tsx — Premium customer bottom tab navigator with strict TypeScript types
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlusCircle, ListTodo, LogOut, Home } from 'lucide-react-native';
import CustomerHomeScreen from '../screens/customer/CustomerHomeScreen';
import CreateTaskScreen from '../screens/customer/CreateTaskScreen';
import ActiveBookingsScreen from '../screens/customer/ActiveBookingsScreen';
import { useAuth } from './AuthContext';
import { Theme } from '../styles/theme';
import { CustomerTabParamList } from '../types/navigation';

export type CustomerTabType = keyof CustomerTabParamList;

export const CustomerTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CustomerTabType>('CustomerHome');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { logout } = useAuth();

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setActiveTab('CreateTask');
  };

  const handleClearCategory = () => {
    setSelectedCategory(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />

      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>ApnaTask</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
          <LogOut size={16} color={Theme.colors.textOnPrimary} style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Screen Content */}
      <View style={styles.content}>
        {activeTab === 'CustomerHome' ? (
          <CustomerHomeScreen
            onSelectCategory={handleCategorySelect}
            onNavigateToBookings={() => setActiveTab('ActiveBookings')}
            customerName="Zamad"
            activeBooking={{
              id: 101,
              status: 'negotiating',
              amount: 1500,
            }}
          />
        ) : activeTab === 'CreateTask' ? (
          <CreateTaskScreen
            initialCategory={selectedCategory}
            onClearCategory={handleClearCategory}
          />
        ) : (
          <ActiveBookingsScreen />
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('CustomerHome')}
          style={styles.tabItem}
          activeOpacity={0.7}
          testID="tab-home"
        >
          <Home size={20} color={activeTab === 'CustomerHome' ? Theme.colors.primary : Theme.colors.textTertiary} />
          <Text style={[styles.tabLabel, activeTab === 'CustomerHome' && styles.tabLabelActive]}>
            Home
          </Text>
          {activeTab === 'CustomerHome' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('CreateTask')}
          style={styles.tabItem}
          activeOpacity={0.7}
          testID="tab-create"
        >
          <PlusCircle size={20} color={activeTab === 'CreateTask' ? Theme.colors.primary : Theme.colors.textTertiary} />
          <Text style={[styles.tabLabel, activeTab === 'CreateTask' && styles.tabLabelActive]}>
            Post Task
          </Text>
          {activeTab === 'CreateTask' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('ActiveBookings')}
          style={styles.tabItem}
          activeOpacity={0.7}
          testID="tab-bookings"
        >
          <ListTodo size={20} color={activeTab === 'ActiveBookings' ? Theme.colors.primary : Theme.colors.textTertiary} />
          <Text style={[styles.tabLabel, activeTab === 'ActiveBookings' && styles.tabLabelActive]}>
            My Bookings
          </Text>
          {activeTab === 'ActiveBookings' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
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
    paddingVertical: 14,
    ...Theme.shadows.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.textOnPrimary,
    letterSpacing: -0.3,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 6,
    borderRadius: Theme.radius.full,
  },
  logoutIcon: {
    marginRight: 4,
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

export default CustomerTab;
