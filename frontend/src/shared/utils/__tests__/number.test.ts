import { formatMoney, numberOrZero, getProgressPercentage } from '../number';

describe('formatMoney', () => {
  it('formats positive numbers with thousands separator', () => {
    expect(formatMoney(1234.56)).toBe('$1 234.56');
  });

  it('formats large numbers', () => {
    expect(formatMoney(1234567.89)).toBe('$1 234 567.89');
  });

  it('formats small numbers', () => {
    expect(formatMoney(12.34)).toBe('$12.34');
  });

  it('formats zero', () => {
    expect(formatMoney(0)).toBe('$0.00');
  });

  it('always includes two decimal places', () => {
    expect(formatMoney(100)).toBe('$100.00');
    expect(formatMoney(100.1)).toBe('$100.10');
  });
});

describe('numberOrZero', () => {
  it('returns the number if input is a number', () => {
    expect(numberOrZero(42)).toBe(42);
    expect(numberOrZero(0)).toBe(0);
    expect(numberOrZero(-5)).toBe(-5);
  });

  it('returns 0 if input is a string', () => {
    expect(numberOrZero('123')).toBe(0);
    expect(numberOrZero('')).toBe(0);
  });
});

describe('getProgressPercentage', () => {
  it('calculates correct percentage', () => {
    expect(getProgressPercentage(5000, 10000)).toBe(50);
    expect(getProgressPercentage(2500, 10000)).toBe(25);
    expect(getProgressPercentage(10000, 10000)).toBe(100);
  });

  it('handles zero target amount', () => {
    expect(getProgressPercentage(5000, 0)).toBe(0);
  });

  it('handles negative target amount', () => {
    expect(getProgressPercentage(5000, -10000)).toBe(0);
  });

  it('handles current amount exceeding target', () => {
    expect(getProgressPercentage(15000, 10000)).toBe(150);
  });

  it('handles zero current amount', () => {
    expect(getProgressPercentage(0, 10000)).toBe(0);
  });
});
