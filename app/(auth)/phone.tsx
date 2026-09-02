import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Mail, ShieldCheck, Smartphone } from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import Input from '../../src/components/Input';
import { FadeIn } from '../../src/components/Motion';
import { Screen } from '../../src/components/Screen';
import { supabase } from '../../src/services/supabaseClient';
import { Theme } from '../../src/styles/theme';
import TactilePressable from '../../src/components/TactilePressable';
import { setLocale, type SupportedLocale } from '../../src/i18n';
import { normalizePakistanPhone } from '../../src/utils/format';
import { EmailAuthFormData, emailAuthSchema, PhoneAuthFormData, phoneAuthErrorKey, phoneAuthSchema } from '../../src/validation/phoneAuth';
import { runtime } from '../../src/config/runtime';
import { ApnaTaskLogo } from '../../src/components/brand/ApnaTaskLogo';
import { parseEntryIntent } from '../../src/navigation/entryIntent';

export default function PhoneAuthScreen() {
  const params = useLocalSearchParams<{ intent?: string | string[] }>();
  const intent = parseEntryIntent(params.intent);
  const { t, i18n } = useTranslation();
  const emailMode = runtime.authMode === 'email';
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'error' | 'success'; message: string } | null>(null);
  const phoneForm = useForm<PhoneAuthFormData>({ resolver: zodResolver(phoneAuthSchema), defaultValues: { phone: '', otp: '' } });
  const emailForm = useForm<EmailAuthFormData>({ resolver: zodResolver(emailAuthSchema), defaultValues: { email: '', otp: '' } });

  const complete = async (destination: string, otp: string) => {
    setBusy(true);
    setFeedback(null);
    try {
      if (runtime.localAuthToken) {
        setFeedback({ tone: 'success', message: t('auth.localCode') });
        router.replace({ pathname: '/', params: { intent } });
        return;
      }
      if (!sentTo) {
        const emailRedirectTo = Platform.OS === 'web' && typeof window !== 'undefined'
          ? `${window.location.origin}/`
          : undefined;
        const result = emailMode
          ? await supabase.auth.signInWithOtp({
              email: destination,
              // Alpha identities are provisioned by invitation. Keeping account
              // creation off prevents a public URL from becoming a free-email
              // relay or consuming the shared Supabase auth quota.
              options: {
                shouldCreateUser: runtime.appVariant !== 'alpha',
                emailRedirectTo,
              },
            })
          : await supabase.auth.signInWithOtp({ phone: destination, options: { shouldCreateUser: true } });
        const { error } = result;
        if (error) throw error;
        setSentTo(destination);
        setFeedback({
          tone: 'success',
          message: emailMode ? t('auth.emailSent') : __DEV__ ? t('auth.localCode') : t('auth.smsSent'),
        });
      } else {
        if (!otp) {
          if (emailMode) emailForm.setError('otp', { message: t('auth.enterCode') });
          else phoneForm.setError('otp', { message: t('auth.enterCode') });
          return;
        }
        const result = emailMode
          ? await supabase.auth.verifyOtp({ email: sentTo, token: otp, type: 'email' })
          : await supabase.auth.verifyOtp({ phone: sentTo, token: otp, type: 'sms' });
        const { error } = result;
        if (error) throw error;
        router.replace({ pathname: '/', params: { intent } });
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : t('auth.retry');
      const errorKey = phoneAuthErrorKey(detail, Boolean(runtime.localAuthToken));
      const message = t(emailMode && errorKey === 'serviceUnavailable' ? 'auth.emailUnavailable' : `auth.${errorKey}`);
      setFeedback({ tone: 'error', message });
    } finally {
      setBusy(false);
    }
  };

  const submit = emailMode
    ? emailForm.handleSubmit(({ email, otp }) => complete(email.trim().toLowerCase(), otp))
    : phoneForm.handleSubmit(({ phone, otp }) => complete(normalizePakistanPhone(phone), otp));

  return (
    <Screen style={styles.screen}>
      <View style={styles.topbar}>
        <View style={styles.brandLogo}><ApnaTaskLogo size={38} /></View>
        <View style={styles.languages}>{([['en', 'EN'], ['ur-Latn', 'Roman']] as [SupportedLocale, string][]).map(([locale, label]) => <TactilePressable accessibilityRole="button" accessibilityState={{ selected: i18n.language === locale }} key={locale} onPress={() => void setLocale(locale)} style={[styles.languageButton, i18n.language === locale && styles.languageButtonActive]}><Text style={[styles.languageButtonText, i18n.language === locale && styles.languageButtonTextActive]}>{label}</Text></TactilePressable>)}</View>
      </View>
      <FadeIn><View style={styles.hero}>
        <Text style={styles.eyebrow}>{t('auth.title')}</Text>
        <Text style={styles.title}>{t('auth.hero')}</Text>
        <Text style={styles.copy}>{t(emailMode ? 'auth.copyEmail' : 'auth.copy')}</Text>
      </View></FadeIn>
      <FadeIn delay={80}><Card elevation="md" style={styles.form}>
        {runtime.localAuthToken && <View style={styles.localBanner}><View style={styles.localIcon}><Smartphone color={Theme.colors.primary} size={19} /></View><Text style={styles.localHint}>{t('auth.localHint')}</Text></View>}
        {emailMode ? <Controller control={emailForm.control} name="email" render={({ field, fieldState }) => (
          <Input label={t('auth.email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder={t('auth.emailPlaceholder')} editable={!sentTo} value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} icon={<Mail size={18} color={Theme.colors.textTertiary} />} />
        )} /> : <Controller control={phoneForm.control} name="phone" render={({ field, fieldState }) => (
          <Input label={t('auth.phone')} keyboardType="phone-pad" placeholder={t('auth.phonePlaceholder')} editable={!sentTo} value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
        )} />}
        {sentTo && !emailMode && <Controller control={phoneForm.control} name="otp" render={({ field, fieldState }) => (
          <Input label={t('auth.otpLabel')} keyboardType="number-pad" maxLength={6} value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
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
        {(!sentTo || !emailMode) && <Button title={runtime.localAuthToken ? t('auth.openPreview') : sentTo ? t('auth.verify') : t(emailMode ? 'auth.sendEmail' : 'auth.sendFull')} onPress={submit} loading={busy} size="lg" />}
        {sentTo && <Button title={t('auth.different')} onPress={() => { setSentTo(null); setFeedback(null); }} type="outline" />}
        <View style={styles.termsRow}><ShieldCheck color={Theme.colors.textTertiary} size={15} /><Text style={styles.terms}>{t('auth.terms')}</Text></View>
      </Card></FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { maxWidth: 500, width: '100%', alignSelf: 'center', paddingTop: Theme.spacing.xl },
  topbar: { minHeight: 48, flexDirection: 'row', alignItems: 'center', marginBottom: Theme.spacing.xxxl },
  brandLogo: { flex: 1 },
  languages: { flexDirection: 'row', gap: 6 },
  languageButton: { minHeight: 40, paddingHorizontal: Theme.spacing.md, borderRadius: Theme.radius.full, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  languageButtonActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  languageButtonText: { ...Theme.typography.caption, color: Theme.colors.textSecondary, fontWeight: '700' },
  languageButtonTextActive: { color: Theme.colors.white },
  hero: { marginBottom: Theme.spacing.xxl },
  eyebrow: { ...Theme.typography.overline, color: Theme.colors.primary },
  title: { ...Theme.typography.h1, color: Theme.colors.textPrimary, marginTop: 7, flexShrink: 1 },
  copy: { ...Theme.typography.bodySmall, color: Theme.colors.textSecondary, marginTop: 9, maxWidth: 440 },
  form: { gap: 4, padding: Theme.spacing.xl, borderRadius: Theme.radius.xl, ...(Platform.OS === 'web' ? ({ boxShadow: Theme.webShadows.lg } as ViewStyle) : Theme.shadows.lg) },
  localBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: Theme.spacing.sm, padding: Theme.spacing.md, backgroundColor: Theme.colors.primaryMist, borderRadius: Theme.radius.md, marginBottom: Theme.spacing.lg },
  localIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: Theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  localHint: { ...Theme.typography.caption, color: Theme.colors.textSecondary, flex: 1, paddingTop: 1 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 7, marginTop: Theme.spacing.md, paddingHorizontal: Theme.spacing.sm },
  terms: { color: Theme.colors.textSecondary, fontSize: 12, lineHeight: 18, flex: 1 },
  error: { color: Theme.colors.error, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  success: { color: Theme.colors.successDark, fontSize: 14, lineHeight: 20, fontWeight: '600' },
});
