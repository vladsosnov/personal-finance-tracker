import { screen } from '@testing-library/react';
import { render } from '@/__tests__/test-utils';
import { ProfileClient } from '../profile-client';
import { GET_ME } from '@/shared/gql/queries';
import { GET_GOALS } from '@/features/dashboard/gql/dashboard';
import type { MockedResponse } from '@apollo/client/testing';

const mockSearchParamsGet = jest.fn();

jest.mock('@/shared/lib/token-storage', () => ({
  tokenStorage: {
    set: jest.fn(),
    clear: jest.fn(),
    getAccess: jest.fn(() => null),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/profile',
  useSearchParams: () => ({
    get: mockSearchParamsGet,
  }),
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

jest.mock('@/features/profile/components/ChangePasswordCard', () => ({
  ChangePasswordCard: () => <div data-testid="change-password-card">Change Password</div>,
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
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParamsGet.mockReturnValue(null);
  });

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

  it('renders change password card', async () => {
    render(<ProfileClient />, { mocks: [meMock, goalsMock] });

    expect(await screen.findByTestId('change-password-card')).toBeInTheDocument();
  });

  it('shows billing return feedback after checkout redirect', async () => {
    mockSearchParamsGet.mockImplementation((key: string) => {
      if (key === 'billing') return 'return';
      if (key === 'plan') return 'pro';
      return null;
    });

    render(<ProfileClient />, { mocks: [meMock, goalsMock] });

    expect(await screen.findByText(/confirming your pro upgrade/i)).toBeInTheDocument();
  });
});
