import { Camera, Map as LibreMap, Marker } from '@maplibre/maplibre-react-native';
import { MapPin } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { runtime } from '../../config/runtime';
import { Theme } from '../../styles/theme';
import type { DynamicMapProps } from './DynamicMap.types';

export default function DynamicMap({
  center,
  height = 330,
  markers = [],
  mode,
  onCenterChange,
  onMarkerPress,
  selectedMarkerId,
  zoom = 13,
}: DynamicMapProps) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const handleRegionChange = useCallback((event: Parameters<NonNullable<React.ComponentProps<typeof LibreMap>['onRegionDidChange']>>[0]) => {
    if (mode !== 'picker' || !event.nativeEvent.userInteraction) return;
    const [longitude, latitude] = event.nativeEvent.center;
    onCenterChange?.({ latitude, longitude });
  }, [mode, onCenterChange]);

  return (
    <View style={[styles.frame, { height }]}>
      <LibreMap
        mapStyle={runtime.mapStyleUrl}
        onDidFailLoadingMap={() => setFailed(true)}
        onDidFinishLoadingMap={() => setReady(true)}
        onDidFinishLoadingStyle={() => setReady(true)}
        onRegionDidChange={handleRegionChange}
        style={StyleSheet.absoluteFill}
      >
        <Camera center={[center.longitude, center.latitude]} zoom={zoom} maxBounds={[60.5, 23, 77.5, 37.2]} />
        {mode === 'markers' && markers.map((marker) => {
          const selected = marker.id === selectedMarkerId;
          const origin = marker.variant === 'origin';
          return (
            <Marker
              key={marker.id}
              id={marker.id}
              lngLat={[marker.longitude, marker.latitude]}
              anchor="bottom"
              onPress={() => onMarkerPress?.(marker.id)}
            >
              <View style={origin ? styles.origin : [styles.marker, selected && styles.markerSelected]}>
                {!origin && <Text style={[styles.markerText, selected && styles.markerTextSelected]}>{marker.label || 'Task'}</Text>}
              </View>
            </Marker>
          );
        })}
      </LibreMap>
      {!ready && !failed && <View pointerEvents="none" style={styles.state}><ActivityIndicator color={Theme.colors.primary} /><Text style={styles.stateText}>Loading live map…</Text></View>}
      {failed && <View style={styles.state}><Text style={styles.errorTitle}>Map unavailable</Text><Text style={styles.stateText}>Address search still works. Check the configured map style.</Text></View>}
      {mode === 'picker' && <View pointerEvents="none" style={styles.pin}><MapPin size={42} color={Theme.colors.primary} fill="#FFFFFF" /></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { position: 'relative', overflow: 'hidden', borderRadius: Theme.radius.lg, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: Theme.colors.surfaceMuted },
  state: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(244,248,247,0.92)' },
  stateText: { ...Theme.typography.caption, color: Theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: 28 },
  errorTitle: { ...Theme.typography.h3, color: Theme.colors.textPrimary },
  pin: { position: 'absolute', left: '50%', top: '50%', marginLeft: -21, marginTop: -42 },
  marker: { minWidth: 56, minHeight: 34, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: Theme.colors.primary, alignItems: 'center' },
  markerSelected: { backgroundColor: '#073D38' },
  markerText: { color: Theme.colors.primary, fontSize: 12, fontWeight: '800' },
  markerTextSelected: { color: '#FFFFFF' },
  origin: { width: 20, height: 20, borderRadius: 10, backgroundColor: Theme.colors.primary, borderColor: '#FFFFFF', borderWidth: 3 },
});
