import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Text } from 'react-native';
import Button from '../../src/components/Button';
import Input from '../../src/components/Input';
import { Screen } from '../../src/components/Screen';
import { createIdempotencyKey, typedApi } from '../../src/services/api';
import { Theme } from '../../src/styles/theme';

export default function SupportScreen() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = async () => {
    if (subject.trim().length < 3 || description.trim().length < 10) {
      return Alert.alert('More detail needed', 'Add a clear subject and description.');
    }
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
    <Screen>
      <Text style={{ ...Theme.typography.h2 }}>How can we help?</Text>
      <Text style={{ color: Theme.colors.textSecondary, marginVertical: 8 }}>Do not include your CNIC, OTP, payment PIN, or full card details.</Text>
      <Input label="Subject" value={subject} onChangeText={setSubject} />
      <Input label="What happened?" value={description} onChangeText={setDescription} multiline numberOfLines={6} />
      {errorMessage && <Text role="alert" style={{ color: Theme.colors.error, marginBottom: 8 }}>{errorMessage}</Text>}
      <Button title="Create support ticket" loading={busy} onPress={() => void submit()} />
    </Screen>
  );
}
