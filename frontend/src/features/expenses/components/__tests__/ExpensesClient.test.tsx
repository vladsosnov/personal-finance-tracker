import { screen } from '@testing-library/react';
import { render } from '@/__tests__/test-utils';
import { ExpensesClient } from '../expenses-client';

describe('ExpensesClient', () => {
  it('renders the page title', () => {
    render(<ExpensesClient />);
    expect(screen.getByRole('heading', { name: 'Expenses' })).toBeInTheDocument();
  });

  it('shows coming soon badge', () => {
    render(<ExpensesClient />);
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });

  it('shows feature preview list', () => {
    render(<ExpensesClient />);
    expect(screen.getByText(/log expenses instantly/i)).toBeInTheDocument();
    expect(screen.getByText(/organize by category/i)).toBeInTheDocument();
    expect(screen.getByText(/spending breakdowns/i)).toBeInTheDocument();
    expect(screen.getByText(/browse your full history/i)).toBeInTheDocument();
  });

  it('mentions it is a paid feature', () => {
    render(<ExpensesClient />);
    expect(screen.getByText(/paid feature included in pro and lifetime/i)).toBeInTheDocument();
  });
});
