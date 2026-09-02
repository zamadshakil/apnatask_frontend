import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';

import { Theme } from '../../styles/theme';
import { ApnaTaskMark, ApnaTaskMarkMode } from './ApnaTaskMark';

interface ApnaTaskLogoProps {
  markMode?: ApnaTaskMarkMode;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function ApnaTaskLogo({
  markMode = 'primary',
  size = 34,
  color = Theme.colors.textPrimary,
  style,
}: ApnaTaskLogoProps) {
  return (
    <View accessibilityLabel="ApnaTask" accessibilityRole="image" style={styles.lockup}>
      <ApnaTaskMark accessibilityLabel="" mode={markMode} size={size} />
      <Text style={[styles.wordmark, { color, fontSize: size * 0.72, lineHeight: size }, style]}>ApnaTask</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  wordmark: { fontWeight: '800', letterSpacing: -0.7 },
});
