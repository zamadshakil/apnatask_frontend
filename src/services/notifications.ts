import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { typedApi } from './api';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });

export async function enablePushNotifications(): Promise<void> {
  if (Platform.OS === 'web') throw new Error('Web push is not enabled yet.');
  if (!Device.isDevice) throw new Error('Push notifications require a physical device.');
  const existing = await Notifications.getPermissionsAsync();
  const permission = existing.granted ? existing : await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error('Notification permission was not granted.');
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) throw new Error('This build is not linked to an EAS project.');
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const { error } = await typedApi.POST('/api/v2/device-tokens', { body: { token, platform: Platform.OS as 'android' | 'ios' } });
  if (error) throw new Error('Could not register this device for notifications.');
}
