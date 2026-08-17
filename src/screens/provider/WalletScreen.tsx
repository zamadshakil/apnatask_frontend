// src/screens/provider/WalletScreen.tsx — Premium wallet with balance card and transactions
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../navigation/AuthContext';
import { Theme } from '../../styles/theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import api from '../../services/api';
import { Wallet, ArrowUpRight, ArrowDownRight, CreditCard, RefreshCw, Landmark, CircleDollarSign } from 'lucide-react-native';

const QUICK_AMOUNTS = [100, 250, 500, 1000];

interface Transaction {
  id: string;
  type: 'topup' | 'bid_fee' | 'commission';
  amount: number;
  description: string;
  time: string;
}

export default function WalletScreen() {
  const { userId } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [topupAmount, setTopupAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Custom mock logs matching recent actions
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', type: 'topup', amount: 500, description: 'EasyPaisa Wallet Top-up', time: '1 hour ago' },
    { id: '2', type: 'bid_fee', amount: -25, description: 'Commission fee — Plumbing Job #101', time: '3 hours ago' },
    { id: '3', type: 'topup', amount: 200, description: 'JazzCash Wallet Top-up', time: '1 day ago' },
  ]);

  const providerId = userId || 'demo-provider-id';

  const fetchWalletBalance = useCallback(async (showLoading = false) => {
    if (showLoading) setFetching(true);
    try {
      const response = await api.get(`/provider/${providerId}/wallet`);
      if (response.data && typeof response.data.balance === 'number') {
        setBalance(response.data.balance);
      }
    } catch (err: any) {
      console.log('Error fetching wallet balance:', err.message);
      // Fallback to local default balance on network issue
    } finally {
      setFetching(false);
      setRefreshing(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchWalletBalance(true);
  }, [fetchWalletBalance]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWalletBalance();
  };

  const handleTopup = async (amount?: number) => {
    const finalAmount = amount || parseFloat(topupAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive amount.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/provider/${providerId}/wallet/topup`, {
        amount: finalAmount
      });
      if (response.data && typeof response.data.balance === 'number') {
        setBalance(response.data.balance);
        setTransactions((prev) => [
          {
            id: Date.now().toString(),
            type: 'topup',
            amount: finalAmount,
            description: 'Wallet Top-up via Instant Gateway',
            time: 'Just now',
          },
          ...prev,
        ]);
        setTopupAmount('');
        Alert.alert('Success! 🎉', `Rs. ${finalAmount.toLocaleString()} added to your wallet.`);
      }
    } catch (err: any) {
      Alert.alert('Top-up Failed', err.response?.data?.detail || 'Unable to complete transaction.');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'topup':
        return <ArrowUpRight size={18} color={Theme.colors.successDark} />;
      case 'bid_fee':
      case 'commission':
        return <ArrowDownRight size={18} color={Theme.colors.error} />;
      default:
        return <CircleDollarSign size={18} color={Theme.colors.textSecondary} />;
    }
  };

  if (fetching) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Syncing digital wallet...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Theme.colors.primary}
          colors={[Theme.colors.primary]}
        />
      }
    >
      {/* Balance Card Section */}
      <View style={styles.cardContainer}>
        <View style={styles.walletCard}>
          {/* Card Chip & Network */}
          <View style={styles.cardHeader}>
            <View style={styles.chipGraphic} />
            <CreditCard size={24} color="rgba(255,255,255,0.85)" />
          </View>

          {/* Balance */}
          <View style={styles.balanceSection}>
            <Text style={styles.cardLabelText}>AVAILABLE BALANCE</Text>
            <Text style={styles.balanceValueText}>Rs. {balance.toLocaleString()}</Text>
          </View>

          {/* Card Info Footer */}
          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.cardHolderLabel}>PROVIDER PARTNER ID</Text>
              <Text style={styles.cardHolderValue} numberOfLines={1} ellipsizeMode="middle">
                {String(providerId).toUpperCase()}
              </Text>
            </View>
            <View style={styles.brandContainer}>
              <Text style={styles.brandText}>ApnaTask</Text>
              <Text style={styles.brandSubtext}>PREMIUM</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Action Alerts */}
      {balance < 100 ? (
        <View style={[styles.alertBar, styles.alertError]}>
          <Text style={styles.alertText}>
            ⚠️ Balance below Rs. 100. Bidding is currently disabled. Please top up.
          </Text>
        </View>
      ) : (
        <View style={[styles.alertBar, styles.alertSuccess]}>
          <Text style={styles.alertTextSuccess}>
            ✅ Active Bidding Mode Enabled
          </Text>
        </View>
      )}

      {/* Quick Top-up Options */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Quick Recharge</Text>
        <View style={styles.quickGrid}>
          {QUICK_AMOUNTS.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={styles.amountChip}
              onPress={() => handleTopup(amount)}
              activeOpacity={0.7}
            >
              <Text style={styles.amountChipText}>Rs. {amount}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Custom Recharge Form */}
      <Card elevation="sm" style={styles.inputCard}>
        <Text style={styles.inputTitle}>Add Funds to Account</Text>
        <View style={styles.formRow}>
          <View style={styles.inputPrefixContainer}>
            <Text style={styles.currencyLabel}>PKR</Text>
            <Input
              label=""
              value={topupAmount}
              onChangeText={setTopupAmount}
              placeholder="e.g. 500"
              keyboardType="numeric"
              containerStyle={styles.textInputStyle}
            />
          </View>
          <Button
            title="Load"
            onPress={() => handleTopup()}
            type="primary"
            size="md"
            loading={loading}
            disabled={!topupAmount || loading}
            style={styles.rechargeBtn}
          />
        </View>

        {/* Local Operators */}
        <View style={styles.gatewayIconsContainer}>
          <Text style={styles.gatewayHelpText}>Instant Payment Operator Channel:</Text>
          <View style={styles.gatewayBadgeRow}>
            <View style={[styles.gatewayBadge, styles.easypaisaColor]}>
              <Text style={styles.gatewayBadgeTextText}>EasyPaisa</Text>
            </View>
            <View style={[styles.gatewayBadge, styles.jazzcashColor]}>
              <Text style={styles.gatewayBadgeTextText}>JazzCash</Text>
            </View>
            <View style={[styles.gatewayBadge, styles.bankColor]}>
              <Landmark size={12} color="#fff" style={{ marginRight: 3 }} />
              <Text style={styles.gatewayBadgeTextText}>Bank Transfer</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* History */}
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <Text style={styles.sectionHeader}>Recent Wallet Transactions</Text>
          <TouchableOpacity onPress={() => fetchWalletBalance(true)} style={styles.refreshBtn}>
            <RefreshCw size={14} color={Theme.colors.primaryLight} />
          </TouchableOpacity>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyTransactions}>
            <Text style={styles.emptyText}>No recent transactions found.</Text>
          </View>
        ) : (
          transactions.map((tx) => (
            <View key={tx.id} style={styles.transactionCard}>
              <View style={styles.txIconContainer}>
                {getTransactionIcon(tx.type)}
              </View>
              <View style={styles.txBody}>
                <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                <Text style={styles.txDate}>{tx.time}</Text>
              </View>
              <View style={styles.txValueCol}>
                <Text style={[
                  styles.txAmountText,
                  tx.amount > 0 ? styles.positiveText : styles.negativeText
                ]}>
                  {tx.amount > 0 ? '+' : ''}Rs. {Math.abs(tx.amount).toLocaleString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
      <View style={styles.bottomSpace} />
    </ScrollView>
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
    marginTop: Theme.spacing.md,
    color: Theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  cardContainer: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
    alignItems: 'center',
  },
  walletCard: {
    width: '100%',
    height: 200,
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.darkSlate,
    padding: Theme.spacing.xl,
    justifyContent: 'space-between',
    ...Theme.shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipGraphic: {
    width: 36,
    height: 26,
    borderRadius: Theme.radius.xs,
    backgroundColor: '#D4AF37', // Gold chip color
    opacity: 0.85,
  },
  balanceSection: {
    marginVertical: Theme.spacing.sm,
  },
  cardLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
  },
  balanceValueText: {
    fontSize: 32,
    fontWeight: '800',
    color: Theme.colors.white,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: Theme.spacing.md,
  },
  cardHolderLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  cardHolderValue: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
    maxWidth: 160,
  },
  brandContainer: {
    alignItems: 'flex-end',
  },
  brandText: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.white,
    letterSpacing: -0.5,
  },
  brandSubtext: {
    fontSize: 7,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 1,
  },
  alertBar: {
    marginHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.md,
    borderRadius: Theme.radius.sm,
    paddingVertical: 10,
    paddingHorizontal: Theme.spacing.md,
  },
  alertError: {
    backgroundColor: Theme.colors.errorLight,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.error,
  },
  alertSuccess: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.successDark,
  },
  alertText: {
    fontSize: 12,
    color: Theme.colors.error,
    fontWeight: '600',
  },
  alertTextSuccess: {
    fontSize: 12,
    color: Theme.colors.successDark,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.xl,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.md,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  amountChip: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Theme.colors.white,
    paddingVertical: 14,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    ...Theme.shadows.sm,
  },
  amountChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  inputCard: {
    marginHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.lg,
    padding: Theme.spacing.lg,
  },
  inputTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Theme.spacing.md,
  },
  inputPrefixContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.textSecondary,
    marginRight: Theme.spacing.sm,
    marginBottom: 4,
  },
  textInputStyle: {
    flex: 1,
    marginBottom: 0,
  },
  rechargeBtn: {
    height: 48,
    minWidth: 90,
  },
  gatewayIconsContainer: {
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
  },
  gatewayHelpText: {
    fontSize: 11,
    color: Theme.colors.textTertiary,
    marginBottom: Theme.spacing.sm,
  },
  gatewayBadgeRow: {
    flexDirection: 'row',
    gap: Theme.spacing.xs,
  },
  gatewayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 6,
    borderRadius: Theme.radius.xs,
  },
  easypaisaColor: {
    backgroundColor: '#1DAA53',
  },
  jazzcashColor: {
    backgroundColor: '#EA0038',
  },
  bankColor: {
    backgroundColor: '#1976D2',
  },
  gatewayBadgeTextText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.white,
  },
  historySection: {
    paddingHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.xl,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshBtn: {
    padding: 6,
  },
  emptyTransactions: {
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  emptyText: {
    fontSize: 13,
    color: Theme.colors.textTertiary,
    fontStyle: 'italic',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.white,
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.md,
    marginBottom: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
    ...Theme.shadows.sm,
  },
  txIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  txBody: {
    flex: 1,
  },
  txDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  txDate: {
    fontSize: 11,
    color: Theme.colors.textTertiary,
    marginTop: 2,
  },
  txValueCol: {
    alignItems: 'flex-end',
  },
  txAmountText: {
    fontSize: 14,
    fontWeight: '700',
  },
  positiveText: {
    color: Theme.colors.successDark,
  },
  negativeText: {
    color: Theme.colors.error,
  },
  bottomSpace: {
    height: 60,
  },
});
