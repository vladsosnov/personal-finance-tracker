import { tokenStorage } from '../token-storage';

describe('tokenStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('returns null when no access token is stored', () => {
    expect(tokenStorage.getAccess()).toBeNull();
  });

  it('returns null when no refresh token is stored', () => {
    expect(tokenStorage.getRefresh()).toBeNull();
  });

  it('stores and retrieves access and refresh tokens', () => {
    tokenStorage.set('access-abc', 'refresh-xyz');

    expect(tokenStorage.getAccess()).toBe('access-abc');
    expect(tokenStorage.getRefresh()).toBe('refresh-xyz');
  });

  it('overwrites existing tokens on set', () => {
    tokenStorage.set('old-access', 'old-refresh');
    tokenStorage.set('new-access', 'new-refresh');

    expect(tokenStorage.getAccess()).toBe('new-access');
    expect(tokenStorage.getRefresh()).toBe('new-refresh');
  });

  it('clears both tokens', () => {
    tokenStorage.set('access-abc', 'refresh-xyz');
    tokenStorage.clear();

    expect(tokenStorage.getAccess()).toBeNull();
    expect(tokenStorage.getRefresh()).toBeNull();
  });

  it('clear is a no-op when nothing is stored', () => {
    expect(() => tokenStorage.clear()).not.toThrow();
    expect(tokenStorage.getAccess()).toBeNull();
    expect(tokenStorage.getRefresh()).toBeNull();
  });
});
