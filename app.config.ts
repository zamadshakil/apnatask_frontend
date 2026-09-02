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
  const appLinkDomain = process.env.APP_LINK_DOMAIN ?? `app.${appDomain}`;
  const linkDomains = [...new Set([appDomain, appLinkDomain])];
  const projectId = process.env.EAS_PROJECT_ID;
  const webOutput = process.env.EXPO_WEB_OUTPUT === 'static' ? 'static' : 'single';

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
      icon: {
        light: './assets/ios-icon-light.png',
        dark: './assets/ios-icon-dark.png',
        tinted: './assets/ios-icon-tinted.png',
      },
      associatedDomains: linkDomains.map((domain) => `applinks:${domain}`),
      config: { usesNonExemptEncryption: false },
      infoPlist: {
        UIBackgroundModes: ['remote-notification'],
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: `pk.com.apnatask.app${suffix}`,
      adaptiveIcon: {
        backgroundColor: '#082F2C',
        foregroundImage: './assets/android-icon-foreground.png',
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
          data: linkDomains.map((host) => ({ scheme: 'https', host, pathPrefix: '/' })),
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      bundler: 'metro',
      // Authenticated dynamic routes must use a client app shell. A separate
      // EXPO_WEB_OUTPUT=static build remains available for public SEO pages.
      output: webOutput,
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      '@maplibre/maplibre-react-native',
      ['expo-secure-store', { configureAndroidBackup: true }],
      'expo-localization',
      [
        'expo-splash-screen',
        {
          image: './assets/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#F7F4EC',
          dark: {
            image: './assets/splash-icon-dark.png',
            backgroundColor: '#082F2C',
          },
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
        { icon: './assets/notification-icon.png', color: '#075B55' },
      ],
      '@sentry/react-native',
    ],
    experiments: { typedRoutes: true },
  };
};
