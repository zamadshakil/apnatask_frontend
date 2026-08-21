import React from 'react';
import { Text } from 'react-native';
import type { DynamicMapProps } from './DynamicMap.types';

// Metro replaces this fallback with DynamicMap.web.tsx or
// DynamicMap.native.tsx. Keeping a base module also gives TypeScript one
// platform-neutral contract to resolve.
export default function DynamicMap(_props: DynamicMapProps) {
  return <Text>Interactive maps are unavailable on this platform.</Text>;
}
