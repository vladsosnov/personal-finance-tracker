import { screen } from '@testing-library/react';
import { render } from '@/__tests__/test-utils';
import { SubscriptionCard } from '../SubscriptionCard';

describe('SubscriptionCard', () => {
  it('renders subscription section', () => {
    render(<SubscriptionCard currentSubscription="Free" />);

    expect(screen.getByRole('heading', { name: /^subscription$/i })).toBeInTheDocument();
    expect(screen.getByText(/review your current plan/i)).toBeInTheDocument();
  });

  it('renders all plan cards', () => {
    render(<SubscriptionCard currentSubscription="Free" />);

    expect(screen.getByLabelText(/free plan \(current\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^pro plan$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^lifetime plan$/i)).toBeInTheDocument();
  });

  it('marks current plan with badge', () => {
    render(<SubscriptionCard currentSubscription="Free" />);

    const freePlan = screen.getByLabelText(/free plan \(current\)/i);
    expect(freePlan).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('marks paid non-current plans with Soon badge', () => {
    render(<SubscriptionCard currentSubscription="Free" />);

    const badges = screen.getAllByText('Soon');
    expect(badges).toHaveLength(2);
  });

  it('marks free plan as Available when not current', () => {
    render(<SubscriptionCard currentSubscription="Pro" />);

    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('does not show Available badge when Free is current plan', () => {
    render(<SubscriptionCard currentSubscription="Free" />);

    expect(screen.queryByText('Available')).not.toBeInTheDocument();
  });

  it('handles case-insensitive plan matching', () => {
    render(<SubscriptionCard currentSubscription="PRO" />);

    const proPlan = screen.getByLabelText(/pro plan \(current\)/i);
    expect(proPlan).toHaveAttribute('aria-current', 'true');
  });

  it('displays plan prices', () => {
    render(<SubscriptionCard currentSubscription="Free" />);

    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('$3/mo')).toBeInTheDocument();
    expect(screen.getByText('$9 once')).toBeInTheDocument();
  });

  it('displays plan descriptions', () => {
    render(<SubscriptionCard currentSubscription="Free" />);

    expect(screen.getByText(/getting started with your first/i)).toBeInTheDocument();
    expect(screen.getByText(/managing multiple goals/i)).toBeInTheDocument();
    expect(screen.getByText(/one-time payment/i)).toBeInTheDocument();
  });

  it('displays plan features in tables', () => {
    render(<SubscriptionCard currentSubscription="Free" />);

    expect(screen.getByRole('table', { name: /free plan features/i })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /pro plan features/i })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /lifetime plan features/i })).toBeInTheDocument();
  });

  it('displays feature lists for each plan', () => {
    render(<SubscriptionCard currentSubscription="Free" />);

    const tables = screen.getAllByRole('table');
    expect(tables).toHaveLength(3);

    tables.forEach(table => {
      const rows = table.querySelectorAll('tbody tr');
      expect(rows.length).toBeGreaterThan(0);
    });
  });
});
