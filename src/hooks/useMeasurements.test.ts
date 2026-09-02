import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMeasurements } from './useMeasurements';
import { subscribeToMeasurements } from '../services/measurements';

vi.mock('../services/measurements', () => ({
  subscribeToMeasurements: vi.fn(),
}));

const subscribe = vi.mocked(subscribeToMeasurements);

describe('useMeasurements', () => {
  beforeEach(() => {
    subscribe.mockReset();
  });

  /**
   * A rejected subscription used to be discarded, so a family member whose read
   * was refused saw the same empty chart as a family with nothing logged yet.
   */
  it('should surface a subscription failure instead of reporting an empty list', async () => {
    subscribe.mockImplementation((_familyId, _babyId, _onNext, onError) => {
      onError?.(new Error('Missing or insufficient permissions.'));
      return () => {};
    });

    const { result } = renderHook(() => useMeasurements('fam-1', 'baby-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Missing or insufficient permissions.');
    expect(result.current.measurements).toEqual([]);
  });

  it('should clear the error once a snapshot arrives', async () => {
    subscribe.mockImplementation((_familyId, _babyId, onNext) => {
      onNext({ measurements: [], fromCache: false, hasPendingWrites: false });
      return () => {};
    });

    const { result } = renderHook(() => useMeasurements('fam-1', 'baby-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
  });
});
