import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { BadgeCheck, BriefcaseBusiness, Check, Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import Input from '../../src/components/Input';
import { FadeIn } from '../../src/components/Motion';
import { Screen } from '../../src/components/Screen';
import TactilePressable from '../../src/components/TactilePressable';
import { createIdempotencyKey, typedApi } from '../../src/services/api';
import { Theme } from '../../src/styles/theme';

export default function ProviderApply() {
  const [selected, setSelected] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [busy, setBusy] = useState(false);
  const query = useQuery({ queryKey: ['categories'], queryFn: async () => (await typedApi.GET('/api/v2/categories')).data ?? [], meta: { persist: true } });
  const submit = async () => {
    if (!selected.length) return Alert.alert('Choose a service', 'Select at least one service you can provide.');
    setBusy(true);
    const { error } = await typedApi.POST('/api/v2/provider-mode', { headers: { 'Idempotency-Key': createIdempotencyKey() }, body: { category_ids: selected, bio, service_radius_km: 15 } });
    setBusy(false);
    if (error) return Alert.alert('Application not saved', 'Please check the details and retry.');
    router.push('/(provider)/kyc');
  };
  return (
    <Screen topInset={false}>
      <FadeIn>
        <View style={styles.iconWell}><BriefcaseBusiness color={Theme.colors.primary} size={26} /></View>
        <Text style={styles.title}>Earn with your skills</Text>
        <Text style={styles.copy}>Choose the work you do best. You will only see relevant tasks near your service area.</Text>
      </FadeIn>
      <FadeIn delay={70}>
        <Card elevation="md">
          <View style={styles.sectionTitle}><Sparkles color={Theme.colors.primary} size={19} /><Text style={styles.heading}>Your services</Text></View>
          <View style={styles.grid}>
            {query.data?.map((category) => {
              const active = selected.includes(category.id);
              return <TactilePressable key={category.id} style={[styles.chip, active && styles.active]} onPress={() => setSelected((all) => active ? all.filter((item) => item !== category.id) : [...all, category.id])}><Text style={[styles.chipText, active && styles.activeText]}>{category.name_en}</Text>{active && <Check color={Theme.colors.primary} size={16} strokeWidth={2.5} />}</TactilePressable>;
            })}
          </View>
          <Input label="About your experience (optional)" value={bio} onChangeText={setBio} multiline maxLength={1000} placeholder="Tell customers what makes your work reliable" />
        </Card>
      </FadeIn>
      <FadeIn delay={130}>
        <View style={styles.trust}><BadgeCheck color={Theme.colors.verified} size={19} /><Text style={styles.trustText}>Provider access unlocks after phone verification and manual CNIC/selfie review. First bids are currently free.</Text></View>
        <Button title="Continue to identity verification" loading={busy} onPress={() => void submit()} />
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconWell: { width: 54, height: 54, borderRadius: 18, backgroundColor: Theme.colors.primaryMist, alignItems: 'center', justifyContent: 'center', marginBottom: Theme.spacing.lg },
  title: { ...Theme.typography.h1, color: Theme.colors.textPrimary },
  copy: { ...Theme.typography.body, color: Theme.colors.textSecondary, marginTop: Theme.spacing.sm, marginBottom: Theme.spacing.xl, maxWidth: 540 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm, marginBottom: Theme.spacing.lg },
  heading: { ...Theme.typography.h3, color: Theme.colors.textPrimary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.sm, marginBottom: Theme.spacing.xl },
  chip: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xs, backgroundColor: Theme.colors.surfaceMuted, borderWidth: 1, borderColor: Theme.colors.borderLight, borderRadius: Theme.radius.full, paddingVertical: 11, paddingHorizontal: 15 },
  active: { backgroundColor: Theme.colors.primaryMist, borderColor: 'rgba(7,94,84,0.22)' },
  chipText: { ...Theme.typography.bodySmall, color: Theme.colors.textSecondary, fontWeight: '600' },
  activeText: { color: Theme.colors.primary },
  trust: { flexDirection: 'row', alignItems: 'flex-start', gap: Theme.spacing.sm, marginVertical: Theme.spacing.lg, paddingHorizontal: Theme.spacing.sm },
  trustText: { ...Theme.typography.caption, color: Theme.colors.textSecondary, flex: 1 },
});
