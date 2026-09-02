import { snapshotIsOnline } from '../../src/services/connectivity';

describe('connectivity', () => {
  it('treats a connected network with pending reachability as online', () => {
    expect(snapshotIsOnline({ isConnected: true, isInternetReachable: null })).toBe(true);
  });

  it('reports confirmed unreachable and disconnected networks as offline', () => {
    expect(snapshotIsOnline({ isConnected: true, isInternetReachable: false })).toBe(false);
    expect(snapshotIsOnline({ isConnected: false, isInternetReachable: true })).toBe(false);
  });
});
