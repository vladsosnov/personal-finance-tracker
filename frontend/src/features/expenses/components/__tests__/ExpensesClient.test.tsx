import { screen } from '@testing-library/react';
import { render } from '@/__tests__/test-utils';
import { ExpensesClient } from '../expenses-client';

describe('ExpensesClient', () => {
  it('renders the page title', () => {
    render(<ExpensesClient />);
    expect(screen.getByRole('heading', { name: 'Expenses' })).toBeInTheDocument();
  });

  it('renders the coming soon badge', () => {
    render(<ExpensesClient />);
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    render(<ExpensesClient />);
    expect(screen.getByText(/log expenses instantly/i)).toBeInTheDocument();
    expect(screen.getByText(/organize by category/i)).toBeInTheDocument();
    expect(screen.getByText(/spending breakdowns/i)).toBeInTheDocument();
  });
});
