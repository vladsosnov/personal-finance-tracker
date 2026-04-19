import { renderHook, act, waitFor } from '@/__tests__/test-utils';
import { useGoals } from '../useGoals';
import {
  GET_GOALS,
  CREATE_GOAL,
  EDIT_GOAL,
  DELETE_GOAL,
  COMPLETE_GOAL,
  REORDER_GOALS,
} from '@/features/dashboard/gql/dashboard';
import type { MockedResponse } from '@apollo/client/testing';
import type { Goal } from '@/features/dashboard/types';
import { showToast } from '@/shared/lib/toast-store';

jest.mock('@/shared/lib/toast-store', () => ({
  showToast: jest.fn(),
}));

const activeGoal: Goal & { __typename: string } = {
  __typename: 'Goal',
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
  operations: [],
};

const activeGoal2: Goal & { __typename: string } = {
  __typename: 'Goal',
  id: '3',
  title: 'Car Fund',
  targetAmount: 20000,
  initialAmount: 0,
  currency: 'USD',
  color: '#f06595',
  sortOrder: 1,
  isCompleted: false,
  currentAmount: 3000,
  progress: 15,
  createdAt: '2024-02-01T00:00:00.000Z',
  operations: [],
};

const completedGoal: Goal & { __typename: string } = {
  __typename: 'Goal',
  id: '2',
  title: 'Vacation Fund',
  targetAmount: 5000,
  initialAmount: 0,
  currency: 'USD',
  color: '#40c057',
  sortOrder: 2,
  isCompleted: true,
  completedAt: '2024-01-15T00:00:00.000Z',
  currentAmount: 5000,
  progress: 100,
  createdAt: '2024-01-01T00:00:00.000Z',
  operations: [],
};

const allGoals = [activeGoal, activeGoal2, completedGoal];

const goalsMock = (): MockedResponse => ({
  request: { query: GET_GOALS },
  result: { data: { goals: allGoals } },
});

describe('useGoals', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads goals and splits active/completed', async () => {
    const { result } = renderHook(() => useGoals(), { mocks: [goalsMock()] });

    await waitFor(() => {
      expect(result.current.goals.length).toBe(3);
    });

    expect(result.current.activeGoals.length).toBe(2);
    expect(result.current.completedGoals.length).toBe(1);
    expect(result.current.isLoadingGoals).toBe(false);
  });

  it('returns empty arrays when no goals', async () => {
    const emptyMock: MockedResponse = {
      request: { query: GET_GOALS },
      result: { data: { goals: [] } },
    };

    const { result } = renderHook(() => useGoals(), { mocks: [emptyMock] });

    await waitFor(() => {
      expect(result.current.isLoadingGoals).toBe(false);
    });

    expect(result.current.goals).toEqual([]);
    expect(result.current.activeGoals).toEqual([]);
    expect(result.current.completedGoals).toEqual([]);
  });

  it('exposes loading and error states', () => {
    const { result } = renderHook(() => useGoals(), { mocks: [goalsMock()] });

    expect(result.current.isLoadingGoals).toBe(true);
    expect(result.current.goalsError).toBeUndefined();
  });

  describe('createGoal', () => {
    it('calls mutation with trimmed title', async () => {
      const createMock: MockedResponse = {
        request: {
          query: CREATE_GOAL,
          variables: {
            title: 'New Goal',
            targetAmount: 5000,
            initialAmount: 0,
            color: '#228be6',
            currency: 'USD',
          },
        },
        result: { data: { createGoal: { id: '4' } } },
      };

      const { result } = renderHook(() => useGoals(), {
        mocks: [goalsMock(), createMock, goalsMock()],
      });

      await waitFor(() => {
        expect(result.current.goals.length).toBe(3);
      });

      await act(async () => {
        await result.current.createGoal({
          title: '  New Goal  ',
          targetAmount: 5000,
          initialAmount: 0,
          color: '#228be6',
          currency: 'USD',
        });
      });

      expect(showToast).not.toHaveBeenCalled();
    });
  });

  describe('editGoal', () => {
    it('calls mutation and returns updated goal', async () => {
      const updatedGoal = { ...activeGoal, title: 'Updated Fund' };
      const editMock: MockedResponse = {
        request: {
          query: EDIT_GOAL,
          variables: {
            goalId: '1',
            title: 'Updated Fund',
            targetAmount: 10000,
            initialAmount: 1000,
            color: '#228be6',
            currency: 'USD',
          },
        },
        result: { data: { editGoal: updatedGoal } },
      };

      const { result } = renderHook(() => useGoals(), {
        mocks: [goalsMock(), editMock, goalsMock()],
      });

      await waitFor(() => {
        expect(result.current.goals.length).toBe(3);
      });

      let editResult: Goal | null | undefined;
      await act(async () => {
        editResult = await result.current.editGoal('1', {
          title: '  Updated Fund  ',
          targetAmount: 10000,
          initialAmount: 1000,
          color: '#228be6',
          currency: 'USD',
        });
      });

      expect(editResult?.title).toBe('Updated Fund');
    });
  });

  describe('deleteGoal', () => {
    it('calls mutation successfully', async () => {
      const deleteMock: MockedResponse = {
        request: { query: DELETE_GOAL, variables: { goalId: '1' } },
        result: { data: { deleteGoal: { id: '1' } } },
      };

      const { result } = renderHook(() => useGoals(), {
        mocks: [goalsMock(), deleteMock, goalsMock()],
      });

      await waitFor(() => {
        expect(result.current.goals.length).toBe(3);
      });

      await act(async () => {
        await result.current.deleteGoal('1');
      });

      expect(showToast).not.toHaveBeenCalled();
    });
  });

  describe('completeGoal', () => {
    it('calls mutation successfully', async () => {
      const completeMock: MockedResponse = {
        request: { query: COMPLETE_GOAL, variables: { goalId: '1' } },
        result: { data: { completeGoal: { ...activeGoal, isCompleted: true, operations: [] } } },
      };

      const { result } = renderHook(() => useGoals(), {
        mocks: [goalsMock(), completeMock, goalsMock()],
      });

      await waitFor(() => {
        expect(result.current.goals.length).toBe(3);
      });

      await act(async () => {
        await result.current.completeGoal('1');
      });

      expect(showToast).not.toHaveBeenCalled();
    });
  });

  describe('reorderGoals', () => {
    it('sets optimistic state and calls mutation', async () => {
      const reorderMock: MockedResponse = {
        request: {
          query: REORDER_GOALS,
          variables: { goalIds: ['3', '1', '2'] },
        },
        result: { data: { reorderGoals: [{ id: '3' }, { id: '1' }, { id: '2' }] } },
      };

      const { result } = renderHook(() => useGoals(), {
        mocks: [goalsMock(), reorderMock, goalsMock()],
      });

      await waitFor(() => {
        expect(result.current.goals.length).toBe(3);
      });

      await act(async () => {
        await result.current.reorderGoals('1', '3');
      });

      expect(showToast).not.toHaveBeenCalled();
    });

    it('does nothing when ids are not found', async () => {
      const { result } = renderHook(() => useGoals(), {
        mocks: [goalsMock()],
      });

      await waitFor(() => {
        expect(result.current.goals.length).toBe(3);
      });

      await act(async () => {
        await result.current.reorderGoals('nonexistent', '1');
      });

      expect(result.current.activeGoals[0].id).toBe('1');
    });
  });
});
