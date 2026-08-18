import type { components } from '../../../src/api/schema';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { AirVent, ArrowUpRight, Brush, Hammer, PlugZap, Search, Sparkles, Wrench } from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TextInput, useWindowDimensions, View, ViewStyle } from 'react-native';
import Button from '../../../src/components/Button';
import Card from '../../../src/components/Card';
import { FadeIn } from '../../../src/components/Motion';
import { Screen, StateView } from '../../../src/components/Screen';
import SectionHeader from '../../../src/components/SectionHeader';
import TactilePressable from '../../../src/components/TactilePressable';
import { useSession } from '../../../src/providers/AuthProvider';
import { typedApi } from '../../../src/services/api';
import { Theme } from '../../../src/styles/theme';

type Category = components['schemas']['CategoryResponse'];
const icons = { plumbing: Wrench, electrical: PlugZap, cleaning: Sparkles, 'ac-repair': AirVent, carpentry: Hammer, painting: Brush, 'appliance-repair': PlugZap } as const;
const iconTints: Record<string, string> = { plumbing: '#E5F5F1', electrical: '#FFF3D9', cleaning: '#EAF7EE', 'ac-repair': '#E7F2FA', carpentry: '#F7EFE5', painting: '#F3EAF8', 'appliance-repair': '#E6F4F1' };

function ServiceCard({ category }: { category: Category }) {
  const Icon = icons[category.slug as keyof typeof icons] ?? Wrench;
  return (
    <TactilePressable
      accessibilityRole="link"
      accessibilityLabel={`${category.name_en} ${category.name_ur}`}
      onPress={() => router.push({ pathname: '/(customer)/task/new', params: { categoryId: category.id } })}
      style={styles.category}
    >
      <View style={[styles.icon, { backgroundColor: iconTints[category.slug] ?? Theme.colors.primaryMist }]}><Icon color={Theme.colors.primary} size={24} strokeWidth={1.9} /></View>
      <View style={styles.categoryCopy}><Text style={styles.categoryText}>{category.name_en}</Text><Text style={styles.urdu}>{category.name_ur}</Text></View>
      <ArrowUpRight color={Theme.colors.textTertiary} size={16} strokeWidth={1.8} style={styles.categoryArrow} />
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
  const categories = useMemo(() => (query.data ?? []).filter((item: Category) => `${item.name_en} ${item.name_ur} ${item.roman_urdu_aliases}`.toLowerCase().includes(search.toLowerCase())), [query.data, search]);
  const firstName = user?.display_name?.split(' ')[0];

  return <Screen>
    <FadeIn>
      <LinearGradient colors={Theme.gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.brandRow}><Text style={styles.brand}>ApnaTask</Text><View style={styles.avatar}><Text style={styles.avatarText}>{firstName?.[0]?.toUpperCase() ?? 'A'}</Text></View></View>
        <Text style={styles.hello}>Assalam-o-Alaikum{firstName ? `, ${firstName}` : ''}</Text>
        <Text style={styles.title}>What can we help you fix today?</Text>
        <Animated.View style={[styles.search, searchFocused && styles.searchFocused, { transform: [{ scale: focus.interpolate({ inputRange: [0, 1], outputRange: [1, 1.008] }) }] }]}>
          <Search color={searchFocused ? Theme.colors.primary : Theme.colors.textSecondary} size={20} strokeWidth={2} />
          <TextInput accessibilityLabel="Search services" value={search} onChangeText={setSearch} onFocus={() => { setSearchFocused(true); animateFocus(1); }} onBlur={() => { setSearchFocused(false); animateFocus(0); }} placeholder="Plumber, bijli, safai…" placeholderTextColor={Theme.colors.textTertiary} selectionColor={Theme.colors.primaryLight} style={styles.input} />
        </Animated.View>
      </LinearGradient>
    </FadeIn>

    <FadeIn delay={70}><SectionHeader title="Popular services" detail="Reviewed local professionals, close to home." /></FadeIn>
    {query.isLoading ? <StateView title="Loading services…" loading /> : query.isError ? <StateView title="Services unavailable" detail="Your saved services may still appear while offline." onRetry={() => query.refetch()} /> :
      <View style={styles.grid}>{categories.map((category: Category, index: number) => <FadeIn key={category.id} delay={100 + index * 35} style={compact ? styles.categoryHalf : styles.categoryThird}><ServiceCard category={category} /></FadeIn>)}</View>}

    <FadeIn delay={330}>
      <Card variant="tinted" elevation="md" style={styles.cta}>
        <View style={styles.ctaTop}><View style={styles.ctaIcon}><Sparkles color={Theme.colors.primary} size={22} /></View><Text style={styles.ctaEyebrow}>QUICK POST</Text></View>
        <Text style={styles.ctaTitle}>Not sure which service?</Text>
        <Text style={styles.ctaCopy}>Describe the problem once. Nearby verified providers can respond with private offers.</Text>
        <Button title="Post a task" size="lg" onPress={() => router.push('/(customer)/task/new')} />
      </Card>
    </FadeIn>
  </Screen>;
}

const categoryDepth = Platform.OS === 'web' ? ({ boxShadow: Theme.webShadows.sm } as ViewStyle) : Theme.shadows.sm;
const styles = StyleSheet.create({
  hero: { borderRadius: Theme.radius.xxl, paddingHorizontal: Theme.spacing.xxl, paddingTop: Theme.spacing.xl, paddingBottom: Theme.spacing.xxl, overflow: 'hidden', ...(Platform.OS === 'web' ? ({ boxShadow: Theme.webShadows.lg } as ViewStyle) : Theme.shadows.lg) },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Theme.spacing.xxl },
  brand: { ...Theme.typography.h3, color: Theme.colors.white, letterSpacing: -0.35 },
  avatar: { width: 38, height: 38, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.17)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.27)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Theme.colors.white, fontWeight: '700', fontSize: 15 },
  hello: { ...Theme.typography.bodySmall, color: 'rgba(255,255,255,0.76)', marginBottom: 5 },
  title: { ...Theme.typography.display, color: Theme.colors.white, maxWidth: 540 },
  search: { minHeight: 56, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: Theme.radius.md, paddingHorizontal: Theme.spacing.lg, marginTop: Theme.spacing.xxl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.76)' },
  searchFocused: { backgroundColor: Theme.colors.white, borderColor: 'rgba(255,255,255,0.98)' },
  input: { flex: 1, minHeight: 54, paddingHorizontal: 11, ...Theme.typography.body, color: Theme.colors.textPrimary, outlineStyle: 'none' } as never,
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryHalf: { width: '48%' },
  categoryThird: { width: '31.7%' },
  category: { width: '100%', minHeight: 154, backgroundColor: Theme.colors.surface, borderRadius: Theme.radius.lg, borderWidth: 1, borderColor: Theme.colors.borderLight, padding: Theme.spacing.lg, justifyContent: 'space-between', ...categoryDepth },
  icon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  categoryCopy: { marginTop: 17 },
  categoryText: { ...Theme.typography.h3, fontSize: 16, color: Theme.colors.textPrimary },
  urdu: { ...Theme.typography.bodySmall, color: Theme.colors.textSecondary, marginTop: 3 },
  categoryArrow: { position: 'absolute', right: 14, top: 15 },
  cta: { marginTop: Theme.spacing.xxxl, padding: Theme.spacing.xxl, borderRadius: Theme.radius.xxl },
  ctaTop: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: Theme.spacing.lg },
  ctaIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.72)', alignItems: 'center', justifyContent: 'center' },
  ctaEyebrow: { ...Theme.typography.overline, color: Theme.colors.primary },
  ctaTitle: { ...Theme.typography.h2, color: Theme.colors.textPrimary },
  ctaCopy: { ...Theme.typography.body, color: Theme.colors.textSecondary, marginTop: 7, marginBottom: Theme.spacing.xl, maxWidth: 500 },
});
