import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { buildChartData } from '../../src/utils/chart-data';
import type { BabyEvent } from '../../src/types/events';

function makeEvent(type: BabyEvent['type'], date: Date): BabyEvent {
  return {
    id: `${type}-${date.toISOString()}`,
    babyId: 'baby1',
    type,
    timestamp: Timestamp.fromDate(date),
    createdBy: 'user1',
    createdAt: Timestamp.now(),
  } as BabyEvent;
}

describe('buildChartData', () => {
  it('should return one entry per day in the range', () => {
    const start = new Date(2026, 2, 10);
    const end = new Date(2026, 2, 12);
    const result = buildChartData([], start, end);

    expect(result).toHaveLength(3);
    expect(result[0].date).toBe('2026-03-10');
    expect(result[1].date).toBe('2026-03-11');
    expect(result[2].date).toBe('2026-03-12');
  });

  it('should count events by type per day', () => {
    const start = new Date(2026, 2, 10);
    const end = new Date(2026, 2, 10);

    const events: BabyEvent[] = [
      makeEvent('feeding', new Date(2026, 2, 10, 8, 0)),
      makeEvent('feeding', new Date(2026, 2, 10, 12, 0)),
      makeEvent('pee', new Date(2026, 2, 10, 9, 0)),
      makeEvent('poop', new Date(2026, 2, 10, 10, 0)),
    ];

    const result = buildChartData(events, start, end);

    expect(result).toHaveLength(1);
    expect(result[0].feeding).toBe(2);
    expect(result[0].pee).toBe(1);
    expect(result[0].poop).toBe(1);
    expect(result[0].medication).toBe(0);
  });

  it('should initialize days with zero counts when no events', () => {
    const start = new Date(2026, 2, 10);
    const end = new Date(2026, 2, 10);
    const result = buildChartData([], start, end);

    expect(result[0].feeding).toBe(0);
    expect(result[0].pee).toBe(0);
    expect(result[0].poop).toBe(0);
    expect(result[0].medication).toBe(0);
  });

  it('should distribute events across correct days', () => {
    const start = new Date(2026, 2, 10);
    const end = new Date(2026, 2, 12);

    const events: BabyEvent[] = [
      makeEvent('feeding', new Date(2026, 2, 10, 8, 0)),
      makeEvent('feeding', new Date(2026, 2, 12, 14, 0)),
    ];

    const result = buildChartData(events, start, end);

    expect(result[0].feeding).toBe(1);
    expect(result[1].feeding).toBe(0);
    expect(result[2].feeding).toBe(1);
  });
});
