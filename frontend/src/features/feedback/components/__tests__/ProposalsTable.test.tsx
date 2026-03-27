import { render, screen } from '@/__tests__/test-utils';
import { ProposalsTable } from '../ProposalsTable';
import userEvent from '@testing-library/user-event';
import type { Proposal } from '@/features/feedback/types';

const mockProposals: Proposal[] = [
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

describe('ProposalsTable', () => {
  const mockOnVote = jest.fn();
  const mockOnUpdateStatus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no proposals', () => {
    render(<ProposalsTable proposals={[]} onVote={mockOnVote} />);

    expect(screen.getByText('No feedback yet')).toBeInTheDocument();
    expect(screen.getByText('Be the first to submit a suggestion or report a bug.')).toBeInTheDocument();
  });

  it('renders proposals table', () => {
    render(<ProposalsTable proposals={mockProposals} onVote={mockOnVote} />);

    expect(screen.getByText('Add dark mode')).toBeInTheDocument();
    expect(screen.getByText('Fix login issue')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders category badges', () => {
    render(<ProposalsTable proposals={mockProposals} onVote={mockOnVote} />);

    expect(screen.getByText('Feature')).toBeInTheDocument();
    expect(screen.getByText('Bug')).toBeInTheDocument();
  });

  it('renders status badges', () => {
    render(<ProposalsTable proposals={mockProposals} onVote={mockOnVote} />);

    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('In review')).toBeInTheDocument();
  });

  it('calls onVote when vote button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProposalsTable proposals={mockProposals} onVote={mockOnVote} />);

    const voteButtons = screen.getAllByLabelText(/Vote for/);
    await user.click(voteButtons[0]);

    expect(mockOnVote).toHaveBeenCalledWith('1');
  });

  it('disables vote button when already voted', () => {
    render(<ProposalsTable proposals={mockProposals} onVote={mockOnVote} />);

    const alreadyVotedButton = screen.getByLabelText(/Vote for "Fix login issue" \(already voted\)/);
    expect(alreadyVotedButton).toBeDisabled();
  });

  it('expands row to show description when clicked', async () => {
    const user = userEvent.setup();
    render(<ProposalsTable proposals={mockProposals} onVote={mockOnVote} />);

    expect(screen.queryByText('Please add dark mode support')).not.toBeInTheDocument();

    await user.click(screen.getByText('Add dark mode'));

    expect(screen.getByText('Please add dark mode support')).toBeInTheDocument();
  });

  it('collapses expanded row when clicked again', async () => {
    const user = userEvent.setup();
    render(<ProposalsTable proposals={mockProposals} onVote={mockOnVote} />);

    await user.click(screen.getByText('Add dark mode'));
    expect(screen.getByText('Please add dark mode support')).toBeInTheDocument();

    await user.click(screen.getByText('Add dark mode'));
    expect(screen.queryByText('Please add dark mode support')).not.toBeInTheDocument();
  });

  it('renders status select for admins', () => {
    render(<ProposalsTable proposals={mockProposals} onVote={mockOnVote} onUpdateStatus={mockOnUpdateStatus} />);

    const statusSelects = screen.getAllByRole('textbox');
    expect(statusSelects.length).toBeGreaterThan(0);
  });

  it('paginates proposals when more than 10', () => {
    const manyProposals = Array.from({ length: 15 }, (_, i) => ({
      id: `${i}`,
      category: 'FEATURE' as const,
      title: `Proposal ${i}`,
      description: `Description ${i}`,
      status: 'OPEN' as const,
      votes: i,
      hasVoted: false,
      createdAt: '2024-01-01T00:00:00.000Z',
    }));

    render(<ProposalsTable proposals={manyProposals} onVote={mockOnVote} />);

    expect(screen.getByText(/Showing 1–10 of 15/)).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(<ProposalsTable proposals={mockProposals} onVote={mockOnVote} />);

    expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
    expect(screen.getByText('Jan 2, 2024')).toBeInTheDocument();
  });
});
