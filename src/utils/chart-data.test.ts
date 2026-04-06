import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { buildChartData } from './chart-data';
import type { BabyEvent, EventType } from '../types/events';

function makeEvent(type: EventType, dateStr: string): BabyEvent {
  const date = new Date(dateStr);
  return {
    id: `${type}-${dateStr}`,
    babyId: 'baby1',
    type,
    timestamp: Timestamp.fromDate(date),
    createdBy: 'user1',
    createdAt: Timestamp.fromDate(date),
  } as BabyEvent;
}

describe('buildChartData', () => {
  it('should return one point per day in the range', () => {
    const start = new Date('2025-03-01');
    const end = new Date('2025-03-03');
    const result = buildChartData([], start, end);
    expect(result).toHaveLength(3);
    expect(result[0].date).toBe('2025-03-01');
    expect(result[1].date).toBe('2025-03-02');
    expect(result[2].date).toBe('2025-03-03');
  });

  it('should count events correctly by type', () => {
    const start = new Date('2025-03-01');
    const end = new Date('2025-03-01');
    const events = [
      makeEvent('feeding', '2025-03-01T08:00:00'),
      makeEvent('feeding', '2025-03-01T10:00:00'),
      makeEvent('pee', '2025-03-01T09:00:00'),
      makeEvent('poop', '2025-03-01T11:00:00'),
      makeEvent('medication', '2025-03-01T12:00:00'),
    ];
    const result = buildChartData(events, start, end);
    expect(result).toHaveLength(1);
    expect(result[0].feeding).toBe(2);
    expect(result[0].pee).toBe(1);
    expect(result[0].poop).toBe(1);
    expect(result[0].medication).toBe(1);
  });

  it('should set zeros for days with no events', () => {
    const start = new Date('2025-03-01');
    const end = new Date('2025-03-03');
    const events = [makeEvent('feeding', '2025-03-02T08:00:00')];
    const result = buildChartData(events, start, end);
    expect(result[0].feeding).toBe(0);
    expect(result[1].feeding).toBe(1);
    expect(result[2].feeding).toBe(0);
  });

  it('should ignore events outside the date range', () => {
    const start = new Date('2025-03-02');
    const end = new Date('2025-03-02');
    const events = [
      makeEvent('feeding', '2025-03-01T23:00:00'),
      makeEvent('feeding', '2025-03-02T08:00:00'),
      makeEvent('feeding', '2025-03-03T01:00:00'),
    ];
    const result = buildChartData(events, start, end);
    expect(result).toHaveLength(1);
    expect(result[0].feeding).toBe(1);
  });

  it('should count bath events', () => {
    const start = new Date('2025-03-01');
    const end = new Date('2025-03-01');
    const events = [
      makeEvent('bath', '2025-03-01T18:00:00'),
      makeEvent('bath', '2025-03-01T19:00:00'),
    ];
    const result = buildChartData(events, start, end);
    expect(result[0].bath).toBe(2);
  });

  it('should have correct label format', () => {
    const start = new Date('2025-03-01');
    const end = new Date('2025-03-01');
    const result = buildChartData([], start, end);
    expect(result[0].label).toBe('Mar 1');
  });
});
