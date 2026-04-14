import { buildGoalFromDetails, getProjectedDate } from '../goalUtils';
import type { GoalDetails, GoalOperation } from '@/features/dashboard/types';

describe('goalUtils', () => {
  describe('buildGoalFromDetails', () => {
    it('extracts Goal fields from GoalDetails', () => {
      const goalDetails: GoalDetails = {
        id: '1',
        title: 'Emergency Fund',
        targetAmount: 10000,
        initialAmount: 1000,
        currency: 'USD',
        color: '#228be6',
        sortOrder: 0,
        isCompleted: false,
        currentAmount: 5000,
        progress: 50,
        createdAt: '2024-01-01T00:00:00.000Z',
        operations: [
          {
            id: 'op1',
            type: 'INCREASE',
            amount: 1000,
            currency: 'USD',
            convertedAmount: 1000,
            operationDate: '2024-01-15',
            createdAt: '2024-01-15T00:00:00.000Z',
          },
        ],
      };

      const result = buildGoalFromDetails(goalDetails);

      expect(result).toEqual({
        id: '1',
        title: 'Emergency Fund',
        targetAmount: 10000,
        initialAmount: 1000,
        currency: 'USD',
        color: '#228be6',
        sortOrder: 0,
        isCompleted: false,
        completedAt: undefined,
        currentAmount: 5000,
        progress: 50,
        createdAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('omits operations array from result', () => {
      const goalDetails: GoalDetails = {
        id: '2',
        title: 'Vacation',
        targetAmount: 5000,
        initialAmount: 0,
        currency: 'USD',
        color: '#40c057',
        sortOrder: 1,
        isCompleted: true,
        completedAt: '2024-02-01T00:00:00.000Z',
        currentAmount: 5000,
        progress: 100,
        createdAt: '2024-01-01T00:00:00.000Z',
        operations: [],
      };

      const result = buildGoalFromDetails(goalDetails);

      expect(result).not.toHaveProperty('operations');
      expect(result.completedAt).toBe('2024-02-01T00:00:00.000Z');
    });

    it('preserves all Goal properties', () => {
      const goalDetails: GoalDetails = {
        id: '3',
        title: 'Car Down Payment',
        targetAmount: 20000,
        initialAmount: 5000,
        currency: 'USD',
        color: '#f06595',
        sortOrder: 2,
        isCompleted: false,
        currentAmount: 12000,
        progress: 60,
        createdAt: '2023-12-01T00:00:00.000Z',
        operations: [],
      };

      const result = buildGoalFromDetails(goalDetails);

      expect(result.id).toBe('3');
      expect(result.title).toBe('Car Down Payment');
      expect(result.targetAmount).toBe(20000);
      expect(result.initialAmount).toBe(5000);
      expect(result.color).toBe('#f06595');
      expect(result.sortOrder).toBe(2);
      expect(result.isCompleted).toBe(false);
      expect(result.currentAmount).toBe(12000);
      expect(result.progress).toBe(60);
      expect(result.createdAt).toBe('2023-12-01T00:00:00.000Z');
    });

    it('handles undefined completedAt', () => {
      const goalDetails: GoalDetails = {
        id: '4',
        title: 'Test Goal',
        targetAmount: 1000,
        initialAmount: 0,
        currency: 'USD',
        color: '#228be6',
        sortOrder: 0,
        isCompleted: false,
        currentAmount: 500,
        progress: 50,
        createdAt: '2024-01-01T00:00:00.000Z',
        operations: [],
      };

      const result = buildGoalFromDetails(goalDetails);

      expect(result.completedAt).toBeUndefined();
    });
  });

  describe('getProjectedDate', () => {
    const makeOp = (
      overrides: Partial<GoalOperation> & { operationDate: string },
    ): GoalOperation => ({
      id: Math.random().toString(),
      type: 'INCREASE',
      amount: 100,
      currency: 'USD',
      convertedAmount: 100,
      createdAt: `${overrides.operationDate}T00:00:00Z`,
      ...overrides,
    });

    it('returns null for completed goals', () => {
      const ops = [
        makeOp({ operationDate: '2024-01-01', convertedAmount: 100 }),
        makeOp({ operationDate: '2024-02-01', convertedAmount: 200 }),
      ];
      expect(getProjectedDate(ops, 10000, 300, true)).toBeNull();
    });

    it('returns null when targetAmount is zero', () => {
      const ops = [
        makeOp({ operationDate: '2024-01-01', convertedAmount: 100 }),
        makeOp({ operationDate: '2024-02-01', convertedAmount: 200 }),
      ];
      expect(getProjectedDate(ops, 0, 100, false)).toBeNull();
    });

    it('returns null when targetAmount is negative', () => {
      const ops = [
        makeOp({ operationDate: '2024-01-01', convertedAmount: 100 }),
        makeOp({ operationDate: '2024-02-01', convertedAmount: 200 }),
      ];
      expect(getProjectedDate(ops, -500, 100, false)).toBeNull();
    });

    it('returns null when currentAmount >= targetAmount', () => {
      const ops = [
        makeOp({ operationDate: '2024-01-01', convertedAmount: 500 }),
        makeOp({ operationDate: '2024-02-01', convertedAmount: 500 }),
      ];
      expect(getProjectedDate(ops, 1000, 1000, false)).toBeNull();
    });

    it('returns null with fewer than 2 operations', () => {
      const ops = [makeOp({ operationDate: '2024-01-01', convertedAmount: 100 })];
      expect(getProjectedDate(ops, 10000, 100, false)).toBeNull();
    });

    it('returns null with empty operations', () => {
      expect(getProjectedDate([], 10000, 100, false)).toBeNull();
    });

    it('returns null when slope is negative (decreasing trend)', () => {
      const ops = [
        makeOp({ operationDate: '2024-01-01', type: 'INCREASE', convertedAmount: 500 }),
        makeOp({ operationDate: '2024-02-01', type: 'DECREASE', convertedAmount: 800 }),
      ];
      expect(getProjectedDate(ops, 10000, 200, false)).toBeNull();
    });

    it('returns null when all operations are on the same date (zero denominator)', () => {
      const ops = [
        makeOp({ operationDate: '2024-01-01', convertedAmount: 100, createdAt: '2024-01-01T01:00:00Z' }),
        makeOp({ operationDate: '2024-01-01', convertedAmount: 200, createdAt: '2024-01-01T02:00:00Z' }),
      ];
      expect(getProjectedDate(ops, 10000, 300, false)).toBeNull();
    });

    it('returns a formatted date string for valid positive trend', () => {
      // Two operations: +100 on Jan 1, +200 on Feb 1 → cumulative 100, 300
      // With steady positive slope, should project a future completion date
      const ops = [
        makeOp({ operationDate: '2024-01-01', convertedAmount: 100 }),
        makeOp({ operationDate: '2024-02-01', convertedAmount: 200 }),
      ];
      const result = getProjectedDate(ops, 5000, 300, false);

      expect(result).not.toBeNull();
      // Format: "Mon YYYY"
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{4}$/);
    });

    it('returns null when projection exceeds 5 years', () => {
      // Very slow growth: tiny amounts spread over a huge target
      const ops = [
        makeOp({ operationDate: '2024-01-01', convertedAmount: 1 }),
        makeOp({ operationDate: '2024-01-02', convertedAmount: 1 }),
      ];
      // Target of 10,000,000 with $2 cumulative and ~$1/day slope → ~27,000 years
      expect(getProjectedDate(ops, 10000000, 2, false)).toBeNull();
    });

    it('sorts operations by date before computing regression', () => {
      // Provide out-of-order operations; result should be same as sorted
      const ops = [
        makeOp({ operationDate: '2024-03-01', convertedAmount: 300 }),
        makeOp({ operationDate: '2024-01-01', convertedAmount: 100 }),
        makeOp({ operationDate: '2024-02-01', convertedAmount: 200 }),
      ];
      const result = getProjectedDate(ops, 5000, 600, false);
      expect(result).not.toBeNull();
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{4}$/);
    });

    it('handles DECREASE operations in cumulative total', () => {
      const ops = [
        makeOp({ operationDate: '2024-01-01', type: 'INCREASE', convertedAmount: 500 }),
        makeOp({ operationDate: '2024-02-01', type: 'DECREASE', convertedAmount: 100 }),
        makeOp({ operationDate: '2024-03-01', type: 'INCREASE', convertedAmount: 600 }),
      ];
      // Cumulative: 500, 400, 1000 - still positive overall
      const result = getProjectedDate(ops, 10000, 1000, false);
      expect(result).not.toBeNull();
    });
  });
});
