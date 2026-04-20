import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import type { MockedResponse } from '@apollo/client/testing';
import { CurrencyCard } from '../CurrencyCard';
import { GET_ME } from '@/shared/gql/queries';
import { GET_EXCHANGE_RATES, SET_PRIMARY_CURRENCY } from '@/features/profile/gql/currency';
import { showToast } from '@/shared/lib/toast-store';

jest.mock('@/shared/lib/toast-store');

// Mantine Combobox calls scrollIntoView which is not implemented in jsdom
Element.prototype.scrollIntoView = jest.fn();

const meMock: MockedResponse = {
  request: { query: GET_ME },
  result: {
    data: {
      me: { id: '1', email: 'test@example.com', subscription: 'Pro', role: 'user', primaryCurrency: 'USD', emailVerified: true },
    },
  },
};

const ratesMock: MockedResponse = {
  request: { query: GET_EXCHANGE_RATES, variables: { base: 'USD' } },
  result: {
    data: {
      exchangeRates: {
        base: 'USD',
        rates: JSON.stringify({ EUR: 0.92, PLN: 3.72, GBP: 0.79, JPY: 149.5, CHF: 0.88, CAD: 1.36, AUD: 1.53, CNY: 7.24, SEK: 10.5, NOK: 10.8 }),
        fetchedAt: '2026-04-01T00:00:00.000Z',
      },
    },
  },
};

const defaultMocks = [meMock, ratesMock];

describe('CurrencyCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the currency card title and description', async () => {
    render(<CurrencyCard />, { mocks: defaultMocks });

    expect(await screen.findByText('Currency')).toBeInTheDocument();
    expect(screen.getByText(/primary currency for dashboard totals/i)).toBeInTheDocument();
  });

  it('renders the primary currency selector with current value', async () => {
    render(<CurrencyCard />, { mocks: defaultMocks });

    await screen.findByText('Primary currency');
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('USD ($)');
  });

  it('displays exchange rates table', async () => {
    render(<CurrencyCard />, { mocks: defaultMocks });

    const table = await screen.findByLabelText('Exchange rates');
    const scrollArea = screen.getByTestId('exchange-rates-scroll-area');

    expect(table).toBeInTheDocument();
    expect(scrollArea).toHaveStyle({ height: 'calc(9.375rem * var(--mantine-scale))' });
    expect(screen.getByText('1 USD =')).toBeInTheDocument();
    // Check rates by their numeric values (unique to the table)
    expect(screen.getByText('0.9200')).toBeInTheDocument();
    expect(screen.getByText('3.7200')).toBeInTheDocument();
    // Verify currencies appear within the table
    const tableEl = screen.getByLabelText('Exchange rates');
    expect(tableEl.textContent).toContain('EUR (€)');
    expect(tableEl.textContent).toContain('PLN (zł)');
  });

  it('shows rates updated timestamp', async () => {
    render(<CurrencyCard />, { mocks: defaultMocks });

    expect(await screen.findByText(/Rates updated.*via ECB/)).toBeInTheDocument();
  });

  it('limits exchange rates table to 10 currencies', async () => {
    render(<CurrencyCard />, { mocks: defaultMocks });

    await screen.findByLabelText('Exchange rates');
    const rows = screen.getAllByRole('row');
    // 1 header row + 10 data rows
    expect(rows).toHaveLength(11);
  });

  it('calls setPrimaryCurrency mutation on currency change', async () => {
    const setPrimaryCurrencyMock: MockedResponse = {
      request: { query: SET_PRIMARY_CURRENCY, variables: { currency: 'PLN' } },
      result: {
        data: {
          setPrimaryCurrency: { id: '1', email: 'test@example.com', subscription: 'Pro', role: 'user', primaryCurrency: 'PLN', emailVerified: true },
        },
      },
    };

    const plnRatesMock: MockedResponse = {
      request: { query: GET_EXCHANGE_RATES, variables: { base: 'PLN' } },
      result: {
        data: {
          exchangeRates: {
            base: 'PLN',
            rates: JSON.stringify({ USD: 0.27, EUR: 0.23 }),
            fetchedAt: '2026-04-01T00:00:00.000Z',
          },
        },
      },
    };

    const plnMeMock: MockedResponse = {
      request: { query: GET_ME },
      result: {
        data: {
          me: { id: '1', email: 'test@example.com', subscription: 'Pro', role: 'user', primaryCurrency: 'PLN', emailVerified: true },
        },
      },
    };

    const user = userEvent.setup();
    render(<CurrencyCard />, {
      mocks: [...defaultMocks, setPrimaryCurrencyMock, plnRatesMock, plnMeMock],
    });

    await screen.findByText('Primary currency');
    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.clear(input);
    await user.type(input, 'PLN');

    // Use role selector to pick the dropdown option, not the table cell
    const options = await screen.findAllByText('PLN (zł)');
    const dropdownOption = options.find((el) => el.closest('[role="option"]'));
    await user.click(dropdownOption!);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('Primary currency changed to PLN', 'teal');
    });
  });

  it('shows error toast when mutation fails', async () => {
    const failingMock: MockedResponse = {
      request: { query: SET_PRIMARY_CURRENCY, variables: { currency: 'EUR' } },
      error: new Error('Network error'),
    };

    const user = userEvent.setup();
    render(<CurrencyCard />, { mocks: [...defaultMocks, failingMock] });

    await screen.findByText('Primary currency');
    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.clear(input);
    await user.type(input, 'EUR');

    // Use role selector to pick the dropdown option, not the table cell
    const options = await screen.findAllByText('EUR (€)');
    const dropdownOption = options.find((el) => el.closest('[role="option"]'));
    await user.click(dropdownOption!);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('Network error', 'red');
    });
  });

  it('does not show exchange rates table when rates are empty', async () => {
    const emptyRatesMock: MockedResponse = {
      request: { query: GET_EXCHANGE_RATES, variables: { base: 'USD' } },
      result: {
        data: {
          exchangeRates: { base: 'USD', rates: '{}', fetchedAt: '2026-04-01T00:00:00.000Z' },
        },
      },
    };

    render(<CurrencyCard />, { mocks: [meMock, emptyRatesMock] });

    await screen.findByText('Currency');
    expect(screen.queryByLabelText('Exchange rates')).not.toBeInTheDocument();
  });

  it('defaults to USD when me query returns null', async () => {
    const nullMeMock: MockedResponse = {
      request: { query: GET_ME },
      result: { data: { me: null } },
    };

    const usdRatesMock: MockedResponse = {
      request: { query: GET_EXCHANGE_RATES, variables: { base: 'USD' } },
      result: {
        data: {
          exchangeRates: { base: 'USD', rates: JSON.stringify({ EUR: 0.92 }), fetchedAt: '2026-04-01T00:00:00.000Z' },
        },
      },
    };

    render(<CurrencyCard />, { mocks: [nullMeMock, usdRatesMock] });

    await screen.findByText('Primary currency');
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('USD ($)');
  });
});
