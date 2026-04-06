import { Schema, model } from "mongoose";

export type ExchangeRateDocument = {
  baseCurrency: string;
  rates: Map<string, number>;
  fetchedAt: Date;
};

const exchangeRateSchema = new Schema<ExchangeRateDocument>({
  baseCurrency: { type: String, required: true, unique: true },
  rates: { type: Map, of: Number, required: true },
  fetchedAt: { type: Date, required: true },
});

export const ExchangeRateModel = model<ExchangeRateDocument>("ExchangeRate", exchangeRateSchema);
