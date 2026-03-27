import type { Goal } from '@/features/dashboard/types';

export const mockGoal: Goal = {
  id: '1',
  title: 'Emergency Fund',
  targetAmount: 10000,
  currentAmount: 5000,
  initialAmount: 1000,
  color: '#228be6',
  isCompleted: false,
  sortOrder: 0,
  progress: 50,
  createdAt: '2024-01-01T00:00:00.000Z',
};

export const mockCompletedGoal: Goal = {
  id: '2',
  title: 'Vacation Fund',
  targetAmount: 5000,
  currentAmount: 5000,
  initialAmount: 0,
  color: '#40c057',
  isCompleted: true,
  sortOrder: 1,
  progress: 100,
  completedAt: '2024-01-15T00:00:00.000Z',
  createdAt: '2024-01-01T00:00:00.000Z',
};

export const mockGoals: Goal[] = [mockGoal, mockCompletedGoal];

export const mockOperation = {
  id: '1',
  type: 'income',
  amount: 1000,
  note: 'Salary',
  date: '2024-01-01',
  createdAt: '2024-01-01T00:00:00.000Z',
};

export const mockOperations = [
  mockOperation,
  {
    id: '2',
    type: 'expense',
    amount: 500,
    note: 'Rent',
    date: '2024-01-02',
    createdAt: '2024-01-02T00:00:00.000Z',
  },
];
