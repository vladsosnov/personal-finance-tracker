import { trackEvent } from '../analytics';

global.fetch = jest.fn();

describe('analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('trackEvent', () => {
    it('sends analytics event via fetch', () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      trackEvent('login_click');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/track'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ event: 'login_click', metadata: undefined }),
        })
      );
    });

    it('includes metadata when provided', () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      trackEvent('operation_added', { goalId: '123', type: 'INCREASE' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            event: 'operation_added',
            metadata: { goalId: '123', type: 'INCREASE' },
          }),
        })
      );
    });

    it('tracks all event types', () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      const events: Array<Parameters<typeof trackEvent>[0]> = [
        'login_click',
        'register_click',
        'forgot_password_click',
        'reset_password_submit',
        'add_goal_click',
        'goal_deleted',
        'operation_added',
        'operation_deleted',
        'profile_page_view',
        'data_exported',
        'data_imported',
        'data_reset',
        'delete_account_click',
      ];

      events.forEach((event) => {
        trackEvent(event);
      });

      expect(global.fetch).toHaveBeenCalledTimes(events.length);
    });

    it('silently catches fetch errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      expect(() => {
        trackEvent('profile_page_view');
      }).not.toThrow();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(global.fetch).toHaveBeenCalled();
    });

    it('does not throw on failed request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });

      expect(() => {
        trackEvent('data_exported');
      }).not.toThrow();

      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    it('uses correct API endpoint', () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      trackEvent('goal_deleted');

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toMatch(/\/analytics\/track$/);
    });

    it('sends credentials with request', () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      trackEvent('operation_deleted');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });
  });
});
