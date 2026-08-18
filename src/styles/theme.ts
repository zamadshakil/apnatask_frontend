import { Platform } from 'react-native';

const systemFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
});

export const Theme = {
  colors: {
    primary: '#075E54',
    primaryLight: '#128C7E',
    primaryDark: '#04483F',
    primaryMist: '#E7F4F1',
    accent: '#25D366',
    accentLight: '#54DF8A',

    darkSlate: '#182723',
    darkSlateLight: '#263A34',
    darkSlateMedium: '#21332E',

    background: '#F3F6F5',
    backgroundDark: '#E7ECEA',
    surface: '#FFFFFF',
    surfaceElevated: '#FBFCFC',
    surfaceMuted: '#EDF2F0',
    surfaceGlass: 'rgba(255,255,255,0.78)',
    surfaceGlassStrong: 'rgba(255,255,255,0.92)',
    white: '#FFFFFF',

    chatBubbleSent: '#DDF5EA',
    chatBubbleReceived: '#FFFFFF',
    chatBackground: '#EDF2F0',

    textPrimary: '#13211E',
    textSecondary: '#5F716C',
    textTertiary: '#879590',
    textOnPrimary: '#FFFFFF',
    textOnDark: '#F2F7F5',
    textDark: '#182723',
    textLight: '#879590',

    success: '#25D366',
    successDark: '#16884B',
    error: '#D92D4F',
    errorLight: '#FFF0F3',
    warning: '#E9AF28',
    warningLight: '#FFF8E8',
    info: '#2188D9',

    border: '#DCE5E2',
    borderLight: '#EAF0EE',
    glassBorder: 'rgba(255,255,255,0.72)',
    divider: '#E6ECEA',

    moneyGreen: '#0F8A55',
    moneyGold: '#C88712',
    online: '#25D366',
    offline: '#879590',
    verified: '#2188D9',
    pending: '#E9AF28',
  },

  typography: {
    display: { fontFamily: systemFont, fontSize: 36, fontWeight: '700' as const, letterSpacing: -1.15, lineHeight: 42 },
    h1: { fontFamily: systemFont, fontSize: 30, fontWeight: '700' as const, letterSpacing: -0.8, lineHeight: 36 },
    h2: { fontFamily: systemFont, fontSize: 23, fontWeight: '700' as const, letterSpacing: -0.45, lineHeight: 29 },
    h3: { fontFamily: systemFont, fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.15, lineHeight: 24 },
    body: { fontFamily: systemFont, fontSize: 16, fontWeight: '400' as const, letterSpacing: -0.1, lineHeight: 23 },
    bodySmall: { fontFamily: systemFont, fontSize: 14, fontWeight: '400' as const, letterSpacing: -0.05, lineHeight: 20 },
    caption: { fontFamily: systemFont, fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.05, lineHeight: 16 },
    metadata: { fontFamily: systemFont, fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.2, lineHeight: 15 },
    button: { fontFamily: systemFont, fontSize: 16, fontWeight: '600' as const, letterSpacing: -0.1, lineHeight: 20 },
    overline: { fontFamily: systemFont, fontSize: 11, fontWeight: '700' as const, letterSpacing: 1.15, lineHeight: 16, textTransform: 'uppercase' as const },
  },

  spacing: { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, section: 40, hero: 48 },
  radius: { xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 30, sheet: 34, full: 999 },

  shadows: {
    sm: { shadowColor: '#0B2D25', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    md: { shadowColor: '#0B2D25', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
    lg: { shadowColor: '#0B2D25', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.11, shadowRadius: 24, elevation: 6 },
    xl: { shadowColor: '#0B2D25', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.13, shadowRadius: 34, elevation: 9 },
  },

  webShadows: {
    sm: '0 1px 5px rgba(7, 52, 42, 0.06)',
    md: '0 6px 20px rgba(7, 52, 42, 0.09)',
    lg: '0 14px 34px rgba(7, 52, 42, 0.12)',
    xl: '0 20px 46px rgba(7, 52, 42, 0.14)',
  },

  motion: {
    quick: 140,
    standard: 240,
    sheet: 360,
    spring: { damping: 18, stiffness: 220, mass: 0.8 },
    gentleSpring: { damping: 20, stiffness: 150, mass: 0.9 },
  },

  gradients: {
    primary: ['#075E54', '#0A7164'],
    primaryAccent: ['#075E54', '#14947F'],
    dark: ['#182723', '#263A34'],
    accent: ['#25D366', '#54DF8A'],
    wallet: ['#0F8A55', '#25D366'],
    sunset: ['#E38B24', '#F4C45C'],
    hero: ['#075E54', '#0A6B60', '#128C7E'],
  },
} as const;

export const theme = Theme;
