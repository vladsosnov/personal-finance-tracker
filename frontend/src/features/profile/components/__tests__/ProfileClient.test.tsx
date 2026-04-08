import { screen } from '@testing-library/react';
import { render } from '@/__tests__/test-utils';
import { ProfileClient } from '../profile-client';
import { GET_ME } from '@/shared/gql/queries';
import { GET_GOALS } from '@/features/dashboard/gql/dashboard';
import type { MockedResponse } from '@apollo/client/testing';

jest.mock('@/shared/lib/token-storage', () => ({
  tokenStorage: {
    set: jest.fn(),
    clear: jest.fn(),
    getAccess: jest.fn(() => null),
    getRefresh: jest.fn(() => null),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/profile',
}));

jest.mock('@/shared/lib/analytics', () => ({
  trackEvent: jest.fn(),
}));

jest.mock('@/features/profile/components/ThemeCard', () => ({
  ThemeCard: () => <div data-testid="theme-card">Theme</div>,
}));

jest.mock('@/features/profile/components/CurrencyCard', () => ({
  CurrencyCard: () => <div data-testid="currency-card">Currency</div>,
}));

jest.mock('@/features/profile/components/CustomColorsCard', () => ({
  CustomColorsCard: () => <div data-testid="custom-colors-card">Custom Colors</div>,
}));

const meMock: MockedResponse = {
  request: { query: GET_ME },
  result: {
    data: {
      me: {
        __typename: 'User',
        id: '1',
        email: 'test@test.com',
        subscription: 'Free',
        role: 'user',
        primaryCurrency: 'USD',
        emailVerified: true,
      },
    },
  },
};

const goalsMock: MockedResponse = {
  request: { query: GET_GOALS },
  result: { data: { goals: [] } },
};

describe('ProfileClient', () => {
  it('renders profile heading', async () => {
    render(<ProfileClient />, { mocks: [meMock, goalsMock] });

    expect(await screen.findByRole('heading', { level: 1, name: /profile/i })).toBeInTheDocument();
  });

  it('renders profile description', async () => {
    render(<ProfileClient />, { mocks: [meMock, goalsMock] });

    expect(await screen.findByText(/account preferences and progress import/i)).toBeInTheDocument();
  });

  it('renders import progress card', async () => {
    render(<ProfileClient />, { mocks: [meMock, goalsMock] });

    expect(await screen.findByText('Import progress')).toBeInTheDocument();
  });

  it('renders theme card', async () => {
    render(<ProfileClient />, { mocks: [meMock, goalsMock] });

    expect(await screen.findByTestId('theme-card')).toBeInTheDocument();
  });

  it('renders currency card', async () => {
    render(<ProfileClient />, { mocks: [meMock, goalsMock] });

    expect(await screen.findByTestId('currency-card')).toBeInTheDocument();
  });
});
