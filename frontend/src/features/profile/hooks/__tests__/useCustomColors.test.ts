import { renderHook, act } from '@testing-library/react';
import { useCustomColors } from '../useCustomColors';

const STORAGE_KEY = 'custom-goal-colors';

describe('useCustomColors', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty array when no colors stored', () => {
    const { result } = renderHook(() => useCustomColors());

    expect(result.current.colors).toEqual([]);
  });

  it('returns colors from localStorage', () => {
    const stored = [{ value: '#FF0000', label: 'Red' }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useCustomColors());

    expect(result.current.colors).toEqual(stored);
  });

  it('adds a color', () => {
    const { result } = renderHook(() => useCustomColors());

    act(() => {
      result.current.addColor('#FF0000', 'Red');
    });

    expect(result.current.colors).toEqual([{ value: '#FF0000', label: 'Red' }]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([
      { value: '#FF0000', label: 'Red' },
    ]);
  });

  it('uses hex as label when label is empty', () => {
    const { result } = renderHook(() => useCustomColors());

    act(() => {
      result.current.addColor('#FF0000', '');
    });

    expect(result.current.colors[0].label).toBe('#FF0000');
  });

  it('uses hex as label when label is whitespace', () => {
    const { result } = renderHook(() => useCustomColors());

    act(() => {
      result.current.addColor('#FF0000', '   ');
    });

    expect(result.current.colors[0].label).toBe('#FF0000');
  });

  it('trims label', () => {
    const { result } = renderHook(() => useCustomColors());

    act(() => {
      result.current.addColor('#FF0000', '  Red  ');
    });

    expect(result.current.colors[0].label).toBe('Red');
  });

  it('prevents duplicate colors (case-insensitive)', () => {
    const { result } = renderHook(() => useCustomColors());

    act(() => {
      result.current.addColor('#FF0000', 'Red');
    });

    let added: boolean;
    act(() => {
      added = result.current.addColor('#ff0000', 'Also Red');
    });

    expect(added!).toBe(false);
    expect(result.current.colors).toHaveLength(1);
  });

  it('returns true on successful add', () => {
    const { result } = renderHook(() => useCustomColors());

    let added: boolean;
    act(() => {
      added = result.current.addColor('#FF0000', 'Red');
    });

    expect(added!).toBe(true);
  });

  it('returns false when at max limit', () => {
    const colors = Array.from({ length: 20 }, (_, i) => ({
      value: `#${String(i).padStart(6, '0')}`,
      label: `Color ${i}`,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));

    const { result } = renderHook(() => useCustomColors());

    let added: boolean;
    act(() => {
      added = result.current.addColor('#FFFFFF', 'White');
    });

    expect(added!).toBe(false);
    expect(result.current.colors).toHaveLength(20);
  });

  it('exposes maxColors constant', () => {
    const { result } = renderHook(() => useCustomColors());

    expect(result.current.maxColors).toBe(20);
  });

  it('removes a color', () => {
    const stored = [
      { value: '#FF0000', label: 'Red' },
      { value: '#00FF00', label: 'Green' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useCustomColors());

    act(() => {
      result.current.removeColor('#FF0000');
    });

    expect(result.current.colors).toEqual([{ value: '#00FF00', label: 'Green' }]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([
      { value: '#00FF00', label: 'Green' },
    ]);
  });

  it('handles removing non-existent color gracefully', () => {
    const stored = [{ value: '#FF0000', label: 'Red' }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useCustomColors());

    act(() => {
      result.current.removeColor('#999999');
    });

    expect(result.current.colors).toEqual(stored);
  });

  it('syncs across multiple hook instances', () => {
    const { result: result1 } = renderHook(() => useCustomColors());
    const { result: result2 } = renderHook(() => useCustomColors());

    act(() => {
      result1.current.addColor('#FF0000', 'Red');
    });

    expect(result2.current.colors).toEqual([{ value: '#FF0000', label: 'Red' }]);
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'not valid json');

    const { result } = renderHook(() => useCustomColors());

    expect(result.current.colors).toEqual([]);
  });
});
