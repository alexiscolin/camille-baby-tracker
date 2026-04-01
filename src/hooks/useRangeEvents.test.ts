import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRangeEvents } from './useRangeEvents';

const mockSubscribe = vi.fn();

vi.mock('../services/events', () => ({
  subscribeToEvents: (...args: unknown[]) => mockSubscribe(...args),
}));

describe('useRangeEvents', () => {
  const start = new Date('2026-03-01');
  const end = new Date('2026-03-07');

  beforeEach(() => {
    vi.clearAllMocks();
    mockSubscribe.mockReturnValue(vi.fn()); // unsubscribe function
  });

  it('should start in loading state', () => {
    const { result } = renderHook(() =>
      useRangeEvents('fam-1', 'baby-1', start, end),
    );
    expect(result.current.loading).toBe(true);
    expect(result.current.events).toEqual([]);
  });

  it('should return events from subscription callback', async () => {
    const fakeEvents = [{ id: '1', type: 'pee' }];
    mockSubscribe.mockImplementation(
      (_fam: string, _baby: string, _start: Date, _end: Date, callback: (result: { events: unknown[]; fromCache: boolean; hasPendingWrites: boolean }) => void) => {
        callback({ events: fakeEvents, fromCache: false, hasPendingWrites: false });
        return vi.fn();
      },
    );

    const { result } = renderHook(() =>
      useRangeEvents('fam-1', 'baby-1', start, end),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.events).toEqual(fakeEvents);
    expect(result.current.fromCache).toBe(false);
  });

  it('should not subscribe when familyId is undefined', () => {
    const { result } = renderHook(() =>
      useRangeEvents(undefined, 'baby-1', start, end),
    );
    expect(mockSubscribe).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it('should not subscribe when babyId is undefined', () => {
    const { result } = renderHook(() =>
      useRangeEvents('fam-1', undefined, start, end),
    );
    expect(mockSubscribe).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it('should unsubscribe on unmount', () => {
    const unsubscribe = vi.fn();
    mockSubscribe.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() =>
      useRangeEvents('fam-1', 'baby-1', start, end),
    );

    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('should set error state when subscription fails', async () => {
    const testError = new Error('Permission denied');
    mockSubscribe.mockImplementation(
      (_fam: string, _baby: string, _start: Date, _end: Date, _callback: unknown, onError: (err: Error) => void) => {
        onError(testError);
        return vi.fn();
      },
    );

    const { result } = renderHook(() =>
      useRangeEvents('fam-1', 'baby-1', start, end),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe(testError);
  });

  it('should set fromCache when data is from cache', async () => {
    mockSubscribe.mockImplementation(
      (_fam: string, _baby: string, _start: Date, _end: Date, callback: (result: { events: unknown[]; fromCache: boolean; hasPendingWrites: boolean }) => void) => {
        callback({ events: [], fromCache: true, hasPendingWrites: false });
        return vi.fn();
      },
    );

    const { result } = renderHook(() =>
      useRangeEvents('fam-1', 'baby-1', start, end),
    );

    await waitFor(() => {
      expect(result.current.fromCache).toBe(true);
    });
  });
});
