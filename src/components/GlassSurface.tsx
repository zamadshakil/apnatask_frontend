import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Theme } from '../styles/theme';

interface GlassSurfaceProps extends React.PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
  strong?: boolean;
}

export default function GlassSurface({ children, style, contentStyle, intensity = 58, strong = false }: GlassSurfaceProps) {
  const webMaterial = Platform.OS === 'web'
    ? ({ backdropFilter: `blur(${strong ? 24 : 18}px) saturate(145%)` } as unknown as ViewStyle)
    : null;

  return (
    <View style={[styles.shell, webMaterial, strong && styles.strong, style]}>
      {Platform.OS !== 'web' && <BlurView tint="light" intensity={intensity} style={StyleSheet.absoluteFill} />}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    backgroundColor: Theme.colors.surfaceGlass,
    borderWidth: 1,
    borderColor: Theme.colors.glassBorder,
  },
  strong: { backgroundColor: Theme.colors.surfaceGlassStrong },
  content: { flex: 1 },
});
