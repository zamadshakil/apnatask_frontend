// src/screens/provider/FindJobsScreen.tsx — Premium job discovery screen
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../navigation/AuthContext';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import api from '../../services/api';
import { Theme } from '../../styles/theme';
import { MapPin, Clock, Banknote, ShieldCheck, Search, Filter, Briefcase } from 'lucide-react-native';

interface Job {
  id: number;
  category: string;
  description: string;
  budget: number;
  status: string;
  distance?: string;
  customerName?: string;
  createdAt?: string;
}

// Development mock data
const mockJobs: Job[] = [
  {
    id: 101,
    category: 'Plumbing',
    description: 'Fix leaking pipe under kitchen sink. Urgent repair needed.',
    budget: 1500,
    status: 'pending',
    distance: '0.8 km',
    customerName: 'Ahmed K.',
    createdAt: '5 min ago',
  },
  {
    id: 102,
    category: 'AC Repair',
    description: 'Split unit AC not cooling. Need gas refill and general maintenance.',
    budget: 2500,
    status: 'pending',
    distance: '1.2 km',
    customerName: 'Sara M.',
    createdAt: '12 min ago',
  },
  {
    id: 103,
    category: 'Electrical',
    description: 'Install new ceiling fan and check wiring in bedroom.',
    budget: 2000,
    status: 'pending',
    distance: '2.5 km',
    customerName: 'Bilal A.',
    createdAt: '20 min ago',
  },
  {
    id: 104,
    category: 'Cleaning',
    description: 'Full house deep cleaning before moving in. 3-bedroom house.',
    budget: 4500,
    status: 'pending',
    distance: '3.1 km',
    customerName: 'Zainab R.',
    createdAt: '35 min ago',
  },
];

const categories = ['All', 'Plumbing', 'AC Repair', 'Electrical', 'Cleaning', 'Painting', 'Carpentry'];

const categoryValues: Record<string, string> = {
  Plumbing: 'plumber',
  'AC Repair': 'ac_repair',
  Electrical: 'electrician',
  Cleaning: 'cleaning',
  Painting: 'painting',
  Carpentry: 'carpenter',
};

const categoryLabels: Record<string, string> = Object.fromEntries(
  Object.entries(categoryValues).map(([label, value]) => [value, label])
);

export default function FindJobsScreen() {
  const navigation = useNavigation<any>();
  const { userId, userToken } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchJobs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await api.get('/jobs', {
        params: {
          category: selectedCategory === 'All' ? undefined : categoryValues[selectedCategory],
        },
      });

      if (response.data && response.data.length > 0) {
        setJobs(response.data.map((job: any) => ({
          id: job.id,
          category: categoryLabels[job.category] || job.category || 'General',
          description: job.description || 'Service request',
          budget: job.budget || 0,
          status: job.status || 'pending',
          distance: 'Nearby',
          customerName: 'ApnaTask Customer',
          createdAt: 'Just now',
        })));
      } else {
        // Fallback to mock data filtered by category
        setJobs(
          selectedCategory === 'All'
            ? mockJobs
            : mockJobs.filter((job) => job.category === selectedCategory)
        );
      }
    } catch (err: any) {
      // Use mock data when backend is not fully available
      setJobs(
        selectedCategory === 'All'
          ? mockJobs
          : mockJobs.filter((job) => job.category === selectedCategory)
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleBidPress = (job: Job) => {
    navigation.navigate('ProviderNegotiationScreen', {
      bookingId: job.id,
      token: userToken || `mock-jwt-provider-${userId}`,
    });
  };

  const renderJobCard = ({ item }: { item: Job }) => {
    return (
      <Card elevation="sm" style={styles.jobCard}>
        {/* Top Metadata Row */}
        <View style={styles.jobTopRow}>
          <View style={styles.categoryBadge}>
            <Briefcase size={12} color={Theme.colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.jobCategory}>{item.category}</Text>
          </View>
          <View style={styles.distanceBadgeRow}>
            <MapPin size={12} color={Theme.colors.textSecondary} style={{ marginRight: 2 }} />
            <Text style={styles.distanceText}>{item.distance || 'Nearby'}</Text>
          </View>
        </View>

        {/* Client Name & Verification */}
        <View style={styles.clientRow}>
          <Text style={styles.customerName}>{item.customerName || 'ApnaTask User'}</Text>
          <View style={styles.verifiedContainer}>
            <ShieldCheck size={14} color={Theme.colors.successDark} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        </View>

        {/* Task Description */}
        <Text style={styles.jobDescription} numberOfLines={3}>
          {item.description}
        </Text>

        {/* Pricing, Timing, and Bid Action */}
        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.budgetCol}>
            <Text style={styles.budgetLabel}>CLIENT BUDGET</Text>
            <View style={styles.budgetRow}>
              <Banknote size={16} color={Theme.colors.successDark} style={{ marginRight: 4 }} />
              <Text style={styles.budgetValue}>Rs. {item.budget.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.timeCol}>
            <Clock size={12} color={Theme.colors.textTertiary} style={{ marginRight: 4 }} />
            <Text style={styles.timeAgo}>{item.createdAt || '10m ago'}</Text>
          </View>
        </View>

        <Button
          title="Send Bid Offer"
          onPress={() => handleBidPress(item)}
          type="primary"
          size="md"
          style={styles.bidButton}
        />
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Header Banner */}
      <View style={styles.headerBanner}>
        <Text style={styles.headerTitle}>Nearby Jobs</Text>
        <Text style={styles.headerSubtitle}>
          Real-time service request matching for verified partners
        </Text>
      </View>

      {/* Categories Filter Bar */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipActive
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Jobs List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Searching matching leads...</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderJobCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchJobs(true)}
              tintColor={Theme.colors.primary}
              colors={[Theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Search size={44} color={Theme.colors.textTertiary} style={{ marginBottom: Theme.spacing.md }} />
              <Text style={styles.emptyTitle}>No matching jobs</Text>
              <Text style={styles.emptyText}>
                No pending requests for "{selectedCategory}" in your region. Pull down to refresh or check other categories.
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
  headerBanner: {
    backgroundColor: Theme.colors.primaryDark,
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.xl,
    paddingBottom: Theme.spacing.lg,
    borderBottomLeftRadius: Theme.radius.lg,
    borderBottomRightRadius: Theme.radius.lg,
    ...Theme.shadows.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.white,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 4,
  },
  filterSection: {
    paddingVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.background,
  },
  filterScrollContent: {
    paddingHorizontal: Theme.spacing.lg,
    gap: Theme.spacing.xs,
  },
  filterChip: {
    backgroundColor: Theme.colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: Theme.colors.white,
  },
  listContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.section,
  },
  jobCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    ...Theme.shadows.sm,
  },
  jobTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.xs,
  },
  jobCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
    textTransform: 'uppercase',
  },
  distanceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.sm,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Theme.radius.xs,
    gap: 2,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1565C0',
  },
  jobDescription: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: Theme.spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.borderLight,
    marginBottom: Theme.spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  budgetCol: {
    justifyContent: 'center',
  },
  budgetLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Theme.colors.textTertiary,
    letterSpacing: 0.5,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  timeCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeAgo: {
    fontSize: 11,
    color: Theme.colors.textTertiary,
    fontWeight: '500',
  },
  bidButton: {
    width: '100%',
    borderRadius: Theme.radius.sm,
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
