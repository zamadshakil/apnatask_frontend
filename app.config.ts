import type { ConfigContext, ExpoConfig } from 'expo/config';

const variants = ['development', 'staging', 'production'] as const;
type Variant = (typeof variants)[number];

function getVariant(): Variant {
  const requested = process.env.APP_VARIANT ?? 'development';
  if (!variants.includes(requested as Variant)) {
    throw new Error(`Unsupported APP_VARIANT: ${requested}`);
  }
  return requested as Variant;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = getVariant();
  const isProduction = variant === 'production';
  const suffix = isProduction ? '' : `.${variant}`;
  const appDomain = process.env.APP_DOMAIN ?? 'apnatask.pk';
  const projectId = process.env.EAS_PROJECT_ID;

  if (isProduction && process.env.EAS_BUILD && !projectId) {
    throw new Error('EAS_PROJECT_ID is required for production builds');
  }

  return {
    ...config,
    name: isProduction ? 'ApnaTask' : `ApnaTask ${variant}`,
    slug: 'apnatask',
    owner: process.env.EAS_OWNER,
    version: '1.0.0',
    scheme: 'apnatask',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    runtimeVersion: { policy: 'appVersion' },
    updates: projectId
      ? { url: `https://u.expo.dev/${projectId}`, fallbackToCacheTimeout: 0 }
      : undefined,
    extra: {
      eas: { projectId },
      appVariant: variant,
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: `pk.com.apnatask.app${suffix}`,
      associatedDomains: [`applinks:${appDomain}`],
      config: { usesNonExemptEncryption: false },
      infoPlist: {
        UIBackgroundModes: ['remote-notification'],
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: `pk.com.apnatask.app${suffix}`,
      adaptiveIcon: {
        backgroundColor: '#ECFDF5',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: true,
      permissions: [
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.CAMERA',
        'android.permission.POST_NOTIFICATIONS',
      ],
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: 'https', host: appDomain, pathPrefix: '/' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      ['expo-secure-store', { configureAndroidBackup: true }],
      'expo-localization',
      [
        'expo-splash-screen',
        {
          image: './assets/splash-icon.png',
          imageWidth: 180,
          resizeMode: 'contain',
          backgroundColor: '#FFFFFF',
          dark: { backgroundColor: '#07120E' },
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'ApnaTask uses your location to show nearby tasks and set service areas.',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission:
            'ApnaTask needs photo access so you can attach task and identity images.',
          cameraPermission:
            'ApnaTask needs camera access so you can take task and identity images.',
        },
      ],
      [
        'expo-notifications',
        { icon: './assets/android-icon-monochrome.png', color: '#059669' },
      ],
      '@sentry/react-native',
    ],
    experiments: { typedRoutes: true },
  };
};
