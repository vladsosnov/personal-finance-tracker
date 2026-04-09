import { isValidCurrency, getCurrencySymbol, SUPPORTED_CURRENCIES } from "../currencies";

describe("currencies", () => {
  describe("SUPPORTED_CURRENCIES", () => {
    it("contains USD", () => {
      expect(SUPPORTED_CURRENCIES.find((c) => c.code === "USD")).toBeDefined();
    });

    it("contains EUR", () => {
      expect(SUPPORTED_CURRENCIES.find((c) => c.code === "EUR")).toBeDefined();
    });

    it("has unique codes", () => {
      const codes = SUPPORTED_CURRENCIES.map((c) => c.code);
      expect(new Set(codes).size).toBe(codes.length);
    });

    it("all entries have code, symbol, and name", () => {
      for (const currency of SUPPORTED_CURRENCIES) {
        expect(currency.code).toBeTruthy();
        expect(currency.symbol).toBeTruthy();
        expect(currency.name).toBeTruthy();
      }
    });
  });

  describe("isValidCurrency", () => {
    it("returns true for supported currencies", () => {
      expect(isValidCurrency("USD")).toBe(true);
      expect(isValidCurrency("EUR")).toBe(true);
      expect(isValidCurrency("PLN")).toBe(true);
      expect(isValidCurrency("JPY")).toBe(true);
      expect(isValidCurrency("GBP")).toBe(true);
    });

    it("returns false for unsupported currencies", () => {
      expect(isValidCurrency("XYZ")).toBe(false);
      expect(isValidCurrency("BTC")).toBe(false);
      expect(isValidCurrency("")).toBe(false);
    });

    it("is case-sensitive", () => {
      expect(isValidCurrency("usd")).toBe(false);
      expect(isValidCurrency("Usd")).toBe(false);
    });
  });

  describe("getCurrencySymbol", () => {
    it("returns symbol for known currencies", () => {
      expect(getCurrencySymbol("USD")).toBe("$");
      expect(getCurrencySymbol("EUR")).toBe("€");
      expect(getCurrencySymbol("GBP")).toBe("£");
      expect(getCurrencySymbol("PLN")).toBe("zł");
      expect(getCurrencySymbol("JPY")).toBe("¥");
    });

    it("returns code itself for unknown currencies", () => {
      expect(getCurrencySymbol("XYZ")).toBe("XYZ");
      expect(getCurrencySymbol("UNKNOWN")).toBe("UNKNOWN");
    });
  });
});
