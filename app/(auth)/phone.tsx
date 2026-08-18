import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import Input from '../../src/components/Input';
import { FadeIn } from '../../src/components/Motion';
import { Screen } from '../../src/components/Screen';
import { supabase } from '../../src/services/supabaseClient';
import { Theme } from '../../src/styles/theme';
import { normalizePakistanPhone } from '../../src/utils/format';
import { PhoneAuthFormData, phoneAuthSchema } from '../../src/validation/phoneAuth';

export default function PhoneAuthScreen() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'error' | 'success'; message: string } | null>(null);
  const { control, handleSubmit, setError } = useForm<PhoneAuthFormData>({ resolver: zodResolver(phoneAuthSchema), defaultValues: { phone: '', otp: '' } });

  const submit = handleSubmit(async ({ phone, otp }) => {
    setBusy(true);
    setFeedback(null);
    try {
      const normalized = normalizePakistanPhone(phone);
      if (!sentTo) {
        const { error } = await supabase.auth.signInWithOtp({ phone: normalized, options: { shouldCreateUser: true } });
        if (error) throw error;
        setSentTo(normalized);
        setFeedback({
          tone: 'success',
          message: __DEV__ ? 'Local code ready. Enter 123456 to continue.' : 'Verification code sent by SMS.',
        });
      } else {
        if (!otp) return setError('otp', { message: 'Enter the code sent by SMS' });
        const { error } = await supabase.auth.verifyOtp({ phone: sentTo, token: otp, type: 'sms' });
        if (error) throw error;
        router.replace('/');
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Please try again.';
      const message = __DEV__ && /fetch|network/i.test(detail)
        ? 'Local authentication is not running. Start the ApnaTask local services, then retry.'
        : detail;
      setFeedback({ tone: 'error', message });
      Alert.alert('Unable to verify', message);
    } finally {
      setBusy(false);
    }
  });

  return (
    <Screen style={styles.screen}>
      <FadeIn><LinearGradient colors={Theme.gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <Text style={styles.brand}>ApnaTask</Text>
        <Text style={styles.title}>Trusted help, close to home.</Text>
        <Text style={styles.copy}>Use your Pakistani mobile number. Standard SMS charges may apply.</Text>
      </LinearGradient></FadeIn>
      <FadeIn delay={80}><Card variant="glass" elevation="md" style={styles.form}>
        {__DEV__ && <Text style={styles.localHint}>Local preview: use 0300 0000001, then code 123456.</Text>}
        <Controller control={control} name="phone" render={({ field, fieldState }) => (
          <Input label="Mobile number" keyboardType="phone-pad" placeholder="0300 1234567" editable={!sentTo} value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
        )} />
        {sentTo && <Controller control={control} name="otp" render={({ field, fieldState }) => (
          <Input label="6-digit verification code" keyboardType="number-pad" maxLength={6} value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
        )} />}
        {feedback && (
          <Text
            accessibilityLiveRegion="polite"
            role={feedback.tone === 'error' ? 'alert' : undefined}
            style={feedback.tone === 'error' ? styles.error : styles.success}
          >
            {feedback.message}
          </Text>
        )}
        <Button title={sentTo ? 'Verify and continue' : 'Send verification code'} onPress={submit} loading={busy} size="lg" />
        {sentTo && <Button title="Use a different number" onPress={() => { setSentTo(null); setFeedback(null); }} type="outline" />}
        <Text style={styles.terms}>By continuing, you confirm you are 18 or older and agree to ApnaTask’s Terms and Privacy Policy.</Text>
      </Card></FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { maxWidth: 580, paddingTop: Theme.spacing.xxl },
  hero: { borderRadius: Theme.radius.xxl, padding: 30, marginBottom: Theme.spacing.xl, ...(Platform.OS === 'web' ? ({ boxShadow: Theme.webShadows.lg } as ViewStyle) : Theme.shadows.lg) },
  brand: { ...Theme.typography.h3, color: '#fff' },
  title: { ...Theme.typography.display, color: '#fff', marginTop: 34 },
  copy: { ...Theme.typography.body, color: 'rgba(255,255,255,.78)', marginTop: 9 },
  form: { gap: 4, padding: Theme.spacing.xl, borderRadius: Theme.radius.xl },
  terms: { color: Theme.colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8 },
  localHint: { color: Theme.colors.textSecondary, fontSize: 13, lineHeight: 20 },
  error: { color: Theme.colors.error, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  success: { color: Theme.colors.successDark, fontSize: 14, lineHeight: 20, fontWeight: '600' },
});
