import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import Button from '../../src/components/Button';
import Input from '../../src/components/Input';
import { Screen } from '../../src/components/Screen';
import { supabase } from '../../src/services/supabaseClient';
import { Theme } from '../../src/styles/theme';
import { normalizePakistanPhone } from '../../src/utils/format';

const schema = z.object({ phone: z.string().min(10), otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code').optional() });
type FormData = z.infer<typeof schema>;

export default function PhoneAuthScreen() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { control, handleSubmit, setError } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { phone: '', otp: '' } });

  const submit = handleSubmit(async ({ phone, otp }) => {
    setBusy(true);
    try {
      const normalized = normalizePakistanPhone(phone);
      if (!sentTo) {
        const { error } = await supabase.auth.signInWithOtp({ phone: normalized, options: { shouldCreateUser: true } });
        if (error) throw error;
        setSentTo(normalized);
      } else {
        if (!otp) return setError('otp', { message: 'Enter the code sent by SMS' });
        const { error } = await supabase.auth.verifyOtp({ phone: sentTo, token: otp, type: 'sms' });
        if (error) throw error;
        router.replace('/');
      }
    } catch (error) {
      Alert.alert('Unable to verify', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  });

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.brand}>ApnaTask</Text>
        <Text style={styles.title}>Trusted help, close to home.</Text>
        <Text style={styles.copy}>Use your Pakistani mobile number. Standard SMS charges may apply.</Text>
      </View>
      <View style={styles.form}>
        <Controller control={control} name="phone" render={({ field, fieldState }) => (
          <Input label="Mobile number" keyboardType="phone-pad" placeholder="0300 1234567" editable={!sentTo} value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
        )} />
        {sentTo && <Controller control={control} name="otp" render={({ field, fieldState }) => (
          <Input label="6-digit verification code" keyboardType="number-pad" maxLength={6} value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
        )} />}
        <Button title={sentTo ? 'Verify and continue' : 'Send verification code'} onPress={submit} loading={busy} size="lg" />
        {sentTo && <Button title="Use a different number" onPress={() => setSentTo(null)} type="outline" />}
        <Text style={styles.terms}>By continuing, you confirm you are 18 or older and agree to ApnaTask’s Terms and Privacy Policy.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: Theme.colors.primary, borderRadius: 24, padding: 28, marginBottom: 24 },
  brand: { color: '#fff', fontWeight: '800', fontSize: 18 },
  title: { color: '#fff', fontWeight: '800', fontSize: 30, marginTop: 28 },
  copy: { color: 'rgba(255,255,255,.8)', fontSize: 15, lineHeight: 22, marginTop: 8 },
  form: { gap: 12 },
  terms: { color: Theme.colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8 },
});
