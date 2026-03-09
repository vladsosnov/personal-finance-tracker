export const formatMoney = (value: number) => {
  const [whole, decimals] = value.toFixed(2).split(".");
  const withSpaces = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `$${withSpaces}.${decimals}`;
};

export const MONEY_INPUT_PROPS = {
  min: 1,
  decimalScale: 2,
  thousandSeparator: " ",
  hideControls: true,
} as const;

export const numberOrZero = (value: number | string) => (typeof value === "number" ? value : 0);

export const getProgressPercentage = (currentAmount: number, targetAmount: number) => {
  if (targetAmount <= 0) {
    return 0;
  }

  return (currentAmount / targetAmount) * 100;
};
