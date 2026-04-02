import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { CustomColorsCard } from '../CustomColorsCard';
import { useCustomColors } from '@/features/profile/hooks/useCustomColors';

jest.mock('@/features/profile/hooks/useCustomColors');

const mockAddColor = jest.fn();
const mockRemoveColor = jest.fn();

const setupMock = (colors: { value: string; label: string }[] = []) => {
  (useCustomColors as jest.Mock).mockReturnValue({
    colors,
    addColor: mockAddColor,
    removeColor: mockRemoveColor,
    maxColors: 20,
  });
};

describe('CustomColorsCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMock();
  });

  it('renders card title and description', () => {
    render(<CustomColorsCard />);

    expect(screen.getByText('Custom color palette')).toBeInTheDocument();
    expect(screen.getByText('Add your own colors to use when creating goals.')).toBeInTheDocument();
  });

  it('renders color name input', () => {
    render(<CustomColorsCard />);

    expect(screen.getByPlaceholderText('Color name')).toBeInTheDocument();
  });

  it('renders add button', () => {
    render(<CustomColorsCard />);

    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('does not render color chips when no colors exist', () => {
    render(<CustomColorsCard />);

    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });

  it('renders existing color chips with remove buttons', () => {
    setupMock([
      { value: '#FF0000', label: 'Red' },
      { value: '#00FF00', label: 'Green' },
    ]);

    render(<CustomColorsCard />);

    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getByText('Green')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Red' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Green' })).toBeInTheDocument();
  });

  it('calls addColor when add button is clicked with valid hex', async () => {
    mockAddColor.mockReturnValue(true);
    const user = userEvent.setup();

    render(<CustomColorsCard />);

    const colorInput = screen.getByPlaceholderText('#FF5500');
    const labelInput = screen.getByPlaceholderText('Color name');

    await user.type(colorInput, '#FF5500');
    await user.type(labelInput, 'Orange');
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(mockAddColor).toHaveBeenCalledWith('#FF5500', 'Orange');
  });

  it('shows error for invalid hex', async () => {
    const user = userEvent.setup();

    render(<CustomColorsCard />);

    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(screen.getByText('Enter a valid hex color (e.g. #FF5500)')).toBeInTheDocument();
    expect(mockAddColor).not.toHaveBeenCalled();
  });

  it('shows error for duplicate color', async () => {
    setupMock([{ value: '#FF0000', label: 'Red' }]);
    const user = userEvent.setup();

    render(<CustomColorsCard />);

    const colorInput = screen.getByPlaceholderText('#FF5500');
    await user.type(colorInput, '#FF0000');
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(screen.getByText('This color is already in your palette')).toBeInTheDocument();
    expect(mockAddColor).not.toHaveBeenCalled();
  });

  it('calls removeColor when remove button is clicked', async () => {
    setupMock([{ value: '#FF0000', label: 'Red' }]);
    const user = userEvent.setup();

    render(<CustomColorsCard />);

    await user.click(screen.getByRole('button', { name: 'Remove Red' }));

    expect(mockRemoveColor).toHaveBeenCalledWith('#FF0000');
  });

  it('disables add button and shows limit message when at max', () => {
    const colors = Array.from({ length: 20 }, (_, i) => ({
      value: `#${String(i).padStart(6, '0')}`,
      label: `Color ${i}`,
    }));
    setupMock(colors);

    render(<CustomColorsCard />);

    expect(screen.getByRole('button', { name: /add/i })).toBeDisabled();
    expect(screen.getByText('Maximum of 20 custom colors reached.')).toBeInTheDocument();
  });

  it('does not show limit message when below max', () => {
    setupMock([{ value: '#FF0000', label: 'Red' }]);

    render(<CustomColorsCard />);

    expect(screen.queryByText(/maximum of/i)).not.toBeInTheDocument();
  });
});
