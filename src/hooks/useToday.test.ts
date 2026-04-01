import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToday } from './useToday';

describe('useToday', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return a Date for today', () => {
    const { result } = renderHook(() => useToday());
    const now = new Date();
    expect(result.current.getDate()).toBe(now.getDate());
    expect(result.current.getMonth()).toBe(now.getMonth());
    expect(result.current.getFullYear()).toBe(now.getFullYear());
  });

  it('should update at midnight', () => {
    vi.useFakeTimers();
    // Set time to 23:59:59.500
    vi.setSystemTime(new Date(2026, 3, 1, 23, 59, 59, 500));

    const { result } = renderHook(() => useToday());
    expect(result.current.getDate()).toBe(1);

    // Advance past midnight
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.getDate()).toBe(2);
  });

  it('should clean up timer on unmount', () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');

    const { unmount } = renderHook(() => useToday());
    unmount();

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
