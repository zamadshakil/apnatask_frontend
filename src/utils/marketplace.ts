export function assignedToProvider<T extends { selected_provider_id: string | null }>(items: T[], providerId?: string | null): T[] {
  return providerId ? items.filter((item) => item.selected_provider_id === providerId) : [];
}

export function problemDetail(error: unknown, fallback: string): string {
  return error && typeof error === 'object' && 'detail' in error && typeof error.detail === 'string'
    ? error.detail : fallback;
}

export const liveQueryOptions = { refetchInterval: 5000, refetchIntervalInBackground: false, refetchOnWindowFocus: true, refetchOnReconnect: true } as const;
