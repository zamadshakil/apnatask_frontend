import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';

export type SupportedLocale = 'en' | 'ur' | 'ur-Latn';
const localeKey = 'apnatask.locale';

const resources = {
  en: {
    translation: {
      common: { retry: 'Try again', cancel: 'Cancel', continue: 'Continue', offline: 'You are offline' },
      auth: { title: 'Services you can trust', phone: 'Mobile number', otp: 'Verification code', send: 'Send code', verify: 'Verify and continue' },
      tabs: { home: 'Home', tasks: 'My tasks', messages: 'Messages', account: 'Account', jobs: 'Find jobs', credits: 'Credits' },
      home: { greeting: 'Assalam-o-Alaikum', title: 'What do you need help with?', post: 'Post a task' },
    },
  },
  ur: {
    translation: {
      common: { retry: 'دوبارہ کوشش کریں', cancel: 'منسوخ', continue: 'جاری رکھیں', offline: 'آپ آف لائن ہیں' },
      auth: { title: 'قابلِ اعتماد خدمات', phone: 'موبائل نمبر', otp: 'تصدیقی کوڈ', send: 'کوڈ بھیجیں', verify: 'تصدیق کریں' },
      tabs: { home: 'ہوم', tasks: 'میرے کام', messages: 'پیغامات', account: 'اکاؤنٹ', jobs: 'کام تلاش کریں', credits: 'کریڈٹس' },
      home: { greeting: 'السلام علیکم', title: 'آپ کو کس کام میں مدد چاہیے؟', post: 'کام پوسٹ کریں' },
    },
  },
  'ur-Latn': {
    translation: {
      common: { retry: 'Dobara koshish karein', cancel: 'Mansookh', continue: 'Jari rakhein', offline: 'Aap offline hain' },
      auth: { title: 'Bharosemand khidmaat', phone: 'Mobile number', otp: 'Tasdeeqi code', send: 'Code bhejein', verify: 'Tasdeeq karein' },
      tabs: { home: 'Home', tasks: 'Mere kaam', messages: 'Paighamaat', account: 'Account', jobs: 'Kaam dhoondein', credits: 'Credits' },
      home: { greeting: 'Assalam-o-Alaikum', title: 'Aap ko kis kaam mein madad chahiye?', post: 'Kaam post karein' },
    },
  },
} as const;

function detectedLocale(): SupportedLocale {
  const languageTag = Localization.getLocales()[0]?.languageTag;
  if (languageTag?.toLowerCase().startsWith('ur-latn')) return 'ur-Latn';
  if (languageTag?.toLowerCase().startsWith('ur')) return 'ur';
  return 'en';
}

void i18n.use(initReactI18next).init({
  resources,
  lng: detectedLocale(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

if (Platform.OS !== 'web') {
  void SecureStore.getItemAsync(localeKey).then((saved) => {
    if (saved && saved in resources) void setLocale(saved as SupportedLocale);
  });
}

export async function setLocale(locale: SupportedLocale): Promise<boolean> {
  await i18n.changeLanguage(locale);
  if (Platform.OS !== 'web') await SecureStore.setItemAsync(localeKey, locale);
  const shouldBeRTL = locale === 'ur';
  const needsRestart = I18nManager.isRTL !== shouldBeRTL;
  I18nManager.allowRTL(shouldBeRTL);
  I18nManager.forceRTL(shouldBeRTL);
  return needsRestart;
}

export const isRTL = () => i18n.language === 'ur';
export default i18n;
