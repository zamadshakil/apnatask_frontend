import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock3, Coins, Gift, ShieldCheck, WalletCards } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Card from '../../../src/components/Card';
import { FadeIn } from '../../../src/components/Motion';
import { Screen, StateView } from '../../../src/components/Screen';
import { typedApi } from '../../../src/services/api';
import { Theme } from '../../../src/styles/theme';
import { formatPkr } from '../../../src/utils/format';
import i18n from '../../../src/i18n';

export default function CreditsScreen() {
  const query = useQuery({ queryKey: ['credits'], queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/credits'); if (error || !data) throw error; return data; } });
  if (query.isLoading) return <StateView title={i18n.t('experience.credits.loading')} loading />;
  if (query.isError || !query.data) return <StateView title={i18n.t('experience.credits.unavailable')} onRetry={() => query.refetch()} />;
  const value = query.data;
  return (
    <Screen>
      <FadeIn><Text style={styles.title}>{i18n.t('experience.credits.title')}</Text><Text style={styles.subtitle}>{i18n.t('experience.credits.subtitle')}</Text></FadeIn>
      <FadeIn delay={70}>
        <LinearGradient colors={[...Theme.gradients.wallet]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.wallet}>
          <View style={styles.walletTop}><View><Text style={styles.walletLabel}>{i18n.t('experience.credits.available')}</Text><Text style={styles.total}>{formatPkr(value.total_paisa)}</Text></View><View style={styles.walletIcon}><WalletCards color={Theme.colors.white} size={25} /></View></View>
          <View style={styles.split}><View><Text style={styles.splitLabel}>{i18n.t('experience.credits.promotional')}</Text><Text style={styles.splitValue}>{formatPkr(value.promotional_paisa)}</Text></View><View style={styles.rule} /><View><Text style={styles.splitLabel}>{i18n.t('experience.credits.purchased')}</Text><Text style={styles.splitValue}>{formatPkr(value.purchased_paisa)}</Text></View></View>
        </LinearGradient>
      </FadeIn>
      <FadeIn delay={130}>
        <Card elevation="md">
          <View style={styles.infoHeading}><Coins color={Theme.colors.primary} size={21} /><Text style={styles.heading}>{i18n.t('experience.credits.pricing')}</Text></View>
          <Text style={styles.body}>{value.paid_bids_enabled ? i18n.t('experience.credits.paidCopy', { fee: formatPkr(value.bid_fee_paisa) }) : i18n.t('experience.credits.freeCopy')}</Text>
          <View style={styles.note}><ShieldCheck color={Theme.colors.successDark} size={17} /><Text style={styles.noteText}>{i18n.t('experience.credits.floor', { floor: formatPkr(value.floor_paisa) })}</Text></View>
        </Card>
        <View style={styles.perks}><View style={styles.perk}><Gift color={Theme.colors.primary} size={18} /><Text style={styles.perkText}>{i18n.t('experience.credits.promoExpires')}</Text></View><View style={styles.perk}><Clock3 color={Theme.colors.primary} size={18} /><Text style={styles.perkText}>{i18n.t('experience.credits.purchasedLasts')}</Text></View></View>
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...Theme.typography.display, color: Theme.colors.textPrimary },
  subtitle: { ...Theme.typography.body, color: Theme.colors.textSecondary, marginTop: Theme.spacing.xs, marginBottom: Theme.spacing.xl },
  wallet: { borderRadius: Theme.radius.xxl, padding: Theme.spacing.xxl, marginVertical: Theme.spacing.sm, ...(Platform.OS === 'web' ? ({ boxShadow: Theme.webShadows.lg } as ViewStyle) : Theme.shadows.lg) },
  walletTop: { flexDirection: 'row', justifyContent: 'space-between' },
  walletLabel: { ...Theme.typography.overline, color: 'rgba(255,255,255,0.72)' },
  total: { ...Theme.typography.display, color: Theme.colors.white, marginTop: Theme.spacing.sm },
  walletIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  split: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xl, marginTop: Theme.spacing.xxl, paddingTop: Theme.spacing.lg, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.18)' },
  splitLabel: { ...Theme.typography.metadata, color: 'rgba(255,255,255,0.65)' },
  splitValue: { ...Theme.typography.h3, color: Theme.colors.white, marginTop: 2 },
  rule: { width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.18)' },
  infoHeading: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm },
  heading: { ...Theme.typography.h3, color: Theme.colors.textPrimary },
  body: { ...Theme.typography.body, color: Theme.colors.textSecondary, marginTop: Theme.spacing.md },
  note: { flexDirection: 'row', gap: Theme.spacing.sm, backgroundColor: Theme.colors.primaryMist, padding: Theme.spacing.md, borderRadius: Theme.radius.md, marginTop: Theme.spacing.lg },
  noteText: { ...Theme.typography.caption, color: Theme.colors.textSecondary, flex: 1 },
  perks: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.sm, marginTop: Theme.spacing.md },
  perk: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm, backgroundColor: Theme.colors.surface, padding: Theme.spacing.md, borderRadius: Theme.radius.md, borderWidth: 1, borderColor: Theme.colors.borderLight },
  perkText: { ...Theme.typography.caption, color: Theme.colors.textSecondary },
});
