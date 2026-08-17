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
import { Calendar, Banknote, HelpCircle, ArrowRight, MessageSquareDashed, Clock, ChevronRight } from 'lucide-react-native';

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

// Mock data for development
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
    category: 'Electrical',
    description: 'Install 4 new switches and rewire living room circuit.',
    budget: 3000,
    status: 'accepted',
    bidsCount: 5,
    topBid: 2800,
    createdAt: '1 hour ago',
  },
];

const statusConfig: Record<string, { variant: 'success' | 'warning' | 'info' | 'neutral' | 'error'; label: string }> = {
  bidding: { variant: 'warning', label: 'Bids Pending' },
  negotiation: { variant: 'info', label: 'Negotiating' },
  accepted: { variant: 'success', label: 'Offer Accepted' },
  pending: { variant: 'neutral', label: 'Pending' },
  completed: { variant: 'success', label: 'Completed' },
  canceled: { variant: 'error', label: 'Canceled' },
};

export default function ActiveBookingsScreen() {
  const navigation = useNavigation<any>();
  const { userId } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchBookings = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      // Fetch bookings from real backend API if running
      // Since it's a customer, we can fetch their active bookings.
      // But we fallback to our mock data if not running/connected.
      const response = await api.get('/bookings');
      if (response.data && response.data.length > 0) {
        setBookings(response.data.map((b: any) => ({
          id: b.id,
          category: b.category || 'General Task',
          description: b.description || 'Request details...',
          budget: b.amount || 0,
          status: b.status || 'pending',
          bidsCount: b.bids_count || 0,
          topBid: b.top_bid || undefined,
          createdAt: 'Recently',
        })));
      } else {
        setBookings(mockBookings);
      }
    } catch (err: any) {
      setBookings(mockBookings);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings(true);
  }, [fetchBookings]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleBookingPress = (booking: Booking) => {
    navigation.navigate('CustomerNegotiationScreen', { bookingId: booking.id });
  };

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const status = statusConfig[item.status] || statusConfig.pending;

    return (
      <Card elevation="sm" onPress={() => handleBookingPress(item)} style={styles.bookingCard}>
        {/* Top Header — Category and Badge */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.categoryBadgeContainer}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
          <Badge label={status.label} variant={status.variant} />
        </View>

        {/* Task description */}
        <Text style={styles.taskDescription} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Stats Table */}
        <View style={styles.statisticsContainer}>
          <View style={styles.statColumn}>
            <Text style={styles.statHeading}>YOUR BUDGET</Text>
            <Text style={styles.statMainValue}>Rs. {item.budget.toLocaleString()}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statColumn}>
            <Text style={styles.statHeading}>TOTAL BIDS</Text>
            <Text style={[styles.statMainValue, styles.bidsCountText]}>
              {item.bidsCount}
            </Text>
          </View>
          {item.topBid && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statColumn}>
                <Text style={styles.statHeading}>LOWEST OFFER</Text>
                <Text style={[styles.statMainValue, styles.lowestBidText]}>
                  Rs. {item.topBid.toLocaleString()}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Footer actions */}
        <View style={styles.cardFooter}>
          <View style={styles.timeContainer}>
            <Clock size={12} color={Theme.colors.textTertiary} style={{ marginRight: 4 }} />
            <Text style={styles.timeText}>Posted {item.createdAt}</Text>
          </View>
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>View Chat & Bids</Text>
            <ChevronRight size={14} color={Theme.colors.primary} />
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Title Header Section */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Active Bookings</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{bookings.length} active</Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Fetching active bookings...</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBookingCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Theme.colors.primary}
              colors={[Theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MessageSquareDashed size={48} color={Theme.colors.textTertiary} style={{ marginBottom: Theme.spacing.md }} />
              <Text style={styles.emptyTitle}>No bookings found</Text>
              <Text style={styles.emptyText}>
                You don't have any active service requests right now. Go to the "Post Task" screen to hire a professional.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  loadingText: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: Theme.spacing.md,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.lg,
    paddingBottom: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: Theme.colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.radius.full,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.section,
  },
  bookingCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    ...Theme.shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  categoryBadgeContainer: {
    backgroundColor: Theme.colors.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.xs,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.white,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  taskDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: Theme.colors.textPrimary,
    lineHeight: 20,
    marginBottom: Theme.spacing.md,
  },
  statisticsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.radius.sm,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    marginBottom: Theme.spacing.md,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Theme.colors.border,
  },
  statHeading: {
    fontSize: 9,
    fontWeight: '700',
    color: Theme.colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statMainValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  bidsCountText: {
    color: Theme.colors.primaryLight,
  },
  lowestBidText: {
    color: Theme.colors.successDark,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: Theme.colors.textTertiary,
    fontWeight: '500',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.section * 2,
    paddingHorizontal: Theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.xs,
  },
  emptyText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
