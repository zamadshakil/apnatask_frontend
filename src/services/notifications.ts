import { Platform } from 'react-native';

export async function enablePushNotifications(): Promise<void> {
  if (Platform.OS === 'web') throw new Error('Web push is not enabled yet.');
  const nativeNotifications = await import('./notifications.native');
  return nativeNotifications.enablePushNotifications();
}
