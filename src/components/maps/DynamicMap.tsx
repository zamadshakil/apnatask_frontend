import React from 'react';
import { Text } from 'react-native';
import type { DynamicMapProps } from './DynamicMap.types';
import { useTranslation } from 'react-i18next';

// Metro replaces this fallback with DynamicMap.web.tsx or
// DynamicMap.native.tsx. Keeping a base module also gives TypeScript one
// platform-neutral contract to resolve.
export default function DynamicMap(_props: DynamicMapProps) {
  const { t } = useTranslation();
  return <Text>{t('experience.map.unavailable')}</Text>;
}
