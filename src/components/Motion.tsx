import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleProp, ViewStyle } from 'react-native';
import { Theme } from '../styles/theme';

export function FadeIn({ children, delay = 0, distance = 10, style }: React.PropsWithChildren<{ delay?: number; distance?: number; style?: StyleProp<ViewStyle> }>) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: Theme.motion.standard, delay, useNativeDriver: Platform.OS !== 'web' }),
      Animated.spring(translateY, { toValue: 0, delay, damping: 20, stiffness: 180, mass: 0.85, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, [delay, opacity, translateY]);
  return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
}
