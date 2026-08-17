import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import {
  Star,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Wallet,
  ArrowRight,
  TrendingUp,
  Award,
  ShieldAlert,
} from 'lucide-react-native';
import { Theme } from '../../styles/theme';
import Card from '../../components/Card';

interface ProviderHomeScreenProps {
  onNavigateToFindJobs: () => void;
  onNavigateToWallet: () => void;
  providerName?: string;
  walletBalance?: number;
}

export default function ProviderHomeScreen({
  onNavigateToFindJobs,
  onNavigateToWallet,
  providerName = 'Ali Khan',
  walletBalance = 1250,
}: ProviderHomeScreenProps) {
  const [isOnline, setIsOnline] = useState(true);

  // Weekly target calculations
  const weeklyTarget = 15000;
  const targetPercentage = Math.min((walletBalance / weeklyTarget) * 100, 100);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Top Welcome Pro Header */}
      <View style={styles.welcomeContainer}>
        <View style={styles.rowJustify}>
          <View>
            <Text style={styles.welcomeSub}>PARTNER PORTAL ⚡</Text>
            <Text style={styles.welcomeName}>{providerName}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{providerName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        {/* Online Status Toggle Panel */}
        <Card style={[styles.statusCard, isOnline ? styles.statusCardOnline : styles.statusCardOffline]} elevation="sm">
          <View style={styles.statusInfo}>
            <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
            <View>
              <Text style={styles.statusTitle}>{isOnline ? 'You are Online' : 'You are Offline'}</Text>
              <Text style={styles.statusDesc}>
                {isOnline ? 'Active & matching nearby job requests' : 'Go online to receive new requests'}
              </Text>
            </View>
          </View>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: '#767577', true: '#81C784' }}
            thumbColor={isOnline ? Theme.colors.successDark : '#f4f3f4'}
          />
        </Card>
      </View>

      {/* Stats Counter Row */}
      <View style={styles.statsRow}>
        <Card style={styles.metricCard} elevation="sm">
          <View style={styles.metricHeader}>
            <Star size={16} color="#FFB300" fill="#FFB300" />
            <Text style={styles.metricVal}>4.9</Text>
          </View>
          <Text style={styles.metricLbl}>Your Rating</Text>
        </Card>
        <Card style={styles.metricCard} elevation="sm">
          <View style={styles.metricHeader}>
            <CheckCircle size={16} color={Theme.colors.successDark} />
            <Text style={styles.metricVal}>28</Text>
          </View>
          <Text style={styles.metricLbl}>Jobs Completed</Text>
        </Card>
        <Card style={styles.metricCard} elevation="sm">
          <View style={styles.metricHeader}>
            <Briefcase size={16} color={Theme.colors.primaryLight} />
            <Text style={styles.metricVal}>3</Text>
          </View>
          <Text style={styles.metricLbl}>Active Bids</Text>
        </Card>
      </View>

      {/* Earnings Dashboard & Goal Tracker */}
      <Card style={styles.earningsCard} elevation="md" onPress={onNavigateToWallet}>
        <View style={styles.earningsHeader}>
          <View>
            <Text style={styles.earningsLabel}>CURRENT BALANCE</Text>
            <Text style={styles.earningsValue}>Rs. {walletBalance.toLocaleString()}</Text>
          </View>
          <View style={styles.walletIconCircle}>
            <Wallet size={24} color={Theme.colors.white} />
          </View>
        </View>

        {/* Weekly Goal Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressTextRow}>
            <Text style={styles.progressLabel}>Weekly Earnings Target</Text>
            <Text style={styles.progressValue}>
              Rs. {walletBalance.toLocaleString()} / Rs. {weeklyTarget.toLocaleString()}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${targetPercentage}%` }]} />
          </View>
          <Text style={styles.progressHint}>
            {targetPercentage >= 100 ? '🎉 Weekly target achieved!' : `${Math.round(100 - targetPercentage)}% remaining to reach your goal`}
          </Text>
        </View>

        <View style={styles.earningsFooter}>
          <Text style={styles.earningsFooterText}>Withdraw funds or view history</Text>
          <ArrowRight size={16} color={Theme.colors.successDark} />
        </View>
      </Card>

      {/* Fast Action Quick Links */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={onNavigateToFindJobs} activeOpacity={0.7}>
            <View style={[styles.actionIconContainer, styles.jobsIconBg]}>
              <Briefcase size={20} color={Theme.colors.primary} />
            </View>
            <Text style={styles.actionBtnLabel}>Find Leads</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={onNavigateToWallet} activeOpacity={0.7}>
            <View style={[styles.actionIconContainer, styles.walletIconBg]}>
              <Wallet size={20} color="#1565C0" />
            </View>
            <Text style={styles.actionBtnLabel}>Top-up Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <View style={[styles.actionIconContainer, styles.kycIconBg]}>
              <Award size={20} color="#E65100" />
            </View>
            <Text style={styles.actionBtnLabel}>Verify KYC</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Safety Alert Widget */}
      <Card style={styles.alertCard} elevation="sm">
        <View style={styles.alertHeaderRow}>
          <ShieldAlert size={20} color="#E65100" />
          <Text style={styles.alertTitle}>Safety & Bidding Guardrails</Text>
        </View>
        <Text style={styles.alertDesc}>
          1. Keep your wallet balance above **Rs. 100** to remain active for bidding.
          2. Never accept off-app cash advances; always request booking confirmation through ApnaTask to secure payout protection.
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
    marginBottom: Theme.spacing.lg,
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.darkSlate,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  avatarText: {
    color: Theme.colors.white,
    fontWeight: '700',
    fontSize: 18,
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.md,
    borderWidth: 1.5,
  },
  statusCardOnline: {
    borderColor: '#C8E6C9',
    backgroundColor: '#F1F8E9',
  },
  statusCardOffline: {
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.white,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotOnline: {
    backgroundColor: Theme.colors.successDark,
  },
  dotOffline: {
    backgroundColor: Theme.colors.textTertiary,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  statusDesc: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Theme.colors.white,
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  metricLbl: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  earningsCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    marginBottom: Theme.spacing.xl,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
    paddingBottom: Theme.spacing.md,
  },
  earningsLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Theme.colors.textTertiary,
    letterSpacing: 1,
  },
  earningsValue: {
    fontSize: 26,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  walletIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.successDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSection: {
    marginTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.successDark,
  },
  progressHint: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  earningsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
    paddingTop: Theme.spacing.md,
    marginTop: Theme.spacing.xs,
  },
  earningsFooterText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.successDark,
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    width: '30%',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    ...Theme.shadows.sm,
  },
  jobsIconBg: {
    backgroundColor: '#E8F5E9',
  },
  walletIconBg: {
    backgroundColor: '#E3F2FD',
  },
  kycIconBg: {
    backgroundColor: '#FFE0B2',
  },
  actionBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    textAlign: 'center',
  },
  alertCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    marginTop: Theme.spacing.sm,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E65100',
  },
  alertDesc: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 40,
  },
});
