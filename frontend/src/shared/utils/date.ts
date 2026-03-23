export const getTodayDateValue = () => new Date().toISOString().slice(0, 10);

export const formatDay = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

export const dateStringToUtcTimestamp = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return new Date(value).getTime();
  }

  return Date.UTC(year, month - 1, day);
};
