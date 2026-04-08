import { renderHook, act, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockedResponse } from '@apollo/client/testing';
import { useDataManagement } from '../useDataManagement';
import { EXPORT_ALL_DATA, GET_GOALS, RESET_ALL_DATA } from '@/features/dashboard/gql/dashboard';
import { GET_ME } from '@/shared/gql/queries';
import { showToast } from '@/shared/lib/toast-store';
import { trackEvent } from '@/shared/lib/analytics';

jest.mock('@/shared/lib/toast-store');
jest.mock('@/shared/lib/analytics');
jest.mock('@/features/profile/utils/prepareImport');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}));

global.fetch = jest.fn();
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

const mockMeData = {
  me: {
    __typename: 'User' as const,
    id: '1',
    email: 'test@example.com',
    subscription: 'Free',
    role: 'user',
    primaryCurrency: 'USD',
    emailVerified: true,
  },
};

const mockGoals = [
  {
    __typename: 'Goal' as const,
    id: '1',
    title: 'Goal 1',
    targetAmount: 1000,
    initialAmount: 0,
    currency: 'USD',
    color: '#228be6',
    sortOrder: 0,
    isCompleted: false,
    completedAt: null,
    currentAmount: 0,
    progress: 0,
    createdAt: '2025-01-01T00:00:00Z',
  },
];

describe('useDataManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    (showToast as jest.Mock).mockClear();
    (trackEvent as jest.Mock).mockClear();
  });

  const createWrapper = (mockResponses: readonly MockedResponse[]) => {
    // eslint-disable-next-line react/display-name
    return ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mockResponses}>
        {children}
      </MockedProvider>
    );
  };

  describe('initial state', () => {
    it('loads user and goals data', async () => {
      const mockList: MockedResponse[] = [
        {
          request: { query: GET_ME },
          result: { data: mockMeData },
        },
        {
          request: { query: GET_GOALS },
          result: { data: { goals: mockGoals } },
        },
      ];

      const { result } = renderHook(() => useDataManagement(), {
        wrapper: createWrapper(mockList),
      });

      await waitFor(() => {
        expect(result.current.isLoadingMe).toBe(false);
      });

      expect(result.current.meData).toEqual(mockMeData);
      expect(result.current.goalsData?.goals).toEqual(mockGoals);
    });

    it('calculates remaining slots for Free plan', async () => {
      const mockList: MockedResponse[] = [
        {
          request: { query: GET_ME },
          result: { data: mockMeData },
        },
        {
          request: { query: GET_GOALS },
          result: { data: { goals: mockGoals } },
        },
      ];

      const { result } = renderHook(() => useDataManagement(), {
        wrapper: createWrapper(mockList),
      });

      await waitFor(() => {
        expect(result.current.isLoadingGoals).toBe(false);
      });

      // Free plan has 3 max goals, 1 exists, so 2 remaining
      expect(result.current.hasStoredData).toBe(true);
    });
  });

  describe('file import', () => {
    it('handles import file parsing error', async () => {
      const mockList: MockedResponse[] = [
        {
          request: { query: GET_ME },
          result: { data: mockMeData },
        },
        {
          request: { query: GET_GOALS },
          result: { data: { goals: [] } },
        },
      ];

      const { result } = renderHook(() => useDataManagement(), {
        wrapper: createWrapper(mockList),
      });

      const mockFile = new File(['invalid json'], 'test.txt', { type: 'text/plain' });

      await act(async () => {
        result.current.handleFileChange(mockFile);
      });

      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith(expect.any(String), 'red');
      });
    });

    it('clears import state when file is null', async () => {
      const mockList: MockedResponse[] = [
        {
          request: { query: GET_ME },
          result: { data: mockMeData },
        },
        {
          request: { query: GET_GOALS },
          result: { data: { goals: [] } },
        },
      ];

      const { result } = renderHook(() => useDataManagement(), {
        wrapper: createWrapper(mockList),
      });

      await act(async () => {
        result.current.handleFileChange(null);
      });

      expect(result.current.preparedGoals).toHaveLength(0);
      expect(result.current.skippedGoals).toHaveLength(0);
    });
  });

  describe('import operations', () => {
    it('shows error when importing without prepared goals', async () => {
      const mockList: MockedResponse[] = [
        {
          request: { query: GET_ME },
          result: { data: mockMeData },
        },
        {
          request: { query: GET_GOALS },
          result: { data: { goals: [] } },
        },
      ];

      const { result } = renderHook(() => useDataManagement(), {
        wrapper: createWrapper(mockList),
      });

      await act(async () => {
        await result.current.handleImport();
      });

      expect(showToast).toHaveBeenCalledWith('Prepare the file before importing', 'red');
    });
  });

  describe('export operations', () => {
    it('exports all data successfully', async () => {
      const mockList: MockedResponse[] = [
        {
          request: { query: GET_ME },
          result: { data: mockMeData },
        },
        {
          request: { query: GET_GOALS },
          result: { data: { goals: mockGoals } },
        },
        {
          request: { query: EXPORT_ALL_DATA },
          result: {
            data: {
              exportAllData: JSON.stringify([{ title: 'Goal 1', targetValue: 1000 }]),
            },
          },
        },
      ];

      const { result } = renderHook(() => useDataManagement(), {
        wrapper: createWrapper(mockList),
      });

      const mockLink = document.createElement('a');
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
      jest.spyOn(mockLink, 'click');
      jest.spyOn(mockLink, 'remove');

      await act(async () => {
        await result.current.handleExportAllData();
      });

      await waitFor(() => {
        expect(trackEvent).toHaveBeenCalledWith('data_exported');
      });

      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith('Exported all goals and operations.', 'teal');
      });

      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('reset operations', () => {
    it('resets all data successfully', async () => {
      const mockList: MockedResponse[] = [
        {
          request: { query: GET_ME },
          result: { data: mockMeData },
        },
        {
          request: { query: GET_GOALS },
          result: { data: { goals: mockGoals } },
        },
        {
          request: { query: RESET_ALL_DATA },
          result: {
            data: {
              resetAllData: {
                deletedGoalsCount: 1,
                deletedOperationsCount: 0,
              },
            },
          },
        },
        {
          request: { query: GET_GOALS },
          result: { data: { goals: [] } },
        },
      ];

      const { result } = renderHook(() => useDataManagement(), {
        wrapper: createWrapper(mockList),
      });

      await act(async () => {
        await result.current.handleResetAllData();
      });

      await waitFor(() => {
        expect(trackEvent).toHaveBeenCalledWith('data_reset');
      });

      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith(
          'Removed 1 goals and 0 operations.',
          'teal'
        );
      });
    });
  });

  describe('modal state', () => {
    it('opens and closes reset modal', async () => {
      const mockList: MockedResponse[] = [
        {
          request: { query: GET_ME },
          result: { data: mockMeData },
        },
        {
          request: { query: GET_GOALS },
          result: { data: { goals: [] } },
        },
      ];

      const { result } = renderHook(() => useDataManagement(), {
        wrapper: createWrapper(mockList),
      });

      expect(result.current.isResetModalOpen).toBe(false);

      act(() => {
        result.current.openResetModal();
      });

      expect(result.current.isResetModalOpen).toBe(true);

      act(() => {
        result.current.closeResetModal();
      });

      expect(result.current.isResetModalOpen).toBe(false);
    });

    it('opens and closes delete account modal', async () => {
      const mockList: MockedResponse[] = [
        {
          request: { query: GET_ME },
          result: { data: mockMeData },
        },
        {
          request: { query: GET_GOALS },
          result: { data: { goals: [] } },
        },
      ];

      const { result } = renderHook(() => useDataManagement(), {
        wrapper: createWrapper(mockList),
      });

      expect(result.current.isDeleteAccountModalOpen).toBe(false);

      act(() => {
        result.current.openDeleteAccountModal();
      });

      expect(result.current.isDeleteAccountModalOpen).toBe(true);

      act(() => {
        result.current.closeDeleteAccountModal();
      });

      expect(result.current.isDeleteAccountModalOpen).toBe(false);
    });
  });

  describe('delete account', () => {
    it('deletes account successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const mockList: MockedResponse[] = [
        {
          request: { query: GET_ME },
          result: { data: mockMeData },
        },
        {
          request: { query: GET_GOALS },
          result: { data: { goals: [] } },
        },
      ];

      const { result } = renderHook(() => useDataManagement(), {
        wrapper: createWrapper(mockList),
      });

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      expect(trackEvent).toHaveBeenCalledWith('delete_account_click');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/delete-account'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });

    it('handles delete account error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to delete' }),
      });

      const mockList: MockedResponse[] = [
        {
          request: { query: GET_ME },
          result: { data: mockMeData },
        },
        {
          request: { query: GET_GOALS },
          result: { data: { goals: [] } },
        },
      ];

      const { result } = renderHook(() => useDataManagement(), {
        wrapper: createWrapper(mockList),
      });

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith('Failed to delete', 'red');
      });
    });
  });
});
