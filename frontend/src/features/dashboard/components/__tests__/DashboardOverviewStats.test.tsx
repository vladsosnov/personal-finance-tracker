import { screen, fireEvent } from '@testing-library/react';
import { render } from '@/__tests__/test-utils';
import { useMediaQuery } from '@mantine/hooks';
import { DashboardOverviewStats } from '../dashboard-overview-stats';

// Mock useMediaQuery to return false (desktop) by default
jest.mock('@mantine/hooks', () => ({
  ...jest.requireActual('@mantine/hooks'),
  useMediaQuery: jest.fn(() => false),
}));

const mockUseMediaQuery = useMediaQuery as jest.Mock;

describe('DashboardOverviewStats', () => {
  it('renders all three stat labels', () => {
    render(<DashboardOverviewStats totalTarget={10000} totalCurrent={5000} currency="USD" />);

    expect(screen.getByText('Total target')).toBeInTheDocument();
    expect(screen.getByText('Total current')).toBeInTheDocument();
    expect(screen.getByText('Overall progress')).toBeInTheDocument();
  });

  it('has dashboard overview region', () => {
    render(<DashboardOverviewStats totalTarget={10000} totalCurrent={5000} currency="USD" />);

    expect(screen.getByRole('region', { name: /dashboard overview/i })).toBeInTheDocument();
  });

  it('shows loading skeletons when values are null', () => {
    const { container } = render(<DashboardOverviewStats totalTarget={null} totalCurrent={null} currency="USD" />);

    const skeletons = container.querySelectorAll('.mantine-Skeleton-root');
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  it('does not show skeletons when values are provided', () => {
    render(<DashboardOverviewStats totalTarget={10000} totalCurrent={5000} currency="USD" />);

    expect(screen.queryByText('Total target')).toBeInTheDocument();
    // Values are rendered via aria-labelledby headings
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings.length).toBe(3);
  });

  it('renders with zero values', () => {
    render(<DashboardOverviewStats totalTarget={0} totalCurrent={0} currency="USD" />);

    expect(screen.getByText('Total target')).toBeInTheDocument();
    expect(screen.getByText('Total current')).toBeInTheDocument();
  });

  it('uses aria-live for dynamic content', () => {
    render(<DashboardOverviewStats totalTarget={10000} totalCurrent={5000} currency="USD" />);

    const liveRegions = screen.getAllByRole('heading', { level: 3 });
    liveRegions.forEach((heading) => {
      expect(heading).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('mobile carousel', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(true);
    });

    afterEach(() => {
      mockUseMediaQuery.mockReturnValue(false);
    });

    it('renders single card with dot indicators on mobile', () => {
      render(<DashboardOverviewStats totalTarget={10000} totalCurrent={5000} currency="USD" />);

      const region = screen.getByRole('region', { name: /dashboard overview/i });
      expect(region).toBeInTheDocument();
      // Should show only one stat card at a time (first card = "Total target")
      expect(screen.getByText('Total target')).toBeInTheDocument();
      // Should not render as a Grid (desktop), but as a carousel with dots
      // 3 dot indicators for 3 cards
      const dots = region.querySelectorAll('div[style*="cursor: pointer"]');
      expect(dots).toHaveLength(3);
    });

    it('swipes right to next card on touch', () => {
      render(<DashboardOverviewStats totalTarget={10000} totalCurrent={5000} currency="USD" />);

      const region = screen.getByRole('region', { name: /dashboard overview/i });

      // Swipe left (positive diff > 40) to go to next card
      fireEvent.touchStart(region, { touches: [{ clientX: 200 }] });
      fireEvent.touchEnd(region, { changedTouches: [{ clientX: 100 }] });

      // Should now show second card "Total current"
      expect(screen.getByText('Total current')).toBeInTheDocument();
    });

    it('swipes left to previous card on touch', () => {
      render(<DashboardOverviewStats totalTarget={10000} totalCurrent={5000} currency="USD" />);

      const region = screen.getByRole('region', { name: /dashboard overview/i });

      // First swipe to card 2
      fireEvent.touchStart(region, { touches: [{ clientX: 200 }] });
      fireEvent.touchEnd(region, { changedTouches: [{ clientX: 100 }] });
      expect(screen.getByText('Total current')).toBeInTheDocument();

      // Swipe right (negative diff < -40) to go back
      fireEvent.touchStart(region, { touches: [{ clientX: 100 }] });
      fireEvent.touchEnd(region, { changedTouches: [{ clientX: 200 }] });

      expect(screen.getByText('Total target')).toBeInTheDocument();
    });

    it('wraps around from last to first card', () => {
      render(<DashboardOverviewStats totalTarget={10000} totalCurrent={5000} currency="USD" />);

      const region = screen.getByRole('region', { name: /dashboard overview/i });

      // Swipe through all 3 cards to wrap around
      for (let i = 0; i < 3; i++) {
        fireEvent.touchStart(region, { touches: [{ clientX: 200 }] });
        fireEvent.touchEnd(region, { changedTouches: [{ clientX: 100 }] });
      }

      // Should be back on first card
      expect(screen.getByText('Total target')).toBeInTheDocument();
    });

    it('ignores small swipes', () => {
      render(<DashboardOverviewStats totalTarget={10000} totalCurrent={5000} currency="USD" />);

      const region = screen.getByRole('region', { name: /dashboard overview/i });

      // Swipe less than 40px — should not change slide
      fireEvent.touchStart(region, { touches: [{ clientX: 200 }] });
      fireEvent.touchEnd(region, { changedTouches: [{ clientX: 180 }] });

      expect(screen.getByText('Total target')).toBeInTheDocument();
    });

    it('navigates to card on dot click', () => {
      render(<DashboardOverviewStats totalTarget={10000} totalCurrent={5000} currency="USD" />);

      const region = screen.getByRole('region', { name: /dashboard overview/i });
      const dots = region.querySelectorAll('div[style*="cursor: pointer"]');

      // Click third dot (index 2) → "Overall progress"
      fireEvent.click(dots[2]);
      expect(screen.getByText('Overall progress')).toBeInTheDocument();

      // Click first dot (index 0) → "Total target"
      fireEvent.click(dots[0]);
      expect(screen.getByText('Total target')).toBeInTheDocument();
    });
  });
});
