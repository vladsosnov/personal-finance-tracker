import { prepareImportGoals } from '../prepareImport';
import { DEFAULT_GOAL_COLOR } from '@/shared/constants/goal-colors';

describe('prepareImport', () => {
  describe('prepareImportGoals', () => {
    it('parses valid goal data', () => {
      const source = JSON.stringify([
        {
          title: 'Emergency Fund',
          targetValue: 10000,
          initialValue: 1000,
          history: [],
        },
      ]);

      const result = prepareImportGoals(source, new Set());

      expect(result.goals).toHaveLength(1);
      expect(result.goals[0]).toMatchObject({
        title: 'Emergency Fund',
        targetAmount: 10000,
        initialAmount: 1000,
        operationCount: 0,
      });
    });

    it('throws error for non-array input', () => {
      const source = JSON.stringify({ goals: [] });

      expect(() => prepareImportGoals(source, new Set())).toThrow(
        'Import file must contain an array of goals'
      );
    });

    it('assigns default title when missing', () => {
      const source = JSON.stringify([
        { targetValue: 5000, initialValue: 0 },
        { title: '', targetValue: 3000, initialValue: 0 },
      ]);

      const result = prepareImportGoals(source, new Set());

      expect(result.goals[0].title).toBe('Goal 1');
      expect(result.goals[1].title).toBe('Goal 2');
    });

    it('uses default color when color is missing', () => {
      const source = JSON.stringify([{ title: 'Test', targetValue: 1000 }]);

      const result = prepareImportGoals(source, new Set());

      expect(result.goals[0].color).toBe(DEFAULT_GOAL_COLOR);
    });

    it('normalizes valid hex colors', () => {
      const source = JSON.stringify([
        {
          title: 'Goal 1',
          targetValue: 1000,
          display: { bar: { colors: { primary: '#FF5733' } } },
        },
        {
          title: 'Goal 2',
          targetValue: 1000,
          display: { bar: { colors: { primary: 'ABC123' } } },
        },
      ]);

      const result = prepareImportGoals(source, new Set());

      expect(result.goals[0].color).toBe('#FF5733');
      expect(result.goals[1].color).toBe('#ABC123');
    });

    it('uses default color for invalid hex values', () => {
      const source = JSON.stringify([
        {
          title: 'Test',
          targetValue: 1000,
          display: { bar: { colors: { primary: 'not-a-color' } } },
        },
      ]);

      const result = prepareImportGoals(source, new Set());

      expect(result.goals[0].color).toBe(DEFAULT_GOAL_COLOR);
    });

    it('skips goals with invalid target amount', () => {
      const source = JSON.stringify([
        { title: 'Valid', targetValue: 1000 },
        { title: 'Invalid', targetValue: null },
        { title: 'Negative', targetValue: -100 },
      ]);

      const result = prepareImportGoals(source, new Set());

      expect(result.goals).toHaveLength(1);
      expect(result.skippedGoals).toHaveLength(2);
      expect(result.skippedGoals[0].reason).toBe('Target amount is missing or zero');
      expect(result.skippedGoals[1].reason).toBe('Target amount is invalid');
    });

    it('skips goals with zero target unless explicitly included', () => {
      const source = JSON.stringify([
        { title: 'Zero Target', targetValue: 0 },
        { title: 'Valid', targetValue: 1000 },
      ]);

      const result = prepareImportGoals(source, new Set());

      expect(result.goals).toHaveLength(1);
      expect(result.goals[0].title).toBe('Valid');
      expect(result.skippedGoals).toHaveLength(1);
      expect(result.skippedGoals[0].reason).toBe('Target amount is missing or zero');
      expect(result.skippedGoals[0].canInclude).toBe(true);
    });

    it('includes zero target goals when explicitly included', () => {
      const source = JSON.stringify([{ title: 'Zero Target', targetValue: 0 }]);

      const result = prepareImportGoals(source, new Set([0]));

      expect(result.goals).toHaveLength(1);
      expect(result.goals[0].title).toBe('Zero Target');
    });

    it('skips goals with invalid initial amount', () => {
      const source = JSON.stringify([
        { title: 'Negative Initial', targetValue: 1000, initialValue: -100 },
      ]);

      const result = prepareImportGoals(source, new Set());

      expect(result.goals).toHaveLength(0);
      expect(result.skippedGoals).toHaveLength(1);
      expect(result.skippedGoals[0].reason).toBe('Starting amount is invalid');
    });

    it('converts history to operations', () => {
      const source = JSON.stringify([
        {
          title: 'Test',
          targetValue: 5000,
          initialValue: 1000,
          history: [
            { date: '2024-01-15', value: 1500, note: 'Added' },
            { date: '2024-01-20', value: 1200, note: 'Spent' },
          ],
        },
      ]);

      const result = prepareImportGoals(source, new Set());

      expect(result.goals[0].operations).toHaveLength(2);
      expect(result.goals[0].operations[0]).toMatchObject({
        type: 'INCREASE',
        amount: 500,
        note: 'Added',
        operationDate: '2024-01-15',
      });
      expect(result.goals[0].operations[1]).toMatchObject({
        type: 'DECREASE',
        amount: 300,
        note: 'Spent',
        operationDate: '2024-01-20',
      });
    });

    it('sorts history by timestamp', () => {
      const source = JSON.stringify([
        {
          title: 'Test',
          targetValue: 3000,
          initialValue: 1000,
          history: [
            { date: '2024-01-20', value: 1500 },
            { date: '2024-01-10', value: 1200 },
            { date: '2024-01-15', value: 1300 },
          ],
        },
      ]);

      const result = prepareImportGoals(source, new Set());

      expect(result.goals[0].operations[0].operationDate).toBe('2024-01-10');
      expect(result.goals[0].operations[1].operationDate).toBe('2024-01-15');
      expect(result.goals[0].operations[2].operationDate).toBe('2024-01-20');
    });

    it('skips operations with zero delta', () => {
      const source = JSON.stringify([
        {
          title: 'Test',
          targetValue: 2000,
          initialValue: 1000,
          history: [
            { date: '2024-01-15', value: 1000 },
            { date: '2024-01-20', value: 1500 },
          ],
        },
      ]);

      const result = prepareImportGoals(source, new Set());

      expect(result.goals[0].operations).toHaveLength(1);
      expect(result.goals[0].operations[0].amount).toBe(500);
    });

    it('skips goals with invalid history entries', () => {
      const source = JSON.stringify([
        {
          title: 'Invalid History',
          targetValue: 1000,
          history: [{ date: 'invalid-date', value: 500 }],
        },
      ]);

      const result = prepareImportGoals(source, new Set());

      expect(result.goals).toHaveLength(0);
      expect(result.skippedGoals).toHaveLength(1);
      expect(result.skippedGoals[0].reason).toBe('History item 1 is invalid');
    });

    it('handles empty history array', () => {
      const source = JSON.stringify([
        { title: 'No History', targetValue: 1000, history: [] },
      ]);

      const result = prepareImportGoals(source, new Set());

      expect(result.goals[0].operations).toHaveLength(0);
    });

    it('handles missing history field', () => {
      const source = JSON.stringify([{ title: 'No History Field', targetValue: 1000 }]);

      const result = prepareImportGoals(source, new Set());

      expect(result.goals[0].operations).toHaveLength(0);
    });

    it('excludes goals by index', () => {
      const source = JSON.stringify([
        { title: 'Goal 1', targetValue: 1000 },
        { title: 'Goal 2', targetValue: 2000 },
        { title: 'Goal 3', targetValue: 3000 },
      ]);

      const result = prepareImportGoals(source, new Set(), new Set([1]));

      expect(result.goals).toHaveLength(2);
      expect(result.goals[0].title).toBe('Goal 1');
      expect(result.goals[1].title).toBe('Goal 3');
      expect(result.skippedGoals).toHaveLength(1);
      expect(result.skippedGoals[0].reason).toBe('Removed by user');
      expect(result.skippedGoals[0].canInclude).toBe(true);
    });

    it('trims whitespace from notes', () => {
      const source = JSON.stringify([
        {
          title: 'Test',
          targetValue: 1000,
          initialValue: 500,
          history: [{ date: '2024-01-15', value: 800, note: '  Note with spaces  ' }],
        },
      ]);

      const result = prepareImportGoals(source, new Set());

      expect(result.goals[0].operations[0].note).toBe('Note with spaces');
    });

    it('omits empty notes', () => {
      const source = JSON.stringify([
        {
          title: 'Test',
          targetValue: 1000,
          initialValue: 500,
          history: [
            { date: '2024-01-15', value: 800, note: '' },
            { date: '2024-01-20', value: 900 },
          ],
        },
      ]);

      const result = prepareImportGoals(source, new Set());

      expect(result.goals[0].operations[0].note).toBeUndefined();
      expect(result.goals[0].operations[1].note).toBeUndefined();
    });

    it('rounds operation amounts to 2 decimal places', () => {
      const source = JSON.stringify([
        {
          title: 'Test',
          targetValue: 1000,
          initialValue: 100.12,
          history: [{ date: '2024-01-15', value: 100.456 }],
        },
      ]);

      const result = prepareImportGoals(source, new Set());

      expect(result.goals[0].operations[0].amount).toBe(0.34);
    });

    it('sets canRemoveFromImport to true for all goals', () => {
      const source = JSON.stringify([
        { title: 'Goal 1', targetValue: 1000 },
        { title: 'Goal 2', targetValue: 2000 },
      ]);

      const result = prepareImportGoals(source, new Set());

      result.goals.forEach((goal) => {
        expect(goal.canRemoveFromImport).toBe(true);
      });
    });

    it('preserves source index for all goals', () => {
      const source = JSON.stringify([
        { title: 'Goal 1', targetValue: 1000 },
        { title: 'Goal 2', targetValue: 2000 },
        { title: 'Goal 3', targetValue: 3000 },
      ]);

      const result = prepareImportGoals(source, new Set());

      expect(result.goals[0].sourceIndex).toBe(0);
      expect(result.goals[1].sourceIndex).toBe(1);
      expect(result.goals[2].sourceIndex).toBe(2);
    });

    it('defaults initial amount to 0 when missing', () => {
      const source = JSON.stringify([{ title: 'Test', targetValue: 1000 }]);

      const result = prepareImportGoals(source, new Set());

      expect(result.goals[0].initialAmount).toBe(0);
    });
  });
});
