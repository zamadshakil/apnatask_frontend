import { router } from 'expo-router';
import { Headphones, LockKeyhole, MessageCircleMore } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import Input from '../../src/components/Input';
import { FadeIn } from '../../src/components/Motion';
import { Screen } from '../../src/components/Screen';
import { createIdempotencyKey, typedApi } from '../../src/services/api';
import { Theme } from '../../src/styles/theme';

export default function SupportScreen() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = async () => {
    if (subject.trim().length < 3 || description.trim().length < 10) return Alert.alert('More detail needed', 'Add a clear subject and description.');
    setBusy(true);
    setErrorMessage(null);
    try {
      const { error } = await typedApi.POST('/api/v2/support/tickets', {
        headers: { 'Idempotency-Key': createIdempotencyKey() },
        body: { subject: subject.trim(), description: description.trim(), priority: 'normal' },
      });
      if (error) throw new Error('The support service rejected this request.');
      Alert.alert('Support ticket created', 'Our team will respond in the app.');
      router.back();
    } catch {
      setErrorMessage('Ticket not created. Check your connection and retry.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen topInset={false}>
      <FadeIn>
        <View style={styles.iconWell}><Headphones color={Theme.colors.primary} size={26} /></View>
        <Text style={styles.title}>How can we help?</Text>
        <Text style={styles.intro}>Tell us what happened and our support team will follow up inside ApnaTask.</Text>
      </FadeIn>
      <FadeIn delay={70}>
        <Card elevation="md" style={styles.formCard}>
          <View style={styles.formHeading}><MessageCircleMore color={Theme.colors.primary} size={20} /><Text style={styles.formTitle}>New support request</Text></View>
          <Input label="Subject" value={subject} onChangeText={setSubject} placeholder="A short summary" />
          <Input label="What happened?" value={description} onChangeText={setDescription} multiline numberOfLines={6} placeholder="Include the details that will help us investigate" />
          {errorMessage && <Text role="alert" style={styles.error}>{errorMessage}</Text>}
          <Button title="Create support ticket" loading={busy} onPress={() => void submit()} />
        </Card>
      </FadeIn>
      <FadeIn delay={130}>
        <View style={styles.securityNote}><LockKeyhole color={Theme.colors.textTertiary} size={16} /><Text style={styles.securityText}>Never include your CNIC, OTP, payment PIN, or full card details.</Text></View>
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconWell: { width: 54, height: 54, borderRadius: 18, backgroundColor: Theme.colors.primaryMist, alignItems: 'center', justifyContent: 'center', marginBottom: Theme.spacing.lg },
  title: { ...Theme.typography.h1, color: Theme.colors.textPrimary },
  intro: { ...Theme.typography.body, color: Theme.colors.textSecondary, marginTop: Theme.spacing.sm, marginBottom: Theme.spacing.xl, maxWidth: 520 },
  formCard: { padding: Theme.spacing.xl },
  formHeading: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm, marginBottom: Theme.spacing.md },
  formTitle: { ...Theme.typography.h3, color: Theme.colors.textPrimary },
  error: { ...Theme.typography.bodySmall, color: Theme.colors.error, marginBottom: Theme.spacing.md },
  securityNote: { flexDirection: 'row', alignItems: 'flex-start', gap: Theme.spacing.sm, paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.lg },
  securityText: { ...Theme.typography.caption, color: Theme.colors.textTertiary, flex: 1 },
});
