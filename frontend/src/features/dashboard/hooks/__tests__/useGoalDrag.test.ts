import { renderHook, act } from '@testing-library/react';
import { useGoalDrag } from '../useGoalDrag';

describe('useGoalDrag', () => {
  it('initializes with null values', () => {
    const onDrop = jest.fn();
    const { result } = renderHook(() => useGoalDrag(onDrop));

    expect(result.current.draggingGoalId).toBeNull();
    expect(result.current.dragOverGoalId).toBeNull();
  });

  it('handles drag start', () => {
    const onDrop = jest.fn();
    const { result } = renderHook(() => useGoalDrag(onDrop));

    act(() => {
      result.current.handleDragStart('goal-1');
    });

    expect(result.current.draggingGoalId).toBe('goal-1');
    expect(result.current.dragOverGoalId).toBe('goal-1');
  });

  it('handles drag over', () => {
    const onDrop = jest.fn();
    const { result } = renderHook(() => useGoalDrag(onDrop));

    act(() => {
      result.current.handleDragStart('goal-1');
    });

    act(() => {
      result.current.handleDragOver('goal-2');
    });

    expect(result.current.dragOverGoalId).toBe('goal-2');
  });

  it('ignores drag over same goal', () => {
    const onDrop = jest.fn();
    const { result } = renderHook(() => useGoalDrag(onDrop));

    act(() => {
      result.current.handleDragStart('goal-1');
    });

    act(() => {
      result.current.handleDragOver('goal-1');
    });

    expect(result.current.dragOverGoalId).toBe('goal-1');
  });

  it('ignores drag over when not dragging', () => {
    const onDrop = jest.fn();
    const { result } = renderHook(() => useGoalDrag(onDrop));

    act(() => {
      result.current.handleDragOver('goal-1');
    });

    expect(result.current.dragOverGoalId).toBeNull();
  });

  it('handles drag end', () => {
    const onDrop = jest.fn();
    const { result } = renderHook(() => useGoalDrag(onDrop));

    act(() => {
      result.current.handleDragStart('goal-1');
      result.current.handleDragOver('goal-2');
    });

    act(() => {
      result.current.handleDragEnd();
    });

    expect(result.current.draggingGoalId).toBeNull();
    expect(result.current.dragOverGoalId).toBeNull();
  });

  it('handles successful drop', async () => {
    const onDrop = jest.fn();
    const { result } = renderHook(() => useGoalDrag(onDrop));

    act(() => {
      result.current.handleDragStart('goal-1');
    });

    await act(async () => {
      await result.current.handleDrop('goal-2');
    });

    expect(onDrop).toHaveBeenCalledWith('goal-1', 'goal-2');
    expect(result.current.draggingGoalId).toBeNull();
    expect(result.current.dragOverGoalId).toBeNull();
  });

  it('handles drop on same goal without calling onDrop', async () => {
    const onDrop = jest.fn();
    const { result } = renderHook(() => useGoalDrag(onDrop));

    act(() => {
      result.current.handleDragStart('goal-1');
    });

    await act(async () => {
      await result.current.handleDrop('goal-1');
    });

    expect(onDrop).not.toHaveBeenCalled();
    expect(result.current.draggingGoalId).toBeNull();
  });

  it('handles drop when not dragging', async () => {
    const onDrop = jest.fn();
    const { result } = renderHook(() => useGoalDrag(onDrop));

    await act(async () => {
      await result.current.handleDrop('goal-1');
    });

    expect(onDrop).not.toHaveBeenCalled();
  });
});
