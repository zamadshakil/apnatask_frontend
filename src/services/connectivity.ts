import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { runtime } from '../config/runtime';

export function snapshotIsOnline(state: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>): boolean {
  return state.isConnected === true && state.isInternetReachable !== false;
}

function browserIsOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

let lastProbeAt = 0;
let lastProbeResult = true;

async function probeBackendReachable(): Promise<boolean> {
  const now = Date.now();
  if (now - lastProbeAt < 2500) return lastProbeResult;
  lastProbeAt = now;
  if (!runtime.apiBaseUrl) {
    lastProbeResult = false;
    return false;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(`${runtime.apiBaseUrl}/health/live`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    // Auth is not required for this endpoint to exist in our deployment model.
    lastProbeResult = response.ok || response.status === 401 || response.status === 403 || response.status === 405;
    return lastProbeResult;
  } catch {
    lastProbeResult = false;
    return false;
  }
}

export function subscribeToConnectivity(listener: (online: boolean) => void): () => void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const report = () => void isOnline().then((online) => listener(online));
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
    if (!browserIsOnline()) return false;
    return probeBackendReachable();
  }
  return snapshotIsOnline(await NetInfo.fetch());
}
