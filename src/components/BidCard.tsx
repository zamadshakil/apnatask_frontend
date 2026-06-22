// src/components/BidCard.tsx — Premium bid display card for negotiation
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Theme } from '../styles/theme';
import Badge from './Badge';

interface BidCardProps {
  providerName: string;
  amount: number;
  isVerified?: boolean;
  timestamp?: string;
  onAccept?: () => void;
  onCounter?: () => void;
  isOwnBid?: boolean;
}

export default function BidCard({
  providerName,
  amount,
  isVerified = false,
  timestamp,
  onAccept,
  onCounter,
  isOwnBid = false,
}: BidCardProps) {
  return (
    <View style={[styles.container, isOwnBid ? styles.ownBid : styles.receivedBid]}>
      <View style={styles.topRow}>
        <View style={styles.providerInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {providerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{providerName}</Text>
              {isVerified && <Badge label="KYC" variant="verified" />}
            </View>
            {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
          </View>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>{isOwnBid ? 'Your offer' : 'Bid'}</Text>
          <Text style={styles.amount}>Rs. {amount.toLocaleString()}</Text>
        </View>
      </View>

      {!isOwnBid && (onAccept || onCounter) && (
        <View style={styles.actions}>
          {onAccept && (
            <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.7}>
              <Text style={styles.acceptText}>Accept Bid</Text>
            </TouchableOpacity>
          )}
          {onCounter && (
            <TouchableOpacity style={styles.counterBtn} onPress={onCounter} activeOpacity={0.7}>
              <Text style={styles.counterText}>Counter</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
    marginVertical: Theme.spacing.sm,
    ...Theme.shadows.sm,
  },
  ownBid: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.accent,
  },
  receivedBid: {
    backgroundColor: Theme.colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.moneyGold,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Theme.colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  timestamp: {
    fontSize: 11,
    color: Theme.colors.textTertiary,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 11,
    color: Theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.primary,
    letterSpacing: -0.3,
  },
  actions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderLight,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    borderRadius: Theme.radius.sm,
    alignItems: 'center',
  },
  acceptText: {
    color: Theme.colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  counterBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: Theme.radius.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
  },
  counterText: {
    color: Theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
