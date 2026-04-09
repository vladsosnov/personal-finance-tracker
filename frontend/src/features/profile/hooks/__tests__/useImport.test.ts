import { renderHook, act, waitFor } from '@/__tests__/test-utils';
import { useImport } from '../useImport';
import { IMPORT_GOALS } from '@/features/dashboard/gql/dashboard';
import { prepareImportGoals } from '@/features/profile/utils/prepareImport';
import { showToast } from '@/shared/lib/toast-store';
import { trackEvent } from '@/shared/lib/analytics';
import type { MockedResponse } from '@apollo/client/testing';
import type { PreparedImportGoal, PreparedImportResult } from '@/features/profile/types';

jest.mock('@/shared/lib/toast-store', () => ({ showToast: jest.fn() }));
jest.mock('@/shared/lib/analytics', () => ({ trackEvent: jest.fn() }));
jest.mock('@/features/profile/utils/prepareImport', () => ({
  prepareImportGoals: jest.fn(),
}));

// Polyfill File.prototype.text for JSDOM
if (!File.prototype.text) {
  File.prototype.text = function () {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(this);
    });
  };
}

const mockPreparedGoal: PreparedImportGoal = {
  sourceIndex: 0,
  title: 'Emergency Fund',
  targetAmount: 10000,
  initialAmount: 500,
  currency: 'USD',
  color: '#228be6',
  operationCount: 2,
  operations: [
    { type: 'INCREASE', amount: 500, operationDate: '2024-01-15' },
    { type: 'INCREASE', amount: 300, operationDate: '2024-02-15' },
  ],
  canRemoveFromImport: true,
};

const mockPrepareResult: PreparedImportResult = {
  goals: [mockPreparedGoal],
  skippedGoals: [],
};

const emptyPrepareResult: PreparedImportResult = {
  goals: [],
  skippedGoals: [],
};

/** Helper: create a File with working .text() in JSDOM */
const makeFile = (content: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  return new File([blob], 'test.txt', { type: 'text/plain' });
};

/** Helper: set a file and wait for preview to finish */
const loadFile = async (result: { current: ReturnType<typeof useImport> }, content = '[]') => {
  const file = makeFile(content);
  await act(async () => {
    result.current.handleFileChange(file);
    // Give the async previewImportFile time to resolve
    await new Promise((r) => setTimeout(r, 0));
  });
};

describe('useImport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prepareImportGoals as jest.Mock).mockReturnValue(mockPrepareResult);
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useImport('Free', 0));

    expect(result.current.file).toBeNull();
    expect(result.current.preparedGoals).toEqual([]);
    expect(result.current.skippedGoals).toEqual([]);
    expect(result.current.isImporting).toBe(false);
    expect(result.current.isPreparingImport).toBe(false);
    expect(result.current.importProgress).toBeNull();
    expect(result.current.importProgressValue).toBe(0);
  });

  describe('handleFileChange', () => {
    it('parses file and sets prepared goals', async () => {
      const { result } = renderHook(() => useImport('Free', 0));

      await loadFile(result);

      expect(prepareImportGoals).toHaveBeenCalled();
      expect(result.current.preparedGoals.length).toBe(1);
      expect(result.current.importTotals).toEqual({ goals: 1, operations: 2 });
    });

    it('resets state when file is null', async () => {
      const { result } = renderHook(() => useImport('Free', 0));

      await loadFile(result);
      expect(result.current.preparedGoals.length).toBe(1);

      await act(async () => {
        result.current.handleFileChange(null);
      });

      expect(result.current.preparedGoals).toEqual([]);
      expect(result.current.skippedGoals).toEqual([]);
    });

    it('shows toast when no goals found', async () => {
      (prepareImportGoals as jest.Mock).mockReturnValue(emptyPrepareResult);

      const { result } = renderHook(() => useImport('Free', 0));

      await loadFile(result);

      expect(showToast).toHaveBeenCalledWith('No goals found in the selected file', 'red');
    });

    it('shows toast when only skipped goals found', async () => {
      (prepareImportGoals as jest.Mock).mockReturnValue({
        goals: [],
        skippedGoals: [{ sourceIndex: 0, title: 'Bad Goal', reason: 'Invalid', canInclude: false }],
      });

      const { result } = renderHook(() => useImport('Free', 0));

      await loadFile(result);

      expect(showToast).toHaveBeenCalledWith('No valid goals found in the selected file', 'red');
    });
  });

  describe('import limit', () => {
    it('detects over-limit for Free plan', async () => {
      (prepareImportGoals as jest.Mock).mockReturnValue({
        goals: [mockPreparedGoal, { ...mockPreparedGoal, sourceIndex: 1, title: 'Goal 2' }],
        skippedGoals: [],
      });

      // Free plan maxGoals=3, existing=2, importing 2 → over limit
      const { result } = renderHook(() => useImport('Free', 2));

      await loadFile(result);

      await waitFor(() => {
        expect(result.current.preparedGoals.length).toBe(2);
      });

      expect(result.current.isImportOverLimit).toBe(true);
      expect(result.current.importLimitMessage).toMatch(/free plan is limited/i);
    });

    it('is not over limit for Pro plan', async () => {
      const { result } = renderHook(() => useImport('Pro', 10));

      await loadFile(result);

      expect(result.current.isImportOverLimit).toBe(false);
      expect(result.current.importLimitMessage).toBeNull();
    });
  });

  describe('handleToggleZeroTargetGoal', () => {
    it('re-prepares import with updated included indexes', async () => {
      const { result } = renderHook(() => useImport('Free', 0));

      await loadFile(result);
      expect(prepareImportGoals).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.handleToggleZeroTargetGoal(2, true);
      });

      expect(prepareImportGoals).toHaveBeenCalledTimes(2);
    });

    it('does nothing when no import source loaded', () => {
      const { result } = renderHook(() => useImport('Free', 0));

      act(() => {
        result.current.handleToggleZeroTargetGoal(0, true);
      });

      expect(prepareImportGoals).not.toHaveBeenCalled();
    });
  });

  describe('handleRemoveFromImport', () => {
    it('re-prepares import with excluded index', async () => {
      const { result } = renderHook(() => useImport('Free', 0));

      await loadFile(result);
      expect(prepareImportGoals).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.handleRemoveFromImport(0);
      });

      expect(prepareImportGoals).toHaveBeenCalledTimes(2);
    });

    it('does nothing when no import source loaded', () => {
      const { result } = renderHook(() => useImport('Free', 0));

      act(() => {
        result.current.handleRemoveFromImport(0);
      });

      expect(prepareImportGoals).not.toHaveBeenCalled();
    });
  });

  describe('handleImport', () => {
    it('shows error when no prepared goals', async () => {
      (prepareImportGoals as jest.Mock).mockReturnValue(emptyPrepareResult);

      const { result } = renderHook(() => useImport('Free', 0));
      const refetchGoals = jest.fn().mockResolvedValue(undefined);

      await act(async () => {
        await result.current.handleImport(refetchGoals);
      });

      expect(showToast).toHaveBeenCalledWith('Prepare the file before importing', 'red');
      expect(trackEvent).not.toHaveBeenCalled();
    });

    it('calls mutation and shows success toast', async () => {
      const importMock: MockedResponse = {
        request: {
          query: IMPORT_GOALS,
          variables: {
            goals: [{
              title: 'Emergency Fund',
              targetAmount: 10000,
              initialAmount: 500,
              currency: 'USD',
              color: '#228be6',
              operations: mockPreparedGoal.operations,
            }],
          },
        },
        result: {
          data: { importGoals: { importedGoalsCount: 1, importedOperationsCount: 2 } },
        },
      };

      const { result } = renderHook(() => useImport('Free', 0), {
        mocks: [importMock],
      });

      await loadFile(result);

      await waitFor(() => {
        expect(result.current.preparedGoals.length).toBe(1);
      });

      const refetchGoals = jest.fn().mockResolvedValue(undefined);

      await act(async () => {
        await result.current.handleImport(refetchGoals);
      });

      expect(trackEvent).toHaveBeenCalledWith('data_imported');
      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith(
          'Imported 1 goals and 2 operations.',
          'teal'
        );
      });
    });
  });

  describe('resetImportState', () => {
    it('clears all import-related state', async () => {
      const { result } = renderHook(() => useImport('Free', 0));

      await loadFile(result);
      expect(result.current.preparedGoals.length).toBe(1);

      act(() => {
        result.current.resetImportState();
      });

      expect(result.current.preparedGoals).toEqual([]);
      expect(result.current.skippedGoals).toEqual([]);
      expect(result.current.importProgress).toBeNull();
    });
  });
});
