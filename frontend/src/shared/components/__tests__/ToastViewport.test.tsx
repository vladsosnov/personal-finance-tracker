import { render, screen, waitFor } from '@/__tests__/test-utils';
import { ToastViewport } from '../toast-viewport';
import { showToast, useToastStore } from '@/shared/lib/toast-store';
import { act } from 'react';

jest.useFakeTimers();

describe('ToastViewport', () => {
  beforeEach(() => {
    act(() => {
      useToastStore.setState({ items: [] });
    });
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders nothing when no toasts', () => {
    render(<ToastViewport />);

    const toastCount = useToastStore.getState().items.length;
    expect(toastCount).toBe(0);
  });

  it('renders toast when added', () => {
    render(<ToastViewport />);

    act(() => {
      showToast('Test message', 'teal');
    });

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders multiple toasts', () => {
    render(<ToastViewport />);

    act(() => {
      showToast('First message', 'teal');
      showToast('Second message', 'red');
    });

    expect(screen.getByText('First message')).toBeInTheDocument();
    expect(screen.getByText('Second message')).toBeInTheDocument();
  });

  it('renders success toast with correct icon', () => {
    render(<ToastViewport />);

    act(() => {
      showToast('Success', 'teal');
    });

    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('renders error toast with correct icon', () => {
    render(<ToastViewport />);

    act(() => {
      showToast('Error', 'red');
    });

    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders warning toast with correct icon', () => {
    render(<ToastViewport />);

    act(() => {
      showToast('Warning', 'yellow');
    });

    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('renders info toast with correct icon', () => {
    render(<ToastViewport />);

    act(() => {
      showToast('Info', 'blue');
    });

    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('clears timeouts when component unmounts', () => {
    const { unmount } = render(<ToastViewport />);

    act(() => {
      showToast('Test message', 'teal');
    });

    const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
