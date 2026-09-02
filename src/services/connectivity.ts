import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { Platform } from 'react-native';

export function snapshotIsOnline(state: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>): boolean {
  return state.isConnected === true && state.isInternetReachable !== false;
}

function browserIsOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

export function subscribeToConnectivity(listener: (online: boolean) => void): () => void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const report = () => listener(browserIsOnline());
    window.addEventListener('online', report);
    window.addEventListener('offline', report);
    void report();
    return () => {
      window.removeEventListener('online', report);
      window.removeEventListener('offline', report);
    };
  }
  return NetInfo.addEventListener((state) => listener(snapshotIsOnline(state)));
}

export async function isOnline(): Promise<boolean> {
  if (Platform.OS === 'web') {
    // "Offline" describes the user's network, not a sleeping or temporarily
    // unavailable API. Request-level loading/retry states handle backend cold
    // starts without falsely blaming the user's connection.
    return browserIsOnline();
  }
  return snapshotIsOnline(await NetInfo.fetch());
}
