import { render, screen } from '@/__tests__/test-utils';
import { AnimateOnScroll } from '../AnimateOnScroll';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver as any;

describe('AnimateOnScroll', () => {
  beforeEach(() => {
    mockIntersectionObserver.mockClear();
  });

  it('renders children', () => {
    render(
      <AnimateOnScroll>
        <div>Test content</div>
      </AnimateOnScroll>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('sets up intersection observer with correct options', () => {
    render(
      <AnimateOnScroll>
        <div>Test</div>
      </AnimateOnScroll>
    );

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px',
      })
    );
  });

  it('supports different variants', () => {
    const { rerender } = render(
      <AnimateOnScroll variant="up">
        <div>Test</div>
      </AnimateOnScroll>
    );

    expect(screen.getByText('Test')).toBeInTheDocument();

    rerender(
      <AnimateOnScroll variant="scale">
        <div>Test</div>
      </AnimateOnScroll>
    );

    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
