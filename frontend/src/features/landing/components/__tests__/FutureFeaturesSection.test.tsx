import { render, screen } from '@/__tests__/test-utils';
import { FutureFeaturesSection } from '../FutureFeaturesSection';

const mockIntersectionObserver = jest.fn().mockReturnValue({
  observe: () => null, unobserve: () => null, disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver as any;

describe('FutureFeaturesSection', () => {
  it('renders the section heading', () => {
    render(<FutureFeaturesSection />);

    expect(screen.getByRole('heading', { level: 2, name: /we are actively building what comes next/i })).toBeInTheDocument();
  });

  it('renders the section label', () => {
    render(<FutureFeaturesSection />);

    expect(screen.getByText('Future features')).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(<FutureFeaturesSection />);

    expect(screen.getByText(/financial goals tracker is not static/i)).toBeInTheDocument();
  });

  it('renders all 4 future feature cards', () => {
    render(<FutureFeaturesSection />);

    expect(screen.getByText('Internationalization')).toBeInTheDocument();
    expect(screen.getByText('Recurring operations')).toBeInTheDocument();
    expect(screen.getByText('Goal reminders')).toBeInTheDocument();
    expect(screen.getByText('Community-driven roadmap')).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    render(<FutureFeaturesSection />);

    expect(screen.getByText(/localize dates, numbers/i)).toBeInTheDocument();
    expect(screen.getByText(/submit ideas, vote on what matters/i)).toBeInTheDocument();
  });

  it('has proper accessibility with labelledby', () => {
    render(<FutureFeaturesSection />);

    const section = screen.getByLabelText(/we are actively building what comes next/i);
    expect(section.tagName).toBe('SECTION');
  });
});
