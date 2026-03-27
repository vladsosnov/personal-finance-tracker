import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/test-utils';
import { EditGoalModal } from '../EditGoalModal';
import { useGoalForm } from '@/features/dashboard/hooks/useGoalForm';
import { renderHook, act } from '@testing-library/react';

describe('EditGoalModal', () => {
  const setup = () => {
    const { result } = renderHook(() => useGoalForm());
    const onConfirm = jest.fn();
    const onClose = jest.fn();

    return {
      form: result.current,
      onConfirm,
      onClose,
    };
  };

  it('renders when opened', () => {
    const { form, onConfirm, onClose } = setup();

    render(
      <EditGoalModal opened={true} isLoading={false} form={form} onConfirm={onConfirm} onClose={onClose} />
    );

    expect(screen.getByText('Edit goal')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/target amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/starting amount/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { form, onConfirm, onClose } = setup();

    render(
      <EditGoalModal opened={false} isLoading={false} form={form} onConfirm={onConfirm} onClose={onClose} />
    );

    expect(screen.queryByText('Edit goal')).not.toBeInTheDocument();
  });

  it('calls onConfirm on form submit when valid', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    const { result } = renderHook(() => useGoalForm());

    act(() => {
      result.current.setTitle('Test Goal');
      result.current.setTargetAmount(5000);
    });

    render(
      <EditGoalModal opened={true} isLoading={false} form={result.current} onConfirm={onConfirm} onClose={onClose} />
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not call onConfirm when form is invalid', async () => {
    const user = userEvent.setup();
    const { form, onConfirm, onClose } = setup();

    render(
      <EditGoalModal opened={true} isLoading={false} form={form} onConfirm={onConfirm} onClose={onClose} />
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('disables submit button when form is invalid', () => {
    const { form, onConfirm, onClose } = setup();

    render(
      <EditGoalModal opened={true} isLoading={false} form={form} onConfirm={onConfirm} onClose={onClose} />
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();
  });

  it('enables submit button when form is valid', () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    const { result } = renderHook(() => useGoalForm());

    act(() => {
      result.current.setTitle('Goal');
      result.current.setTargetAmount(1000);
    });

    render(
      <EditGoalModal opened={true} isLoading={false} form={result.current} onConfirm={onConfirm} onClose={onClose} />
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).not.toBeDisabled();
  });

  it('calls onClose when cancel button clicked', async () => {
    const user = userEvent.setup();
    const { form, onConfirm, onClose } = setup();

    render(
      <EditGoalModal opened={true} isLoading={false} form={form} onConfirm={onConfirm} onClose={onClose} />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on submit button', () => {
    const { form, onConfirm, onClose } = setup();

    render(
      <EditGoalModal opened={true} isLoading={true} form={form} onConfirm={onConfirm} onClose={onClose} />
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toHaveAttribute('data-loading', 'true');
  });

  it('disables cancel button when loading', () => {
    const { form, onConfirm, onClose } = setup();

    render(
      <EditGoalModal opened={true} isLoading={true} form={form} onConfirm={onConfirm} onClose={onClose} />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();
  });

  it('prevents modal close when loading', async () => {
    const user = userEvent.setup();
    const { form, onConfirm, onClose } = setup();

    render(
      <EditGoalModal opened={true} isLoading={true} form={form} onConfirm={onConfirm} onClose={onClose} />
    );

    expect(onClose).not.toHaveBeenCalled();
  });

  it('enforces max length on title input', () => {
    const { form, onConfirm, onClose } = setup();

    render(
      <EditGoalModal opened={true} isLoading={false} form={form} onConfirm={onConfirm} onClose={onClose} />
    );

    const titleInput = screen.getByLabelText(/title/i);
    expect(titleInput).toHaveAttribute('maxLength', '80');
  });

  it('marks required fields', () => {
    const { form, onConfirm, onClose } = setup();

    render(
      <EditGoalModal opened={true} isLoading={false} form={form} onConfirm={onConfirm} onClose={onClose} />
    );

    expect(screen.getByLabelText(/title/i)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(/target amount/i)).toHaveAttribute('aria-required', 'true');
  });
});
