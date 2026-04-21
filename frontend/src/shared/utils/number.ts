import { getCurrencySymbol } from "@/shared/constants/currencies";

export const formatMoney = (value: number, currencyCode?: string) => {
  const [whole, decimals] = value.toFixed(2).split(".");
  const withSpaces = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const formatted = `${withSpaces}.${decimals}`;
  if (!currencyCode) return formatted;
  return `${getCurrencySymbol(currencyCode)} ${formatted}`;
};

export const MONEY_INPUT_PROPS = {
  min: 0.01,
  decimalScale: 2,
  thousandSeparator: " ",
  hideControls: true,
} as const;

export const numberOrZero = (value: number | string) => (typeof value === "number" ? value : 0);

export const getProgressPercentage = (currentAmount: number, targetAmount: number) => {
  if (targetAmount <= 0) {
    return 0;
  }

  return Math.min((currentAmount / targetAmount) * 100, 100);
};
