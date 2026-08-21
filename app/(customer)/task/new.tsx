import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, MapPin, Search } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Linking, StyleSheet, Text, View } from 'react-native';
import Button from '../../../src/components/Button';
import Card from '../../../src/components/Card';
import DynamicMap from '../../../src/components/maps/DynamicMap';
import Input from '../../../src/components/Input';
import { FadeIn } from '../../../src/components/Motion';
import { Screen } from '../../../src/components/Screen';
import TactilePressable from '../../../src/components/TactilePressable';
import { createIdempotencyKey, typedApi } from '../../../src/services/api';
import { isOnline } from '../../../src/services/connectivity';
import { GeocodedPlace, mapService } from '../../../src/services/maps';
import { pickTaskImages, PreparedImage, uploadImage } from '../../../src/services/uploads';
import { Theme } from '../../../src/styles/theme';

const DRAFT_KEY = 'apnatask.task-draft.v2';
type Draft = {
  categoryId: string;
  title: string;
  description: string;
  budget: string;
  address: string;
  area: string;
  city: string;
  latitude?: number;
  longitude?: number;
};
const empty: Draft = { categoryId: '', title: '', description: '', budget: '', address: '', area: '', city: '' };
const PAKISTAN_CENTER = { latitude: 30.3753, longitude: 69.3451 };

export default function NewTaskScreen() {
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const [draft, setDraft] = useState<Draft>({ ...empty, categoryId: params.categoryId ?? '' });
  const [locationSearch, setLocationSearch] = useState('');
  const [locations, setLocations] = useState<GeocodedPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [images, setImages] = useState<PreparedImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [resolvingPin, setResolvingPin] = useState(false);
  const reverseRequest = React.useRef(0);

  const categories = useQuery({ queryKey: ['categories'], queryFn: async () => (await typedApi.GET('/api/v2/categories')).data ?? [], meta: { persist: true } });

  useEffect(() => {
    void AsyncStorage.getItem(DRAFT_KEY).then((saved) => {
      if (!saved) return;
      setDraft((current) => {
        const parsed = JSON.parse(saved) as Draft;
        return {
          ...parsed,
          categoryId: params.categoryId ?? parsed.categoryId ?? current.categoryId,
        };
      });
    });
  }, [params.categoryId]);

  useEffect(() => {
    const timeout = setTimeout(() => void AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft)), 400);
    return () => clearTimeout(timeout);
  }, [draft]);

  useEffect(() => {
    const query = locationSearch.trim();
    if (!query || query.length < 3) {
      setLocations([]);
      return;
    }
    const timer = setTimeout(() => {
      void (async () => {
        setSearching(true);
        try {
          const result = await mapService.search(query);
          setLocations(result);
        } catch {
          setLocations([]);
        } finally {
          setSearching(false);
        }
      })();
    }, 350);
    return () => clearTimeout(timer);
  }, [locationSearch]);

  const update = (key: keyof Draft, value: string | number) => setDraft((current) => ({ ...current, [key]: value }));
  const clearSearch = () => {
    setLocationSearch('');
    setLocations([]);
  };

  const locate = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        return Alert.alert('Location denied', 'Allow location access so ApnaTask can pin the task safely.');
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const place = await mapService.reverse(current.coords);
      setDraft((value) => ({ ...value, ...place }));
      clearSearch();
      if (!place.address) {
        Alert.alert('Location pinned', 'Please use map search to refine this address.');
      }
    } catch {
      Alert.alert('Location unavailable', 'Check browser location permission and try again.');
    }
  };

  const pickFromSearch = (place: GeocodedPlace) => {
    setDraft((value) => ({
      ...value,
      address: place.address.trim(),
      area: place.area.trim(),
      city: place.city.trim(),
      latitude: place.latitude,
      longitude: place.longitude,
    }));
    clearSearch();
  };

  const movePin = async (coordinate: { latitude: number; longitude: number }) => {
    const requestId = ++reverseRequest.current;
    setResolvingPin(true);
    setDraft((value) => ({ ...value, ...coordinate }));
    try {
      const place = await mapService.reverse(coordinate);
      if (reverseRequest.current !== requestId) return;
      if (!place.address || !place.city) throw new Error('No address returned for this pin');
      setDraft((value) => ({
        ...value,
        address: place.address.trim(),
        area: place.area.trim(),
        city: place.city.trim(),
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      }));
    } catch {
      if (reverseRequest.current === requestId) {
        Alert.alert('Address not found', 'Move the pin slightly or select a nearby search result.');
      }
    } finally {
      if (reverseRequest.current === requestId) setResolvingPin(false);
    }
  };

  const submit = async () => {
    if (resolvingPin) {
      return Alert.alert('Confirming location', 'Wait a moment while we identify the address under the pin.');
    }
    if (
      !draft.categoryId ||
      draft.title.trim().length < 5 ||
      draft.description.trim().length < 20 ||
      !draft.address ||
      !draft.area ||
      !draft.city ||
      draft.latitude == null ||
      draft.longitude == null
    ) {
      return Alert.alert('More details needed', 'Select a category, add a clear title and description, and choose a map location.');
    }
    if (!(await isOnline())) {
      return Alert.alert('You are offline', 'Your draft is saved. Posting requires a confirmed connection.');
    }

    setBusy(true);
    try {
      const imageKeys = await Promise.all(images.map((image) => uploadImage(image, 'task')));
      const budgetPaisa = draft.budget ? Math.round(Number(draft.budget) * 100) : null;
      const { data, error } = await typedApi.POST('/api/v2/bookings', {
        headers: { 'Idempotency-Key': createIdempotencyKey() },
        body: {
          category_id: draft.categoryId,
          title: draft.title.trim(),
          description: draft.description.trim(),
          budget_paisa: budgetPaisa,
          image_keys: imageKeys,
          publish: true,
          address: {
            label: 'Task address',
            address_line: draft.address.trim(),
            area: draft.area.trim(),
            city: draft.city.trim(),
            latitude: draft.latitude,
            longitude: draft.longitude,
          },
        },
      });
      if (error || !data) throw new Error('The task could not be posted.');
      await AsyncStorage.removeItem(DRAFT_KEY);
      router.replace({ pathname: '/(customer)/task/[id]', params: { id: data.id } });
    } catch (error) {
      Alert.alert('Task not posted', error instanceof Error ? error.message : 'Please retry.');
    } finally {
      setBusy(false);
    }
  };

  const locationLabel = draft.address || 'No location selected';
  const locationMeta = [draft.area, draft.city].filter(Boolean).join(' · ');
  const mapCenter = draft.latitude != null && draft.longitude != null
    ? { latitude: draft.latitude, longitude: draft.longitude }
    : PAKISTAN_CENTER;

  return (
    <Screen topInset={false}>
      <FadeIn><Text style={styles.eyebrow}>TELL US WHAT YOU NEED</Text><Text style={styles.title}>A clear task gets better offers.</Text><Text style={styles.copy}>Your draft saves automatically. Location is set through private address search and stays private until provider selection.</Text></FadeIn>
      <FadeIn delay={60}>
        <Card variant="glass" style={styles.section}>
          <Text style={styles.label}>SERVICE</Text>
          <View style={styles.categories}>
            {categories.data?.map((category) => (
              <TactilePressable
                key={category.id}
                onPress={() => update('categoryId', category.id)}
                style={[styles.chip, draft.categoryId === category.id && styles.active]}
              >
                <Text style={[styles.chipText, draft.categoryId === category.id && styles.activeText]}>{category.name_en}</Text>
              </TactilePressable>
            ))}
          </View>
          <Input label="Short title" value={draft.title} onChangeText={(value) => update('title', value)} placeholder="Leaking kitchen sink" maxLength={120} />
          <Input label="Describe the work" value={draft.description} onChangeText={(value) => update('description', value)} multiline numberOfLines={5} maxLength={2000} />
          <Input label="Budget in PKR (optional)" value={draft.budget} onChangeText={(value) => update('budget', value.replace(/\D/g, ''))} keyboardType="number-pad" />
        </Card>
      </FadeIn>

      <FadeIn delay={100}>
        <Card style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionIcon}><MapPin color={Theme.colors.primary} size={21} /></View>
            <View>
              <Text style={styles.sectionTitle}>Task location</Text>
              <Text style={styles.sectionCopy}>Search across Pakistan or use current location.</Text>
            </View>
          </View>
          <Button title="Use my current location" type="outline" icon={<MapPin color={Theme.colors.primary} size={18} />} onPress={() => void locate()} />
          <View style={styles.searchRow}>
            <Input
              label="Find address"
              value={locationSearch}
              onChangeText={setLocationSearch}
              placeholder="Sector, colony, or nearest landmark"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.searchButton}>
              <Button title={searching ? 'Searching…' : 'Search'} type="outline" icon={<Search color={Theme.colors.textPrimary} size={16} />} onPress={() => void setLocationSearch(locationSearch.trim())} />
            </View>
          </View>
          {!!locations.length && <View style={styles.searchResults}>
            {locations.map((place) => (
              <TactilePressable key={`${place.latitude}-${place.longitude}-${place.address}`} style={styles.resultRow} onPress={() => pickFromSearch(place)}>
                <Text style={styles.resultAddress} numberOfLines={2}>{place.label ?? place.address}</Text>
                <Text style={styles.resultMeta}>{place.address ? `${place.area}${place.city ? ` · ${place.city}` : ''}` : 'Select this location'}</Text>
              </TactilePressable>
            ))}
          </View>}
          <View style={styles.mapBlock}>
            <View style={styles.mapHeading}>
              <Text style={styles.mapTitle}>Move the map to position the pin</Text>
              <Text style={styles.mapCopy}>The pin is the task location. Only the selected provider receives the exact point.</Text>
            </View>
            <DynamicMap
              center={mapCenter}
              mode="picker"
              onCenterChange={(coordinate) => void movePin(coordinate)}
              zoom={draft.latitude == null ? 5 : 15}
            />
          </View>
          <Text
            accessibilityRole="link"
            style={styles.attribution}
            onPress={() => void Linking.openURL('https://www.openstreetmap.org/copyright')}
          >
            Address data © OpenStreetMap contributors
          </Text>
          <View style={styles.locationSelected}>
            <Text style={styles.locationTitle}>Chosen task location</Text>
            <Text style={styles.locationAddress} numberOfLines={2}>{resolvingPin ? 'Finding address under the pin…' : locationLabel}</Text>
            {!!locationMeta && <Text style={styles.locationMeta}>{locationMeta}</Text>}
          </View>
        </Card>
      </FadeIn>

      <FadeIn delay={140}>
        <Card style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionIcon}><Camera color={Theme.colors.primary} size={21} /></View>
            <View>
              <Text style={styles.sectionTitle}>Photos</Text>
              <Text style={styles.sectionCopy}>{images.length}/5 added · location metadata is removed.</Text>
            </View>
          </View>
          <View style={styles.images}>{images.map((image) => <Image key={image.uri} source={{ uri: image.uri }} style={styles.image} />)}</View>
          <Button
            title="Add photos"
            type="outline"
            disabled={images.length >= 5}
            onPress={() =>
              void pickTaskImages(5 - images.length)
                .then((picked) => setImages((all) => [...all, ...picked]))
                .catch((error) => Alert.alert('Photo unavailable', error.message))
            }
          />
        </Card>
      </FadeIn>
      <FadeIn delay={180}>
        <Button title="Post task" size="lg" loading={busy} onPress={() => void submit()} style={styles.submit} />
      </FadeIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { ...Theme.typography.overline, color: Theme.colors.primary },
  title: { ...Theme.typography.h1, color: Theme.colors.textPrimary, marginTop: 4 },
  copy: { ...Theme.typography.body, color: Theme.colors.textSecondary, marginTop: 8, marginBottom: Theme.spacing.xl },
  section: { padding: Theme.spacing.xl, marginBottom: Theme.spacing.md },
  label: { ...Theme.typography.overline, color: Theme.colors.textTertiary, marginBottom: 10 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Theme.spacing.xl },
  chip: { backgroundColor: Theme.colors.surfaceMuted, paddingHorizontal: 13, paddingVertical: 10, borderRadius: Theme.radius.full, borderWidth: 1, borderColor: Theme.colors.border },
  chipText: { ...Theme.typography.caption, color: Theme.colors.textSecondary, fontWeight: '600' },
  active: { backgroundColor: Theme.colors.primaryMist, borderColor: 'rgba(7,94,84,0.35)' },
  activeText: { color: Theme.colors.primary, fontWeight: '700' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Theme.spacing.lg },
  sectionIcon: { width: 43, height: 43, borderRadius: 15, backgroundColor: Theme.colors.primaryMist, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { ...Theme.typography.h3, color: Theme.colors.textPrimary },
  sectionCopy: { ...Theme.typography.caption, color: Theme.colors.textSecondary, marginTop: 2 },
  searchRow: { gap: Theme.spacing.md, marginTop: Theme.spacing.md },
  searchButton: { marginTop: Theme.spacing.sm },
  searchResults: { marginTop: Theme.spacing.sm, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.radius.md, overflow: 'hidden' },
  resultRow: { padding: Theme.spacing.md, borderTopWidth: 1, borderTopColor: Theme.colors.divider },
  resultAddress: { ...Theme.typography.body, color: Theme.colors.textPrimary },
  resultMeta: { ...Theme.typography.caption, color: Theme.colors.textTertiary, marginTop: 4 },
  mapBlock: { marginTop: Theme.spacing.lg },
  mapHeading: { marginBottom: Theme.spacing.sm },
  mapTitle: { ...Theme.typography.bodySmall, color: Theme.colors.textPrimary, fontWeight: '700' },
  mapCopy: { ...Theme.typography.caption, color: Theme.colors.textSecondary, marginTop: 3 },
  attribution: { ...Theme.typography.caption, color: Theme.colors.textTertiary, marginTop: Theme.spacing.sm, textDecorationLine: 'underline' },
  locationSelected: { backgroundColor: Theme.colors.primaryMist, marginTop: Theme.spacing.md, borderRadius: Theme.radius.md, padding: Theme.spacing.md },
  locationTitle: { ...Theme.typography.overline, color: Theme.colors.textTertiary },
  locationAddress: { ...Theme.typography.body, color: Theme.colors.textPrimary, marginTop: 3 },
  locationMeta: { ...Theme.typography.caption, color: Theme.colors.textSecondary, marginTop: 2 },
  images: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: Theme.spacing.md },
  image: { width: 76, height: 76, borderRadius: Theme.radius.md },
  submit: { marginTop: Theme.spacing.sm },
});
