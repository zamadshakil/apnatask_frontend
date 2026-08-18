import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../styles/theme';

type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

function TabItem({ route, descriptor, focused, navigation }: { route: BottomTabBarProps['state']['routes'][number]; descriptor: BottomTabBarProps['descriptors'][string]; focused: boolean; navigation: BottomTabBarProps['navigation'] }) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => { Animated.spring(progress, { toValue: focused ? 1 : 0, damping: 18, stiffness: 210, mass: 0.8, useNativeDriver: Platform.OS !== 'web' }).start(); }, [focused, progress]);
  const options = descriptor.options;
  const color = focused ? Theme.colors.primary : Theme.colors.textTertiary;
  const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title ?? route.name;
  const icon = options.tabBarIcon?.({ focused, color, size: 22 });
  const onPress = () => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  };
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={options.tabBarAccessibilityLabel ?? label} onPress={onPress} style={styles.item}>
      <Animated.View style={[styles.itemContent, { transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }) }] }]}>
        {icon}
        <Text numberOfLines={1} style={[styles.label, { color }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const index = useRef(new Animated.Value(state.index)).current;
  useEffect(() => { Animated.spring(index, { toValue: state.index, damping: 20, stiffness: 190, mass: 0.85, useNativeDriver: Platform.OS !== 'web' }).start(); }, [index, state.index]);
  const itemWidth = width > 0 ? (width - 10) / state.routes.length : 0;
  const webGlass = Platform.OS === 'web' ? ({ backdropFilter: 'blur(24px) saturate(150%)' } as never) : null;

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={[styles.bar, webGlass]}>
        {Platform.OS !== 'web' && <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />}
        {itemWidth > 0 && <Animated.View style={[styles.indicator, { width: itemWidth, transform: [{ translateX: Animated.multiply(index, itemWidth) }] }]} />}
        {state.routes.map((route, routeIndex) => <TabItem key={route.key} route={route} descriptor={descriptors[route.key]} focused={state.index === routeIndex} navigation={navigation} />)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { backgroundColor: 'transparent', paddingHorizontal: 14, paddingTop: 7 },
  bar: { minHeight: 68, flexDirection: 'row', overflow: 'hidden', borderRadius: 25, padding: 5, backgroundColor: 'rgba(255,255,255,0.82)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', ...(Platform.OS === 'web' ? ({ boxShadow: Theme.webShadows.lg } as ViewStyle) : Theme.shadows.lg) },
  indicator: { position: 'absolute', left: 5, top: 5, bottom: 5, borderRadius: 20, backgroundColor: 'rgba(7,94,84,0.10)', borderWidth: 1, borderColor: 'rgba(7,94,84,0.06)' },
  item: { flex: 1, zIndex: 1 },
  itemContent: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { ...Theme.typography.metadata, fontSize: 10 },
});
