import { ExchangeRateModel } from "../../db/models/exchange-rate.model";

export type CachedRates = {
  baseCurrency: string;
  rates: Record<string, number>;
  fetchedAt: string;
};

export const getCachedRates = async (baseCurrency: string): Promise<CachedRates | null> => {
  const doc = await ExchangeRateModel.findOne({ baseCurrency }).lean();
  if (!doc) return null;

  const rates: Record<string, number> = {};
  if (doc.rates instanceof Map) {
    doc.rates.forEach((value, key) => {
      rates[key] = value;
    });
  } else {
    Object.assign(rates, doc.rates);
  }

  return {
    baseCurrency: doc.baseCurrency,
    rates,
    fetchedAt: doc.fetchedAt.toISOString(),
  };
};

export const setCachedRates = async (
  baseCurrency: string,
  rates: Record<string, number>
): Promise<void> => {
  await ExchangeRateModel.findOneAndUpdate(
    { baseCurrency },
    { $set: { rates, fetchedAt: new Date() } },
    { upsert: true }
  );
};
