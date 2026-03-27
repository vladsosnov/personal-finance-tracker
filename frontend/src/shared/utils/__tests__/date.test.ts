import { getTodayDateValue, formatDay, dateStringToUtcTimestamp } from '../date';

describe('getTodayDateValue', () => {
  it('returns date in YYYY-MM-DD format', () => {
    const result = getTodayDateValue();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns current date', () => {
    const result = getTodayDateValue();
    const today = new Date().toISOString().slice(0, 10);
    expect(result).toBe(today);
  });
});

describe('formatDay', () => {
  it('formats valid date string to locale date', () => {
    const result = formatDay('2024-01-15');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('returns original value for invalid date', () => {
    expect(formatDay('invalid-date')).toBe('invalid-date');
  });

  it('handles edge case dates', () => {
    const result = formatDay('2024-12-31');
    expect(result).toBeTruthy();
  });
});

describe('dateStringToUtcTimestamp', () => {
  it('converts YYYY-MM-DD to UTC timestamp', () => {
    const result = dateStringToUtcTimestamp('2024-01-15');
    const expected = Date.UTC(2024, 0, 15);
    expect(result).toBe(expected);
  });

  it('handles different months correctly', () => {
    const jan = dateStringToUtcTimestamp('2024-01-01');
    const dec = dateStringToUtcTimestamp('2024-12-01');
    expect(dec).toBeGreaterThan(jan);
  });

  it('falls back to Date constructor for invalid format', () => {
    const result = dateStringToUtcTimestamp('invalid');
    expect(typeof result).toBe('number');
  });

  it('handles leap year dates', () => {
    const result = dateStringToUtcTimestamp('2024-02-29');
    expect(result).toBe(Date.UTC(2024, 1, 29));
  });
});
