import { Link } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import Button from '../../../src/components/Button';
import Card from '../../../src/components/Card';
import { Screen } from '../../../src/components/Screen';
import { useSession } from '../../../src/providers/AuthProvider';
import { createIdempotencyKey, typedApi } from '../../../src/services/api';
import { Theme } from '../../../src/styles/theme';
import { enablePushNotifications } from '../../../src/services/notifications';

export default function AccountScreen() {
  const { user, signOut } = useSession();
  const providerApproved = user?.capabilities.includes('provider');
  const exportData = async () => { const { error } = await typedApi.POST('/api/v2/account/export', { headers: { 'Idempotency-Key': createIdempotencyKey() } }); Alert.alert(error ? 'Request failed' : 'Export requested', error ? 'Please retry.' : 'We’ll notify you when your secure export is ready.'); };
  return <Screen>
    <Text style={styles.name}>{user?.display_name}</Text><Text style={styles.phone}>{user?.phone}</Text>
    <Card><Text style={styles.heading}>Provider mode</Text><Text style={styles.copy}>{providerApproved ? 'Your provider profile is approved.' : user?.provider_kyc_status ? `KYC status: ${user.provider_kyc_status}` : 'Apply to offer services and earn from nearby work.'}</Text>
      {providerApproved ? <Link href="/(provider)/(tabs)" asChild><Button title="Switch to provider" onPress={() => undefined} /></Link> : <Link href="/(provider)/apply" asChild><Button title="Apply as a provider" onPress={() => undefined} /></Link>}</Card>
    <Card><Text style={styles.heading}>Notifications</Text><Button title="Enable task notifications" type="outline" onPress={() => void enablePushNotifications().then(() => Alert.alert('Notifications enabled')).catch((error) => Alert.alert('Could not enable notifications', error.message))} /></Card>
    <Card><Text style={styles.heading}>Privacy and support</Text><Button title="Request my data export" type="outline" onPress={exportData} /><Link href="/(customer)/support" asChild><Button title="Contact support" type="outline" onPress={() => undefined} /></Link><Button title="Delete my account" type="danger" onPress={() => Alert.alert('Delete account?', 'Active or disputed tasks must be resolved first. This starts the permanent deletion process.', [{ text: 'Keep account', style: 'cancel' }, { text: 'Request deletion', style: 'destructive', onPress: () => void typedApi.POST('/api/v2/account/deletion', { headers: { 'Idempotency-Key': createIdempotencyKey() } }).then(({ error }) => Alert.alert(error ? 'Deletion not started' : 'Deletion requested', error ? 'Resolve active tasks or contact support.' : 'You will receive confirmation when deletion is complete.')) }])} /></Card>
    <Button title="Sign out" type="outline" onPress={() => void signOut()} />
  </Screen>;
}
const styles = StyleSheet.create({ name: { ...Theme.typography.h1, color: Theme.colors.textPrimary, marginTop: 20 }, phone: { color: Theme.colors.textSecondary, marginBottom: 12 }, heading: { ...Theme.typography.h3, color: Theme.colors.textPrimary, marginBottom: 6 }, copy: { color: Theme.colors.textSecondary, marginBottom: 12 } });
