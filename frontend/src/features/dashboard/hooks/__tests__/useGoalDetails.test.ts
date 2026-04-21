import { renderHook, act, waitFor } from '@/__tests__/test-utils';
import { useGoalDetails } from '../useGoalDetails';
import {
  ADD_GOAL_OPERATIONS,
  GET_GOAL_DETAILS,
  EDIT_GOAL_OPERATION,
  DELETE_GOAL_OPERATION,
} from '@/features/dashboard/gql/dashboard';
import type { MockedResponse } from '@apollo/client/testing';
import type { GoalDetails } from '@/features/dashboard/types';
import { showToast } from '@/shared/lib/toast-store';

jest.mock('@/shared/lib/toast-store', () => ({
  showToast: jest.fn(),
}));

const mockGoalDetails: GoalDetails & { __typename: string } = {
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
  operations: [
    {
      id: 'op1',
      type: 'INCREASE',
      amount: 500,
      currency: 'USD',
      convertedAmount: 500,
      operationDate: '2024-01-15',
      createdAt: '2024-01-15T10:00:00Z',
    },
  ],
};

const detailsMock = (): MockedResponse => ({
  request: { query: GET_GOAL_DETAILS, variables: { id: '1' } },
  result: { data: { goal: mockGoalDetails } },
});

describe('useGoalDetails', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null selectedGoal when no id provided', () => {
    const { result } = renderHook(() => useGoalDetails(null));

    expect(result.current.selectedGoal).toBeNull();
    expect(result.current.isLoadingGoalDetails).toBe(false);
  });

  it('fetches goal details when id is provided', async () => {
    const { result } = renderHook(() => useGoalDetails('1'), {
      mocks: [detailsMock()],
    });

    expect(result.current.isLoadingGoalDetails).toBe(true);

    await waitFor(() => {
      expect(result.current.selectedGoal).not.toBeNull();
    });

    expect(result.current.selectedGoal?.id).toBe('1');
    expect(result.current.selectedGoal?.title).toBe('Emergency Fund');
  });

  it('returns null when query errors', async () => {
    const errorMock: MockedResponse = {
      request: { query: GET_GOAL_DETAILS, variables: { id: '1' } },
      error: new Error('Network error'),
    };

    const { result } = renderHook(() => useGoalDetails('1'), {
      mocks: [errorMock],
    });

    await waitFor(() => {
      expect(result.current.goalDetailsError).toBeDefined();
    });

    expect(result.current.selectedGoal).toBeNull();
  });

  describe('addOperations', () => {
    it('calls mutation and returns updated goal', async () => {
      const updatedGoal = { ...mockGoalDetails, currentAmount: 5500, progress: 55 };
      const addMock: MockedResponse = {
        request: {
          query: ADD_GOAL_OPERATIONS,
          variables: {
            goalId: '1',
            operations: [
              {
                type: 'INCREASE',
                amount: 500,
                currency: 'USD',
                operationDate: '2024-02-01',
              },
            ],
          },
        },
        result: { data: { addGoalOperations: updatedGoal } },
      };

      const { result } = renderHook(() => useGoalDetails('1'), {
        mocks: [detailsMock(), addMock, detailsMock()],
      });

      await waitFor(() => {
        expect(result.current.selectedGoal).not.toBeNull();
      });

      let addResult: GoalDetails | null | undefined;
      await act(async () => {
        addResult = await result.current.addOperations({
          goalId: '1',
          operations: [
            {
              type: 'INCREASE',
              amount: 500,
              currency: 'USD',
              operationDate: '2024-02-01',
            },
          ],
        });
      });

      expect(addResult?.currentAmount).toBe(5500);
    });
  });

  describe('editOperation', () => {
    it('calls mutation and returns updated goal', async () => {
      const updatedGoal = { ...mockGoalDetails, currentAmount: 6000 };
      const editMock: MockedResponse = {
        request: {
          query: EDIT_GOAL_OPERATION,
          variables: {
            operationId: 'op1',
            type: 'INCREASE',
            amount: 1000,
            currency: 'USD',
            operationDate: '2024-01-15',
          },
        },
        result: { data: { editGoalOperation: updatedGoal } },
      };

      const { result } = renderHook(() => useGoalDetails('1'), {
        mocks: [detailsMock(), editMock, detailsMock()],
      });

      await waitFor(() => {
        expect(result.current.selectedGoal).not.toBeNull();
      });

      let editResult: GoalDetails | null | undefined;
      await act(async () => {
        editResult = await result.current.editOperation({
          operationId: 'op1',
          type: 'INCREASE',
          amount: 1000,
          currency: 'USD',
          operationDate: '2024-01-15',
        });
      });

      expect(editResult?.currentAmount).toBe(6000);
    });
  });

  describe('deleteOperation', () => {
    it('calls mutation successfully', async () => {
      const updatedGoal = { ...mockGoalDetails, currentAmount: 4500, operations: [] };
      const deleteMock: MockedResponse = {
        request: {
          query: DELETE_GOAL_OPERATION,
          variables: { operationId: 'op1' },
        },
        result: { data: { deleteGoalOperation: updatedGoal } },
      };

      const { result } = renderHook(() => useGoalDetails('1'), {
        mocks: [detailsMock(), deleteMock],
      });

      await waitFor(() => {
        expect(result.current.selectedGoal).not.toBeNull();
      });

      await act(async () => {
        await result.current.deleteOperation('op1');
      });

      expect(showToast).not.toHaveBeenCalled();
    });
  });
});
