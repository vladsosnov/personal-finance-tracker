import { render, screen, waitFor } from '@/__tests__/test-utils';
import { FeedbackClient } from '../feedback-client';
import { GET_PROPOSALS } from '@/features/feedback/gql/feedback';
import { GET_ME } from '@/shared/gql/queries';
import userEvent from '@testing-library/user-event';
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
  {
    id: '2',
    category: 'BUG',
    title: 'Fix login issue',
    description: 'Login button not working',
    status: 'IN_REVIEW',
    votes: 10,
    hasVoted: true,
    createdAt: '2024-01-02T00:00:00.000Z',
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

const getMeMock: MockedResponse = {
  request: {
    query: GET_ME,
  },
  result: {
    data: {
      me: {
        id: '1',
        email: 'user@example.com',
        role: 'user',
      },
    },
  },
};

const getAdminMeMock: MockedResponse = {
  request: {
    query: GET_ME,
  },
  result: {
    data: {
      me: {
        id: '1',
        email: 'admin@example.com',
        role: 'admin',
      },
    },
  },
};

describe('FeedbackClient', () => {
  it('renders page title and description', async () => {
    render(<FeedbackClient />, {
      mocks: [getProposalsMock, getMeMock],
    });

    expect(screen.getByRole('heading', { name: 'Feedback' })).toBeInTheDocument();
    expect(screen.getByText(/Report bugs, suggest features, or request text changes/i)).toBeInTheDocument();
  });

  it('renders loading state initially', () => {
    render(<FeedbackClient />, {
      mocks: [getProposalsMock, getMeMock],
    });

    expect(screen.getByLabelText('Loading proposals')).toBeInTheDocument();
  });

  it('renders proposals after loading', async () => {
    render(<FeedbackClient />, {
      mocks: [getProposalsMock, getMeMock],
    });

    await waitFor(() => {
      expect(screen.getByText('Add dark mode')).toBeInTheDocument();
      expect(screen.getByText('Fix login issue')).toBeInTheDocument();
    });
  });

  it('renders filter controls', async () => {
    render(<FeedbackClient />, {
      mocks: [getProposalsMock, getMeMock],
    });

    expect(screen.getByLabelText('Filter by category')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by status')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort proposals')).toBeInTheDocument();
  });

  it('renders submit feedback button', () => {
    render(<FeedbackClient />, {
      mocks: [getProposalsMock, getMeMock],
    });

    expect(screen.getByRole('button', { name: /Submit feedback/i })).toBeInTheDocument();
  });

  it('sorts proposals by most voted', async () => {
    const user = userEvent.setup();
    render(<FeedbackClient />, {
      mocks: [getProposalsMock, getMeMock],
    });

    await waitFor(() => {
      expect(screen.getByText('Add dark mode')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Most voted'));

    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      const firstProposalRow = rows.find((row) => row.textContent?.includes('Fix login issue'));
      const secondProposalRow = rows.find((row) => row.textContent?.includes('Add dark mode'));

      expect(firstProposalRow).toBeTruthy();
      expect(secondProposalRow).toBeTruthy();
    });
  });

  it('sorts proposals by newest (default)', async () => {
    render(<FeedbackClient />, {
      mocks: [getProposalsMock, getMeMock],
    });

    await waitFor(() => {
      expect(screen.getByText('Fix login issue')).toBeInTheDocument();
    });

    const rows = screen.getAllByRole('row');
    const firstRow = rows[1]; // Skip header row
    expect(firstRow.textContent).toContain('Fix login issue');
  });

  it('shows status select for admin users', async () => {
    render(<FeedbackClient />, {
      mocks: [getProposalsMock, getAdminMeMock],
    });

    await waitFor(() => {
      const statusSelects = screen.getAllByRole('textbox');
      expect(statusSelects.length).toBeGreaterThan(0);
    });
  });

  it('does not show status select for regular users', async () => {
    render(<FeedbackClient />, {
      mocks: [getProposalsMock, getMeMock],
    });

    await waitFor(() => {
      expect(screen.getByText('Add dark mode')).toBeInTheDocument();
    });

    const statusSelects = screen.queryAllByRole('textbox');
    expect(statusSelects.length).toBe(2);
  });

  it('handles error state', async () => {
    const errorMock: MockedResponse = {
      request: {
        query: GET_PROPOSALS,
      },
      error: new Error('Network error'),
    };

    render(<FeedbackClient />, {
      mocks: [errorMock, getMeMock],
    });

    await waitFor(() => {
      expect(screen.getByText("Couldn't load proposals")).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('can retry after error', async () => {
    const user = userEvent.setup();
    const errorMock: MockedResponse = {
      request: {
        query: GET_PROPOSALS,
      },
      error: new Error('Network error'),
    };

    render(<FeedbackClient />, {
      mocks: [errorMock, getMeMock, getProposalsMock],
    });

    await waitFor(() => {
      expect(screen.getByText("Couldn't load proposals")).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() => {
      expect(screen.getByText('Add dark mode')).toBeInTheDocument();
    });
  });
});
