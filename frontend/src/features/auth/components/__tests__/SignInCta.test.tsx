import { screen } from '@testing-library/react';
import { render } from '@/__tests__/test-utils';
import { SignInCta } from '../sign-in-cta';
import { GET_ME } from '@/shared/gql/queries';

describe('SignInCta', () => {
  it('renders nothing while loading', () => {
    const mocks = [
      {
        request: { query: GET_ME },
        result: { data: { me: null } },
        delay: 100,
      },
    ];

    render(<SignInCta />, { mocks });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders Get Started and Sign In buttons when not authenticated', async () => {
    const mocks = [
      {
        request: { query: GET_ME },
        result: { data: { me: null } },
      },
    ];

    render(<SignInCta />, { mocks });

    const getStartedButton = await screen.findByRole('link', { name: /get started/i });
    const signInButton = await screen.findByRole('link', { name: /sign in/i });

    expect(getStartedButton).toBeInTheDocument();
    expect(signInButton).toBeInTheDocument();
    expect(getStartedButton).toHaveAttribute('href', '/auth');
    expect(signInButton).toHaveAttribute('href', '/auth');
  });

  it('renders Open Dashboard button when authenticated', async () => {
    const mocks = [
      {
        request: { query: GET_ME },
        result: {
          data: {
            me: { id: 'user-123' },
          },
        },
      },
    ];

    render(<SignInCta />, { mocks });

    const dashboardButton = await screen.findByRole('link', { name: /open dashboard/i });

    expect(dashboardButton).toBeInTheDocument();
    expect(dashboardButton).toHaveAttribute('href', '/dashboard');
    expect(screen.queryByRole('link', { name: /get started/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument();
  });

  it('handles query error gracefully', async () => {
    const mocks = [
      {
        request: { query: GET_ME },
        error: new Error('Network error'),
      },
    ];

    render(<SignInCta />, { mocks });

    const getStartedButton = await screen.findByRole('link', { name: /get started/i });
    expect(getStartedButton).toBeInTheDocument();
  });
});
