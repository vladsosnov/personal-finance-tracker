import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { AuthView } from '../auth-view';

describe('AuthView', () => {
  const defaultProps = {
    authMode: 'login' as const,
    email: '',
    password: '',
    isLoading: false,
    error: null,
    setAuthMode: jest.fn(),
    setEmail: jest.fn(),
    setPassword: jest.fn(),
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login mode by default', () => {
    render(<AuthView {...defaultProps} />);

    expect(screen.getByRole('heading', { name: /financial goals tracker/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders register mode', () => {
    render(<AuthView {...defaultProps} authMode="register" />);

    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('displays email and password inputs', () => {
    render(<AuthView {...defaultProps} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('required');
  });

  it('calls setEmail when email input changes', async () => {
    const user = userEvent.setup();
    render(<AuthView {...defaultProps} />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@example.com');

    expect(defaultProps.setEmail).toHaveBeenCalled();
  });

  it('calls setPassword when password input changes', async () => {
    const user = userEvent.setup();
    render(<AuthView {...defaultProps} />);

    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, 'password123');

    expect(defaultProps.setPassword).toHaveBeenCalled();
  });

  it('calls setAuthMode when switching between login and register', async () => {
    const user = userEvent.setup();
    render(<AuthView {...defaultProps} />);

    const registerButton = screen.getByRole('radio', { name: /register/i });
    await user.click(registerButton);

    expect(defaultProps.setAuthMode).toHaveBeenCalledWith('register');
  });

  it('calls onSubmit when form is submitted', async () => {
    const user = userEvent.setup();
    render(<AuthView {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /log in/i });
    await user.click(submitButton);

    expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('prevents default form submission', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<AuthView {...defaultProps} onSubmit={onSubmit} />);

    const form = screen.getByRole('button', { name: /log in/i }).closest('form');
    expect(form).toHaveAttribute('noValidate');
  });

  it('displays error message when error prop is provided', () => {
    render(<AuthView {...defaultProps} error="Invalid credentials" />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Invalid credentials');
  });

  it('does not display error when error prop is null', () => {
    render(<AuthView {...defaultProps} error={null} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows loading state on submit button', () => {
    render(<AuthView {...defaultProps} isLoading={true} />);

    const submitButton = screen.getByRole('button', { name: /log in/i });
    expect(submitButton).toHaveAttribute('data-loading', 'true');
  });

  it('displays forgot password link in login mode', () => {
    render(<AuthView {...defaultProps} authMode="login" />);

    const forgotLink = screen.getByRole('link', { name: /forgot password/i });
    expect(forgotLink).toHaveAttribute('href', '/auth/forgot-password');
  });

  it('does not display forgot password link in register mode', () => {
    render(<AuthView {...defaultProps} authMode="register" />);

    expect(screen.queryByRole('link', { name: /forgot password/i })).not.toBeInTheDocument();
  });

  it('has correct autocomplete attributes', () => {
    const { rerender } = render(<AuthView {...defaultProps} authMode="login" />);

    expect(screen.getByLabelText(/email/i)).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('autocomplete', 'current-password');

    rerender(<AuthView {...defaultProps} authMode="register" />);
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('autocomplete', 'new-password');
  });

  it('marks required fields with aria-required', () => {
    render(<AuthView {...defaultProps} />);

    expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('aria-required', 'true');
  });

  it('displays controlled email value', () => {
    render(<AuthView {...defaultProps} email="user@example.com" />);

    expect(screen.getByLabelText(/email/i)).toHaveValue('user@example.com');
  });

  it('displays controlled password value', () => {
    render(<AuthView {...defaultProps} password="mypassword" />);

    expect(screen.getByLabelText(/password/i)).toHaveValue('mypassword');
  });
});
