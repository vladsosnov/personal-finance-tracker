import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { ChartRangePicker, CHART_RANGE_OPTIONS } from '../ChartRangePicker';

describe('ChartRangePicker', () => {
  const defaultProps = {
    value: 'all' as const,
    opened: false,
    onToggle: jest.fn(),
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default selection', () => {
    render(<ChartRangePicker {...defaultProps} />);

    expect(screen.getByRole('button', { name: /chart range: all time/i })).toBeInTheDocument();
  });

  it('shows selected range label', () => {
    render(<ChartRangePicker {...defaultProps} value="7d" />);

    expect(screen.getByText('7D')).toBeInTheDocument();
  });

  it('calls onToggle when button clicked', async () => {
    const user = userEvent.setup();
    render(<ChartRangePicker {...defaultProps} />);

    const button = screen.getByRole('button', { name: /chart range/i });
    await user.click(button);

    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows dropdown when opened', () => {
    render(<ChartRangePicker {...defaultProps} opened={true} />);

    const listbox = screen.getByRole('listbox', { name: /chart time range/i });
    expect(listbox).toBeInTheDocument();
  });

  it('does not show dropdown when closed', () => {
    render(<ChartRangePicker {...defaultProps} opened={false} />);

    const listbox = screen.queryByRole('listbox');
    expect(listbox).not.toBeInTheDocument();
  });

  it('renders all range options', () => {
    render(<ChartRangePicker {...defaultProps} opened={true} />);

    CHART_RANGE_OPTIONS.forEach((option) => {
      expect(screen.getByRole('option', { name: option.label })).toBeInTheDocument();
    });
  });

  it('calls onChange when option clicked', async () => {
    const user = userEvent.setup();
    render(<ChartRangePicker {...defaultProps} opened={true} />);

    const option = screen.getByRole('option', { name: '7D' });
    await user.click(option);

    expect(defaultProps.onChange).toHaveBeenCalledWith('7d');
  });

  it('highlights selected option', () => {
    render(<ChartRangePicker {...defaultProps} value="1m" opened={true} />);

    const selectedOption = screen.getByRole('option', { name: '1M' });
    expect(selectedOption).toHaveAttribute('aria-selected', 'true');
  });

  it('marks unselected options correctly', () => {
    render(<ChartRangePicker {...defaultProps} value="all" opened={true} />);

    const option = screen.getByRole('option', { name: '7D' });
    expect(option).toHaveAttribute('aria-selected', 'false');
  });

  it('has proper ARIA attributes on trigger button', () => {
    render(<ChartRangePicker {...defaultProps} opened={true} />);

    const button = screen.getByRole('button', { name: /chart range/i });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-haspopup');
  });

  it('updates aria-expanded when closed', () => {
    render(<ChartRangePicker {...defaultProps} opened={false} />);

    const button = screen.getByRole('button', { name: /chart range/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders chevron icon', () => {
    const { container } = render(<ChartRangePicker {...defaultProps} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
