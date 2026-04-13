import { tokenStorage } from '@/shared/lib/token-storage';

jest.mock('@/shared/lib/token-storage', () => ({
  tokenStorage: {
    getAccess: jest.fn(() => null),
    getRefresh: jest.fn(() => 'refresh-xyz'),
    set: jest.fn(),
    clear: jest.fn(),
  },
}));

const mockTokenStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;

describe('apollo-client refreshSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTokenStorage.getRefresh.mockReturnValue('refresh-xyz');
  });

  it('clears fallback tokens after refresh failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn(),
    } as unknown as Response);

    const { __private__ } = await import('../apollo-client');

    await expect(__private__.refreshSession()).rejects.toThrow('Session refresh failed');
    expect(mockTokenStorage.clear).toHaveBeenCalled();
  });
});
