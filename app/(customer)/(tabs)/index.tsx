import type { components } from '../../../src/api/schema';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { AirVent, Brush, Hammer, PlugZap, Search, Sparkles, Wrench } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Button from '../../../src/components/Button';
import Card from '../../../src/components/Card';
import { Screen, StateView } from '../../../src/components/Screen';
import { useSession } from '../../../src/providers/AuthProvider';
import { typedApi } from '../../../src/services/api';
import { Theme } from '../../../src/styles/theme';

type Category = components['schemas']['CategoryResponse'];
const icons = { plumbing: Wrench, electrical: PlugZap, cleaning: Sparkles, 'ac-repair': AirVent, carpentry: Hammer, painting: Brush, 'appliance-repair': PlugZap } as const;

export default function HomeScreen() {
  const { user } = useSession();
  const [search, setSearch] = useState('');
  const query = useQuery({ queryKey: ['categories'], queryFn: async () => { const { data, error } = await typedApi.GET('/api/v2/categories'); if (error) throw error; return data; }, meta: { persist: true }, staleTime: 24 * 60 * 60 * 1000 });
  const categories = useMemo(() => (query.data ?? []).filter((item: Category) => `${item.name_en} ${item.name_ur} ${item.roman_urdu_aliases}`.toLowerCase().includes(search.toLowerCase())), [query.data, search]);
  return <Screen>
    <Text style={styles.hello}>Assalam-o-Alaikum{user?.display_name ? `, ${user.display_name.split(' ')[0]}` : ''}</Text>
    <Text style={styles.title}>What do you need help with?</Text>
    <View style={styles.search}><Search color={Theme.colors.textSecondary} size={20} /><TextInput accessibilityLabel="Search services" value={search} onChangeText={setSearch} placeholder="Plumber, bijli, safai…" style={styles.input} /></View>
    {query.isLoading ? <StateView title="Loading services…" loading /> : query.isError ? <StateView title="Services unavailable" detail="Your saved services may still appear while offline." onRetry={() => query.refetch()} /> :
      <View style={styles.grid}>{categories.map((category: Category) => { const Icon = icons[category.slug as keyof typeof icons] ?? Wrench; return <Link key={category.id} href={{ pathname: '/(customer)/task/new', params: { categoryId: category.id } }} asChild><Pressable style={styles.category}><View style={styles.icon}><Icon color={Theme.colors.primary} /></View><Text style={styles.categoryText}>{category.name_en}</Text><Text style={styles.urdu}>{category.name_ur}</Text></Pressable></Link>; })}</View>}
    <Card style={styles.cta}><Text style={styles.ctaTitle}>Not sure which service?</Text><Text style={styles.ctaCopy}>Describe the problem and providers can respond with an offer.</Text><Link href="/(customer)/task/new" asChild><Button title="Post a task" onPress={() => undefined} /></Link></Card>
  </Screen>;
}

const styles = StyleSheet.create({ hello: { color: Theme.colors.primary, fontWeight: '700', marginTop: 10 }, title: { ...Theme.typography.h1, color: Theme.colors.textPrimary, marginVertical: 10 }, search: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, marginVertical: 16 }, input: { flex: 1, padding: 14, fontSize: 16 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, category: { width: '47%', backgroundColor: '#fff', padding: 16, borderRadius: 16, minHeight: 130 }, icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' }, categoryText: { fontWeight: '700', color: Theme.colors.textPrimary, marginTop: 10 }, urdu: { color: Theme.colors.textSecondary, marginTop: 2 }, cta: { marginTop: 22, backgroundColor: '#E7F8F3' }, ctaTitle: { ...Theme.typography.h3, color: Theme.colors.textPrimary }, ctaCopy: { color: Theme.colors.textSecondary, marginVertical: 8 } });
