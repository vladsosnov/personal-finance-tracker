import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { CurrencySelect } from '../CurrencySelect';

// Mantine Combobox calls scrollIntoView which is not implemented in jsdom
Element.prototype.scrollIntoView = jest.fn();

describe('CurrencySelect', () => {
  const defaultProps = {
    value: 'USD',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default Currency label', () => {
    render(<CurrencySelect {...defaultProps} />);

    expect(screen.getByText('Currency')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<CurrencySelect {...defaultProps} label="Primary currency" />);

    expect(screen.getByText('Primary currency')).toBeInTheDocument();
  });

  it('displays the current value', () => {
    render(<CurrencySelect {...defaultProps} value="EUR" />);

    expect(screen.getByRole('textbox')).toHaveValue('EUR (€)');
  });

  it('calls onChange when a currency is selected', async () => {
    const user = userEvent.setup();
    render(<CurrencySelect {...defaultProps} />);

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.clear(input);
    await user.type(input, 'PLN');

    const option = await screen.findByText('PLN (zł)');
    await user.click(option);

    expect(defaultProps.onChange).toHaveBeenCalledWith('PLN');
  });

  it('does not call onChange when value is cleared', async () => {
    const user = userEvent.setup();
    render(<CurrencySelect {...defaultProps} />);

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.clear(input);

    expect(defaultProps.onChange).not.toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<CurrencySelect {...defaultProps} disabled />);

    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('is not disabled by default', () => {
    render(<CurrencySelect {...defaultProps} />);

    expect(screen.getByRole('textbox')).not.toBeDisabled();
  });
});
