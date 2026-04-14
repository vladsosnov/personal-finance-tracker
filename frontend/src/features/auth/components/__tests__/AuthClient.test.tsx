import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { AuthClient } from '../auth-client';
import { tokenStorage } from '@/shared/lib/token-storage';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRefresh = jest.fn();
const mockRefetchQueries = jest.fn();
const mockSearchParamGet = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
  useSearchParams: () => ({
    get: mockSearchParamGet,
  }),
}));

jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useApolloClient: () => ({
    refetchQueries: mockRefetchQueries,
  }),
}));

jest.mock('@/shared/lib/analytics', () => ({
  trackEvent: jest.fn(),
}));

jest.mock('@/shared/lib/token-storage', () => ({
  tokenStorage: {
    set: jest.fn(),
    clear: jest.fn(),
    getAccess: jest.fn(() => null),
    getRefresh: jest.fn(() => null),
  },
}));

const mockTokenSet = tokenStorage.set as jest.Mock;
const mockTokenClear = tokenStorage.clear as jest.Mock;

global.fetch = jest.fn();

describe('AuthClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    mockRefetchQueries.mockResolvedValue(undefined);
    mockSearchParamGet.mockReturnValue(null);
  });

  it('renders login form by default', () => {
    render(<AuthClient />);

    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('switches to register mode', async () => {
    const user = userEvent.setup();
    render(<AuthClient />);

    const registerTab = screen.getByRole('radio', { name: /register/i });
    await user.click(registerTab);

    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('updates email input', async () => {
    const user = userEvent.setup();
    render(<AuthClient />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@example.com');

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('updates password input', async () => {
    const user = userEvent.setup();
    render(<AuthClient />);

    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, 'password123');

    expect(passwordInput).toHaveValue('password123');
  });

  it('does not submit with empty email', async () => {
    const user = userEvent.setup();
    render(<AuthClient />);

    const submitButton = screen.getByRole('button', { name: /log in/i });
    await user.click(submitButton);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does not submit with empty password', async () => {
    const user = userEvent.setup();
    render(<AuthClient />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /log in/i });
    await user.click(submitButton);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('submits login request with valid credentials', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<AuthClient />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /log in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      );
    });
  });

  it('submits register request when in register mode', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<AuthClient />);

    const registerTab = screen.getByRole('radio', { name: /register/i });
    await user.click(registerTab);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(emailInput, 'new@example.com');
    await user.type(passwordInput, 'newpassword');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.any(Object)
      );
    });
  });

  it('refetches GET_ME on successful login', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<AuthClient />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /log in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockRefetchQueries).toHaveBeenCalled();
    });
  });

  it('redirects to dashboard on successful login', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<AuthClient />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /log in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/goals');
    });
  });

  it('redirects to next path on successful login when provided', async () => {
    const user = userEvent.setup();
    mockSearchParamGet.mockImplementation((key: string) => (
      key === 'next' ? '/profile?upgrade=pro' : null
    ));
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<AuthClient />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/profile?upgrade=pro');
    });
  });

  it('displays error message on failed login', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    render(<AuthClient />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');

    const submitButton = screen.getByRole('button', { name: /log in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
  });

  it('displays generic error on network failure', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<AuthClient />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /log in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network error');
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
    );

    render(<AuthClient />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /log in/i });
    await user.click(submitButton);

    expect(submitButton).toHaveAttribute('data-loading', 'true');

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled();
    });
  });

  it('clears error on new submission', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<AuthClient />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrong');

    const submitButton = screen.getByRole('button', { name: /log in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    await user.clear(passwordInput);
    await user.type(passwordInput, 'correct');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('trims email and password before submission', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<AuthClient />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(emailInput, '  test@example.com  ');
    await user.type(passwordInput, '  password123  ');

    const submitButton = screen.getByRole('button', { name: /log in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      );
    });
  });

  it('stores tokens in localStorage on successful login', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'access-abc', refreshToken: 'refresh-xyz' }),
    });

    render(<AuthClient />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockTokenSet).toHaveBeenCalledWith('access-abc', 'refresh-xyz');
    });
  });

  it('stores tokens in localStorage on successful register', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'access-new', refreshToken: 'refresh-new' }),
    });

    render(<AuthClient />);

    await user.click(screen.getByRole('radio', { name: /register/i }));
    await user.type(screen.getByLabelText(/email/i), 'new@example.com');
    await user.type(screen.getByLabelText(/password/i), 'newpassword');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockTokenSet).toHaveBeenCalledWith('access-new', 'refresh-new');
    });
  });

  it('does not store tokens when response has no tokens', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<AuthClient />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled();
    });
    expect(mockTokenSet).not.toHaveBeenCalled();
  });

  it('does not store tokens on failed login', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    render(<AuthClient />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(mockTokenSet).not.toHaveBeenCalled();
  });

  it('handles response with invalid JSON gracefully', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    render(<AuthClient />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /log in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Authentication failed');
    });
  });
});
