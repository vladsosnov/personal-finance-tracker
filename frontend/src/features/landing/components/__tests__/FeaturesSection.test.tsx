import { render, screen } from '@/__tests__/test-utils';
import { FeaturesSection } from '../FeaturesSection';

const mockIntersectionObserver = jest.fn().mockReturnValue({
  observe: () => null, unobserve: () => null, disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver as any;

describe('FeaturesSection', () => {
  it('renders the section heading', () => {
    render(<FeaturesSection />);

    expect(screen.getByRole('heading', { level: 2, name: /the home page now reflects real product value/i })).toBeInTheDocument();
  });

  it('renders the section label', () => {
    render(<FeaturesSection />);

    expect(screen.getByText("What's already inside")).toBeInTheDocument();
  });

  it('renders all 5 feature cards', () => {
    render(<FeaturesSection />);

    expect(screen.getByText('Track progress with operations')).toBeInTheDocument();
    expect(screen.getByText('Understand progress over time')).toBeInTheDocument();
    expect(screen.getByText('Import existing savings history')).toBeInTheDocument();
    expect(screen.getByText('Multi-currency goals')).toBeInTheDocument();
    expect(screen.getByText('Work the way you prefer')).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    render(<FeaturesSection />);

    expect(screen.getByText(/add increases and decreases/i)).toBeInTheDocument();
    expect(screen.getByText(/review charts, trend direction/i)).toBeInTheDocument();
  });

  it('has proper accessibility with labelledby', () => {
    render(<FeaturesSection />);

    const section = screen.getByLabelText(/the home page now reflects real product value/i);
    expect(section.tagName).toBe('SECTION');
  });
});
