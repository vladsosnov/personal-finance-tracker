import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { EmailVerificationBanner } from '../email-verification-banner';

global.fetch = jest.fn();

describe('EmailVerificationBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('does not render when email is verified', () => {
    render(<EmailVerificationBanner emailVerified={true} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders verification message when email is not verified', () => {
    render(<EmailVerificationBanner emailVerified={false} />);

    expect(
      screen.getByText(/your email is not verified/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /resend verification email/i })
    ).toBeInTheDocument();
  });

  it('has proper role attribute for accessibility', () => {
    render(<EmailVerificationBanner emailVerified={false} />);

    const alert = screen.getByRole('status');
    expect(alert).toBeInTheDocument();
  });

  it('sends verification email on resend button click', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<EmailVerificationBanner emailVerified={false} />);

    const resendButton = screen.getByRole('button', { name: /resend verification email/i });
    await user.click(resendButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/request-verification'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });
  });

  it('shows success message after successful resend', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<EmailVerificationBanner emailVerified={false} />);

    const resendButton = screen.getByRole('button', { name: /resend verification email/i });
    await user.click(resendButton);

    await waitFor(() => {
      expect(screen.getByText(/verification email sent/i)).toBeInTheDocument();
    });
  });

  it('hides resend button after successful send', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<EmailVerificationBanner emailVerified={false} />);

    const resendButton = screen.getByRole('button', { name: /resend verification email/i });
    await user.click(resendButton);

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /resend verification email/i })
      ).not.toBeInTheDocument();
    });
  });

  it('displays error message on failed resend', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Rate limit exceeded' }),
    });

    render(<EmailVerificationBanner emailVerified={false} />);

    const resendButton = screen.getByRole('button', { name: /resend verification email/i });
    await user.click(resendButton);

    await waitFor(() => {
      expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument();
    });
  });

  it('displays generic error on network failure', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<EmailVerificationBanner emailVerified={false} />);

    const resendButton = screen.getByRole('button', { name: /resend verification email/i });
    await user.click(resendButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('shows loading state on resend button', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 100))
    );

    render(<EmailVerificationBanner emailVerified={false} />);

    const resendButton = screen.getByRole('button', { name: /resend verification email/i });
    await user.click(resendButton);

    expect(resendButton).toHaveAttribute('data-loading', 'true');

    await waitFor(() => {
      expect(screen.getByText(/verification email sent/i)).toBeInTheDocument();
    });
  });

  it('handles response with no error message gracefully', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    render(<EmailVerificationBanner emailVerified={false} />);

    const resendButton = screen.getByRole('button', { name: /resend verification email/i });
    await user.click(resendButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to send verification email/i)).toBeInTheDocument();
    });
  });

  it('handles invalid JSON response', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    render(<EmailVerificationBanner emailVerified={false} />);

    const resendButton = screen.getByRole('button', { name: /resend verification email/i });
    await user.click(resendButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to send verification email/i)).toBeInTheDocument();
    });
  });
});
