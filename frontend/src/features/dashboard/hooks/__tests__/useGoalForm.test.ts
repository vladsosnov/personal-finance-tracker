import { renderHook, act } from '@testing-library/react';
import { useGoalForm } from '../useGoalForm';
import { DEFAULT_GOAL_COLOR } from '@/shared/constants/goal-colors';
import { mockGoal } from '@/__tests__/mock-data';

describe('useGoalForm', () => {
  it('initializes with default empty values', () => {
    const { result } = renderHook(() => useGoalForm());

    expect(result.current.title).toBe('');
    expect(result.current.targetAmount).toBe('');
    expect(result.current.initialAmount).toBe('');
    expect(result.current.color).toBe(DEFAULT_GOAL_COLOR);
    expect(result.current.isValid).toBe(false);
  });

  it('updates title', () => {
    const { result } = renderHook(() => useGoalForm());

    act(() => {
      result.current.setTitle('New Goal');
    });

    expect(result.current.title).toBe('New Goal');
  });

  it('updates target amount', () => {
    const { result } = renderHook(() => useGoalForm());

    act(() => {
      result.current.setTargetAmount(5000);
    });

    expect(result.current.targetAmount).toBe(5000);
  });

  it('updates initial amount', () => {
    const { result } = renderHook(() => useGoalForm());

    act(() => {
      result.current.setInitialAmount(1000);
    });

    expect(result.current.initialAmount).toBe(1000);
  });

  it('updates color', () => {
    const { result } = renderHook(() => useGoalForm());

    act(() => {
      result.current.setColor('#ff0000');
    });

    expect(result.current.color).toBe('#ff0000');
  });

  it('validates form correctly', () => {
    const { result } = renderHook(() => useGoalForm());

    expect(result.current.isValid).toBe(false);

    act(() => {
      result.current.setTitle('Goal');
      result.current.setTargetAmount(1000);
    });

    expect(result.current.isValid).toBe(true);
  });

  it('invalidates form with empty title', () => {
    const { result } = renderHook(() => useGoalForm());

    act(() => {
      result.current.setTitle('  ');
      result.current.setTargetAmount(1000);
    });

    expect(result.current.isValid).toBe(false);
  });

  it('validates form with zero target amount', () => {
    const { result } = renderHook(() => useGoalForm());

    act(() => {
      result.current.setTitle('Goal');
      result.current.setTargetAmount(0);
    });

    expect(result.current.isValid).toBe(true);
  });

  it('resets form to defaults', () => {
    const { result } = renderHook(() => useGoalForm());

    act(() => {
      result.current.setTitle('Goal');
      result.current.setTargetAmount(5000);
      result.current.setInitialAmount(1000);
      result.current.setColor('#ff0000');
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.title).toBe('');
    expect(result.current.targetAmount).toBe('');
    expect(result.current.initialAmount).toBe('');
    expect(result.current.color).toBe(DEFAULT_GOAL_COLOR);
  });

  it('loads data from goal', () => {
    const { result } = renderHook(() => useGoalForm());

    act(() => {
      result.current.loadFromGoal(mockGoal);
    });

    expect(result.current.title).toBe(mockGoal.title);
    expect(result.current.targetAmount).toBe(mockGoal.targetAmount);
    expect(result.current.initialAmount).toBe(mockGoal.initialAmount);
    expect(result.current.color).toBe(mockGoal.color);
  });

  it('truncates title to 80 characters when loading from goal', () => {
    const { result } = renderHook(() => useGoalForm());
    const longTitle = 'a'.repeat(100);

    act(() => {
      result.current.loadFromGoal({ ...mockGoal, title: longTitle });
    });

    expect(result.current.title).toBe('a'.repeat(80));
  });

  it('converts zero initial amount to empty string when loading', () => {
    const { result } = renderHook(() => useGoalForm());

    act(() => {
      result.current.loadFromGoal({ ...mockGoal, initialAmount: 0 });
    });

    expect(result.current.initialAmount).toBe('');
  });
});
