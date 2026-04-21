import { tokenStorage } from '../token-storage';

describe('tokenStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('returns null when no access token is stored', () => {
    expect(tokenStorage.getAccess()).toBeNull();
  });

  it('stores and retrieves access token (refresh token is not stored)', () => {
    tokenStorage.set('access-abc', 'refresh-xyz');

    expect(tokenStorage.getAccess()).toBe('access-abc');
    // Refresh token should NOT be stored in localStorage
    expect(localStorage.getItem('fgt_refresh')).toBeNull();
  });

  it('overwrites existing access token on set', () => {
    tokenStorage.set('old-access');
    tokenStorage.set('new-access');

    expect(tokenStorage.getAccess()).toBe('new-access');
  });

  it('clears access token and legacy refresh token', () => {
    tokenStorage.set('access-abc');
    // Simulate legacy refresh token from older version
    localStorage.setItem('fgt_refresh', 'legacy-refresh');
    tokenStorage.clear();

    expect(tokenStorage.getAccess()).toBeNull();
    expect(localStorage.getItem('fgt_refresh')).toBeNull();
  });

  it('clear is a no-op when nothing is stored', () => {
    expect(() => tokenStorage.clear()).not.toThrow();
    expect(tokenStorage.getAccess()).toBeNull();
  });

  it('returns null instead of throwing when localStorage reads fail', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    expect(tokenStorage.getAccess()).toBeNull();
  });

  it('does not throw when localStorage writes fail', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    expect(() => tokenStorage.set('access-abc')).not.toThrow();
  });

  it('does not throw when localStorage removals fail', () => {
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    expect(() => tokenStorage.clear()).not.toThrow();
  });
});
