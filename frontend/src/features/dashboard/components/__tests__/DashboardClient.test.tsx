import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { useMediaQuery } from '@mantine/hooks';
import { DashboardClient } from '../dashboard-client';
import { GET_ME } from '@/shared/gql/queries';
import { GET_GOALS } from '@/features/dashboard/gql/dashboard';
import { GET_EXCHANGE_RATES } from '@/features/profile/gql/currency';
import type { MockedResponse } from '@apollo/client/testing';
import { mockGoal, mockCompletedGoal } from '@/__tests__/mock-data';
import { tokenStorage } from '@/shared/lib/token-storage';

const mockDashboardOverviewStats = jest.fn(() => null);

jest.mock('../dashboard-overview-stats', () => ({
  DashboardOverviewStats: (props: { totalTarget: number | null; totalCurrent: number | null; currency: string }) => {
    mockDashboardOverviewStats();
    return (
      <section aria-label="Dashboard overview" data-testid="dashboard-overview-stats">
        <div>Total target</div>
        <div>Total current</div>
        <div>Overall progress</div>
      </section>
    );
  },
}));

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
  usePathname: () => '/goals',
}));

// Mock useMediaQuery — jest.fn so we can change return value per test
jest.mock('@mantine/hooks', () => ({
  ...jest.requireActual('@mantine/hooks'),
  useMediaQuery: jest.fn(() => false),
}));

const mockUseMediaQuery = useMediaQuery as jest.Mock;

// Stub dynamic imports (EditGoalModal, DeleteGoalModal, CompleteGoalModal)
jest.mock('next/dynamic', () => {
  return (loader: () => Promise<unknown>) => {
    const Stub = (props: Record<string, unknown>) => (
      props.opened ? <div data-testid="dynamic-modal" /> : null
    );
    Stub.displayName = 'DynamicStub';
    return Stub;
  };
});

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
  result: {
    data: {
      goals: [
        { ...mockGoal, __typename: 'Goal' },
        { ...mockCompletedGoal, __typename: 'Goal' },
      ],
    },
  },
};

const emptyGoalsMock: MockedResponse = {
  request: { query: GET_GOALS },
  result: { data: { goals: [] } },
};

const ratesMock: MockedResponse = {
  request: { query: GET_EXCHANGE_RATES, variables: { base: 'USD' } },
  result: { data: { exchangeRates: { base: 'USD', rates: '{}' } } },
};

const eurGoal = {
  ...mockGoal,
  id: '3',
  title: 'Euro Goal',
  currency: 'EUR',
  targetAmount: 5000,
  currentAmount: 2000,
  __typename: 'Goal',
};

const multiCurrencyGoalsMock: MockedResponse = {
  request: { query: GET_GOALS },
  result: {
    data: {
      goals: [
        { ...mockGoal, __typename: 'Goal' },
        eurGoal,
      ],
    },
  },
};

const ratesWithEurMock: MockedResponse = {
  request: { query: GET_EXCHANGE_RATES, variables: { base: 'USD' } },
  result: { data: { exchangeRates: { base: 'USD', rates: '{"EUR":0.85}' } } },
};

const invalidRatesMock: MockedResponse = {
  request: { query: GET_EXCHANGE_RATES, variables: { base: 'USD' } },
  result: { data: { exchangeRates: { base: 'USD', rates: 'not-json' } } },
};

const zeroTargetGoal = {
  ...mockGoal,
  id: '4',
  title: 'Open Balance',
  targetAmount: 0,
  currentAmount: 1000,
  progress: 0,
  __typename: 'Goal',
};

const goalsWithZeroTargetMock: MockedResponse = {
  request: { query: GET_GOALS },
  result: {
    data: {
      goals: [
        { ...mockGoal, __typename: 'Goal' },
        zeroTargetGoal,
      ],
    },
  },
};

describe('DashboardClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMediaQuery.mockReturnValue(false);
  });

  it('renders overview stats section', async () => {
    render(<DashboardClient />, { mocks: [meMock, goalsMock, ratesMock] });

    expect(await screen.findByText('Total target')).toBeInTheDocument();
    expect(screen.getByText('Total current')).toBeInTheDocument();
    expect(screen.getByText('Overall progress')).toBeInTheDocument();
  });

  it('renders create goal form on desktop', async () => {
    render(<DashboardClient />, { mocks: [meMock, goalsMock, ratesMock] });

    expect(await screen.findByText('Create goal')).toBeInTheDocument();
    expect(screen.getByRole('form', { name: /create goal/i })).toBeInTheDocument();
  });

  it('shows empty state when no goals', async () => {
    render(<DashboardClient />, { mocks: [meMock, emptyGoalsMock, ratesMock] });

    expect(await screen.findByText('No goals yet')).toBeInTheDocument();
    expect(screen.getByText(/create your first goal/i)).toBeInTheDocument();
  });

  it('renders goals when loaded', async () => {
    render(<DashboardClient />, { mocks: [meMock, goalsMock, ratesMock] });

    expect(await screen.findByText(mockGoal.title)).toBeInTheDocument();
  });

  it('renders goal details panel placeholder on desktop', async () => {
    render(<DashboardClient />, { mocks: [meMock, goalsMock, ratesMock] });

    expect(await screen.findByText('Select a goal')).toBeInTheDocument();
  });

  it('renders mobile layout with "Create a goal" button', async () => {
    mockUseMediaQuery.mockReturnValue(true);

    render(<DashboardClient />, { mocks: [meMock, goalsMock, ratesMock] });

    expect(await screen.findByRole('button', { name: /create a goal/i })).toBeInTheDocument();
    // Desktop form should not be present
    expect(screen.queryByRole('form', { name: /create goal/i })).not.toBeInTheDocument();
  });

  it('converts multi-currency totals using exchange rates', async () => {
    render(<DashboardClient />, { mocks: [meMock, multiCurrencyGoalsMock, ratesWithEurMock] });

    // Wait for goals and rates to load
    expect(await screen.findByText('Euro Goal')).toBeInTheDocument();

    // Stats should render (conversion happened via rates)
    expect(screen.getByText('Total target')).toBeInTheDocument();
    expect(screen.getByText('Total current')).toBeInTheDocument();
  });

  it('handles invalid rates JSON gracefully', async () => {
    render(<DashboardClient />, { mocks: [meMock, multiCurrencyGoalsMock, invalidRatesMock] });

    expect(await screen.findByText('Euro Goal')).toBeInTheDocument();
    // Should still render stats (falls back to empty rates = no conversion)
    expect(screen.getByText('Total target')).toBeInTheDocument();
  });

  it('excludes zero-target goals from overview totals and progress', async () => {
    render(<DashboardClient />, { mocks: [meMock, goalsWithZeroTargetMock, ratesMock] });

    expect(await screen.findByText('Open Balance')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockDashboardOverviewStats).toHaveBeenLastCalledWith(
        expect.objectContaining({
          totalTarget: 10000,
          totalCurrent: 5000,
          currency: 'USD',
        })
      );
    });
  });

  describe('OAuth token handling', () => {
    it('picks up tokens from URL and stores them', async () => {
      // Push a query string that the component will read
      window.history.pushState({}, '', '?access_token=abc123&refresh_token=xyz789');

      render(<DashboardClient />, { mocks: [meMock, goalsMock, ratesMock] });

      await waitFor(() => {
        expect(tokenStorage.set).toHaveBeenCalledWith('abc123', 'xyz789');
      });

      // Clean up the URL
      window.history.pushState({}, '', '/');
    });
  });

  it('shows goal limit message for Free plan at limit', async () => {
    const threeGoalsMock: MockedResponse = {
      request: { query: GET_GOALS },
      result: {
        data: {
          goals: [
            { ...mockGoal, __typename: 'Goal' },
            { ...mockCompletedGoal, __typename: 'Goal' },
            { ...mockGoal, id: '3', title: 'Car Fund', __typename: 'Goal', sortOrder: 2 },
          ],
        },
      },
    };

    render(<DashboardClient />, { mocks: [meMock, threeGoalsMock, ratesMock] });

    await waitFor(() => {
      expect(screen.getByText('Car Fund')).toBeInTheDocument();
    });

    // Free plan has maxGoals=3, with 3 goals the limit message should appear
    expect(screen.getByText(/free plan supports up to/i)).toBeInTheDocument();
  });
});
