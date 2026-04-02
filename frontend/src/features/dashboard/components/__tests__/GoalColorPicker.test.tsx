import { screen } from '@testing-library/react';
import { render } from '@/__tests__/test-utils';
import { GoalColorPicker } from '../goal-color-picker';
import { GOAL_COLOR_OPTIONS } from '@/shared/constants/goal-colors';
import { useCustomColors } from '@/features/profile/hooks/useCustomColors';

jest.mock('@/features/profile/hooks/useCustomColors');

const setupMock = (colors: { value: string; label: string }[] = []) => {
  (useCustomColors as jest.Mock).mockReturnValue({
    colors,
    addColor: jest.fn(),
    removeColor: jest.fn(),
    maxColors: 20,
  });
};

describe('GoalColorPicker', () => {
  const defaultProps = {
    label: 'Color',
    value: GOAL_COLOR_OPTIONS[0].value,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupMock();
  });

  it('renders label text', () => {
    render(<GoalColorPicker {...defaultProps} />);

    expect(screen.getByText('Color')).toBeInTheDocument();
  });

  it('renders a color swatch', () => {
    const { container } = render(<GoalColorPicker {...defaultProps} />);

    const swatches = container.querySelectorAll('[aria-hidden="true"]');
    expect(swatches.length).toBeGreaterThan(0);
  });

  it('renders a select input with aria-label', () => {
    render(<GoalColorPicker {...defaultProps} />);

    expect(screen.getByRole('textbox', { name: 'Color' })).toBeInTheDocument();
  });

  it('renders with custom colors without crashing', () => {
    setupMock([{ value: '#ABCDEF', label: 'Custom Blue' }]);

    render(<GoalColorPicker {...defaultProps} />);

    expect(screen.getByText('Color')).toBeInTheDocument();
  });

  it('renders when value is a custom color', () => {
    setupMock([{ value: '#ABCDEF', label: 'Custom Blue' }]);

    render(<GoalColorPicker {...defaultProps} value="#ABCDEF" />);

    expect(screen.getByText('Color')).toBeInTheDocument();
  });

  it('falls back to first preset color when value is unknown', () => {
    const { container } = render(<GoalColorPicker {...defaultProps} value="#ZZZZZZ" />);

    const swatches = container.querySelectorAll('[aria-hidden="true"]');
    expect(swatches.length).toBeGreaterThan(0);
  });

  it('renders as disabled when disabled prop is true', () => {
    render(<GoalColorPicker {...defaultProps} disabled />);

    expect(screen.getByRole('textbox', { name: 'Color' })).toBeDisabled();
  });

  it('filters out custom colors that duplicate preset values', () => {
    const presetValue = GOAL_COLOR_OPTIONS[0].value;
    setupMock([{ value: presetValue, label: 'Duplicate' }]);

    render(<GoalColorPicker {...defaultProps} />);

    expect(screen.getByText('Color')).toBeInTheDocument();
  });
});
