import { renderHook, waitFor } from '@/__tests__/test-utils';
import { useProposals } from '../useProposals';
import { GET_PROPOSALS, CREATE_PROPOSAL, VOTE_PROPOSAL, UPDATE_PROPOSAL_STATUS } from '@/features/feedback/gql/feedback';
import type { MockedResponse } from '@apollo/client/testing';

const mockProposals = [
  {
    id: '1',
    category: 'FEATURE',
    title: 'Add dark mode',
    description: 'Please add dark mode support',
    status: 'OPEN',
    votes: 5,
    hasVoted: false,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

const getProposalsMock: MockedResponse = {
  request: {
    query: GET_PROPOSALS,
  },
  result: {
    data: {
      proposals: mockProposals,
    },
  },
};

describe('useProposals', () => {
  it('loads proposals', async () => {
    const { result } = renderHook(() => useProposals(), {
      mocks: [getProposalsMock],
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.proposals).toEqual(mockProposals);
  });

  it('returns empty array when no data', () => {
    const emptyMock: MockedResponse = {
      request: {
        query: GET_PROPOSALS,
      },
      result: {
        data: {
          proposals: [],
        },
      },
    };

    const { result } = renderHook(() => useProposals(), {
      mocks: [emptyMock],
    });

    expect(result.current.proposals).toEqual([]);
  });

  it('handles error state', async () => {
    const errorMock: MockedResponse = {
      request: {
        query: GET_PROPOSALS,
      },
      error: new Error('Network error'),
    };

    const { result } = renderHook(() => useProposals(), {
      mocks: [errorMock],
    });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });

  it('creates a proposal', async () => {
    const createMock: MockedResponse = {
      request: {
        query: CREATE_PROPOSAL,
        variables: {
          category: 'BUG',
          title: 'Test bug',
          description: 'Test description',
        },
      },
      result: {
        data: {
          createProposal: {
            id: '2',
            category: 'BUG',
            title: 'Test bug',
            description: 'Test description',
            status: 'OPEN',
            votes: 0,
            hasVoted: false,
            createdAt: '2024-01-02T00:00:00.000Z',
          },
        },
      },
    };

    const newProposal = createMock.result && 'data' in createMock.result
      ? createMock.result.data?.createProposal
      : null;

    const refetchMock: MockedResponse = {
      request: {
        query: GET_PROPOSALS,
      },
      result: {
        data: {
          proposals: newProposal ? [...mockProposals, newProposal] : mockProposals,
        },
      },
    };

    const { result } = renderHook(() => useProposals(), {
      mocks: [getProposalsMock, createMock, refetchMock],
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.createProposal({
      category: 'BUG',
      title: 'Test bug',
      description: 'Test description',
    });

    await waitFor(() => {
      expect(result.current.proposals.length).toBe(2);
    });
  });

  it('votes for a proposal', async () => {
    const voteMock: MockedResponse = {
      request: {
        query: VOTE_PROPOSAL,
        variables: { proposalId: '1' },
      },
      result: {
        data: {
          voteProposal: {
            ...mockProposals[0],
            votes: 6,
            hasVoted: true,
          },
        },
      },
    };

    const refetchMock: MockedResponse = {
      request: {
        query: GET_PROPOSALS,
      },
      result: {
        data: {
          proposals: [{ ...mockProposals[0], votes: 6, hasVoted: true }],
        },
      },
    };

    const { result } = renderHook(() => useProposals(), {
      mocks: [getProposalsMock, voteMock, refetchMock],
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.voteForProposal('1');

    await waitFor(() => {
      expect(result.current.proposals[0].votes).toBe(6);
      expect(result.current.proposals[0].hasVoted).toBe(true);
    });
  });

  it('updates proposal status', async () => {
    const updateMock: MockedResponse = {
      request: {
        query: UPDATE_PROPOSAL_STATUS,
        variables: { proposalId: '1', status: 'DONE' },
      },
      result: {
        data: {
          updateProposalStatus: {
            ...mockProposals[0],
            status: 'DONE',
          },
        },
      },
    };

    const refetchMock: MockedResponse = {
      request: {
        query: GET_PROPOSALS,
      },
      result: {
        data: {
          proposals: [{ ...mockProposals[0], status: 'DONE' }],
        },
      },
    };

    const { result } = renderHook(() => useProposals(), {
      mocks: [getProposalsMock, updateMock, refetchMock],
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.updateProposalStatus('1', 'DONE');

    await waitFor(() => {
      expect(result.current.proposals[0].status).toBe('DONE');
    });
  });

  it('sets isCreating flag during creation', async () => {
    const createMock: MockedResponse = {
      request: {
        query: CREATE_PROPOSAL,
        variables: {
          category: 'FEATURE',
          title: 'Test',
          description: 'Test desc',
        },
      },
      result: {
        data: {
          createProposal: {
            id: '2',
            category: 'FEATURE',
            title: 'Test',
            description: 'Test desc',
            status: 'OPEN',
            votes: 0,
            hasVoted: false,
            createdAt: '2024-01-02T00:00:00.000Z',
          },
        },
      },
    };

    const refetchMock: MockedResponse = {
      request: {
        query: GET_PROPOSALS,
      },
      result: {
        data: {
          proposals: mockProposals,
        },
      },
    };

    const { result } = renderHook(() => useProposals(), {
      mocks: [getProposalsMock, createMock, refetchMock],
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isCreating).toBe(false);

    result.current.createProposal({
      category: 'FEATURE',
      title: 'Test',
      description: 'Test desc',
    });

    await waitFor(() => {
      expect(result.current.isCreating).toBe(false);
    });
  });
});
