import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { computeSummary, createEmptySummary } from './summary';
import type { BabyEvent, EventType } from '../types/events';

function makeEvent(type: EventType): BabyEvent {
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
      makeEvent('bath'),
    ];
    const result = computeSummary(events);
    expect(result).toEqual({
      ...createEmptySummary(),
      feeding: 2,
      pee: 1,
      poop: 1,
      medication: 2,
      bath: 1,
    });
  });

  it('should return zeros for empty array', () => {
    const result = computeSummary([]);
    expect(result).toEqual(createEmptySummary());
  });

  it('should handle single event type', () => {
    const events = [makeEvent('pee'), makeEvent('pee'), makeEvent('pee')];
    const result = computeSummary(events);
    expect(result.pee).toBe(3);
    expect(result.feeding).toBe(0);
  });
});
