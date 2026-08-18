import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './AuthProvider';
import '../i18n';

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(Boolean(state.isConnected && state.isInternetReachable !== false))),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2, networkMode: 'offlineFirst' },
    mutations: { retry: 0, networkMode: 'online' },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'apnatask.public-query-cache.v2',
  throttleTime: 1000,
});

export function AppProviders({ children }: React.PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          dehydrateOptions: { shouldDehydrateQuery: (query) => query.meta?.persist === true },
        }}
      >
        <AuthProvider>{children}</AuthProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
