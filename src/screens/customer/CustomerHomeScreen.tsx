import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  Wrench,
  Zap,
  Trash,
  Eye,
  PenTool,
  Snowflake,
  Box,
  Plus,
  Search,
  Bell,
  Sliders,
  TrendingUp,
  Clock,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react-native';
import { Theme } from '../../styles/theme';
import Card from '../../components/Card';

interface CustomerHomeScreenProps {
  onSelectCategory: (category: string) => void;
  onNavigateToBookings: () => void;
  customerName?: string;
  activeBooking?: {
    id: number;
    status: 'pending' | 'negotiating' | 'accepted' | 'completed';
    amount: number;
  } | null;
}

const CATEGORIES = [
  { id: 'plumber', label: 'Plumbing', icon: Wrench, color: '#E8F5E9', iconColor: '#2E7D32' },
  { id: 'electrician', label: 'Electrical', icon: Zap, color: '#FFF3E0', iconColor: '#EF6C00' },
  { id: 'ac_repair', label: 'AC Repair', icon: Snowflake, color: '#E1F5FE', iconColor: '#0288D1' },
  { id: 'cleaning', label: 'Cleaning', icon: Trash, color: '#FFEBEE', iconColor: '#C62828' },
  { id: 'painting', label: 'Painting', icon: Eye, color: '#F3E5F5', iconColor: '#6A1B9A' },
  { id: 'carpenter', label: 'Carpentry', icon: PenTool, color: '#efebe9', iconColor: '#4e342e' },
  { id: 'shifting', label: 'Shifting', icon: Box, color: '#E8EAF6', iconColor: '#283593' },
  { id: 'other', label: 'Other', icon: Plus, color: '#ECEFF1', iconColor: '#37474F' },
];

export default function CustomerHomeScreen({
  onSelectCategory,
  onNavigateToBookings,
  customerName = 'Zamad',
  activeBooking,
}: CustomerHomeScreenProps) {
  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'negotiating': return 2;
      case 'accepted': return 3;
      case 'completed': return 4;
      default: return 0;
    }
  };

  const activeStep = activeBooking ? getStatusStep(activeBooking.status) : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Premium Welcome Header */}
      <View style={styles.welcomeContainer}>
        <View style={styles.rowJustify}>
          <View>
            <Text style={styles.welcomeSub}>GOOD MORNING 👋</Text>
            <Text style={styles.welcomeName}>{customerName}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Bell size={20} color={Theme.colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{customerName.charAt(0).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Premium Search Bar */}
        <View style={styles.searchBar}>
          <Search size={20} color={Theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search for plumber, electrician..."
            placeholderTextColor={Theme.colors.textTertiary}
            style={styles.searchInput}
            editable={false}
          />
          <TouchableOpacity style={styles.filterBtn}>
            <Sliders size={18} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Counter Row */}
      <View style={styles.statsRow}>
        <Card style={styles.statsCard} elevation="sm">
          <TrendingUp size={20} color={Theme.colors.primary} />
          <Text style={styles.statsVal}>2</Text>
          <Text style={styles.statsLbl}>Active Tasks</Text>
        </Card>
        <Card style={styles.statsCard} elevation="sm">
          <Clock size={20} color={Theme.colors.info} />
          <Text style={styles.statsVal}>12</Text>
          <Text style={styles.statsLbl}>Completed</Text>
        </Card>
        <Card style={styles.statsCard} elevation="sm">
          <ShieldCheck size={20} color={Theme.colors.successDark} />
          <Text style={styles.statsVal}>Rs. 8.4k</Text>
          <Text style={styles.statsLbl}>Total Spent</Text>
        </Card>
      </View>

      {/* Active Booking Tracker Widget */}
      {activeBooking && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Active Task Status</Text>
          <Card style={styles.trackerCard} elevation="md" onPress={onNavigateToBookings}>
            <View style={styles.trackerHeader}>
              <Text style={styles.trackerTitle}>Booking #{activeBooking.id}</Text>
              <Text style={styles.trackerPrice}>Rs. {activeBooking.amount.toLocaleString()}</Text>
            </View>
            <Text style={styles.trackerStatus}>
              Current Status: <Text style={styles.statusHighlight}>{activeBooking.status.toUpperCase()}</Text>
            </Text>

            {/* Stepper progress indicator */}
            <View style={styles.stepperContainer}>
              {[
                { label: 'Posted', step: 1 },
                { label: 'Bidding', step: 2 },
                { label: 'Accepted', step: 3 },
                { label: 'Done', step: 4 },
              ].map((item, idx) => {
                const isActive = activeStep >= item.step;
                const isLineActive = activeStep > item.step;
                return (
                  <View key={item.label} style={styles.stepWrapper}>
                    <View style={styles.stepLineWrapper}>
                      <View style={[styles.stepCircle, isActive && styles.stepCircleActive]}>
                        {isActive && <View style={styles.stepCircleInner} />}
                      </View>
                      {idx < 3 && (
                        <View style={[styles.stepLine, isLineActive && styles.stepLineActive]} />
                      )}
                    </View>
                    <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{item.label}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.trackerFooter}>
              <Text style={styles.trackerLink}>View details & negotiate bids</Text>
              <ChevronRight size={16} color={Theme.colors.primary} />
            </View>
          </Card>
        </View>
      )}

      {/* Categories Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>What service do you need?</Text>
        <View style={styles.gridContainer}>
          {CATEGORIES.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <TouchableOpacity
                key={cat.id}
                style={styles.gridItem}
                onPress={() => onSelectCategory(cat.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.gridIconContainer, { backgroundColor: cat.color }]}>
                  <IconComponent size={24} color={cat.iconColor} />
                </View>
                <Text style={styles.gridLabel}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Safety Promotion banner */}
      <Card style={styles.promoCard} elevation="sm">
        <View style={styles.promoBadge}>
          <Text style={styles.promoBadgeText}>100% SECURE</Text>
        </View>
        <Text style={styles.promoTitle}>Verified Professionals Only</Text>
        <Text style={styles.promoDesc}>
          All ApnaTask partners go through a rigorous background check & biometric registration. Payment is held securely in escrow until you approve the work.
        </Text>
      </Card>
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    padding: Theme.spacing.lg,
  },
  welcomeContainer: {
    marginBottom: Theme.spacing.lg,
  },
  rowJustify: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeSub: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    letterSpacing: 1.5,
  },
  welcomeName: {
    fontSize: 24,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Theme.colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.md,
    marginTop: Theme.spacing.lg,
    height: 52,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    ...Theme.shadows.sm,
  },
  searchIcon: {
    marginRight: Theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.textPrimary,
  },
  filterBtn: {
    padding: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.xl,
  },
  statsCard: {
    flex: 1,
    backgroundColor: Theme.colors.white,
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  statsVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginTop: 6,
  },
  statsLbl: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    marginBottom: Theme.spacing.xl,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.md,
  },
  trackerCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: Theme.colors.primaryLight,
  },
  trackerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  trackerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  trackerPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  trackerStatus: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.lg,
  },
  statusHighlight: {
    fontWeight: '700',
    color: Theme.colors.primaryLight,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.xs,
    marginBottom: Theme.spacing.md,
  },
  stepWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  stepLineWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
    height: 20,
  },
  stepCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepCircleActive: {
    backgroundColor: Theme.colors.primary,
  },
  stepCircleInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.white,
  },
  stepLine: {
    position: 'absolute',
    left: '50%',
    right: '-50%',
    height: 3,
    backgroundColor: '#E0E0E0',
    zIndex: 1,
  },
  stepLineActive: {
    backgroundColor: Theme.colors.primary,
  },
  stepLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Theme.colors.textTertiary,
    marginTop: 6,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: Theme.colors.textPrimary,
    fontWeight: '700',
  },
  trackerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
    paddingTop: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
  },
  trackerLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '22%',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  gridIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    ...Theme.shadows.sm,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    textAlign: 'center',
  },
  promoCard: {
    backgroundColor: '#ECEFF1',
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    marginTop: Theme.spacing.sm,
  },
  promoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.radius.xs,
    marginBottom: Theme.spacing.sm,
  },
  promoBadgeText: {
    color: Theme.colors.white,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  promoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  promoDesc: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 40,
  },
});
