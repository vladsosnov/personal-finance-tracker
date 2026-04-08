import { render, screen } from '@/__tests__/test-utils';
import { FaqSection } from '../FaqSection';

const mockIntersectionObserver = jest.fn().mockReturnValue({
  observe: () => null, unobserve: () => null, disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver as any;

describe('FaqSection', () => {
  it('renders the FAQ heading', () => {
    render(<FaqSection />);

    expect(screen.getByRole('heading', { level: 2, name: /common questions/i })).toBeInTheDocument();
  });

  it('renders the FAQ label', () => {
    render(<FaqSection />);

    expect(screen.getByText('FAQ')).toBeInTheDocument();
  });

  it('renders all 5 FAQ questions', () => {
    render(<FaqSection />);

    expect(screen.getByText('Is it really free?')).toBeInTheDocument();
    expect(screen.getByText('Where is my data stored?')).toBeInTheDocument();
    expect(screen.getByText('Can I track goals in different currencies?')).toBeInTheDocument();
    expect(screen.getByText('Does it work on mobile?')).toBeInTheDocument();
    expect(screen.getByText('Can I import my existing savings history?')).toBeInTheDocument();
  });

  it('has proper accessibility with labelledby', () => {
    render(<FaqSection />);

    const section = screen.getByLabelText(/common questions/i);
    expect(section.tagName).toBe('SECTION');
  });
});
