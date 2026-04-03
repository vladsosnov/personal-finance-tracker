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
  });

  it('returns canInstall false initially', () => {
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.canInstall).toBe(false);
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
