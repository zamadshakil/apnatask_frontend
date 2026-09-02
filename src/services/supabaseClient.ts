import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { runtime } from '../config/runtime';

const CHUNK_SIZE = 1800;
const memoryStorage = new Map<string, string>();
const chunkKey = (key: string, suffix: string) => `${key.replace(/[^A-Za-z0-9._-]/g, '_')}.${suffix}`;

function webStorage() {
  return typeof window !== 'undefined' ? window.localStorage : undefined;
}

const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return webStorage()?.getItem(key) ?? memoryStorage.get(key) ?? null;
    }
    const count = Number(await SecureStore.getItemAsync(chunkKey(key, 'chunks')));
    if (!count) return null;
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, index) => SecureStore.getItemAsync(chunkKey(key, String(index)))),
    );
    return chunks.some((part) => part === null) ? null : chunks.join('');
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      const storage = webStorage();
      if (storage) storage.setItem(key, value);
      else memoryStorage.set(key, value);
      return;
    }
    const previousCount = Number(await SecureStore.getItemAsync(chunkKey(key, 'chunks')));
    const chunks = value.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'gs')) ?? [];
    await Promise.all(
      chunks.map((part, index) =>
        SecureStore.setItemAsync(chunkKey(key, String(index)), part, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        }),
      ),
    );
    await SecureStore.setItemAsync(chunkKey(key, 'chunks'), String(chunks.length));
    await Promise.all(
      Array.from({ length: Math.max(0, previousCount - chunks.length) }, (_, index) =>
        SecureStore.deleteItemAsync(chunkKey(key, String(chunks.length + index))),
      ),
    );
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      webStorage()?.removeItem(key);
      memoryStorage.delete(key);
      return;
    }
    const count = Number(await SecureStore.getItemAsync(chunkKey(key, 'chunks')));
    await Promise.all([
      SecureStore.deleteItemAsync(chunkKey(key, 'chunks')),
      ...Array.from({ length: count || 0 }, (_, index) =>
        SecureStore.deleteItemAsync(chunkKey(key, String(index))),
      ),
    ]);
  },
};

export const supabase = createClient(runtime.supabaseUrl, runtime.supabaseAnonKey, {
  auth: {
    storage: secureSessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});
