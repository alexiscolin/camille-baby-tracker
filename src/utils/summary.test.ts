import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { computeSummary } from './summary';
import type { BabyEvent } from '../types/events';

function makeEvent(type: 'feeding' | 'pee' | 'poop' | 'medication'): BabyEvent {
  return {
    id: `${type}-${Math.random()}`,
    babyId: 'baby1',
    type,
    timestamp: Timestamp.fromDate(new Date()),
    createdBy: 'user1',
    createdAt: Timestamp.fromDate(new Date()),
  } as BabyEvent;
}

describe('computeSummary', () => {
  it('should count each event type', () => {
    const events = [
      makeEvent('feeding'),
      makeEvent('feeding'),
      makeEvent('pee'),
      makeEvent('poop'),
      makeEvent('medication'),
      makeEvent('medication'),
    ];
    const result = computeSummary(events);
    expect(result).toEqual({
      feeding: 2,
      pee: 1,
      poop: 1,
      medication: 2,
    });
  });

  it('should return zeros for empty array', () => {
    const result = computeSummary([]);
    expect(result).toEqual({
      feeding: 0,
      pee: 0,
      poop: 0,
      medication: 0,
    });
  });

  it('should handle single event type', () => {
    const events = [makeEvent('pee'), makeEvent('pee'), makeEvent('pee')];
    const result = computeSummary(events);
    expect(result.pee).toBe(3);
    expect(result.feeding).toBe(0);
  });
});
