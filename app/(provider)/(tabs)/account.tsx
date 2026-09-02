import { Link } from 'expo-router';
import { BadgeCheck, ChevronRight, CircleUserRound, ShieldCheck, UserRoundCog } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../../../src/components/Button';
import Card from '../../../src/components/Card';
import { FadeIn } from '../../../src/components/Motion';
import { Screen } from '../../../src/components/Screen';
import { useSession } from '../../../src/providers/AuthProvider';
import { Theme } from '../../../src/styles/theme';

export default function ProviderAccount() {
  const { user } = useSession();
  const initials = (user?.display_name || 'Provider').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  return (
    <Screen>
      <FadeIn>
        <Text style={styles.overline}>PROVIDER PROFILE</Text>
        <View style={styles.profile}><View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View><View style={styles.profileCopy}><Text style={styles.title}>{user?.display_name || 'Provider'}</Text><View style={styles.verified}><BadgeCheck size={17} color={Theme.colors.verified} /><Text style={styles.verifiedText}>KYC approved provider</Text></View></View></View>
      </FadeIn>
      <FadeIn delay={80}>
        <Card elevation="md">
          <View style={styles.row}><View style={styles.rowIcon}><ShieldCheck color={Theme.colors.primary} size={20} /></View><View style={styles.rowCopy}><Text style={styles.rowTitle}>Identity verified</Text><Text style={styles.rowDetail}>Your provider profile is active</Text></View><ChevronRight color={Theme.colors.textTertiary} size={19} /></View>
          <View style={styles.divider} />
          <View style={styles.row}><View style={styles.rowIcon}><UserRoundCog color={Theme.colors.primary} size={20} /></View><View style={styles.rowCopy}><Text style={styles.rowTitle}>Services & availability</Text><Text style={styles.rowDetail}>Manage the work you receive</Text></View><ChevronRight color={Theme.colors.textTertiary} size={19} /></View>
        </Card>
      </FadeIn>
      <FadeIn delay={140}>
        <Link href="/(customer)/(tabs)" asChild><Button title="Switch to customer mode" type="outline" icon={<CircleUserRound color={Theme.colors.primary} size={18} />} onPress={() => undefined} style={styles.switch} /></Link>
        <Text style={styles.modeNote}>Your customer and provider activity stays separate while using one account.</Text>
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  overline: { ...Theme.typography.overline, color: Theme.colors.textTertiary },
  profile: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.lg, marginTop: Theme.spacing.lg, marginBottom: Theme.spacing.xxl },
  avatar: { width: 72, height: 72, borderRadius: 25, backgroundColor: Theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  initials: { ...Theme.typography.h2, color: Theme.colors.white },
  profileCopy: { flex: 1 },
  title: { ...Theme.typography.h1, color: Theme.colors.textPrimary },
  verified: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xs, marginTop: Theme.spacing.xs },
  verifiedText: { ...Theme.typography.caption, color: Theme.colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.md, paddingVertical: Theme.spacing.xs },
  rowIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: Theme.colors.primaryMist, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1 },
  rowTitle: { ...Theme.typography.body, fontWeight: '600', color: Theme.colors.textPrimary },
  rowDetail: { ...Theme.typography.caption, color: Theme.colors.textTertiary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Theme.colors.divider, marginVertical: Theme.spacing.lg },
  switch: { marginTop: Theme.spacing.xl },
  modeNote: { ...Theme.typography.caption, color: Theme.colors.textTertiary, textAlign: 'center', marginTop: Theme.spacing.md, paddingHorizontal: Theme.spacing.xl },
});
