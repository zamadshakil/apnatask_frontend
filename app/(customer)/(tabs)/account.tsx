import { router, type Href } from 'expo-router';
import { Bell, BriefcaseBusiness, ChevronRight, Download, Headphones, LogOut, ShieldCheck, Trash2 } from 'lucide-react-native';
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Button from '../../../src/components/Button';
import Card from '../../../src/components/Card';
import { FadeIn } from '../../../src/components/Motion';
import { Screen } from '../../../src/components/Screen';
import TactilePressable from '../../../src/components/TactilePressable';
import { useSession } from '../../../src/providers/AuthProvider';
import { createIdempotencyKey, typedApi } from '../../../src/services/api';
import { enablePushNotifications } from '../../../src/services/notifications';
import { Theme } from '../../../src/styles/theme';

function SettingsRow({ icon: Icon, title, detail, danger, onPress }: { icon: React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>; title: string; detail?: string; danger?: boolean; onPress: () => void }) {
  const color = danger ? Theme.colors.error : Theme.colors.primary;
  return <TactilePressable accessibilityRole="button" onPress={onPress} style={styles.row}><View style={[styles.rowIcon, danger && styles.dangerIcon]}><Icon color={color} size={20} strokeWidth={1.9} /></View><View style={styles.rowCopy}><Text style={[styles.rowTitle, danger && { color }]}>{title}</Text>{detail && <Text style={styles.rowDetail}>{detail}</Text>}</View><ChevronRight color={Theme.colors.textTertiary} size={19} /></TactilePressable>;
}

export default function AccountScreen() {
  const { user, signOut } = useSession();
  const providerApproved = user?.capabilities.includes('provider');
  const initials = user?.display_name?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() ?? 'AT';
  const exportData = async () => { const { error } = await typedApi.POST('/api/v2/account/export', { headers: { 'Idempotency-Key': createIdempotencyKey() } }); Alert.alert(error ? 'Request failed' : 'Export requested', error ? 'Please retry.' : 'We’ll notify you when your secure export is ready.'); };
  const deleteAccount = () => Alert.alert('Delete account?', 'Active or disputed tasks must be resolved first. This starts the permanent deletion process.', [{ text: 'Keep account', style: 'cancel' }, { text: 'Request deletion', style: 'destructive', onPress: () => void typedApi.POST('/api/v2/account/deletion', { headers: { 'Idempotency-Key': createIdempotencyKey() } }).then(({ error }) => Alert.alert(error ? 'Deletion not started' : 'Deletion requested', error ? 'Resolve active tasks or contact support.' : 'You will receive confirmation when deletion is complete.')) }]);

  return <Screen>
    <FadeIn><Text style={styles.eyebrow}>YOUR APNATASK</Text><Text style={styles.heading}>Account</Text></FadeIn>
    <FadeIn delay={60}><Card variant="tinted" elevation="md" style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View><View style={styles.profileCopy}><Text style={styles.name}>{user?.display_name}</Text><Text style={styles.phone}>{user?.phone}</Text></View><ShieldCheck color={Theme.colors.primary} size={22} /></Card></FadeIn>

    <FadeIn delay={100}><Text style={styles.sectionLabel}>WORK WITH APNATASK</Text><Card style={styles.group}>
      <SettingsRow icon={BriefcaseBusiness} title={providerApproved ? 'Switch to provider' : 'Apply as a provider'} detail={providerApproved ? 'Your provider profile is approved.' : user?.provider_kyc_status ? `KYC status: ${user.provider_kyc_status}` : 'Offer services and earn from nearby work.'} onPress={() => router.push((providerApproved ? '/provider' : '/(provider)/apply') as Href)} />
      <View style={styles.divider} />
      <SettingsRow icon={Bell} title="Task notifications" detail="Offers, messages and work updates." onPress={() => void enablePushNotifications().then(() => Alert.alert('Notifications enabled')).catch((error) => Alert.alert('Could not enable notifications', error.message))} />
    </Card></FadeIn>

    <FadeIn delay={140}><Text style={styles.sectionLabel}>PRIVACY & SUPPORT</Text><Card style={styles.group}>
      <SettingsRow icon={Download} title="Request my data export" onPress={() => void exportData()} />
      <View style={styles.divider} />
      <SettingsRow icon={Headphones} title="Contact support" detail="Create an in-app support ticket." onPress={() => router.push('/(customer)/support')} />
      <View style={styles.divider} />
      <SettingsRow icon={Trash2} title="Delete my account" danger onPress={deleteAccount} />
    </Card></FadeIn>

    <FadeIn delay={180}><Button title="Sign out" type="glass" icon={<LogOut color={Theme.colors.primary} size={18} />} onPress={() => void signOut()} style={styles.signOut} /></FadeIn>
  </Screen>;
}

const styles = StyleSheet.create({
  eyebrow: { ...Theme.typography.overline, color: Theme.colors.primary },
  heading: { ...Theme.typography.display, color: Theme.colors.textPrimary, marginTop: 3 },
  profile: { flexDirection: 'row', alignItems: 'center', marginTop: Theme.spacing.xxl, padding: Theme.spacing.xl },
  avatar: { width: 58, height: 58, borderRadius: 21, backgroundColor: Theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Theme.colors.white, fontSize: 18, fontWeight: '700', letterSpacing: 0.4 },
  profileCopy: { flex: 1, marginLeft: Theme.spacing.lg },
  name: { ...Theme.typography.h3, color: Theme.colors.textPrimary },
  phone: { ...Theme.typography.bodySmall, color: Theme.colors.textSecondary, marginTop: 3 },
  sectionLabel: { ...Theme.typography.overline, color: Theme.colors.textTertiary, marginTop: Theme.spacing.xxxl, marginBottom: Theme.spacing.sm, marginLeft: 4 },
  group: { padding: 0, overflow: 'hidden' },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Theme.spacing.lg, paddingVertical: Theme.spacing.md },
  rowIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: Theme.colors.primaryMist, alignItems: 'center', justifyContent: 'center', marginRight: Theme.spacing.md },
  dangerIcon: { backgroundColor: Theme.colors.errorLight },
  rowCopy: { flex: 1 },
  rowTitle: { ...Theme.typography.body, color: Theme.colors.textPrimary, fontWeight: '600' },
  rowDetail: { ...Theme.typography.caption, color: Theme.colors.textSecondary, marginTop: 3 },
  divider: { height: 1, backgroundColor: Theme.colors.divider, marginLeft: 68 },
  signOut: { marginTop: Theme.spacing.xxl },
});
