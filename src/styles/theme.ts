// src/styles/theme.ts — ApnaTask Design System
// Inspired by WhatsApp, Instagram, YouTube, Indrive brand aesthetics

export const Theme = {
  colors: {
    // Primary Brand Palette — Emerald Green
    primary: '#075E54',
    primaryLight: '#128C7E',
    primaryDark: '#054D44',
    accent: '#25D366',
    accentLight: '#34EB7A',

    // Dark Slate Palette
    darkSlate: '#1F2C34',
    darkSlateLight: '#2A3942',
    darkSlateMedium: '#233138',

    // Neutrals
    background: '#F0F2F5',
    backgroundDark: '#ECE5DD',
    surface: '#FFFFFF',
    surfaceElevated: '#FAFAFA',
    white: '#FFFFFF',

    // Chat Colors
    chatBubbleSent: '#DCF8C6',
    chatBubbleReceived: '#FFFFFF',
    chatBackground: '#E5DDD5',

    // Text Colors
    textPrimary: '#111B21',
    textSecondary: '#667781',
    textTertiary: '#8696A0',
    textOnPrimary: '#FFFFFF',
    textOnDark: '#E9EDEF',
    textDark: '#1F2C34',
    textLight: '#8696A0',

    // Semantic Colors
    success: '#25D366',
    successDark: '#1DAA53',
    error: '#EA0038',
    errorLight: '#FFEBEE',
    warning: '#F7C948',
    warningLight: '#FFF8E1',
    info: '#039BE5',

    // Borders & Dividers
    border: '#E1E8ED',
    borderLight: '#F0F2F5',
    divider: '#E9EDEF',

    // Wallet / Money
    moneyGreen: '#00C853',
    moneyGold: '#FFB300',

    // Badge / Status
    online: '#25D366',
    offline: '#8696A0',
    verified: '#039BE5',
    pending: '#F7C948',
  },

  // Typography
  typography: {
    h1: {
      fontSize: 28,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
      lineHeight: 34,
    },
    h2: {
      fontSize: 22,
      fontWeight: '700' as const,
      letterSpacing: -0.3,
      lineHeight: 28,
    },
    h3: {
      fontSize: 18,
      fontWeight: '600' as const,
      letterSpacing: 0,
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      letterSpacing: 0.15,
      lineHeight: 22,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      letterSpacing: 0.1,
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      letterSpacing: 0.4,
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.5,
      lineHeight: 20,
    },
    overline: {
      fontSize: 11,
      fontWeight: '600' as const,
      letterSpacing: 1.5,
      lineHeight: 16,
      textTransform: 'uppercase' as const,
    },
  },

  // Spacing Scale (4px base)
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    section: 40,
  },

  // Border Radius
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 999,
  },

  // Shadows
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 10,
    },
  },

  // Gradients (as linear stops for React Native)
  gradients: {
    primary: ['#075E54', '#128C7E'],
    primaryAccent: ['#075E54', '#25D366'],
    dark: ['#1F2C34', '#2A3942'],
    accent: ['#25D366', '#34EB7A'],
    wallet: ['#00C853', '#25D366'],
    sunset: ['#FF6F00', '#FFB300'],
  },
};

export const theme = Theme;
