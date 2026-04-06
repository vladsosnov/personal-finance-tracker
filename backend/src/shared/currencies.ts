export type CurrencyInfo = {
  code: string;
  symbol: string;
  name: string;
};

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "MXN", symbol: "Mex$", name: "Mexican Peso" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
];

const CURRENCY_CODES = new Set(SUPPORTED_CURRENCIES.map((c) => c.code));

export const isValidCurrency = (code: string): boolean => CURRENCY_CODES.has(code);

export const getCurrencySymbol = (code: string): string =>
  SUPPORTED_CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
