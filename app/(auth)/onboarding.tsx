import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text } from 'react-native';
import { z } from 'zod';
import Button from '../../src/components/Button';
import Input from '../../src/components/Input';
import { Screen } from '../../src/components/Screen';
import { useSession } from '../../src/providers/AuthProvider';
import { createIdempotencyKey, typedApi } from '../../src/services/api';
import { Theme } from '../../src/styles/theme';

const schema = z.object({ displayName: z.string().trim().min(2).max(100), locale: z.enum(['en', 'ur', 'ur-Latn']) });
type FormData = z.infer<typeof schema>;

export default function Onboarding() {
  const { refresh } = useSession();
  const [busy, setBusy] = useState(false);
  const { control, handleSubmit, setValue, watch } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { displayName: '', locale: 'en' } });
  const locale = watch('locale');
  const submit = handleSubmit(async (values) => {
    setBusy(true);
    try {
      const { error } = await typedApi.POST('/api/v2/auth/bootstrap', {
        body: { display_name: values.displayName, locale: values.locale, is_adult: true },
        headers: { 'Idempotency-Key': createIdempotencyKey() },
      });
      if (error) throw error;
      await refresh();
      router.replace('/');
    } catch (error) {
      Alert.alert('Profile not saved', error instanceof Error ? error.message : 'Please retry.');
    } finally { setBusy(false); }
  });
  return (
    <Screen>
      <Text style={styles.title}>Welcome to ApnaTask</Text>
      <Text style={styles.copy}>One account lets you hire help now and apply to become a provider later.</Text>
      <Controller control={control} name="displayName" render={({ field, fieldState }) => (
        <Input label="Your name" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} autoComplete="name" />
      )} />
      <Text style={styles.label}>Language</Text>
      {([['en', 'English'], ['ur', 'اردو'], ['ur-Latn', 'Roman Urdu']] as const).map(([value, label]) => (
        <Button key={value} title={label} type={locale === value ? 'primary' : 'outline'} onPress={() => setValue('locale', value)} />
      ))}
      <Button title="Create my account" onPress={submit} loading={busy} size="lg" style={{ marginTop: 24 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({ title: { ...Theme.typography.h1, color: Theme.colors.textPrimary, marginTop: 30 }, copy: { ...Theme.typography.body, color: Theme.colors.textSecondary, marginVertical: 12 }, label: { fontWeight: '700', color: Theme.colors.textPrimary, marginBottom: 8 } });
