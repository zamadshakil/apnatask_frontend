import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { runtime } from '../../config/runtime';
import { Theme } from '../../styles/theme';
import type { DynamicMapProps } from './DynamicMap.types';
import { useTranslation } from 'react-i18next';

const PAKISTAN_BOUNDS: maplibregl.LngLatBoundsLike = [[60.5, 23], [77.5, 37.2]];

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
  const { t, i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRefs = useRef<maplibregl.Marker[]>([]);
  const centerChangeRef = useRef(onCenterChange);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    centerChangeRef.current = onCenterChange;
  }, [onCenterChange]);

  useEffect(() => {
    if (!containerRef.current) return;
    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: runtime.mapStyleUrl,
        center: [center.longitude, center.latitude],
        zoom,
        maxBounds: PAKISTAN_BOUNDS,
        attributionControl: { compact: true },
        cooperativeGestures: true,
        locale: {
          'AttributionControl.ToggleAttribution': t('experience.map.toggleAttribution'),
          'Map.Title': t('experience.map.mapTitle'),
          'Marker.Title': t('experience.map.marker'),
          'NavigationControl.ZoomIn': t('experience.map.zoomIn'),
          'NavigationControl.ZoomOut': t('experience.map.zoomOut'),
          'CooperativeGesturesHandler.WindowsHelpText': t('experience.map.windowsHelp'),
          'CooperativeGesturesHandler.MacHelpText': t('experience.map.macHelp'),
          'CooperativeGesturesHandler.MobileHelpText': t('experience.map.mobileHelp'),
        },
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      map.on('load', () => setReady(true));
      // styledata arrives before all visible tiles and prevents a slow or
      // unavailable label glyph from leaving an opaque loading layer forever.
      map.once('styledata', () => setReady(true));
      map.on('dragend', () => {
        if (mode !== 'picker') return;
        const next = map.getCenter();
        centerChangeRef.current?.({ latitude: next.lat, longitude: next.lng });
      });
      mapRef.current = map;
      return () => {
        markerRefs.current.forEach((marker) => marker.remove());
        markerRefs.current = [];
        map.remove();
        mapRef.current = null;
      };
    } catch {
      setFailed(true);
    }
  }, [i18n.language, mode, t]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const current = map.getCenter();
    if (Math.abs(current.lat - center.latitude) < 0.00001 && Math.abs(current.lng - center.longitude) < 0.00001) return;
    map.easeTo({ center: [center.longitude, center.latitude], zoom, duration: 550 });
  }, [center.latitude, center.longitude, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || mode !== 'markers') return;
    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = markers.map((marker) => {
      const element = document.createElement('button');
      element.type = 'button';
      element.title = marker.title;
      element.setAttribute('aria-label', marker.title);
      element.textContent = marker.label || '•';
      const selected = marker.id === selectedMarkerId;
      Object.assign(element.style, {
        appearance: 'none',
        background: marker.variant === 'origin' ? '#075E54' : selected ? '#073D38' : '#FFFFFF',
        border: marker.variant === 'origin' ? '3px solid #FFFFFF' : '2px solid #075E54',
        borderRadius: '999px',
        boxShadow: '0 5px 16px rgba(7, 61, 56, 0.24)',
        color: marker.variant === 'origin' || selected ? '#FFFFFF' : '#075E54',
        cursor: 'pointer',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        fontWeight: '800',
        minHeight: marker.variant === 'origin' ? '20px' : '34px',
        minWidth: marker.variant === 'origin' ? '20px' : '54px',
        padding: marker.variant === 'origin' ? '0' : '7px 10px',
      });
      if (marker.variant !== 'origin') {
        const label = document.createElement('span');
        label.textContent = marker.label || t('experience.map.marker');
        label.style.display = 'block';
        element.textContent = '';
        element.appendChild(label);
      }
      element.addEventListener('click', (event) => {
        event.stopPropagation();
        onMarkerPress?.(marker.id);
      });
      return new maplibregl.Marker({ element, anchor: marker.variant === 'origin' ? 'center' : 'bottom' })
        .setLngLat([marker.longitude, marker.latitude])
        .addTo(map);
    });
  }, [markers, mode, onMarkerPress, ready, selectedMarkerId, t]);

  return (
    <View style={[styles.frame, { height }]}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} aria-label={t('experience.map.aria')} />
      {!ready && !failed && <View pointerEvents="none" style={styles.state}><ActivityIndicator color={Theme.colors.primary} /><Text style={styles.stateText}>{t('experience.map.loading')}</Text></View>}
      {failed && <View style={styles.state}><Text style={styles.errorTitle}>{t('experience.map.unavailable')}</Text><Text style={styles.stateText}>{t('experience.map.searchWorks')}</Text></View>}
      {mode === 'picker' && <View pointerEvents="none" style={styles.pin}><MapPin size={42} color={Theme.colors.primary} fill="#FFFFFF" /></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { position: 'relative', overflow: 'hidden', borderRadius: Theme.radius.lg, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: Theme.colors.surfaceMuted },
  state: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(244,248,247,0.9)' },
  stateText: { ...Theme.typography.caption, color: Theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: 28 },
  errorTitle: { ...Theme.typography.h3, color: Theme.colors.textPrimary },
  pin: { position: 'absolute', left: '50%', top: '50%', marginLeft: -21, marginTop: -42 },
});
