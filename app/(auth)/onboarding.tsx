import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import Input from '../../src/components/Input';
import { FadeIn } from '../../src/components/Motion';
import { Screen } from '../../src/components/Screen';
import { useSession } from '../../src/providers/AuthProvider';
import { createIdempotencyKey, typedApi } from '../../src/services/api';
import { Theme } from '../../src/styles/theme';
import i18n, { setLocale, type SupportedLocale } from '../../src/i18n';
import { parseEntryIntent } from '../../src/navigation/entryIntent';

const schema = z.object({ displayName: z.string().trim().min(2).max(100), locale: z.enum(['en', 'ur-Latn']) });
type FormData = z.infer<typeof schema>;

export default function Onboarding() {
  const params = useLocalSearchParams<{ intent?: string | string[] }>();
  const intent = parseEntryIntent(params.intent);
  const { refresh } = useSession();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<'language' | 'profile'>('language');
  const [feedback, setFeedback] = useState<string | null>(null);
  const { control, handleSubmit, setValue, watch } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { displayName: '', locale: (i18n.language as SupportedLocale) || 'en' } });
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
      router.replace({ pathname: '/', params: { intent } });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t('onboarding.saveError'));
    } finally { setBusy(false); }
  });
  return (
    <Screen style={styles.screen}>
      {stage === 'language' ? <FadeIn><Text style={styles.eyebrow}>APNATASK</Text><Text style={styles.title}>{t('onboarding.chooseLanguage')}</Text><Text style={styles.copy}>{t('onboarding.languageHelp')}</Text><Card variant="glass" elevation="md" style={styles.form}><View style={styles.languages}>{([['en', 'English'], ['ur-Latn', 'Roman Urdu']] as const).map(([value, label]) => <Button key={value} title={label} type={locale === value ? 'primary' : 'outline'} onPress={() => { setValue('locale', value); void setLocale(value).then(() => setStage('profile')); }} />)}</View><Text style={styles.promise}>{t('onboarding.promise')}</Text></Card></FadeIn> : <>
      <FadeIn><Text style={styles.eyebrow}>{t('onboarding.mode')}</Text><Text style={styles.title}>{t('onboarding.welcome')}</Text><Text style={styles.copy}>{t('onboarding.intro')}</Text></FadeIn>
      <FadeIn delay={70}><Card variant="glass" elevation="md" style={styles.form}>
      <Controller control={control} name="displayName" render={({ field, fieldState }) => (
        <Input label={t('onboarding.name')} value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} autoComplete="name" />
      )} />
      {!!feedback && <Text accessibilityRole="alert" style={styles.error}>{feedback}</Text>}
      <Button title={t('onboarding.create')} onPress={submit} loading={busy} size="lg" style={{ marginTop: 24 }} />
      <Button title={t('onboarding.chooseLanguage')} type="outline" onPress={() => setStage('language')} />
      </Card></FadeIn></>}
    </Screen>
  );
}

const styles = StyleSheet.create({ screen: { maxWidth: 580, paddingTop: Theme.spacing.xxxl }, eyebrow: { ...Theme.typography.overline, color: Theme.colors.primary }, title: { ...Theme.typography.display, color: Theme.colors.textPrimary, marginTop: 5 }, copy: { ...Theme.typography.body, color: Theme.colors.textSecondary, marginTop: 10, marginBottom: Theme.spacing.xxl }, form: { padding: Theme.spacing.xl, borderRadius: Theme.radius.xl }, languages: { gap: 9 }, promise: { ...Theme.typography.body, color: Theme.colors.textSecondary, textAlign: 'center', marginTop: Theme.spacing.xl }, error: { ...Theme.typography.bodySmall, color: Theme.colors.error, marginBottom: Theme.spacing.sm } });
