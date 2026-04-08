import { render, screen } from '@/__tests__/test-utils';
import { CtaSection } from '../CtaSection';

const mockIntersectionObserver = jest.fn().mockReturnValue({
  observe: () => null, unobserve: () => null, disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver as any;

jest.mock('@/features/auth/components/sign-in-cta', () => ({
  SignInCta: () => <div data-testid="sign-in-cta">Sign In CTA</div>,
}));

describe('CtaSection', () => {
  it('renders the CTA heading', () => {
    render(<CtaSection />);

    expect(screen.getByRole('heading', { level: 2, name: /start tracking with financial goals tracker/i })).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(<CtaSection />);

    expect(screen.getByText(/if you are already signed in/i)).toBeInTheDocument();
  });

  it('renders SignInCta component', () => {
    render(<CtaSection />);

    expect(screen.getByTestId('sign-in-cta')).toBeInTheDocument();
  });

  it('has proper accessibility with labelledby', () => {
    render(<CtaSection />);

    const section = screen.getByLabelText(/start tracking with financial goals tracker/i);
    expect(section.tagName).toBe('SECTION');
  });
});
