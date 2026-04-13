import { screen } from '@testing-library/react';
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

  it('exposes help copy for the total current info tooltip', () => {
    render(<DashboardOverviewStats totalTarget={10000} totalCurrent={5000} currency="USD" />);

    const infoButton = screen.getByRole('button', {
      name: /why zero-goal amounts are excluded from total current/i,
    });

    expect(infoButton).toHaveAccessibleDescription('Zero-goal amounts are not included in Total current.');
  });

  describe('mobile layout', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(true);
    });

    afterEach(() => {
      mockUseMediaQuery.mockReturnValue(false);
    });

    it('shows all stats in a single compact card on mobile', () => {
      render(<DashboardOverviewStats totalTarget={10000} totalCurrent={5000} currency="USD" />);

      const region = screen.getByRole('region', { name: /dashboard overview/i });
      expect(region).toBeInTheDocument();

      // All three stats should be visible simultaneously (no carousel)
      expect(screen.getByText('Total target')).toBeInTheDocument();
      expect(screen.getByText('Total current')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
    });

    it('uses h4 headings on mobile for compact layout', () => {
      render(<DashboardOverviewStats totalTarget={10000} totalCurrent={5000} currency="USD" />);

      const headings = screen.getAllByRole('heading', { level: 4 });
      expect(headings.length).toBe(3);
    });

    it('shows loading skeletons on mobile when values are null', () => {
      const { container } = render(<DashboardOverviewStats totalTarget={null} totalCurrent={null} currency="USD" />);

      const skeletons = container.querySelectorAll('.mantine-Skeleton-root');
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });
  });
});
