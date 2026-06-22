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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../navigation/AuthContext';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import api from '../../services/api';
import { Theme } from '../../styles/theme';

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

// Development mock data — replaces the broken test mock import
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
    category: 'Electrician',
    description: 'Install new ceiling fan and check wiring in bedroom.',
    budget: 2000,
    status: 'pending',
    distance: '2.5 km',
    customerName: 'Bilal A.',
    createdAt: '20 min ago',
  },
];

const categoryIcons: Record<string, string> = {
  'Plumbing': '🔧',
  'AC Repair': '❄️',
  'Electrician': '⚡',
  'Cleaning': '🧹',
  'Painting': '🎨',
  'Carpentry': '🪚',
  'Shifting': '📦',
};

export default function FindJobsScreen() {
  const navigation = useNavigation<any>();
  const { userId, userToken } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchJobs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      // Try fetching from actual API
      const response = await api.get('/matching', {
        params: {
          latitude: 33.6844,
          longitude: 73.0479,
          radius_km: 5.0,
          category: 'plumber',
        },
      });
      
      if (response.data && response.data.length > 0) {
        setJobs(response.data.map((p: any) => ({
          id: p.provider_id,
          category: p.category,
          description: `Service provider ${p.name} available`,
          budget: 0,
          status: 'pending',
          distance: `${p.distance_km.toFixed(1)} km`,
          customerName: p.name,
        })));
      } else {
        // Fallback to mock data during development
        setJobs(mockJobs);
      }
    } catch (err: any) {
      // Use mock data when backend is not available
      setJobs(mockJobs);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
    const icon = categoryIcons[item.category] || '📋';

    return (
      <Card elevation="md" style={styles.jobCard}>
        {/* Top Row */}
        <View style={styles.jobTopRow}>
          <View style={styles.jobCategoryRow}>
            <View style={styles.categoryIconContainer}>
              <Text style={styles.categoryIcon}>{icon}</Text>
            </View>
            <View>
              <Text style={styles.jobCategory}>{item.category}</Text>
              {item.customerName && (
                <Text style={styles.customerName}>by {item.customerName}</Text>
              )}
            </View>
          </View>
          {item.distance && (
            <Badge label={item.distance} variant="info" size="md" />
          )}
        </View>

        {/* Description */}
        <Text style={styles.jobDescription} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Budget & Time */}
        <View style={styles.jobMetaRow}>
          {item.budget > 0 && (
            <View style={styles.budgetContainer}>
              <Text style={styles.budgetLabel}>Budget</Text>
              <Text style={styles.budgetValue}>Rs. {item.budget.toLocaleString()}</Text>
            </View>
          )}
          {item.createdAt && (
            <Text style={styles.timeAgo}>{item.createdAt}</Text>
          )}
        </View>

        {/* Action */}
        <Button
          title="Place Bid"
          onPress={() => handleBidPress(item)}
          type="primary"
          size="md"
          style={styles.bidButton}
        />
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Finding jobs near you...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Nearby Jobs</Text>
        <Text style={styles.headerSubtitle}>
          {jobs.length} jobs within 5 km of your location
        </Text>
      </View>

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
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No Nearby Jobs</Text>
            <Text style={styles.emptyText}>
              No jobs available in your area right now. Pull down to refresh.
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  loadingText: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.md,
  },
  headerSection: {
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.lg,
    paddingBottom: Theme.spacing.sm,
  },
  headerTitle: {
    ...Theme.typography.h2,
    color: Theme.colors.textPrimary,
  },
  headerSubtitle: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.section,
  },
  jobCard: {
    marginVertical: Theme.spacing.sm,
  },
  jobTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  jobCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0FFF4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  categoryIcon: {
    fontSize: 20,
  },
  jobCategory: {
    ...Theme.typography.h3,
    color: Theme.colors.textPrimary,
    fontSize: 16,
  },
  customerName: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
  },
  jobDescription: {
    ...Theme.typography.body,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.md,
    lineHeight: 22,
  },
  jobMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  budgetLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  timeAgo: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
  },
  bidButton: {
    width: '100%',
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
  },
});
