import { convert } from "../exchange-rate.service";

describe("convert", () => {
  const rates: Record<string, number> = {
    EUR: 0.85,
    GBP: 0.73,
    JPY: 110.0,
    PLN: 4.0,
  };

  describe("same currency", () => {
    it("returns the same amount", () => {
      expect(convert(100, "USD", "USD", rates)).toBe(100);
    });
  });

  describe("direct conversion (from base currency)", () => {
    it("converts USD to EUR", () => {
      expect(convert(100, "USD", "EUR", rates)).toBe(85);
    });

    it("converts USD to JPY", () => {
      expect(convert(100, "USD", "JPY", rates)).toBe(11000);
    });

    it("converts USD to GBP", () => {
      expect(convert(50, "USD", "GBP", rates)).toBe(36.5);
    });

    it("handles small amounts", () => {
      expect(convert(0.01, "USD", "EUR", rates)).toBe(0.01);
    });

    it("handles zero amount", () => {
      expect(convert(0, "USD", "EUR", rates)).toBe(0);
    });
  });

  describe("inverse conversion (to base currency)", () => {
    it("converts EUR to USD (base)", () => {
      // rates are relative to USD base. EUR rate = 0.85 means 1 USD = 0.85 EUR
      // So 85 EUR / 0.85 = 100 USD
      expect(convert(85, "EUR", "USD", rates)).toBe(100);
    });

    it("converts JPY to USD", () => {
      expect(convert(11000, "JPY", "USD", rates)).toBe(100);
    });

    it("converts PLN to USD", () => {
      expect(convert(400, "PLN", "USD", rates)).toBe(100);
    });
  });

  describe("error cases", () => {
    it("throws when no rate available", () => {
      expect(() => convert(100, "XYZ", "ABC", rates)).toThrow(
        "No exchange rate available for XYZ → ABC"
      );
    });

    it("throws when neither currency has a rate", () => {
      expect(() => convert(100, "CHF", "AUD", {})).toThrow(
        "No exchange rate available"
      );
    });
  });

  describe("precision", () => {
    it("rounds to 2 decimal places", () => {
      const result = convert(33.33, "USD", "EUR", rates);
      const decimals = result.toString().split(".")[1]?.length ?? 0;
      expect(decimals).toBeLessThanOrEqual(2);
    });
  });
});
