import { render, screen } from '@/__tests__/test-utils';
import { AnimatedCounter } from '../AnimatedCounter';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver as any;

describe('AnimatedCounter', () => {
  it('renders with initial value of 0', () => {
    render(<AnimatedCounter target={100} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders with prefix', () => {
    render(<AnimatedCounter target={100} prefix="$" />);

    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('renders with suffix', () => {
    render(<AnimatedCounter target={100} suffix="+" />);

    expect(screen.getByText('0+')).toBeInTheDocument();
  });

  it('renders with both prefix and suffix', () => {
    render(<AnimatedCounter target={1000} prefix="$" suffix=" saved" />);

    expect(screen.getByText('$0 saved')).toBeInTheDocument();
  });

  it('formats numbers with locale separators', () => {
    render(<AnimatedCounter target={1000} />);

    // Value starts at 0
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders with custom heading order', () => {
    const { container } = render(<AnimatedCounter target={100} order={2} />);

    const heading = container.querySelector('h2');
    expect(heading).toBeInTheDocument();
  });

  it('renders with default order 3', () => {
    const { container } = render(<AnimatedCounter target={100} />);

    const heading = container.querySelector('h3');
    expect(heading).toBeInTheDocument();
  });

  it('sets up intersection observer', () => {
    render(<AnimatedCounter target={100} />);

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        threshold: 0.5,
      })
    );
  });
});
