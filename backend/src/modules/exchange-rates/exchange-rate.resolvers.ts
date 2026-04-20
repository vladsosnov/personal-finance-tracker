import { assertValidCurrency } from "../../utils/validation";
import { getExchangeRatesResponse } from "./exchange-rate.service";
import { SUPPORTED_CURRENCIES } from "../../shared/currencies";

export const exchangeRateResolvers = {
  exchangeRates: async ({ base }: { base: string }) => {
    assertValidCurrency(base);
    return getExchangeRatesResponse(base);
  },
  supportedCurrencies: () => SUPPORTED_CURRENCIES,
};
