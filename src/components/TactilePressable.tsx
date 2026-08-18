import React, { useRef } from 'react';
import { Animated, Platform, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Theme } from '../styles/theme';

interface TactilePressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
}

export default function TactilePressable({ style, pressedScale = 0.975, onPressIn, onPressOut, children, ...props }: TactilePressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (value: number) => Animated.spring(scale, {
    toValue: value,
    damping: Theme.motion.spring.damping,
    stiffness: Theme.motion.spring.stiffness,
    mass: Theme.motion.spring.mass,
    useNativeDriver: Platform.OS !== 'web',
  }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        {...props}
        onPressIn={(event) => { animate(pressedScale); onPressIn?.(event); }}
        onPressOut={(event) => { animate(1); onPressOut?.(event); }}
        style={({ pressed }) => [style, pressed && { opacity: 0.92 }]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
