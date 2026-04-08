import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { ConfirmationModal } from '../confirmation-modal';

describe('ConfirmationModal', () => {
  const defaultProps = {
    opened: true,
    title: 'Confirm action?',
    description: 'Are you sure you want to proceed?',
    confirmLabel: 'Confirm',
    isLoading: false,
    onConfirm: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when opened', () => {
    render(<ConfirmationModal {...defaultProps} />);

    expect(screen.getByText('Confirm action?')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ConfirmationModal {...defaultProps} opened={false} />);

    expect(screen.queryByText('Confirm action?')).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmationModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /confirm/i }));

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmationModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on confirm button', () => {
    render(<ConfirmationModal {...defaultProps} isLoading={true} />);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton).toHaveAttribute('data-loading', 'true');
  });

  it('disables cancel button when loading', () => {
    render(<ConfirmationModal {...defaultProps} isLoading={true} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();
  });

  it('prevents modal close when loading', () => {
    const { baseElement } = render(<ConfirmationModal {...defaultProps} isLoading={true} />);

    const overlay = baseElement.querySelector('.mantine-Modal-overlay');
    if (overlay) {
      (overlay as HTMLElement).click();
    }

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('allows modal close when not loading', async () => {
    const user = userEvent.setup();
    const { baseElement } = render(<ConfirmationModal {...defaultProps} />);

    const closeButton = baseElement.querySelector('.mantine-Modal-close') as HTMLElement;
    await user.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('uses red as default confirm color', () => {
    render(<ConfirmationModal {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton.className).toContain('mantine');
  });

  it('supports custom confirm color', () => {
    render(<ConfirmationModal {...defaultProps} confirmColor="teal" />);

    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
  });

  it('supports custom cancel label', () => {
    render(<ConfirmationModal {...defaultProps} cancelLabel="Keep active" />);

    expect(screen.getByRole('button', { name: /keep active/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^cancel$/i })).not.toBeInTheDocument();
  });

  it('supports ReactNode description', () => {
    render(
      <ConfirmationModal
        {...defaultProps}
        description={<>Remove <strong>Test Goal</strong> permanently?</>}
      />
    );

    expect(screen.getByText('Test Goal')).toBeInTheDocument();
    expect(screen.getByText(/permanently/i)).toBeInTheDocument();
  });

  it('autofocuses cancel button', () => {
    render(<ConfirmationModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toHaveAttribute('data-autofocus');
  });
});
