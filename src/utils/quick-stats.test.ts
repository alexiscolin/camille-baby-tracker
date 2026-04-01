import { describe, it, expect, vi, afterEach } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  getTimeSinceLastFeeding,
  getFeedingBalance,
  getDiaperStatus,
  getAverageFeedingInterval,
  getDayNightSplit,
  getFeedingHourDistribution,
} from './quick-stats';
import type { FeedingEvent, PeeEvent, BabyEvent } from '../types/events';

function makeFeedingEvent(
  date: Date,
  leftCount: number = 1,
  rightCount: number = 0,
  duration?: number,
): FeedingEvent {
  const isBottle = leftCount === 0 && rightCount === 0;
  return {
    id: `f-${date.getTime()}-${Math.random()}`,
    babyId: 'baby-1',
    type: 'feeding',
    feedingType: isBottle ? 'bottle' : 'breast',
    leftCount,
    rightCount,
    timestamp: Timestamp.fromDate(date),
    createdBy: 'user-1',
    createdAt: Timestamp.fromDate(new Date()),
    ...(duration !== undefined ? { durationMinutes: duration } : {}),
  };
}

/** Shorthand for bottle events */
function makeBottleEvent(date: Date, duration?: number): FeedingEvent {
  return makeFeedingEvent(date, 0, 0, duration);
}

function makePeeEvent(date: Date): PeeEvent {
  return {
    id: `p-${date.getTime()}`,
    babyId: 'baby-1',
    type: 'pee',
    timestamp: Timestamp.fromDate(date),
    createdBy: 'user-1',
    createdAt: Timestamp.fromDate(new Date()),
  };
}

describe('getTimeSinceLastFeeding', () => {
  afterEach(() => vi.useRealTimers());

  it('should return null when no feedings exist', () => {
    expect(getTimeSinceLastFeeding([])).toBeNull();
  });

  it('should return time since most recent feeding', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 1, 12, 0));

    const events: BabyEvent[] = [
      makeFeedingEvent(new Date(2026, 3, 1, 10, 0)),
      makeFeedingEvent(new Date(2026, 3, 1, 8, 0)),
    ];

    const result = getTimeSinceLastFeeding(events);
    expect(result).not.toBeNull();
    expect(result!.minutes).toBe(120);
    expect(result!.label).toBe('2h ago');
  });

  it('should return "just now" for very recent feedings', () => {
    vi.useFakeTimers();
    const now = new Date(2026, 3, 1, 12, 0);
    vi.setSystemTime(now);

    const result = getTimeSinceLastFeeding([makeFeedingEvent(now)]);
    expect(result!.label).toBe('just now');
  });
});

describe('getFeedingBalance', () => {
  it('should sum leftCount and rightCount across events', () => {
    const now = new Date();
    const events: BabyEvent[] = [
      makeFeedingEvent(now, 1, 0),  // left only
      makeFeedingEvent(now, 1, 0),  // left only
      makeFeedingEvent(now, 0, 1),  // right only
      makeBottleEvent(now),         // bottle
    ];

    const balance = getFeedingBalance(events);
    expect(balance.left).toBe(2);
    expect(balance.right).toBe(1);
    expect(balance.bottle).toBe(1);
  });

  it('should count both sides from a single event', () => {
    const now = new Date();
    const events: BabyEvent[] = [
      makeFeedingEvent(now, 2, 1),  // left ×2, right ×1
    ];

    const balance = getFeedingBalance(events);
    expect(balance.left).toBe(2);
    expect(balance.right).toBe(1);
    expect(balance.bottle).toBe(0);
  });

  it('should suggest next side based on last event imbalance', () => {
    const events: BabyEvent[] = [
      makeFeedingEvent(new Date(2026, 3, 1, 10, 0), 1, 0),
      makeFeedingEvent(new Date(2026, 3, 1, 12, 0), 0, 1),
    ];

    const balance = getFeedingBalance(events);
    expect(balance.nextSide).toBe('left'); // last event was right-heavy
  });

  it('should suggest right when last event was left-heavy', () => {
    const events: BabyEvent[] = [
      makeFeedingEvent(new Date(2026, 3, 1, 12, 0), 2, 1),
    ];

    const balance = getFeedingBalance(events);
    expect(balance.nextSide).toBe('right');
  });

  it('should return null nextSide when last was bottle', () => {
    const events: BabyEvent[] = [
      makeBottleEvent(new Date()),
    ];

    const balance = getFeedingBalance(events);
    expect(balance.nextSide).toBeNull();
  });

  it('should return null nextSide when last event had equal counts', () => {
    const events: BabyEvent[] = [
      makeFeedingEvent(new Date(), 1, 1),
    ];

    const balance = getFeedingBalance(events);
    expect(balance.nextSide).toBeNull();
  });

  it('should handle empty events', () => {
    const balance = getFeedingBalance([]);
    expect(balance.left).toBe(0);
    expect(balance.right).toBe(0);
    expect(balance.nextSide).toBeNull();
  });
});

describe('getDiaperStatus', () => {
  afterEach(() => vi.useRealTimers());

  it('should return ok when pees meet expectation', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 1, 20, 0)); // 20:00 — expects ~6
    const now = new Date();
    const events = Array.from({ length: 7 }, () => makePeeEvent(now));
    expect(getDiaperStatus(events).status).toBe('ok');
  });

  it('should return warning when pees below 75% of expected', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 1, 20, 0)); // expects ~6
    const now = new Date();
    const events = Array.from({ length: 4 }, () => makePeeEvent(now)); // 4/6 = 67%
    expect(getDiaperStatus(events).status).toBe('warning');
  });

  it('should return alert when pees below 50% of expected', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 1, 20, 0)); // expects ~6
    const now = new Date();
    const events = [makePeeEvent(now), makePeeEvent(now)]; // 2/6 = 33%
    expect(getDiaperStatus(events).status).toBe('alert');
    expect(getDiaperStatus(events).count).toBe(2);
  });

  it('should only count pee events', () => {
    const now = new Date();
    const events: BabyEvent[] = [
      makePeeEvent(now),
      makeFeedingEvent(now, 1, 0),
      makeFeedingEvent(now, 0, 1),
    ];
    expect(getDiaperStatus(events).count).toBe(1);
  });

  it('should include a descriptive message', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 1, 18, 0));
    const now = new Date();
    const events = [makePeeEvent(now)];
    const result = getDiaperStatus(events);
    expect(result.message).toContain('1 wet diaper');
  });
});

describe('getAverageFeedingInterval', () => {
  it('should return null with fewer than 2 feedings', () => {
    const events = [makeFeedingEvent(new Date())];
    expect(getAverageFeedingInterval(events)).toBeNull();
  });

  it('should calculate average interval correctly', () => {
    const events: BabyEvent[] = [
      makeFeedingEvent(new Date(2026, 3, 1, 8, 0)),
      makeFeedingEvent(new Date(2026, 3, 1, 10, 0)),
      makeFeedingEvent(new Date(2026, 3, 1, 13, 0)),
    ];

    const result = getAverageFeedingInterval(events);
    expect(result).not.toBeNull();
    // (120 + 180) / 2 = 150 min = 2h30
    expect(result!.avgMinutes).toBe(150);
    expect(result!.label).toBe('2h30');
  });
});

describe('getDayNightSplit', () => {
  it('should categorize feedings as day (6-20) or night', () => {
    const events: BabyEvent[] = [
      makeFeedingEvent(new Date(2026, 3, 1, 7, 0)),   // day
      makeFeedingEvent(new Date(2026, 3, 1, 12, 0)),  // day
      makeFeedingEvent(new Date(2026, 3, 1, 19, 0)),  // day
      makeFeedingEvent(new Date(2026, 3, 1, 22, 0)),  // night
      makeFeedingEvent(new Date(2026, 3, 1, 3, 0)),   // night
    ];

    const split = getDayNightSplit(events);
    expect(split.day).toBe(3);
    expect(split.night).toBe(2);
    expect(split.dayPercent).toBe(60);
  });

  it('should handle no feedings', () => {
    const split = getDayNightSplit([]);
    expect(split.day).toBe(0);
    expect(split.night).toBe(0);
    expect(split.dayPercent).toBe(0);
  });
});

describe('getFeedingHourDistribution', () => {
  it('should bucket feedings by hour', () => {
    const events: BabyEvent[] = [
      makeFeedingEvent(new Date(2026, 3, 1, 8, 15)),
      makeFeedingEvent(new Date(2026, 3, 1, 8, 45)),
      makeFeedingEvent(new Date(2026, 3, 1, 14, 0)),
    ];

    const dist = getFeedingHourDistribution(events);
    expect(dist).toHaveLength(24);
    expect(dist[8].count).toBe(2);
    expect(dist[14].count).toBe(1);
    expect(dist[0].count).toBe(0);
  });
});
