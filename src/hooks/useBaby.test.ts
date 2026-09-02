import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';
import { useBaby } from './useBaby';
import { subscribeToBaby } from '../services/family';
import type { Baby } from '../types/events';

vi.mock('../services/family', () => ({
  subscribeToBaby: vi.fn(),
}));

const subscribe = vi.mocked(subscribeToBaby);

/**
 * One total implementation for the whole file. Swapping it per test races with
 * testing-library's unmount of the previous test's hook, which reaches the mock
 * after the new implementation is in place.
 */
let push: ((baby: Baby | null) => void) | undefined;
const unsubscribe = vi.fn();

beforeEach(() => {
  push = undefined;
  unsubscribe.mockClear();
  subscribe.mockReset();
  subscribe.mockImplementation((_familyId, _babyId, onNext) => {
    push = onNext;
    onNext(makeBaby());
    return unsubscribe;
  });
});

function makeBaby(overrides: Partial<Baby> = {}): Baby {
  return {
    id: 'baby-1',
    firstName: 'Camille',
    birthDate: Timestamp.fromDate(new Date(2026, 2, 20)),
    createdAt: Timestamp.fromDate(new Date(2026, 2, 20)),
    ...overrides,
  };
}

describe('useBaby', () => {
  /**
   * A one-shot read left every consumer holding the document as it was at
   * mount: Settings could write a preference and then re-render from the stale
   * copy, which is what made a just-unticked event type tick itself back.
   */
  it('should follow the document after the first read', async () => {
    const { result } = renderHook(() => useBaby('fam-1', 'baby-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.baby?.hiddenEventTypes).toBeUndefined();

    act(() => push?.(makeBaby({ hiddenEventTypes: ['feeding'] })));

    expect(result.current.baby?.hiddenEventTypes).toEqual(['feeding']);
  });

  it('should unsubscribe when it unmounts', async () => {
    const { unmount } = renderHook(() => useBaby('fam-1', 'baby-1'));
    await waitFor(() => expect(subscribe).toHaveBeenCalled());

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('should stop loading when there is no family or baby yet', async () => {
    const { result } = renderHook(() => useBaby(undefined, undefined));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(subscribe).not.toHaveBeenCalled();
  });
});
