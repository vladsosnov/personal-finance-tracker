import { buildGoalFromDetails } from '../goalUtils';
import type { GoalDetails } from '@/features/dashboard/types';

describe('goalUtils', () => {
  describe('buildGoalFromDetails', () => {
    it('extracts Goal fields from GoalDetails', () => {
      const goalDetails: GoalDetails = {
        id: '1',
        title: 'Emergency Fund',
        targetAmount: 10000,
        initialAmount: 1000,
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
});
