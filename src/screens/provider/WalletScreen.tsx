// src/screens/provider/WalletScreen.tsx — Premium wallet with balance card and transactions
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../../navigation/AuthContext';
import { Theme } from '../../styles/theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';

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
  const [balance, setBalance] = useState(150);
  const [topupAmount, setTopupAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', type: 'topup', amount: 200, description: 'Wallet Top-up', time: '2 hours ago' },
    { id: '2', type: 'bid_fee', amount: -50, description: 'Bid fee — Plumbing Job #101', time: '5 hours ago' },
  ]);

  const handleTopup = (amount?: number) => {
    const finalAmount = amount || parseFloat(topupAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive amount.');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setBalance((prev) => prev + finalAmount);
      setTransactions((prev) => [
        {
          id: Date.now().toString(),
          type: 'topup',
          amount: finalAmount,
          description: 'Wallet Top-up via EasyPaisa',
          time: 'Just now',
        },
        ...prev,
      ]);
      setTopupAmount('');
      setLoading(false);
      Alert.alert('Success! 🎉', `Rs. ${finalAmount.toLocaleString()} added to your wallet.`);
    }, 800);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'topup': return '💰';
      case 'bid_fee': return '📤';
      case 'commission': return '💼';
      default: return '💵';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceCardInner}>
          <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
          <Text style={styles.balanceAmount}>Rs. {balance.toLocaleString()}</Text>
          <Text style={styles.balanceSubtext}>Provider ID: {userId}</Text>

          {balance < 100 && (
            <View style={styles.lowBalanceWarning}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                Balance below Rs. 100 — you cannot place bids
              </Text>
            </View>
          )}

          {/* Balance Status Indicator */}
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, balance >= 100 ? styles.dotGreen : styles.dotRed]} />
            <Text style={styles.statusText}>
              {balance >= 100 ? 'Bidding Enabled' : 'Bidding Disabled'}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Top-up */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Top-up</Text>
        <View style={styles.quickAmountRow}>
          {QUICK_AMOUNTS.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={styles.quickAmountChip}
              onPress={() => handleTopup(amount)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickAmountText}>Rs. {amount}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Custom Amount */}
      <Card elevation="sm" style={styles.customTopupCard}>
        <Text style={styles.customTitle}>Custom Amount</Text>
        <View style={styles.customRow}>
          <View style={styles.customInputWrapper}>
            <Text style={styles.currencyPrefix}>Rs.</Text>
            <Input
              label=""
              value={topupAmount}
              onChangeText={setTopupAmount}
              placeholder="Enter amount"
              keyboardType="numeric"
              containerStyle={styles.customInput}
            />
          </View>
          <Button
            title="Add Money"
            onPress={() => handleTopup()}
            type="accent"
            size="md"
            loading={loading}
            disabled={!topupAmount}
          />
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentMethods}>
          <Text style={styles.paymentLabel}>Payment via:</Text>
          <View style={styles.paymentIcons}>
            <View style={styles.paymentBadge}>
              <Text style={styles.paymentBadgeText}>EasyPaisa</Text>
            </View>
            <View style={styles.paymentBadge}>
              <Text style={styles.paymentBadgeText}>JazzCash</Text>
            </View>
            <View style={styles.paymentBadge}>
              <Text style={styles.paymentBadgeText}>Bank</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Transaction History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions.map((tx) => (
          <View key={tx.id} style={styles.transactionItem}>
            <View style={styles.txIcon}>
              <Text>{getTransactionIcon(tx.type)}</Text>
            </View>
            <View style={styles.txDetails}>
              <Text style={styles.txDescription}>{tx.description}</Text>
              <Text style={styles.txTime}>{tx.time}</Text>
            </View>
            <Text style={[
              styles.txAmount,
              tx.amount > 0 ? styles.txPositive : styles.txNegative,
            ]}>
              {tx.amount > 0 ? '+' : ''}Rs. {Math.abs(tx.amount).toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  // Balance Card
  balanceCard: {
    marginHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.lg,
    borderRadius: Theme.radius.xl,
    backgroundColor: Theme.colors.primary,
    overflow: 'hidden',
    ...Theme.shadows.lg,
  },
  balanceCardInner: {
    padding: Theme.spacing.xxl,
    alignItems: 'center',
  },
  balanceLabel: {
    ...Theme.typography.overline,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Theme.spacing.sm,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: Theme.colors.white,
    letterSpacing: -1,
  },
  balanceSubtext: {
    ...Theme.typography.caption,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  lowBalanceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 6,
    borderRadius: Theme.radius.full,
    marginTop: Theme.spacing.lg,
    gap: 6,
  },
  warningIcon: {
    fontSize: 14,
  },
  warningText: {
    fontSize: 12,
    color: Theme.colors.warning,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: {
    backgroundColor: Theme.colors.accent,
  },
  dotRed: {
    backgroundColor: Theme.colors.error,
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  // Quick Top-up
  section: {
    paddingHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.xxl,
  },
  sectionTitle: {
    ...Theme.typography.h3,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.md,
  },
  quickAmountRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  quickAmountChip: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    ...Theme.shadows.sm,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  // Custom Top-up
  customTopupCard: {
    marginHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.xl,
  },
  customTitle: {
    ...Theme.typography.h3,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.md,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Theme.spacing.md,
  },
  customInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    marginRight: 4,
    marginBottom: Theme.spacing.lg,
  },
  customInput: {
    flex: 1,
    marginBottom: 0,
  },
  paymentMethods: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
    gap: Theme.spacing.sm,
  },
  paymentLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
  },
  paymentIcons: {
    flexDirection: 'row',
    gap: 6,
  },
  paymentBadge: {
    backgroundColor: Theme.colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.xs,
  },
  paymentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  // Transaction History
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  txDetails: {
    flex: 1,
  },
  txDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: Theme.colors.textPrimary,
  },
  txTime: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  txPositive: {
    color: Theme.colors.successDark,
  },
  txNegative: {
    color: Theme.colors.error,
  },
  bottomPad: {
    height: 40,
  },
});
