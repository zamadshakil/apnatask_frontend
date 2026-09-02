import type { components } from '../../../src/api/schema';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { AirVent, ArrowUpRight, Banknote, Brush, Hammer, MapPin, PlugZap, Search, ShieldCheck, Sparkles, Wrench } from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TextInput, useWindowDimensions, View, ViewStyle } from 'react-native';
import Card from '../../../src/components/Card';
import { FadeIn } from '../../../src/components/Motion';
import { Screen, StateView } from '../../../src/components/Screen';
import SectionHeader from '../../../src/components/SectionHeader';
import TactilePressable from '../../../src/components/TactilePressable';
import DynamicMap from '../../../src/components/maps/DynamicMap';
import { useSession } from '../../../src/providers/AuthProvider';
import { typedApi } from '../../../src/services/api';
import { Theme } from '../../../src/styles/theme';
import i18n from '../../../src/i18n';
import { ApnaTaskLogo } from '../../../src/components/brand/ApnaTaskLogo';

type Category = components['schemas']['CategoryResponse'];
type SupplyCluster = { id: string; latitude: number; longitude: number; provider_count: number; count_label: string };
const icons = { plumbing: Wrench, electrical: PlugZap, cleaning: Sparkles, 'ac-repair': AirVent, carpentry: Hammer, painting: Brush, 'appliance-repair': PlugZap } as const;
const iconTints: Record<string, string> = { plumbing: '#E5F5F1', electrical: '#FFF3D9', cleaning: '#EAF7EE', 'ac-repair': '#E7F2FA', carpentry: '#F7EFE5', painting: '#F3EAF8', 'appliance-repair': '#E6F4F1' };

function ServiceCard({ category }: { category: Category }) {
  const Icon = icons[category.slug as keyof typeof icons] ?? Wrench;
  const displayName = i18n.t(`categories.${category.slug}`, { defaultValue: category.name_en });
  return (
    <TactilePressable
      accessibilityRole="link"
      accessibilityLabel={displayName}
      onPress={() => router.push({ pathname: '/(customer)/task/new', params: { categoryId: category.id } })}
      style={styles.category}
    >
      <View style={[styles.icon, { backgroundColor: iconTints[category.slug] ?? Theme.colors.primaryMist }]}><Icon color={Theme.colors.primary} size={24} strokeWidth={1.9} /></View>
      <View style={styles.categoryCopy}><Text style={styles.categoryText}>{displayName}</Text></View>
    </TactilePressable>
  );
}

export default function HomeScreen() {
  const { user } = useSession();
  const { width } = useWindowDimensions();
  const compact = width < 690;
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const focus = useRef(new Animated.Value(0)).current;
  const animateFocus = (value: number) => Animated.timing(focus, { toValue: value, duration: Theme.motion.quick, useNativeDriver: Platform.OS !== 'web' }).start();
  const query = useQuery({ queryKey: ['categories'], queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/categories'); if (error) throw error; return data; }, meta: { persist: true }, staleTime: 24 * 60 * 60 * 1000 });
  const supply = useQuery({ queryKey: ['supply-clusters', 5], queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/supply/clusters', { params: { query: { zoom: 5 } } }); if (error || !data) throw error; return data as { items: SupplyCluster[]; privacy: string }; }, staleTime: 60_000 });
  const categories = useMemo(() => (query.data ?? []).filter((item: Category) => `${item.name_en} ${item.name_ur} ${item.roman_urdu_aliases}`.toLowerCase().includes(search.toLowerCase())), [query.data, search]);
  const firstName = user?.display_name?.split(' ')[0];

  return <Screen>
    <FadeIn>
      <View style={styles.brandRow}><ApnaTaskLogo size={36} /><View style={styles.brandActions}>{user?.capabilities.includes('provider') && <TactilePressable accessibilityRole="button" onPress={() => router.push('/provider' as never)} style={styles.modeSwitch}><Text style={styles.modeSwitchText}>{i18n.t('experience.home.providerMode')}</Text></TactilePressable>}<View style={styles.avatar}><Text style={styles.avatarText}>{firstName?.[0]?.toUpperCase() ?? 'A'}</Text></View></View></View>
      <View style={styles.intentPanel}>
        <Text style={styles.hello}>{i18n.t('home.greeting')}{firstName ? `, ${firstName}` : ''}</Text>
        <Text style={styles.title}>{i18n.t('experience.home.title')}</Text>
        <Animated.View style={[styles.search, searchFocused && styles.searchFocused, { transform: [{ scale: focus.interpolate({ inputRange: [0, 1], outputRange: [1, 1.008] }) }] }]}>
          <Search color={searchFocused ? Theme.colors.primary : Theme.colors.textSecondary} size={20} strokeWidth={2} />
          <TextInput accessibilityLabel={i18n.t('experience.home.searchLabel')} value={search} onChangeText={setSearch} onFocus={() => { setSearchFocused(true); animateFocus(1); }} onBlur={() => { setSearchFocused(false); animateFocus(0); }} placeholder={i18n.t('experience.home.searchPlaceholder')} placeholderTextColor={Theme.colors.textTertiary} selectionColor={Theme.colors.primaryLight} style={styles.input} />
        </Animated.View>
        {!!search.trim() && <TactilePressable accessibilityRole="button" onPress={() => router.push({ pathname: '/(customer)/task/new', params: { problem: search.trim() } })} style={styles.intentAction}><Sparkles color={Theme.colors.white} size={17} /><Text style={styles.intentText}>{i18n.t('experience.home.startTask', { query: search.trim() })}</Text><ArrowUpRight color={Theme.colors.white} size={16} /></TactilePressable>}
      </View>
    </FadeIn>

    <FadeIn delay={40}><View style={styles.trustRow}><View style={styles.trustItem}><ShieldCheck size={18} color={Theme.colors.primary} /><Text style={styles.trustText}>{i18n.t('experience.home.kyc')}</Text></View><View style={styles.trustItem}><MapPin size={18} color={Theme.colors.primary} /><Text style={styles.trustText}>{i18n.t('experience.home.privateAddress')}</Text></View><View style={styles.trustItem}><Banknote size={18} color={Theme.colors.primary} /><Text style={styles.trustText}>{i18n.t('experience.home.cash')}</Text></View></View></FadeIn>

    <FadeIn delay={60}><SectionHeader title={i18n.t('experience.home.servicesTitle')} detail={i18n.t('experience.home.servicesDetail')} /></FadeIn>
    {query.isLoading ? <StateView title={i18n.t('experience.home.loading')} loading /> : query.isError ? <StateView title={i18n.t('experience.home.unavailable')} detail={i18n.t('experience.home.offlineDetail')} onRetry={() => query.refetch()} /> :
      <View style={styles.grid}>{categories.map((category: Category, index: number) => <FadeIn key={category.id} delay={80 + index * 28} style={compact ? styles.categoryCompact : styles.categoryWide}><ServiceCard category={category} /></FadeIn>)}</View>}

    <FadeIn delay={160}>
      <SectionHeader title={i18n.t('experience.home.supplyTitle')} detail={i18n.t('experience.home.supplyDetail')} />
      <Card style={styles.supplyCard}>
        <DynamicMap center={{ latitude: 30.3753, longitude: 69.3451 }} height={compact ? 220 : 260} mode="markers" zoom={5} markers={(supply.data?.items ?? []).map((cluster) => ({ id: cluster.id, latitude: cluster.latitude, longitude: cluster.longitude, title: i18n.t('experience.home.providers', { count: cluster.count_label }), label: cluster.count_label, variant: 'task' }))} />
        <View style={styles.supplyNote}><ShieldCheck size={16} color={Theme.colors.primary} /><Text style={styles.supplyText}>{supply.isError ? i18n.t('experience.home.supplyUnavailable') : i18n.t('experience.home.supplyPrivacy')}</Text></View>
      </Card>
    </FadeIn>
  </Screen>;
}

const categoryDepth = Platform.OS === 'web' ? ({ boxShadow: Theme.webShadows.sm } as ViewStyle) : Theme.shadows.sm;
const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Theme.spacing.xl },
  brandActions: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm },
  modeSwitch: { minHeight: 40, justifyContent: 'center', paddingHorizontal: Theme.spacing.md, backgroundColor: Theme.colors.surface, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.radius.full },
  modeSwitchText: { ...Theme.typography.caption, color: Theme.colors.primary, fontWeight: '700' },
  avatar: { width: 38, height: 38, borderRadius: 14, backgroundColor: Theme.colors.primaryMist, borderWidth: 1, borderColor: Theme.colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Theme.colors.primary, fontWeight: '700', fontSize: 15 },
  intentPanel: { backgroundColor: Theme.colors.primaryMist, borderRadius: Theme.radius.xl, borderWidth: 1, borderColor: 'rgba(7,94,84,0.08)', padding: Theme.spacing.xl, paddingBottom: Theme.spacing.xxxl, marginBottom: Theme.spacing.xs },
  hello: { ...Theme.typography.bodySmall, color: Theme.colors.primary, marginBottom: 5, fontWeight: '600' },
  title: { ...Theme.typography.h2, color: Theme.colors.textPrimary, maxWidth: 520 },
  search: { minHeight: 58, flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.surface, borderRadius: Theme.radius.md, paddingHorizontal: Theme.spacing.lg, marginTop: Theme.spacing.xl, borderWidth: 1, borderColor: Theme.colors.borderLight, ...(Platform.OS === 'web' ? ({ boxShadow: Theme.webShadows.sm } as ViewStyle) : Theme.shadows.sm) },
  searchFocused: { backgroundColor: Theme.colors.white, borderColor: Theme.colors.primaryLight },
  input: { flex: 1, minHeight: 54, paddingHorizontal: 11, ...Theme.typography.body, color: Theme.colors.textPrimary, outlineStyle: 'none' } as never,
  intentAction: { minHeight: 48, marginTop: Theme.spacing.sm, borderRadius: Theme.radius.md, backgroundColor: Theme.colors.primary, flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm, paddingHorizontal: Theme.spacing.md },
  intentText: { ...Theme.typography.bodySmall, color: Theme.colors.white, fontWeight: '700', flex: 1 },
  trustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.sm, marginTop: Theme.spacing.lg },
  trustItem: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: Theme.colors.surface, borderWidth: 1, borderColor: Theme.colors.borderLight, borderRadius: Theme.radius.full, paddingHorizontal: Theme.spacing.md },
  trustText: { ...Theme.typography.caption, color: Theme.colors.textPrimary, fontWeight: '600' },
  supplyCard: { padding: Theme.spacing.sm },
  supplyNote: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm, padding: Theme.spacing.md },
  supplyText: { ...Theme.typography.caption, color: Theme.colors.textSecondary, flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  categoryCompact: { width: '31.5%' },
  categoryWide: { width: '23.6%' },
  category: { width: '100%', minHeight: 112, backgroundColor: Theme.colors.surface, borderRadius: Theme.radius.md, borderWidth: 1, borderColor: Theme.colors.borderLight, paddingHorizontal: Theme.spacing.sm, paddingVertical: Theme.spacing.md, alignItems: 'center', justifyContent: 'center', ...categoryDepth },
  icon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  categoryCopy: { marginTop: 9, minHeight: 34, justifyContent: 'center' },
  categoryText: { ...Theme.typography.caption, fontSize: 12, lineHeight: 16, color: Theme.colors.textPrimary, textAlign: 'center', fontWeight: '700' },
});
