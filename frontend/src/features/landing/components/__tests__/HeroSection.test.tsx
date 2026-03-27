import { render, screen } from '@/__tests__/test-utils';
import { HeroSection } from '../HeroSection';

jest.mock('@/features/auth/components/sign-in-cta', () => ({
  SignInCta: () => <div data-testid="sign-in-cta">Sign In CTA</div>,
}));

describe('HeroSection', () => {
  it('renders the hero heading', () => {
    render(<HeroSection />);

    expect(screen.getByRole('heading', { level: 1, name: /Turn savings goals into a system you can actually follow/i })).toBeInTheDocument();
  });

  it('renders the badge', () => {
    render(<HeroSection />);

    expect(screen.getByText('Financial Goals Tracker')).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(<HeroSection />);

    expect(screen.getByText(/Create goals, log real operations, review progress over time/i)).toBeInTheDocument();
  });

  it('renders the SignInCta component', () => {
    render(<HeroSection />);

    expect(screen.getByTestId('sign-in-cta')).toBeInTheDocument();
  });

  it('has proper accessibility with labelledby', () => {
    render(<HeroSection />);

    const section = screen.getByLabelText(/Turn savings goals into a system you can actually follow/i);
    expect(section.tagName).toBe('SECTION');
  });

  it('renders decorative orbs', () => {
    const { container } = render(<HeroSection />);

    const orbs = container.querySelectorAll('[class*="orb"]');
    expect(orbs.length).toBeGreaterThanOrEqual(3);
  });
});
