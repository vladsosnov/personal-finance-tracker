import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { CreateGoalForm, CreateGoalFormFields, CreateGoalModal } from '../create-goal-form';

const defaultProps = {
  goalTitle: '',
  goalTarget: '' as number | '',
  goalInitialAmount: '' as number | '',
  goalColor: '#228be6',
  goalCurrency: 'USD',
  isCreatingGoal: false,
  isAddDisabled: true,
  limitMessage: null,
  setGoalTitle: jest.fn(),
  setGoalTarget: jest.fn(),
  setGoalInitialAmount: jest.fn(),
  setGoalColor: jest.fn(),
  setGoalCurrency: jest.fn(),
  onCreateGoal: jest.fn(),
};

describe('CreateGoalFormFields', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<CreateGoalFormFields {...defaultProps} />);

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add goal/i })).toBeInTheDocument();
  });

  it('renders the form with correct aria label', () => {
    render(<CreateGoalFormFields {...defaultProps} />);

    expect(screen.getByRole('form', { name: /create goal/i })).toBeInTheDocument();
  });

  it('disables submit button when isAddDisabled is true', () => {
    render(<CreateGoalFormFields {...defaultProps} isAddDisabled={true} />);

    expect(screen.getByRole('button', { name: /add goal/i })).toBeDisabled();
  });

  it('enables submit button when isAddDisabled is false', () => {
    render(<CreateGoalFormFields {...defaultProps} isAddDisabled={false} />);

    expect(screen.getByRole('button', { name: /add goal/i })).not.toBeDisabled();
  });

  it('disables submit button when limitMessage is present', () => {
    render(<CreateGoalFormFields {...defaultProps} isAddDisabled={false} limitMessage="Upgrade to add more." />);

    expect(screen.getByRole('button', { name: /add goal/i })).toBeDisabled();
  });

  it('shows loading state when isCreatingGoal is true', () => {
    render(<CreateGoalFormFields {...defaultProps} isCreatingGoal={true} />);

    const button = screen.getByRole('button', { name: /add goal/i });
    expect(button).toHaveAttribute('data-loading', 'true');
  });

  it('calls setGoalTitle on title input change', async () => {
    const user = userEvent.setup();
    render(<CreateGoalFormFields {...defaultProps} />);

    await user.type(screen.getByLabelText(/title/i), 'New Goal');

    expect(defaultProps.setGoalTitle).toHaveBeenCalled();
  });

  it('calls onCreateGoal on form submit when enabled', async () => {
    const user = userEvent.setup();
    render(<CreateGoalFormFields {...defaultProps} isAddDisabled={false} goalTitle="Test" goalTarget={1000} />);

    await user.click(screen.getByRole('button', { name: /add goal/i }));

    expect(defaultProps.onCreateGoal).toHaveBeenCalledTimes(1);
  });

  it('does not call onCreateGoal on form submit when disabled', async () => {
    const user = userEvent.setup();
    render(<CreateGoalFormFields {...defaultProps} isAddDisabled={true} />);

    // Submit the form directly since button is disabled
    const form = screen.getByRole('form', { name: /create goal/i });
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(defaultProps.onCreateGoal).not.toHaveBeenCalled();
  });
});

describe('CreateGoalForm', () => {
  it('renders card wrapper with title', () => {
    render(<CreateGoalForm {...defaultProps} />);

    expect(screen.getByText('Create goal')).toBeInTheDocument();
  });

  it('shows limit message when provided', () => {
    render(<CreateGoalForm {...defaultProps} limitMessage="Free plan supports up to 3 goals." />);

    expect(screen.getByText('Free plan supports up to 3 goals.')).toBeInTheDocument();
  });

  it('does not show limit message when null', () => {
    render(<CreateGoalForm {...defaultProps} limitMessage={null} />);

    expect(screen.queryByText(/free plan/i)).not.toBeInTheDocument();
  });
});

describe('CreateGoalModal', () => {
  it('renders modal when opened', () => {
    render(<CreateGoalModal {...defaultProps} opened={true} onClose={jest.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create goal')).toBeInTheDocument();
  });

  it('does not render modal when closed', () => {
    render(<CreateGoalModal {...defaultProps} opened={false} onClose={jest.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when modal close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const { baseElement } = render(<CreateGoalModal {...defaultProps} opened={true} onClose={onClose} />);

    const closeButton = baseElement.querySelector('.mantine-Modal-close') as HTMLElement;
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
