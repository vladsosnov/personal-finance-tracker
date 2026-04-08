import { render } from '@/__tests__/test-utils';
import { DashboardSkeleton } from '../dashboard-skeleton';

describe('DashboardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<DashboardSkeleton />);
    expect(container.querySelector('.mantine-Skeleton-root')).toBeInTheDocument();
  });

  it('renders three stat card skeletons', () => {
    const { container } = render(<DashboardSkeleton />);
    const cards = container.querySelectorAll('.mantine-Card-root');
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });
});
