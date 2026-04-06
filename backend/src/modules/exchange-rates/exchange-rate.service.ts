import { getCachedRates, setCachedRates } from "./exchange-rate.repository";

const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const FRANKFURTER_BASE = "https://api.frankfurter.dev/v1";

const fetchRatesFromApi = async (baseCurrency: string): Promise<Record<string, number>> => {
  const url = `${FRANKFURTER_BASE}/latest?from=${encodeURIComponent(baseCurrency)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rates: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { rates: Record<string, number> };
  return data.rates;
};

export const getRates = async (baseCurrency: string): Promise<Record<string, number>> => {
  const cached = await getCachedRates(baseCurrency);

  if (cached) {
    const age = Date.now() - new Date(cached.fetchedAt).getTime();
    if (age < CACHE_MAX_AGE_MS) {
      return cached.rates;
    }
  }

  try {
    const rates = await fetchRatesFromApi(baseCurrency);
    await setCachedRates(baseCurrency, rates);
    return rates;
  } catch (error) {
    // Fall back to stale cache if available
    if (cached) return cached.rates;
    throw error;
  }
};

export const convert = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number => {
  if (fromCurrency === toCurrency) return amount;

  // rates are relative to a base currency (the goal's currency).
  // If toCurrency is the base, it won't appear in the map — divide by fromCurrency rate instead.
  const directRate = rates[toCurrency];
  if (directRate != null) {
    // fromCurrency is the base → multiply
    return Number((amount * directRate).toFixed(2));
  }

  const inverseRate = rates[fromCurrency];
  if (inverseRate != null && inverseRate !== 0) {
    // toCurrency is the base → divide
    return Number((amount / inverseRate).toFixed(2));
  }

  throw new Error(`No exchange rate available for ${fromCurrency} → ${toCurrency}`);
};

export const getExchangeRatesResponse = async (
  baseCurrency: string
): Promise<{ base: string; rates: string; fetchedAt: string }> => {
  const rates = await getRates(baseCurrency);
  const cached = await getCachedRates(baseCurrency);

  return {
    base: baseCurrency,
    rates: JSON.stringify(rates),
    fetchedAt: cached?.fetchedAt ?? new Date().toISOString(),
  };
};
