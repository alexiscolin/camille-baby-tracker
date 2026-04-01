import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { groupEventsByDay } from './event-groups';
import type { PeeEvent, FeedingEvent } from '../types/events';

function makePeeEvent(date: Date, id: string): PeeEvent {
  return {
    id,
    babyId: 'baby-1',
    type: 'pee',
    timestamp: Timestamp.fromDate(date),
    createdBy: 'user-1',
    createdAt: Timestamp.fromDate(new Date()),
  };
}

function makeFeedingEvent(date: Date, id: string): FeedingEvent {
  return {
    id,
    babyId: 'baby-1',
    type: 'feeding',
    feedingType: 'breast',
    leftCount: 1,
    rightCount: 0,
    timestamp: Timestamp.fromDate(date),
    createdBy: 'user-1',
    createdAt: Timestamp.fromDate(new Date()),
  };
}

describe('groupEventsByDay', () => {
  it('should group events by their date key', () => {
    const day1 = new Date(2026, 2, 30, 10, 0);
    const day1b = new Date(2026, 2, 30, 14, 0);
    const day2 = new Date(2026, 2, 31, 9, 0);

    const events = [
      makePeeEvent(day1, '1'),
      makeFeedingEvent(day1b, '2'),
      makePeeEvent(day2, '3'),
    ];

    const groups = groupEventsByDay(events);

    expect(groups.size).toBe(2);
    expect(groups.get('2026-03-30')).toHaveLength(2);
    expect(groups.get('2026-03-31')).toHaveLength(1);
  });

  it('should return empty map for no events', () => {
    const groups = groupEventsByDay([]);
    expect(groups.size).toBe(0);
  });

  it('should handle single event', () => {
    const event = makePeeEvent(new Date(2026, 3, 1, 8, 0), '1');
    const groups = groupEventsByDay([event]);

    expect(groups.size).toBe(1);
    expect(groups.get('2026-04-01')).toHaveLength(1);
  });
});
