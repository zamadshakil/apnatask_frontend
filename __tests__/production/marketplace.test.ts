import { assignedToProvider, liveQueryOptions, problemDetail } from '../../src/utils/marketplace';
import { flowFixes } from '../../src/i18n/flowFixes';

test('provider assignments never include own customer work assigned to someone else', () => {
  const items = [{ id: 'mine', selected_provider_id: 'provider-one' }, { id: 'customer-task', selected_provider_id: 'provider-two' }, { id: 'open', selected_provider_id: null }];
  expect(assignedToProvider(items, 'provider-one').map(item => item.id)).toEqual(['mine']);
  expect(assignedToProvider(items, null)).toEqual([]);
});

test('live task views refetch while visible and recover on reconnect', () => {
  expect(liveQueryOptions.refetchInterval).toBeLessThanOrEqual(5000);
  expect(liveQueryOptions.refetchIntervalInBackground).toBe(false);
  expect(liveQueryOptions.refetchOnReconnect).toBe(true);
});

test('problem errors show useful details without rendering arbitrary objects', () => {
  expect(problemDetail({ detail: 'Outside service radius' }, 'Retry')).toBe('Outside service radius');
  expect(problemDetail({ detail: [{ secret: 'not displayed' }] }, 'Retry')).toBe('Retry');
});

test('English and Roman Urdu cover the same new states', () => {
  expect(Object.keys(flowFixes.en)).toEqual(Object.keys(flowFixes['ur-Latn']));
  expect(Object.keys(flowFixes.en.timeline)).toEqual(Object.keys(flowFixes['ur-Latn'].timeline));
});
