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

  it('prevents modal close when loading', () => {
    const { form, onConfirm, onClose } = setup();
    const { baseElement } = render(
      <EditGoalModal opened={true} isLoading={true} form={form} onConfirm={onConfirm} onClose={onClose} />
    );

    const overlay = baseElement.querySelector('.mantine-Modal-overlay');
    if (overlay) {
      (overlay as HTMLElement).click();
    }

    expect(onClose).not.toHaveBeenCalled();
  });

  it('allows modal close when not loading', async () => {
    const user = userEvent.setup();
    const { form, onConfirm, onClose } = setup();

    const { baseElement } = render(
      <EditGoalModal opened={true} isLoading={false} form={form} onConfirm={onConfirm} onClose={onClose} />
    );

    const closeButton = baseElement.querySelector('.mantine-Modal-close') as HTMLElement;
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('updates title when input changes', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    const { result } = renderHook(() => useGoalForm());

    const setTitleSpy = jest.fn(result.current.setTitle);
    const form = { ...result.current, setTitle: setTitleSpy };

    render(
      <EditGoalModal opened={true} isLoading={false} form={form} onConfirm={onConfirm} onClose={onClose} />
    );

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'A');

    expect(setTitleSpy).toHaveBeenCalled();
  });

  it('renders color picker', () => {
    const { form, onConfirm, onClose } = setup();

    render(
      <EditGoalModal opened={true} isLoading={false} form={form} onConfirm={onConfirm} onClose={onClose} />
    );

    expect(screen.getByText(/color/i)).toBeInTheDocument();
  });

  it('renders starting amount field', () => {
    const { form, onConfirm, onClose } = setup();

    render(
      <EditGoalModal opened={true} isLoading={false} form={form} onConfirm={onConfirm} onClose={onClose} />
    );

    expect(screen.getByLabelText(/starting amount/i)).toBeInTheDocument();
  });

  it('calls setTargetAmount when target amount changes', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    const { result } = renderHook(() => useGoalForm());

    const setTargetAmountSpy = jest.fn(result.current.setTargetAmount);
    const form = { ...result.current, setTargetAmount: setTargetAmountSpy };

    render(
      <EditGoalModal opened={true} isLoading={false} form={form} onConfirm={onConfirm} onClose={onClose} />
    );

    const targetInput = screen.getByLabelText(/target amount/i);
    await user.type(targetInput, '5000');

    expect(setTargetAmountSpy).toHaveBeenCalled();
  });

  it('calls setInitialAmount when starting amount changes', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    const { result } = renderHook(() => useGoalForm());

    const setInitialAmountSpy = jest.fn(result.current.setInitialAmount);
    const form = { ...result.current, setInitialAmount: setInitialAmountSpy };

    render(
      <EditGoalModal opened={true} isLoading={false} form={form} onConfirm={onConfirm} onClose={onClose} />
    );

    const startingInput = screen.getByLabelText(/starting amount/i);
    await user.type(startingInput, '1000');

    expect(setInitialAmountSpy).toHaveBeenCalled();
  });

  it('prevents form submission via enter when invalid', async () => {
    const user = userEvent.setup();
    const { form, onConfirm, onClose } = setup();

    render(
      <EditGoalModal opened={true} isLoading={false} form={form} onConfirm={onConfirm} onClose={onClose} />
    );

    const titleInput = screen.getByLabelText(/title/i);
    await user.click(titleInput);
    await user.keyboard('{Enter}');

    expect(onConfirm).not.toHaveBeenCalled();
  });
});
