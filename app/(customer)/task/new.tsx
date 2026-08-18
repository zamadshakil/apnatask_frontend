import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../../../src/components/Button';
import Input from '../../../src/components/Input';
import { Screen } from '../../../src/components/Screen';
import { createIdempotencyKey, typedApi } from '../../../src/services/api';
import { mapService } from '../../../src/services/maps';
import { pickTaskImages, PreparedImage, uploadImage } from '../../../src/services/uploads';
import { Theme } from '../../../src/styles/theme';

const DRAFT_KEY = 'apnatask.task-draft.v2';
type Draft = { categoryId: string; title: string; description: string; budget: string; address: string; area: string; city: string; latitude?: number; longitude?: number };
const empty: Draft = { categoryId: '', title: '', description: '', budget: '', address: '', area: '', city: '' };

export default function NewTaskScreen() {
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const [draft, setDraft] = useState<Draft>({ ...empty, categoryId: params.categoryId ?? '' });
  const [images, setImages] = useState<PreparedImage[]>([]);
  const [busy, setBusy] = useState(false);
  const categories = useQuery({ queryKey: ['categories'], queryFn: async () => (await typedApi.GET('/api/v2/categories')).data ?? [], meta: { persist: true } });
  useEffect(() => { void AsyncStorage.getItem(DRAFT_KEY).then((saved) => { if (saved) setDraft((current) => ({ ...JSON.parse(saved) as Draft, categoryId: params.categoryId ?? (JSON.parse(saved) as Draft).categoryId ?? current.categoryId })); }); }, [params.categoryId]);
  useEffect(() => { const timeout = setTimeout(() => void AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft)), 400); return () => clearTimeout(timeout); }, [draft]);
  const update = (key: keyof Draft, value: string | number) => setDraft((current) => ({ ...current, [key]: value }));
  const locate = async () => { const permission = await Location.requestForegroundPermissionsAsync(); if (!permission.granted) return Alert.alert('Location denied', 'Enter the address, area, and city manually.'); const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }); const place = await mapService.reverse(current.coords); setDraft((value) => ({ ...value, ...place })); };
  const submit = async () => {
    if (!draft.categoryId || draft.title.trim().length < 5 || draft.description.trim().length < 20 || !draft.address || !draft.area || !draft.city || draft.latitude == null || draft.longitude == null) return Alert.alert('More details needed', 'Select a category, add a clear title and description, and confirm a mapped location.');
    const network = await NetInfo.fetch(); if (!network.isConnected || network.isInternetReachable === false) return Alert.alert('You are offline', 'Your draft is saved. Posting requires a confirmed connection.');
    setBusy(true);
    try {
      const imageKeys = await Promise.all(images.map((image) => uploadImage(image, 'task')));
      const budgetPaisa = draft.budget ? Math.round(Number(draft.budget) * 100) : null;
      const { data, error } = await typedApi.POST('/api/v2/bookings', { headers: { 'Idempotency-Key': createIdempotencyKey() }, body: { category_id: draft.categoryId, title: draft.title.trim(), description: draft.description.trim(), budget_paisa: budgetPaisa, image_keys: imageKeys, publish: true, address: { label: 'Task address', address_line: draft.address.trim(), area: draft.area.trim(), city: draft.city.trim(), latitude: draft.latitude, longitude: draft.longitude } } });
      if (error || !data) throw new Error('The task could not be posted.');
      await AsyncStorage.removeItem(DRAFT_KEY); router.replace({ pathname: '/(customer)/task/[id]', params: { id: data.id } });
    } catch (error) { Alert.alert('Task not posted', error instanceof Error ? error.message : 'Please retry.'); } finally { setBusy(false); }
  };
  return <Screen>
    <Text style={styles.label}>SERVICE</Text><View style={styles.categories}>{categories.data?.map((category) => <Pressable key={category.id} onPress={() => update('categoryId', category.id)} style={[styles.chip, draft.categoryId === category.id && styles.active]}><Text style={draft.categoryId === category.id && styles.activeText}>{category.name_en}</Text></Pressable>)}</View>
    <Input label="Short title" value={draft.title} onChangeText={(value) => update('title', value)} placeholder="Leaking kitchen sink" maxLength={120} />
    <Input label="Describe the work" value={draft.description} onChangeText={(value) => update('description', value)} multiline numberOfLines={5} maxLength={2000} />
    <Input label="Budget in PKR (optional)" value={draft.budget} onChangeText={(value) => update('budget', value.replace(/\D/g, ''))} keyboardType="number-pad" />
    <Button title="Use my current location" type="outline" onPress={() => void locate()} />
    <Input label="Exact address (private until selection)" value={draft.address} onChangeText={(value) => update('address', value)} />
    <Input label="Area / locality" value={draft.area} onChangeText={(value) => update('area', value)} /><Input label="City" value={draft.city} onChangeText={(value) => update('city', value)} />
    <Text style={styles.label}>PHOTOS ({images.length}/5)</Text><View style={styles.images}>{images.map((image) => <Image key={image.uri} source={{ uri: image.uri }} style={styles.image} />)}</View>
    <Button title="Add photos" type="outline" disabled={images.length >= 5} onPress={() => void pickTaskImages(5 - images.length).then((picked) => setImages((all) => [...all, ...picked])).catch((error) => Alert.alert('Photo unavailable', error.message))} />
    <Button title="Post task" size="lg" loading={busy} onPress={() => void submit()} style={{ marginTop: 18 }} />
  </Screen>;
}
const styles = StyleSheet.create({ label: { ...Theme.typography.overline, color: Theme.colors.textSecondary, marginVertical: 10 }, categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }, chip: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: Theme.colors.border }, active: { backgroundColor: '#E7F8F3', borderColor: Theme.colors.primary }, activeText: { color: Theme.colors.primary, fontWeight: '700' }, images: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, image: { width: 72, height: 72, borderRadius: 10 } });
