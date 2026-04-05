import { act, renderHook } from '@testing-library/react';
import { usePwaInstall } from '../usePwaInstall';

const makePromptEvent = (outcome: 'accepted' | 'dismissed') => {
  const event = new Event('beforeinstallprompt') as Event & {
    prompt: jest.Mock;
    userChoice: Promise<{ outcome: string }>;
  };
  event.preventDefault = jest.fn();
  event.prompt = jest.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome });
  return event;
};

describe('usePwaInstall', () => {
  afterEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window.navigator, 'userAgent', { value: '', configurable: true });
  });

  it('returns canInstall false initially', () => {
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.canInstall).toBe(false);
  });

  it('returns isIos false on non-iOS user agent', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
      configurable: true,
    });
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.isIos).toBe(false);
  });

  it('returns isIos true on iPhone user agent not in standalone mode', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true,
    });
    Object.defineProperty(window.navigator, 'standalone', { value: false, configurable: true });
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.isIos).toBe(true);
  });

  it('returns isIos false when already installed (standalone mode)', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true,
    });
    Object.defineProperty(window.navigator, 'standalone', { value: true, configurable: true });
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.isIos).toBe(false);
  });

  it('dismissIosHint sets isIos to false and persists to localStorage', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true,
    });
    Object.defineProperty(window.navigator, 'standalone', { value: false, configurable: true });

    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.isIos).toBe(true);

    act(() => {
      result.current.dismissIosHint();
    });

    expect(result.current.isIos).toBe(false);
    expect(localStorage.getItem('pwa_ios_hint_dismissed')).toBe('1');
  });

  it('returns isIos false when hint was previously dismissed', () => {
    localStorage.setItem('pwa_ios_hint_dismissed', '1');
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true,
    });
    Object.defineProperty(window.navigator, 'standalone', { value: false, configurable: true });

    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.isIos).toBe(false);
  });

  it('sets canInstall true when beforeinstallprompt fires', () => {
    const { result } = renderHook(() => usePwaInstall());
    const event = makePromptEvent('accepted');

    act(() => {
      window.dispatchEvent(event);
    });

    expect(result.current.canInstall).toBe(true);
  });

  it('calls prompt and clears canInstall on accepted install', async () => {
    const { result } = renderHook(() => usePwaInstall());
    const event = makePromptEvent('accepted');

    act(() => {
      window.dispatchEvent(event);
    });

    await act(async () => {
      await result.current.install();
    });

    expect(event.prompt).toHaveBeenCalled();
    expect(result.current.canInstall).toBe(false);
  });

  it('keeps canInstall true when user dismisses install', async () => {
    const { result } = renderHook(() => usePwaInstall());
    const event = makePromptEvent('dismissed');

    act(() => {
      window.dispatchEvent(event);
    });

    await act(async () => {
      await result.current.install();
    });

    expect(result.current.canInstall).toBe(true);
  });

  it('does nothing when install called without a prompt event', async () => {
    const { result } = renderHook(() => usePwaInstall());
    await act(async () => {
      await result.current.install();
    });
    expect(result.current.canInstall).toBe(false);
  });

  it('removes event listener on unmount', () => {
    const spy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => usePwaInstall());
    unmount();
    expect(spy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
  });
});
