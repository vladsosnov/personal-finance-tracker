import { render, screen, waitFor } from '@/__tests__/test-utils';
import { CreateProposalModal } from '../CreateProposalModal';
import userEvent from '@testing-library/user-event';

describe('CreateProposalModal', () => {
  const mockOnSubmit = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when closed', () => {
    render(
      <CreateProposalModal
        opened={false}
        isLoading={false}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Submit feedback')).not.toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <CreateProposalModal
        opened={true}
        isLoading={false}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    await user.type(screen.getByPlaceholderText('Brief summary of your feedback'), 'Test Feature');
    await user.type(screen.getByPlaceholderText(/Describe the bug, feature, or change in detail/i), 'Test description');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        category: 'FEATURE',
        title: 'Test Feature',
        description: 'Test description',
        contactEmail: undefined,
      });
    });
  });

  it('includes contact email when provided', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <CreateProposalModal
        opened={true}
        isLoading={false}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    await user.type(screen.getByPlaceholderText('Brief summary of your feedback'), 'Bug Report');
    await user.type(screen.getByPlaceholderText(/Describe the bug, feature, or change in detail/i), 'Found a bug');
    await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        category: 'FEATURE',
        title: 'Bug Report',
        description: 'Found a bug',
        contactEmail: 'test@example.com',
      });
    });
  });

  it('trims whitespace from inputs', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <CreateProposalModal
        opened={true}
        isLoading={false}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    await user.type(screen.getByPlaceholderText('Brief summary of your feedback'), '  Test Title  ');
    await user.type(screen.getByPlaceholderText(/Describe the bug, feature, or change in detail/i), '  Test description  ');
    await user.type(screen.getByPlaceholderText('your@email.com'), '  test@example.com  ');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        category: 'FEATURE',
        title: 'Test Title',
        description: 'Test description',
        contactEmail: 'test@example.com',
      });
    });
  });

  it('disables submit button when title is empty', async () => {
    const user = userEvent.setup();

    render(
      <CreateProposalModal
        opened={true}
        isLoading={false}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    await user.type(screen.getByPlaceholderText(/Describe the bug, feature, or change in detail/i), 'Test description');

    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('disables submit button when description is empty', async () => {
    const user = userEvent.setup();

    render(
      <CreateProposalModal
        opened={true}
        isLoading={false}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    await user.type(screen.getByPlaceholderText('Brief summary of your feedback'), 'Test Title');

    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('shows loading state', () => {
    render(
      <CreateProposalModal
        opened={true}
        isLoading={true}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('prevents closing while loading', async () => {
    const user = userEvent.setup();

    render(
      <CreateProposalModal
        opened={true}
        isLoading={true}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup();

    render(
      <CreateProposalModal
        opened={true}
        isLoading={false}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('resets form after successful submission', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    const { rerender } = render(
      <CreateProposalModal
        opened={true}
        isLoading={false}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    await user.type(screen.getByPlaceholderText('Brief summary of your feedback'), 'Test Title');
    await user.type(screen.getByPlaceholderText(/Describe the bug, feature, or change in detail/i), 'Test description');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    rerender(
      <CreateProposalModal
        opened={true}
        isLoading={false}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByPlaceholderText('Brief summary of your feedback')).toHaveValue('');
    expect(screen.getByPlaceholderText(/Describe the bug, feature, or change in detail/i)).toHaveValue('');
  });
});
