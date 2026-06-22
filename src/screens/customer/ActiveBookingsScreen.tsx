// src/screens/customer/ActiveBookingsScreen.tsx — Premium active bookings with live bid tracking
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../../styles/theme';
import { useAuth } from '../../navigation/AuthContext';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import api from '../../services/api';

interface Booking {
  id: number;
  category: string;
  description: string;
  budget: number;
  status: string;
  bidsCount: number;
  topBid?: number;
  createdAt?: string;
}

// Mock data for development — will be replaced with real API data
const mockBookings: Booking[] = [
  {
    id: 101,
    category: 'Plumbing',
    description: 'Fix leaking pipe under kitchen sink. Need urgent repair.',
    budget: 1500,
    status: 'bidding',
    bidsCount: 3,
    topBid: 1200,
    createdAt: '2 min ago',
  },
  {
    id: 102,
    category: 'AC Repair',
    description: 'General cleaning and gas refill for 1.5 ton split unit AC.',
    budget: 2500,
    status: 'negotiation',
    bidsCount: 1,
    topBid: 2200,
    createdAt: '15 min ago',
  },
  {
    id: 103,
    category: 'Electrician',
    description: 'Install 4 new switches and rewire living room circuit.',
    budget: 3000,
    status: 'accepted',
    bidsCount: 5,
    topBid: 2800,
    createdAt: '1 hour ago',
  },
];

const statusConfig: Record<string, { variant: 'success' | 'warning' | 'info' | 'neutral'; label: string }> = {
  bidding: { variant: 'warning', label: 'Bidding Active' },
  negotiation: { variant: 'info', label: 'Negotiating' },
  accepted: { variant: 'success', label: 'Accepted' },
  pending: { variant: 'neutral', label: 'Pending' },
  completed: { variant: 'success', label: 'Completed' },
  canceled: { variant: 'error' as any, label: 'Canceled' },
};

export default function ActiveBookingsScreen() {
  const navigation = useNavigation<any>();
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // In production, fetch from API
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleBookingPress = (booking: Booking) => {
    navigation.navigate('CustomerNegotiationScreen', { bookingId: booking.id });
  };

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const status = statusConfig[item.status] || statusConfig.pending;

    return (
      <Card elevation="md" onPress={() => handleBookingPress(item)}>
        {/* Top Row — Category & Status */}
        <View style={styles.cardTopRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <Badge label={status.label} variant={status.variant} />
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>BUDGET</Text>
            <Text style={styles.statValue}>Rs. {item.budget.toLocaleString()}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>BIDS</Text>
            <Text style={[styles.statValue, styles.bidCount]}>{item.bidsCount}</Text>
          </View>
          {item.topBid && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>LOWEST</Text>
                <Text style={[styles.statValue, styles.topBid]}>
                  Rs. {item.topBid.toLocaleString()}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          {item.createdAt && (
            <Text style={styles.timeText}>Posted {item.createdAt}</Text>
          )}
          <View style={styles.viewBidsLink}>
            <Text style={styles.viewBidsText}>View Bids →</Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Bookings</Text>
        <Text style={styles.sectionCount}>{bookings.length} tasks</Text>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBookingCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Theme.colors.primary}
            colors={[Theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Active Tasks</Text>
            <Text style={styles.emptyText}>
              Post a task to get started — providers will bid on it instantly!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.lg,
    paddingBottom: Theme.spacing.sm,
  },
  sectionTitle: {
    ...Theme.typography.h3,
    color: Theme.colors.textPrimary,
  },
  sectionCount: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
    backgroundColor: Theme.colors.borderLight,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.radius.full,
  },
  listContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.section,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  categoryBadge: {
    backgroundColor: Theme.colors.primaryDark,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 4,
    borderRadius: Theme.radius.xs,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textOnPrimary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  description: {
    ...Theme.typography.body,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.lg,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.radius.sm,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Theme.colors.border,
  },
  statLabel: {
    ...Theme.typography.overline,
    color: Theme.colors.textTertiary,
    marginBottom: 2,
    fontSize: 10,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  bidCount: {
    color: Theme.colors.primaryLight,
  },
  topBid: {
    color: Theme.colors.successDark,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
  },
  timeText: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
  },
  viewBidsLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewBidsText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.section * 2,
    paddingHorizontal: Theme.spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Theme.spacing.lg,
  },
  emptyTitle: {
    ...Theme.typography.h3,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.sm,
  },
  emptyText: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
