import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, Check, MapPin, Search, ShieldCheck } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import Button from '../../../src/components/Button';
import Card from '../../../src/components/Card';
import DynamicMap from '../../../src/components/maps/DynamicMap';
import Input from '../../../src/components/Input';
import { FadeIn } from '../../../src/components/Motion';
import { Screen } from '../../../src/components/Screen';
import TactilePressable from '../../../src/components/TactilePressable';
import { createIdempotencyKey, typedApi } from '../../../src/services/api';
import { trackEvent } from '../../../src/services/analytics';
import { isOnline } from '../../../src/services/connectivity';
import { GeocodedPlace, mapService } from '../../../src/services/maps';
import { pickTaskImages, PreparedImage, uploadImage } from '../../../src/services/uploads';
import { Theme } from '../../../src/styles/theme';
import i18n from '../../../src/i18n';

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
  arrivalPreference: 'asap' | 'today' | 'scheduled' | 'flexible';
};
const empty: Draft = { categoryId: '', title: '', description: '', budget: '', address: '', area: '', city: '', arrivalPreference: 'flexible' };
const PAKISTAN_CENTER = { latitude: 30.3753, longitude: 69.3451 };

export default function NewTaskScreen() {
  const params = useLocalSearchParams<{ categoryId?: string; problem?: string }>();
  const [draft, setDraft] = useState<Draft>({ ...empty, categoryId: params.categoryId ?? '', title: params.problem?.slice(0, 120) ?? '', description: params.problem ?? '' });
  const [locationSearch, setLocationSearch] = useState('');
  const [locations, setLocations] = useState<GeocodedPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [images, setImages] = useState<PreparedImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [feedback, setFeedback] = useState<{ tone: 'error' | 'info' | 'success'; text: string } | null>(null);
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
          title: params.problem?.slice(0, 120) ?? parsed.title ?? current.title,
          description: params.problem ?? parsed.description ?? current.description,
        };
      });
    });
  }, [params.categoryId, params.problem]);

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
        setFeedback({ tone: 'error', text: i18n.t('experience.post.locationPermission') });
        void trackEvent('map_search', { outcome: 'permission_denied', permission: 'denied' });
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const place = await mapService.reverse(current.coords);
      setDraft((value) => ({ ...value, ...place }));
      clearSearch();
      if (!place.address) {
        setFeedback({ tone: 'info', text: i18n.t('experience.post.pinImprecise') });
      }
    } catch {
      setFeedback({ tone: 'error', text: i18n.t('experience.post.locationUnavailable') });
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
        setFeedback({ tone: 'error', text: i18n.t('experience.post.pinNotFound') });
      }
    } finally {
      if (reverseRequest.current === requestId) setResolvingPin(false);
    }
  };

  const submit = async () => {
    if (resolvingPin) {
      setFeedback({ tone: 'info', text: i18n.t('experience.post.waitPin') });
      return;
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
      setFeedback({ tone: 'error', text: i18n.t('experience.post.required') });
      return;
    }
    if (!(await isOnline())) {
      setFeedback({ tone: 'info', text: i18n.t('experience.post.offlineDraft') });
      return;
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
          arrival_preference: draft.arrivalPreference,
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
      void trackEvent('task_post_step', { step: 'review', outcome: 'published', image_count: images.length });
      router.replace({ pathname: '/(customer)/task/[id]', params: { id: data.id } });
    } catch (error) {
      setFeedback({ tone: 'error', text: i18n.t('experience.post.postFailed') });
    } finally {
      setBusy(false);
    }
  };

  const locationLabel = draft.address || 'No location selected';
  const locationMeta = [draft.area, draft.city].filter(Boolean).join(' · ');
  const mapCenter = draft.latitude != null && draft.longitude != null
    ? { latitude: draft.latitude, longitude: draft.longitude }
    : PAKISTAN_CENTER;
  const problemReady = Boolean(draft.categoryId && draft.title.trim().length >= 5 && draft.description.trim().length >= 20);
  const locationReady = Boolean(draft.address && draft.area && draft.city && draft.latitude != null && draft.longitude != null && !resolvingPin);
  const goTo = (next: 1 | 2 | 3) => {
    if (next === 2 && !problemReady) {
      setFeedback({ tone: 'error', text: i18n.t('experience.post.problemRequired') });
      return;
    }
    if (next === 3 && !locationReady) {
      setFeedback({ tone: 'error', text: i18n.t('experience.post.locationRequired') });
      return;
    }
    setFeedback(null);
    setStep(next);
    void trackEvent('task_post_step', { step: next === 1 ? 'problem' : next === 2 ? 'location' : 'review', outcome: 'opened' });
  };

  return (
    <Screen topInset={false}>
      <FadeIn><Text style={styles.eyebrow}>{i18n.t('experience.post.eyebrow')}</Text><Text style={styles.title}>{step === 1 ? i18n.t('experience.post.what') : step === 2 ? i18n.t('experience.post.where') : i18n.t('experience.post.reviewTitle')}</Text><Text style={styles.copy}>{i18n.t('experience.post.draftPrivacy')}</Text></FadeIn>
      <View accessibilityRole="tablist" style={styles.progress}>
        {([i18n.t('experience.post.problem'), i18n.t('experience.post.location'), i18n.t('experience.post.review')] as const).map((label, index) => {
          const value = (index + 1) as 1 | 2 | 3;
          const active = value === step;
          const complete = value < step;
          return <TactilePressable key={label} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => value < step && goTo(value)} style={styles.progressItem}><View style={[styles.progressDot, (active || complete) && styles.progressDotActive]}>{complete ? <Check size={13} color={Theme.colors.white} /> : <Text style={[styles.progressNumber, active && styles.progressNumberActive]}>{value}</Text>}</View><Text style={[styles.progressLabel, active && styles.progressLabelActive]}>{label}</Text></TactilePressable>;
        })}
      </View>
      {feedback && <View accessibilityRole="alert" style={[styles.feedback, feedback.tone === 'error' && styles.feedbackError, feedback.tone === 'success' && styles.feedbackSuccess]}><Text style={styles.feedbackText}>{feedback.text}</Text></View>}
      {step === 1 && <FadeIn delay={60}>
        <Card variant="glass" style={styles.section}>
          <Text style={styles.label}>{i18n.t('experience.post.service')}</Text>
          <View style={styles.categories}>
            {categories.data?.map((category) => (
              <TactilePressable
                key={category.id}
                accessibilityRole="button"
                accessibilityLabel={i18n.t(`categories.${category.slug}`, { defaultValue: category.name_en })}
                accessibilityState={{ selected: draft.categoryId === category.id }}
                onPress={() => update('categoryId', category.id)}
                style={[styles.chip, draft.categoryId === category.id && styles.active]}
              >
                <Text style={[styles.chipText, draft.categoryId === category.id && styles.activeText]}>{i18n.t(`categories.${category.slug}`, { defaultValue: category.name_en })}</Text>
              </TactilePressable>
            ))}
          </View>
          <Input label={i18n.t('experience.post.shortTitle')} value={draft.title} onChangeText={(value) => update('title', value)} placeholder={i18n.t('experience.post.titlePlaceholder')} maxLength={120} />
          <Input label={i18n.t('experience.post.describe')} value={draft.description} onChangeText={(value) => update('description', value)} multiline numberOfLines={5} maxLength={2000} />
          <Input label={i18n.t('experience.post.budget')} value={draft.budget} onChangeText={(value) => update('budget', value.replace(/\D/g, ''))} keyboardType="number-pad" />
        </Card>
        <Card style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionIcon}><Camera color={Theme.colors.primary} size={21} /></View>
            <View><Text style={styles.sectionTitle}>{i18n.t('experience.post.showProblem')}</Text><Text style={styles.sectionCopy}>{i18n.t('experience.post.photoStatus', { count: images.length })}</Text></View>
          </View>
          <View style={styles.images}>{images.map((image) => <Image key={image.uri} source={{ uri: image.uri }} style={styles.image} />)}</View>
          <Button title={i18n.t('experience.post.addPhotos')} type="outline" disabled={images.length >= 5} onPress={() => void pickTaskImages(5 - images.length).then((picked) => setImages((all) => [...all, ...picked])).catch(() => setFeedback({ tone: 'error', text: i18n.t('experience.post.photosError') }))} />
        </Card>
        <Button title={i18n.t('experience.post.continueLocation')} size="lg" onPress={() => goTo(2)} style={styles.submit} />
      </FadeIn>}

      {step === 2 && <FadeIn delay={100}>
        <Card style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionIcon}><MapPin color={Theme.colors.primary} size={21} /></View>
            <View>
              <Text style={styles.sectionTitle}>{i18n.t('experience.post.taskLocation')}</Text>
              <Text style={styles.sectionCopy}>{i18n.t('experience.post.locationHelp')}</Text>
            </View>
          </View>
          <Button title={i18n.t('experience.post.currentLocation')} type="outline" icon={<MapPin color={Theme.colors.primary} size={18} />} onPress={() => void locate()} />
          <View style={styles.searchRow}>
            <Input
              label={i18n.t('experience.post.findAddress')}
              value={locationSearch}
              onChangeText={setLocationSearch}
              placeholder={i18n.t('experience.post.addressPlaceholder')}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.searchButton}>
              <Button title={searching ? i18n.t('experience.post.searching') : i18n.t('experience.post.search')} type="outline" icon={<Search color={Theme.colors.textPrimary} size={16} />} onPress={() => void setLocationSearch(locationSearch.trim())} />
            </View>
          </View>
          {!!locations.length && <View style={styles.searchResults}>
            {locations.map((place) => (
              <TactilePressable accessibilityRole="button" accessibilityLabel={i18n.t('experience.post.chooseLocation', { place: place.label ?? place.address })} key={`${place.latitude}-${place.longitude}-${place.address}`} style={styles.resultRow} onPress={() => pickFromSearch(place)}>
                <Text style={styles.resultAddress} numberOfLines={2}>{place.label ?? place.address}</Text>
                <Text style={styles.resultMeta}>{place.address ? `${place.area}${place.city ? ` · ${place.city}` : ''}` : i18n.t('experience.post.selectLocation')}</Text>
              </TactilePressable>
            ))}
          </View>}
          <View style={styles.mapBlock}>
            <View style={styles.mapHeading}>
              <Text style={styles.mapTitle}>{i18n.t('experience.post.moveMap')}</Text>
              <Text style={styles.mapCopy}>{i18n.t('experience.post.mapPrivacy')}</Text>
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
            {i18n.t('experience.post.attribution')}
          </Text>
          <View style={styles.locationSelected}>
            <Text style={styles.locationTitle}>{i18n.t('experience.post.chosenLocation')}</Text>
            <Text style={styles.locationAddress} numberOfLines={2}>{resolvingPin ? i18n.t('experience.post.resolvingPin') : locationLabel}</Text>
            {!!locationMeta && <Text style={styles.locationMeta}>{locationMeta}</Text>}
          </View>
          <Text style={[styles.label, { marginTop: Theme.spacing.xl }]}>{i18n.t('experience.post.when')}</Text>
          <View style={styles.categories}>
            {([['asap', i18n.t('experience.post.asap')], ['today', i18n.t('experience.post.today')], ['scheduled', i18n.t('experience.post.scheduled')], ['flexible', i18n.t('experience.post.flexible')]] as const).map(([value, label]) => <TactilePressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: draft.arrivalPreference === value }} key={value} onPress={() => setDraft((current) => ({ ...current, arrivalPreference: value }))} style={[styles.chip, draft.arrivalPreference === value && styles.active]}><Text style={[styles.chipText, draft.arrivalPreference === value && styles.activeText]}>{label}</Text></TactilePressable>)}
          </View>
        </Card>
        <View style={styles.actions}><Button title={i18n.t('experience.post.back')} type="outline" onPress={() => goTo(1)} style={styles.actionButton} /><Button title={i18n.t('experience.post.reviewTask')} onPress={() => goTo(3)} style={styles.actionButton} /></View>
      </FadeIn>}

      {step === 3 && <FadeIn delay={140}>
        <Card elevation="md" style={styles.section}>
          <View style={styles.reviewTop}><View style={styles.sectionIcon}><ShieldCheck color={Theme.colors.primary} size={21} /></View><View style={{ flex: 1 }}><Text style={styles.sectionTitle}>{i18n.t('experience.post.safetyTitle')}</Text><Text style={styles.sectionCopy}>{i18n.t('experience.post.safetyCopy')}</Text></View></View>
          <ReviewRow label={i18n.t('experience.post.problem')} value={draft.title} onEdit={() => goTo(1)} />
          <ReviewRow label={i18n.t('experience.post.service')} value={categories.data?.find((item) => item.id === draft.categoryId) ? i18n.t(`categories.${categories.data.find((item) => item.id === draft.categoryId)?.slug}`, { defaultValue: categories.data.find((item) => item.id === draft.categoryId)?.name_en }) : i18n.t('experience.post.selectedService')} onEdit={() => goTo(1)} />
          <ReviewRow label={i18n.t('experience.post.location')} value={`${draft.area}, ${draft.city}`} onEdit={() => goTo(2)} />
          <ReviewRow label={i18n.t('experience.post.when')} value={draft.arrivalPreference === 'asap' ? i18n.t('experience.post.asap') : draft.arrivalPreference === 'today' ? i18n.t('experience.post.today') : draft.arrivalPreference === 'scheduled' ? i18n.t('experience.post.scheduled') : i18n.t('experience.post.flexible')} onEdit={() => goTo(2)} />
          <ReviewRow label={i18n.t('experience.post.budget')} value={draft.budget ? `Rs ${Number(draft.budget).toLocaleString()}` : i18n.t('experience.post.openOffers')} onEdit={() => goTo(1)} />
          <View style={styles.privacyPanel}><ShieldCheck size={18} color={Theme.colors.primary} /><Text style={styles.privacyText}>{i18n.t('experience.post.providersPrivacy')}</Text></View>
        </Card>
        <View style={styles.actions}><Button title={i18n.t('experience.post.back')} type="outline" onPress={() => goTo(2)} style={styles.actionButton} /><Button title={i18n.t('experience.post.postTask')} loading={busy} onPress={() => void submit()} style={styles.actionButton} /></View>
      </FadeIn>}
    </Screen>
  );
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return <View style={styles.reviewRow}><View style={{ flex: 1 }}><Text style={styles.reviewLabel}>{label}</Text><Text style={styles.reviewValue}>{value}</Text></View><TactilePressable accessibilityRole="button" onPress={onEdit} style={styles.editButton}><Text style={styles.editText}>{i18n.t('experience.post.edit')}</Text></TactilePressable></View>;
}

const styles = StyleSheet.create({
  eyebrow: { ...Theme.typography.overline, color: Theme.colors.primary },
  title: { ...Theme.typography.h1, color: Theme.colors.textPrimary, marginTop: 4 },
  copy: { ...Theme.typography.body, color: Theme.colors.textSecondary, marginTop: 8, marginBottom: Theme.spacing.xl },
  progress: { flexDirection: 'row', marginBottom: Theme.spacing.lg, gap: Theme.spacing.lg },
  progressItem: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7 },
  progressDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: Theme.colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  progressDotActive: { backgroundColor: Theme.colors.primary },
  progressNumber: { ...Theme.typography.caption, color: Theme.colors.textSecondary },
  progressNumberActive: { color: Theme.colors.white },
  progressLabel: { ...Theme.typography.caption, color: Theme.colors.textTertiary },
  progressLabelActive: { color: Theme.colors.primary, fontWeight: '700' },
  feedback: { backgroundColor: Theme.colors.warningLight, borderRadius: Theme.radius.md, padding: Theme.spacing.md, marginBottom: Theme.spacing.md, borderLeftWidth: 4, borderLeftColor: Theme.colors.warning },
  feedbackError: { backgroundColor: Theme.colors.errorLight, borderLeftColor: Theme.colors.error },
  feedbackSuccess: { backgroundColor: Theme.colors.primaryMist, borderLeftColor: Theme.colors.successDark },
  feedbackText: { ...Theme.typography.bodySmall, color: Theme.colors.textPrimary },
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
  actions: { flexDirection: 'row', gap: Theme.spacing.md, marginTop: Theme.spacing.sm },
  actionButton: { flex: 1 },
  reviewTop: { flexDirection: 'row', gap: Theme.spacing.md, alignItems: 'center', paddingBottom: Theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: Theme.colors.divider },
  reviewRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Theme.colors.divider, paddingVertical: Theme.spacing.md },
  reviewLabel: { ...Theme.typography.caption, color: Theme.colors.textTertiary },
  reviewValue: { ...Theme.typography.body, color: Theme.colors.textPrimary, marginTop: 2 },
  editButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  editText: { ...Theme.typography.caption, color: Theme.colors.primary, fontWeight: '700' },
  privacyPanel: { flexDirection: 'row', gap: Theme.spacing.sm, backgroundColor: Theme.colors.primaryMist, borderRadius: Theme.radius.md, padding: Theme.spacing.md, marginTop: Theme.spacing.lg },
  privacyText: { ...Theme.typography.bodySmall, color: Theme.colors.textPrimary, flex: 1 },
});
