import { renderHook, act } from '@testing-library/react';
import { useOperationForm } from '../useOperationForm';
import { mockOperation } from '@/__tests__/mock-data';

describe('useOperationForm', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useOperationForm());

    expect(result.current.operationType).toBe('INCREASE');
    expect(result.current.operationAmount).toBe('');
    expect(result.current.operationNote).toBe('');
    expect(result.current.operationDate).toBe('2024-01-15');
    expect(result.current.editingOperationId).toBeNull();
  });

  it('updates operation type', () => {
    const { result } = renderHook(() => useOperationForm());

    act(() => {
      result.current.setOperationType('DECREASE');
    });

    expect(result.current.operationType).toBe('DECREASE');
  });

  it('updates operation amount', () => {
    const { result } = renderHook(() => useOperationForm());

    act(() => {
      result.current.setOperationAmount(500);
    });

    expect(result.current.operationAmount).toBe(500);
  });

  it('updates operation note', () => {
    const { result } = renderHook(() => useOperationForm());

    act(() => {
      result.current.setOperationNote('Test note');
    });

    expect(result.current.operationNote).toBe('Test note');
  });

  it('updates operation date', () => {
    const { result } = renderHook(() => useOperationForm());

    act(() => {
      result.current.setOperationDate('2024-01-20');
    });

    expect(result.current.operationDate).toBe('2024-01-20');
  });

  it('resets form to defaults', () => {
    const { result } = renderHook(() => useOperationForm());

    act(() => {
      result.current.setOperationType('DECREASE');
      result.current.setOperationAmount(500);
      result.current.setOperationNote('Note');
      result.current.setOperationDate('2024-01-20');
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.operationType).toBe('INCREASE');
    expect(result.current.operationAmount).toBe('');
    expect(result.current.operationNote).toBe('');
    expect(result.current.operationDate).toBe('2024-01-15');
    expect(result.current.editingOperationId).toBeNull();
  });

  it('starts edit mode with operation data', () => {
    const { result } = renderHook(() => useOperationForm());
    const operation = {
      ...mockOperation,
      type: 'INCREASE' as const,
      operationDate: '2024-01-10',
    };

    act(() => {
      result.current.startEdit(operation);
    });

    expect(result.current.editingOperationId).toBe(operation.id);
    expect(result.current.operationType).toBe(operation.type);
    expect(result.current.operationAmount).toBe(operation.amount);
    expect(result.current.operationNote).toBe(operation.note);
    expect(result.current.operationDate).toBe(operation.operationDate);
  });

  it('handles operation without note', () => {
    const { result } = renderHook(() => useOperationForm());
    const operation = { ...mockOperation, note: undefined, operationDate: '2024-01-01' };

    act(() => {
      result.current.startEdit(operation);
    });

    expect(result.current.operationNote).toBe('');
  });
});
