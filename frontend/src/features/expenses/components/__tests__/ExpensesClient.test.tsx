import { screen } from '@testing-library/react';
import type { MockedResponse } from '@apollo/client/testing';
import { render } from '@/__tests__/test-utils';
import { GET_ME } from '@/shared/gql/queries';
import { ExpensesClient } from '../expenses-client';

const freeMeMock: MockedResponse = {
  request: { query: GET_ME },
  result: {
    data: {
      me: {
        id: '1',
        email: 'free@example.com',
        plan: 'free',
        billingStatus: 'inactive',
        subscription: 'Free',
        role: 'user',
        primaryCurrency: 'USD',
        emailVerified: true,
      },
    },
  },
};

const proMeMock: MockedResponse = {
  request: { query: GET_ME },
  result: {
    data: {
      me: {
        id: '2',
        email: 'pro@example.com',
        plan: 'pro',
        billingStatus: 'active',
        subscription: 'Pro',
        role: 'user',
        primaryCurrency: 'USD',
        emailVerified: true,
      },
    },
  },
};

describe('ExpensesClient', () => {
  it('renders the page title', async () => {
    render(<ExpensesClient />, { mocks: [freeMeMock] });
    expect(await screen.findByRole('heading', { name: 'Expenses' })).toBeInTheDocument();
  });

  it('shows a locked state for free users', async () => {
    render(<ExpensesClient />, { mocks: [freeMeMock] });

    expect(await screen.findByText(/expenses is available only for pro or lifetime/i)).toBeInTheDocument();
    expect(screen.getByText('Paid Feature')).toBeInTheDocument();
    expect(screen.queryByText('Coming Soon')).not.toBeInTheDocument();
  });

  it('shows the upcoming feature preview for pro users', async () => {
    render(<ExpensesClient />, { mocks: [proMeMock] });

    expect(await screen.findByText('Coming Soon')).toBeInTheDocument();
    expect(screen.getByText(/log expenses instantly/i)).toBeInTheDocument();
    expect(screen.queryByText(/expenses is available only for pro or lifetime/i)).not.toBeInTheDocument();
  });
});
