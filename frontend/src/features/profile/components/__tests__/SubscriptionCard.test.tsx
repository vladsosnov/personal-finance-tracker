import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { SubscriptionCard } from '../SubscriptionCard';

describe('SubscriptionCard', () => {
  const onCheckout = jest.fn();
  const onManageBilling = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders subscription section', () => {
    render(
      <SubscriptionCard
        currentSubscription="Free"
        billingState="idle"
        onCheckout={onCheckout}
        onManageBilling={onManageBilling}
      />
    );

    expect(screen.getByRole('heading', { name: /^subscription$/i })).toBeInTheDocument();
    expect(screen.getByText(/review your current plan/i)).toBeInTheDocument();
  });

  it('renders all plan cards', () => {
    render(
      <SubscriptionCard
        currentSubscription="Free"
        billingState="idle"
        onCheckout={onCheckout}
        onManageBilling={onManageBilling}
      />
    );

    expect(screen.getByLabelText(/free plan \(current\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^pro plan$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^lifetime plan$/i)).toBeInTheDocument();
  });

  it('marks current plan with badge', () => {
    render(
      <SubscriptionCard
        currentSubscription="Free"
        billingState="idle"
        onCheckout={onCheckout}
        onManageBilling={onManageBilling}
      />
    );

    const freePlan = screen.getByLabelText(/free plan \(current\)/i);
    expect(freePlan).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('renders upgrade actions for paid plans when free is current', () => {
    render(
      <SubscriptionCard
        currentSubscription="Free"
        billingState="idle"
        onCheckout={onCheckout}
        onManageBilling={onManageBilling}
      />
    );

    expect(screen.getByRole('button', { name: /get pro/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /get lifetime/i })).toBeInTheDocument();
  });

  it('marks free plan as Available when not current', () => {
    render(
      <SubscriptionCard
        currentSubscription="Pro"
        billingState="idle"
        onCheckout={onCheckout}
        onManageBilling={onManageBilling}
      />
    );

    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('does not show Available badge when Free is current plan', () => {
    render(
      <SubscriptionCard
        currentSubscription="Free"
        billingState="idle"
        onCheckout={onCheckout}
        onManageBilling={onManageBilling}
      />
    );

    expect(screen.queryByText('Available')).not.toBeInTheDocument();
  });

  it('handles case-insensitive plan matching', () => {
    render(
      <SubscriptionCard
        currentSubscription="PRO"
        billingState="idle"
        onCheckout={onCheckout}
        onManageBilling={onManageBilling}
      />
    );

    const proPlan = screen.getByLabelText(/pro plan \(current\)/i);
    expect(proPlan).toHaveAttribute('aria-current', 'true');
  });

  it('displays plan prices', () => {
    render(
      <SubscriptionCard
        currentSubscription="Free"
        billingState="idle"
        onCheckout={onCheckout}
        onManageBilling={onManageBilling}
      />
    );

    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('$5/mo')).toBeInTheDocument();
    expect(screen.getByText('$12 once')).toBeInTheDocument();
  });

  it('displays plan descriptions', () => {
    render(
      <SubscriptionCard
        currentSubscription="Free"
        billingState="idle"
        onCheckout={onCheckout}
        onManageBilling={onManageBilling}
      />
    );

    expect(screen.getByText(/getting started with your first/i)).toBeInTheDocument();
    expect(screen.getByText(/unlocking paid product features/i)).toBeInTheDocument();
    expect(screen.getByText(/one-time payment/i)).toBeInTheDocument();
  });

  it('displays plan features in tables', () => {
    render(
      <SubscriptionCard
        currentSubscription="Free"
        billingState="idle"
        onCheckout={onCheckout}
        onManageBilling={onManageBilling}
      />
    );

    expect(screen.getByRole('table', { name: /free plan features/i })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /pro plan features/i })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /lifetime plan features/i })).toBeInTheDocument();
  });

  it('displays feature lists for each plan', () => {
    render(
      <SubscriptionCard
        currentSubscription="Free"
        billingState="idle"
        onCheckout={onCheckout}
        onManageBilling={onManageBilling}
      />
    );

    const tables = screen.getAllByRole('table');
    expect(tables).toHaveLength(3);

    tables.forEach(table => {
      const rows = table.querySelectorAll('tbody tr');
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  it('starts pro checkout when the user clicks upgrade', async () => {
    const user = userEvent.setup();

    render(
      <SubscriptionCard
        currentSubscription="Free"
        billingState="idle"
        onCheckout={onCheckout}
        onManageBilling={onManageBilling}
      />
    );

    await user.click(screen.getByRole('button', { name: /get pro/i }));

    expect(onCheckout).toHaveBeenCalledWith('PRO');
  });

  it('marks lifetime as popular with a teal border', () => {
    render(
      <SubscriptionCard
        currentSubscription="Free"
        billingState="idle"
        onCheckout={onCheckout}
        onManageBilling={onManageBilling}
      />
    );

    expect(screen.getByText('Popular')).toBeInTheDocument();
    expect(screen.getByLabelText(/^lifetime plan$/i)).toHaveStyle({ borderColor: 'var(--mantine-color-teal-6)' });
  });

  it('renders manage billing for active pro users', () => {
    render(
      <SubscriptionCard
        currentSubscription="Pro"
        billingState="idle"
        canManageBilling
        onCheckout={onCheckout}
        onManageBilling={onManageBilling}
      />
    );

    expect(screen.getByRole('button', { name: /manage billing/i })).toBeInTheDocument();
  });

  it('shows loading only for the active checkout plan', () => {
    render(
      <SubscriptionCard
        currentSubscription="Free"
        billingState="checkout"
        activeCheckoutPlan="PRO"
        onCheckout={onCheckout}
        onManageBilling={onManageBilling}
      />
    );

    expect(screen.getByRole('button', { name: /get pro/i })).toHaveAttribute('data-loading');
    expect(screen.getByRole('button', { name: /get lifetime/i })).not.toHaveAttribute('data-loading');
  });
});
