import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { computeSummary } from '../../src/utils/summary';
import type { BabyEvent } from '../../src/types/events';

function makeEvent(type: BabyEvent['type']): BabyEvent {
  return {
    id: `${type}-${Math.random()}`,
    babyId: 'baby1',
    type,
    timestamp: Timestamp.now(),
    createdBy: 'user1',
    createdAt: Timestamp.now(),
  } as BabyEvent;
}

describe('computeSummary', () => {
  it('should return zero counts for empty events', () => {
    const result = computeSummary([]);
    expect(result).toEqual({ feeding: 0, pee: 0, poop: 0, medication: 0 });
  });

  it('should count events by type', () => {
    const events: BabyEvent[] = [
      makeEvent('feeding'),
      makeEvent('feeding'),
      makeEvent('feeding'),
      makeEvent('pee'),
      makeEvent('pee'),
      makeEvent('poop'),
      makeEvent('medication'),
    ];

    const result = computeSummary(events);

    expect(result).toEqual({
      feeding: 3,
      pee: 2,
      poop: 1,
      medication: 1,
    });
  });

  it('should handle single event type', () => {
    const events: BabyEvent[] = [
      makeEvent('pee'),
      makeEvent('pee'),
    ];

    const result = computeSummary(events);

    expect(result.pee).toBe(2);
    expect(result.feeding).toBe(0);
    expect(result.poop).toBe(0);
    expect(result.medication).toBe(0);
  });
});
