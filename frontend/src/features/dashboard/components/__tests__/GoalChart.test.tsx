import { render } from '@/__tests__/test-utils';
import { GoalChart } from '../goal-chart';
import type { GoalOperation } from '@/features/dashboard/types';

// Mock Highcharts entirely to avoid JSDOM CSS.supports errors
jest.mock('highcharts', () => ({}));
jest.mock('highcharts/modules/accessibility', () => jest.fn());
jest.mock('highcharts-react-official', () => {
  return {
    __esModule: true,
    default: (props: { options: { title?: { text?: string }; series?: Array<{ name?: string }> } }) => (
      <div data-testid="highcharts-mock">
        <span data-testid="chart-title">{props.options?.title?.text}</span>
        {props.options?.series?.map((s, i) => (
          <span key={i} data-testid={`series-${i}`}>{s.name}</span>
        ))}
      </div>
    ),
  };
});

const mockOperations: GoalOperation[] = [
  {
    id: '1',
    type: 'INCREASE',
    amount: 500,
    currency: 'USD',
    convertedAmount: 500,
    operationDate: '2024-01-15',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    type: 'INCREASE',
    amount: 300,
    currency: 'USD',
    convertedAmount: 300,
    operationDate: '2024-02-15',
    createdAt: '2024-02-15T10:00:00Z',
  },
];

const defaultProps = {
  operations: mockOperations,
  color: '#228be6',
  currency: 'USD',
  targetAmount: 10000,
  initialAmount: 0,
  currentAmount: 800,
  isCompleted: false,
  range: 'all' as const,
};

describe('GoalChart', () => {
  it('renders the chart component', () => {
    const { getByTestId } = render(<GoalChart {...defaultProps} />);

    expect(getByTestId('highcharts-mock')).toBeInTheDocument();
  });

  it('displays chart title', () => {
    const { getByTestId } = render(<GoalChart {...defaultProps} />);

    expect(getByTestId('chart-title')).toHaveTextContent('Progress over time');
  });

  it('renders Amount series', () => {
    const { getByTestId } = render(<GoalChart {...defaultProps} />);

    expect(getByTestId('series-0')).toHaveTextContent('Amount');
  });

  it('renders Trend series when showTrend is true', () => {
    const { getByTestId } = render(<GoalChart {...defaultProps} showTrend={true} />);

    expect(getByTestId('series-1')).toHaveTextContent('Trend');
  });

  it('does not render Trend series when showTrend is false', () => {
    const { queryByTestId } = render(<GoalChart {...defaultProps} showTrend={false} />);

    expect(queryByTestId('series-1')).not.toBeInTheDocument();
  });

  it('does not render Trend series for completed goals', () => {
    const { queryByTestId } = render(<GoalChart {...defaultProps} isCompleted={true} showTrend={true} />);

    expect(queryByTestId('series-1')).not.toBeInTheDocument();
  });

  it('renders with empty operations', () => {
    const { getByTestId } = render(<GoalChart {...defaultProps} operations={[]} />);

    expect(getByTestId('highcharts-mock')).toBeInTheDocument();
  });

  it('renders with single operation (no trend possible)', () => {
    const { getByTestId, queryByTestId } = render(
      <GoalChart {...defaultProps} operations={[mockOperations[0]]} showTrend={true} />
    );

    expect(getByTestId('highcharts-mock')).toBeInTheDocument();
    // Trend requires at least 2 data points
    expect(queryByTestId('series-1')).not.toBeInTheDocument();
  });

  it('accepts different range values', () => {
    const ranges = ['all', '7d', '1m', '6m', '12m'] as const;
    ranges.forEach((range) => {
      const { getByTestId, unmount } = render(<GoalChart {...defaultProps} range={range} />);
      expect(getByTestId('highcharts-mock')).toBeInTheDocument();
      unmount();
    });
  });
});
