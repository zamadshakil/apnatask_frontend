import Svg, { Circle, Path } from 'react-native-svg';

export type ApnaTaskMarkMode = 'duotone' | 'primary' | 'reversed';

interface ApnaTaskMarkProps {
  size?: number;
  mode?: ApnaTaskMarkMode;
  accessibilityLabel?: string;
}

const GREEN = '#075B55';
const CREAM = '#F7F4EC';

export function ApnaTaskMark({
  size = 40,
  mode = 'primary',
  accessibilityLabel = 'ApnaTask',
}: ApnaTaskMarkProps) {
  const primary = mode === 'reversed' ? '#FFFFFF' : GREEN;
  const back = mode === 'duotone' ? GREEN : primary;
  const front = mode === 'duotone' ? CREAM : primary;

  return (
    <Svg
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      height={size}
      viewBox="0 0 256 256"
      width={size}
    >
      <Path
        d="M62 207C67 172 83 116 113 75C120 65 130 63 139 70C173 102 199 165 216 207"
        fill="none"
        stroke={back}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={36}
      />
      <Path
        d="M40 207C60 165 90 112 128 74C136 66 148 68 155 77C183 117 197 166 195 207"
        fill="none"
        stroke={front}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={36}
      />
      <Circle cx={78} cy={42} fill={front} r={17} />
      <Circle cx={178} cy={42} fill={back} r={17} />
      <Path d="M112 207V166C112 153 122 143 135 143C148 143 158 153 158 166V207Z" fill={front} />
    </Svg>
  );
}
