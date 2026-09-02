import * as Crypto from 'expo-crypto';
import { createIdempotencyKey, typedApi } from './api';

type EventName =
  | 'onboarding_step'
  | 'task_post_step'
  | 'map_search'
  | 'moderation_status'
  | 'offer_compare'
  | 'provider_feed'
  | 'bid_sheet'
  | 'task_transition'
  | 'support_opened';

type SafeProperties = Record<string, string | number | boolean | null>;

/**
 * Product analytics is intentionally best-effort and metadata-only. Never pass
 * free text, coordinates, addresses, messages, phone numbers, or image data.
 */
export async function trackEvent(name: EventName, properties: SafeProperties = {}): Promise<void> {
  try {
    await typedApi.POST('/api/v2/analytics/events', {
      headers: { 'Idempotency-Key': createIdempotencyKey() },
      body: {
        events: [{
          client_event_id: Crypto.randomUUID(),
          name,
          occurred_at: new Date().toISOString(),
          properties,
        }],
      },
    });
  } catch {
    // Analytics must never block a marketplace action.
  }
}
