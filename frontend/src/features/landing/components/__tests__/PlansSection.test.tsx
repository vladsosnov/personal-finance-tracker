import { render, screen } from '@/__tests__/test-utils';
import { PlansSection } from '../PlansSection';

const mockIntersectionObserver = jest.fn().mockReturnValue({
  observe: () => null, unobserve: () => null, disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver as any;

describe('PlansSection', () => {
  it('renders the section heading', () => {
    render(<PlansSection />);

    expect(screen.getByRole('heading', { level: 2, name: /choose the plan that fits/i })).toBeInTheDocument();
  });

  it('renders the Plans label', () => {
    render(<PlansSection />);

    expect(screen.getByText('Plans')).toBeInTheDocument();
  });

  it('renders all three plan names', () => {
    render(<PlansSection />);

    expect(screen.getByRole('heading', { level: 3, name: 'Free' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Pro' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Lifetime' })).toBeInTheDocument();
  });

  it('renders plan prices', () => {
    render(<PlansSection />);

    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('$5/mo')).toBeInTheDocument();
    expect(screen.getByText('$12 once')).toBeInTheDocument();
  });

  it('renders Popular badge on Lifetime plan', () => {
    render(<PlansSection />);

    expect(screen.getByText('Popular')).toBeInTheDocument();
  });

  it('renders Start free button for Free plan', () => {
    render(<PlansSection />);

    expect(screen.getByRole('link', { name: /start free with free plan/i })).toBeInTheDocument();
  });

  it('renders disabled coming soon actions for paid plans', () => {
    render(<PlansSection />);

    const comingSoonButtons = screen.getAllByRole('button', { name: /comming soon/i });
    expect(comingSoonButtons).toHaveLength(2);
    comingSoonButtons.forEach((button) => expect(button).toBeDisabled());
    expect(screen.queryByRole('link', { name: /get pro with pro plan/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /get lifetime with lifetime plan/i })).not.toBeInTheDocument();
  });

  it('has proper accessibility with labelledby', () => {
    render(<PlansSection />);

    const section = screen.getByLabelText(/choose the plan that fits/i);
    expect(section.tagName).toBe('SECTION');
  });
});
