import { router } from 'expo-router';
import { Camera, CreditCard, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import Input from '../../src/components/Input';
import { FadeIn } from '../../src/components/Motion';
import { Screen } from '../../src/components/Screen';
import { useSession } from '../../src/providers/AuthProvider';
import { createIdempotencyKey, typedApi } from '../../src/services/api';
import { pickTaskImages, PreparedImage, uploadImage } from '../../src/services/uploads';
import { Theme } from '../../src/styles/theme';
type Slot = 'front' | 'back' | 'selfie';
const documentSlots: { slot: Slot; label: string; detail: string; icon: typeof CreditCard }[] = [
  { slot: 'front', label: 'CNIC front', detail: 'Clear, uncropped image', icon: CreditCard },
  { slot: 'back', label: 'CNIC back', detail: 'Clear, uncropped image', icon: CreditCard },
  { slot: 'selfie', label: 'Current selfie', detail: 'Face the camera in good light', icon: UserRound },
];

export default function KycScreen() {
  const { refresh } = useSession();
  const [last4, setLast4] = useState('');
  const [files, setFiles] = useState<Partial<Record<Slot, PreparedImage>>>({});
  const [busy, setBusy] = useState(false);
  const pick = async (slot: Slot) => { const image = (await pickTaskImages(1))[0]; if (image) setFiles((value) => ({ ...value, [slot]: image })); };
  const submit = async () => {
    if (!/^\d{4}$/.test(last4) || !files.front || !files.back || !files.selfie) return Alert.alert('Documents required', 'Add both CNIC sides, a current selfie, and the last four CNIC digits.');
    setBusy(true);
    try {
      const [front, back, selfie] = await Promise.all([uploadImage(files.front, 'kyc'), uploadImage(files.back, 'kyc'), uploadImage(files.selfie, 'kyc')]);
      const { error } = await typedApi.POST('/api/v2/provider/kyc', { headers: { 'Idempotency-Key': createIdempotencyKey() }, body: { cnic_last4: last4, cnic_front_key: front, cnic_back_key: back, selfie_key: selfie, consent: true } });
      if (error) throw error;
      await refresh();
      Alert.alert('Submitted for review', 'We’ll notify you after the manual review.');
      router.replace('/(customer)/(tabs)/account');
    } catch {
      Alert.alert('KYC not submitted', 'Your images remain only on this device. Please retry securely.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen topInset={false}>
      <FadeIn>
        <View style={styles.iconWell}><ShieldCheck color={Theme.colors.primary} size={27} /></View>
        <Text style={styles.title}>Verify your identity</Text>
        <Text style={styles.copy}>A secure, one-time review helps customers trust the people arriving at their homes.</Text>
      </FadeIn>
      <FadeIn delay={70}>
        <Card elevation="md">
          <Input label="Last 4 CNIC digits" value={last4} onChangeText={(value) => setLast4(value.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" placeholder="0000" />
          <View style={styles.slots}>
            {documentSlots.map(({ slot, label, detail, icon: Icon }) => <View key={slot} style={styles.slot}>
              {files[slot] ? <Image source={{ uri: files[slot]!.uri }} style={styles.image} /> : <View style={styles.placeholder}><Icon color={Theme.colors.primary} size={24} /><Text style={styles.slotLabel}>{label}</Text><Text style={styles.slotDetail}>{detail}</Text></View>}
              <Button title={files[slot] ? `Replace ${label}` : `Add ${label}`} type="outline" size="sm" icon={<Camera color={Theme.colors.primary} size={16} />} onPress={() => void pick(slot)} />
            </View>)}
          </View>
        </Card>
      </FadeIn>
      <FadeIn delay={130}>
        <View style={styles.security}><LockKeyhole color={Theme.colors.textTertiary} size={17} /><Text style={styles.securityText}>Documents are encrypted separately and visible only to authorized reviewers. Never share them in chat.</Text></View>
        <Button title="Submit for manual review" loading={busy} onPress={() => void submit()} />
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconWell: { width: 54, height: 54, borderRadius: 18, backgroundColor: Theme.colors.primaryMist, alignItems: 'center', justifyContent: 'center', marginBottom: Theme.spacing.lg },
  title: { ...Theme.typography.h1, color: Theme.colors.textPrimary },
  copy: { ...Theme.typography.body, color: Theme.colors.textSecondary, marginTop: Theme.spacing.sm, marginBottom: Theme.spacing.xl, maxWidth: 540 },
  slots: { gap: Theme.spacing.lg, marginTop: Theme.spacing.sm },
  slot: { borderTopWidth: 1, borderTopColor: Theme.colors.divider, paddingTop: Theme.spacing.lg, gap: Theme.spacing.sm },
  placeholder: { minHeight: 135, borderRadius: Theme.radius.md, backgroundColor: Theme.colors.surfaceMuted, borderWidth: 1, borderStyle: 'dashed', borderColor: Theme.colors.border, alignItems: 'center', justifyContent: 'center', padding: Theme.spacing.lg },
  image: { width: '100%', height: 180, borderRadius: Theme.radius.md },
  slotLabel: { ...Theme.typography.bodySmall, fontWeight: '600', color: Theme.colors.textPrimary, marginTop: Theme.spacing.sm },
  slotDetail: { ...Theme.typography.caption, color: Theme.colors.textTertiary, marginTop: 2 },
  security: { flexDirection: 'row', alignItems: 'flex-start', gap: Theme.spacing.sm, marginVertical: Theme.spacing.lg, paddingHorizontal: Theme.spacing.sm },
  securityText: { ...Theme.typography.caption, color: Theme.colors.textTertiary, flex: 1 },
});
