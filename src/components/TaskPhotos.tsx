import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';
import type { components } from '../api/schema';
import i18n from '../i18n';
import { Theme } from '../styles/theme';

function Photo({ photo, index }: { photo: components['schemas']['BookingImageResponse']; index: number }) {
  const [failedUrl, setFailedUrl] = useState<string>();
  return photo.url && failedUrl !== photo.url
    ? <Image source={{ uri: photo.url }} accessibilityLabel={i18n.t('flow.photo', { count: index + 1 })} onError={() => setFailedUrl(photo.url!)} resizeMode="contain" style={{ width: '100%', height: 230, borderRadius: 16, backgroundColor: Theme.colors.surfaceMuted }} />
    : <Text style={{ color: Theme.colors.textSecondary }}>{i18n.t('flow.imageUnavailable')}</Text>;
}

export default function TaskPhotos({ images = [] }: { images?: components['schemas']['BookingImageResponse'][] }) {
  if (!images.length) return null;
  return <View style={{ marginVertical: 20, gap: 12 }}><Text style={{ ...Theme.typography.h3, color: Theme.colors.textPrimary }}>{i18n.t('flow.photos')}</Text>{images.map((photo, index) => <Photo key={photo.id} photo={photo} index={index} />)}</View>;
}
