import { act } from '@testing-library/react';
import { renderHook } from '@/__tests__/test-utils';
import { useDashboardActions } from '../useDashboardActions';
import { mockGoal, mockCompletedGoal } from '@/__tests__/mock-data';

jest.mock('@/shared/lib/analytics', () => ({ trackEvent: jest.fn() }));
jest.mock('@/features/dashboard/utils/goalUtils', () => ({
  buildGoalFromDetails: jest.fn((g) => g),
}));

const makeGoalsApi = (overrides = {}) => ({
  createGoal: jest.fn().mockResolvedValue(null),
  editGoal: jest.fn().mockResolvedValue(null),
  deleteGoal: jest.fn().mockResolvedValue(undefined),
  completeGoal: jest.fn().mockResolvedValue(undefined),
  refetchGoals: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const makeDetailsApi = (overrides = {}) => ({
  selectedGoal: null,
  addOperation: jest.fn().mockResolvedValue(null),
  editOperation: jest.fn().mockResolvedValue(null),
  deleteOperation: jest.fn().mockResolvedValue(undefined),
  refetchGoalDetails: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const makeEditGoalForm = (overrides = {}) => ({
  title: 'Edited Goal',
  targetAmount: 5000,
  initialAmount: 500,
  color: '#ff0000',
  isValid: true,
  setTitle: jest.fn(),
  setTargetAmount: jest.fn(),
  setInitialAmount: jest.fn(),
  setColor: jest.fn(),
  reset: jest.fn(),
  loadFromGoal: jest.fn(),
  ...overrides,
});

const makeOperationForm = (overrides = {}) => ({
  operationType: 'INCREASE' as const,
  operationAmount: 500 as number | "",
  operationNote: 'test note',
  operationDate: '2024-01-01',
  editingOperationId: null,
  setOperationType: jest.fn(),
  setOperationAmount: jest.fn(),
  setOperationNote: jest.fn(),
  setOperationDate: jest.fn(),
  reset: jest.fn(),
  startEdit: jest.fn(),
  ...overrides,
});

const makeDefaultDeps = (overrides: Record<string, unknown> = {}) => ({
  goals: [mockGoal, mockCompletedGoal],
  selectedGoalId: null,
  setSelectedGoalId: jest.fn(),
  setGoalStatusTab: jest.fn(),
  setIsDetailsDrawerOpen: jest.fn(),
  isMobile: false,
  goalsApi: makeGoalsApi(),
  detailsApi: makeDetailsApi(),
  editGoalForm: makeEditGoalForm(),
  operationForm: makeOperationForm(),
  ...overrides,
});

describe('useDashboardActions', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('handleSelectGoal', () => {
    it('sets selectedGoalId', () => {
      const setSelectedGoalId = jest.fn();
      const { result } = renderHook(() => useDashboardActions(makeDefaultDeps({ setSelectedGoalId })));
      act(() => { result.current.handleSelectGoal(mockGoal.id); });
      expect(setSelectedGoalId).toHaveBeenCalledWith(mockGoal.id);
    });

    it('sets tab to completed for completed goal', () => {
      const setGoalStatusTab = jest.fn();
      const { result } = renderHook(() => useDashboardActions(makeDefaultDeps({ setGoalStatusTab })));
      act(() => { result.current.handleSelectGoal(mockCompletedGoal.id); });
      expect(setGoalStatusTab).toHaveBeenCalledWith('completed');
    });

    it('sets tab to active for active goal', () => {
      const setGoalStatusTab = jest.fn();
      const { result } = renderHook(() => useDashboardActions(makeDefaultDeps({ setGoalStatusTab })));
      act(() => { result.current.handleSelectGoal(mockGoal.id); });
      expect(setGoalStatusTab).toHaveBeenCalledWith('active');
    });

    it('opens drawer on mobile', () => {
      const setIsDetailsDrawerOpen = jest.fn();
      const { result } = renderHook(() => useDashboardActions(makeDefaultDeps({ isMobile: true, setIsDetailsDrawerOpen })));
      act(() => { result.current.handleSelectGoal(mockGoal.id); });
      expect(setIsDetailsDrawerOpen).toHaveBeenCalledWith(true);
    });

    it('does not open drawer on desktop', () => {
      const setIsDetailsDrawerOpen = jest.fn();
      const { result } = renderHook(() => useDashboardActions(makeDefaultDeps({ isMobile: false, setIsDetailsDrawerOpen })));
      act(() => { result.current.handleSelectGoal(mockGoal.id); });
      expect(setIsDetailsDrawerOpen).not.toHaveBeenCalled();
    });
  });

  describe('handleCreateGoal', () => {
    it('calls createGoal with correct args', async () => {
      const goalsApi = makeGoalsApi();
      const { result } = renderHook(() => useDashboardActions(makeDefaultDeps({ goalsApi })));
      await act(async () => {
        await result.current.handleCreateGoal({ title: 'New Goal', targetAmount: 1000, initialAmount: 100, color: '#ff0000' });
      });
      expect(goalsApi.createGoal).toHaveBeenCalledWith({ title: 'New Goal', targetAmount: 1000, initialAmount: 100, color: '#ff0000' });
    });

    it('does not call createGoal with empty title', async () => {
      const goalsApi = makeGoalsApi();
      const { result } = renderHook(() => useDashboardActions(makeDefaultDeps({ goalsApi })));
      await act(async () => {
        await result.current.handleCreateGoal({ title: '  ', targetAmount: 1000, initialAmount: 0, color: '#ff0000' });
      });
      expect(goalsApi.createGoal).not.toHaveBeenCalled();
    });

    it('does not call createGoal with zero target', async () => {
      const goalsApi = makeGoalsApi();
      const { result } = renderHook(() => useDashboardActions(makeDefaultDeps({ goalsApi })));
      await act(async () => {
        await result.current.handleCreateGoal({ title: 'Goal', targetAmount: 0, initialAmount: 0, color: '#ff0000' });
      });
      expect(goalsApi.createGoal).not.toHaveBeenCalled();
    });
  });

  describe('handleStartEditGoal / handleConfirmEditGoal', () => {
    it('loads goal into editGoalForm on start', () => {
      const editGoalForm = makeEditGoalForm();
      const { result } = renderHook(() => useDashboardActions(makeDefaultDeps({ editGoalForm })));
      act(() => { result.current.handleStartEditGoal(mockGoal.id); });
      expect(editGoalForm.loadFromGoal).toHaveBeenCalledWith(mockGoal);
      expect(result.current.editingGoalId).toBe(mockGoal.id);
    });

    it('does nothing when goal not found', () => {
      const editGoalForm = makeEditGoalForm();
      const { result } = renderHook(() => useDashboardActions(makeDefaultDeps({ editGoalForm })));
      act(() => { result.current.handleStartEditGoal('nonexistent'); });
      expect(editGoalForm.loadFromGoal).not.toHaveBeenCalled();
    });

    it('calls editGoal and clears editingGoalId on confirm', async () => {
      const goalsApi = makeGoalsApi();
      const { result } = renderHook(() => useDashboardActions(makeDefaultDeps({ goalsApi })));
      act(() => { result.current.handleStartEditGoal(mockGoal.id); });
      await act(async () => { await result.current.handleConfirmEditGoal(); });
      expect(goalsApi.editGoal).toHaveBeenCalled();
      expect(result.current.editingGoalId).toBeNull();
    });

    it('does not call editGoal when form invalid', async () => {
      const goalsApi = makeGoalsApi();
      const editGoalForm = makeEditGoalForm({ isValid: false });
      const { result } = renderHook(() => useDashboardActions(makeDefaultDeps({ goalsApi, editGoalForm })));
      act(() => { result.current.handleStartEditGoal(mockGoal.id); });
      await act(async () => { await result.current.handleConfirmEditGoal(); });
      expect(goalsApi.editGoal).not.toHaveBeenCalled();
    });
  });

  describe('handleStartDeleteGoal / handleConfirmDeleteGoal', () => {
    it('sets deletingGoalId and title on start', () => {
      const { result } = renderHook(() => useDashboardActions(makeDefaultDeps()));
      act(() => { result.current.handleStartDeleteGoal(mockGoal.id); });
      expect(result.current.deletingGoalId).toBe(mockGoal.id);
      expect(result.current.deletingGoalTitle).toBe(mockGoal.title);
    });

    it('calls deleteGoal on confirm', async () => {
      const goalsApi = makeGoalsApi();
      const { result } = renderHook(() => useDashboardActions(makeDefaultDeps({ goalsApi })));
      act(() => { result.current.handleStartDeleteGoal(mockGoal.id); });
      await act(async () => { await result.current.handleConfirmDeleteGoal(); });
      expect(goalsApi.deleteGoal).toHaveBeenCalledWith(mockGoal.id);
    });

    it('clears selected goal when deleting selected goal', async () => {
      const setSelectedGoalId = jest.fn();
      const setIsDetailsDrawerOpen = jest.fn();
      const { result } = renderHook(() =>
        useDashboardActions(makeDefaultDeps({ selectedGoalId: mockGoal.id, setSelectedGoalId, setIsDetailsDrawerOpen }))
      );
      act(() => { result.current.handleStartDeleteGoal(mockGoal.id); });
      await act(async () => { await result.current.handleConfirmDeleteGoal(); });
      expect(setSelectedGoalId).toHaveBeenCalledWith(null);
      expect(setIsDetailsDrawerOpen).toHaveBeenCalledWith(false);
    });

    it('does nothing when no deletingGoalId', async () => {
      const goalsApi = makeGoalsApi();
      const { result } = renderHook(() => useDashboardActions(makeDefaultDeps({ goalsApi })));
      await act(async () => { await result.current.handleConfirmDeleteGoal(); });
      expect(goalsApi.deleteGoal).not.toHaveBeenCalled();
    });
  });

  describe('handleConfirmComplete', () => {
    it('does nothing when no pending goal', async () => {
      const goalsApi = makeGoalsApi();
      const { result } = renderHook(() => useDashboardActions(makeDefaultDeps({ goalsApi })));
      await act(async () => { await result.current.handleConfirmComplete(); });
      expect(goalsApi.completeGoal).not.toHaveBeenCalled();
    });

    it('calls completeGoal with pending goal id', async () => {
      const goalsApi = makeGoalsApi();
      const { result } = renderHook(() => useDashboardActions(makeDefaultDeps({ goalsApi })));
      act(() => { result.current.setPendingCompletionGoal(mockGoal); });
      await act(async () => { await result.current.handleConfirmComplete(); });
      expect(goalsApi.completeGoal).toHaveBeenCalledWith(mockGoal.id);
      expect(result.current.pendingCompletionGoal).toBeNull();
    });
  });

  describe('handleUpdateProgress', () => {
    it('does nothing when amount is empty', async () => {
      const detailsApi = makeDetailsApi();
      const operationForm = makeOperationForm({ operationAmount: "" as number | "" });
      const { result } = renderHook(() => useDashboardActions(makeDefaultDeps({ detailsApi, operationForm })));
      await act(async () => { await result.current.handleUpdateProgress(); });
      expect(detailsApi.addOperation).not.toHaveBeenCalled();
    });

    it('calls addOperation when no editingOperationId', async () => {
      const detailsApi = makeDetailsApi();
      const { result } = renderHook(() =>
        useDashboardActions(makeDefaultDeps({ detailsApi, selectedGoalId: mockGoal.id }))
      );
      await act(async () => { await result.current.handleUpdateProgress(); });
      expect(detailsApi.addOperation).toHaveBeenCalled();
    });

    it('calls editOperation when editingOperationId present', async () => {
      const detailsApi = makeDetailsApi();
      const operationForm = makeOperationForm({ editingOperationId: 'op-1' });
      const { result } = renderHook(() =>
        useDashboardActions(makeDefaultDeps({ detailsApi, operationForm, selectedGoalId: mockGoal.id }))
      );
      await act(async () => { await result.current.handleUpdateProgress(); });
      expect(detailsApi.editOperation).toHaveBeenCalled();
      expect(detailsApi.addOperation).not.toHaveBeenCalled();
    });
  });

  describe('handleDeleteOperation', () => {
    it('calls deleteOperation', async () => {
      const detailsApi = makeDetailsApi();
      const { result } = renderHook(() => useDashboardActions(makeDefaultDeps({ detailsApi })));
      await act(async () => { await result.current.handleDeleteOperation('op-1'); });
      expect(detailsApi.deleteOperation).toHaveBeenCalledWith('op-1');
    });

    it('resets operationForm when deleting currently edited operation', async () => {
      const detailsApi = makeDetailsApi();
      const operationForm = makeOperationForm({ editingOperationId: 'op-1' });
      const { result } = renderHook(() => useDashboardActions(makeDefaultDeps({ detailsApi, operationForm })));
      await act(async () => { await result.current.handleDeleteOperation('op-1'); });
      expect(operationForm.reset).toHaveBeenCalled();
    });
  });
});
