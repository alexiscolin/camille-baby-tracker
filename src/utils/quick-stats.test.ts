import { describe, it, expect, vi, afterEach } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  getTimeSinceLastFeeding,
  getFeedingBalance,
  getDiaperStatus,
  getAverageFeedingInterval,
  getDayNightSplit,
  getFeedingHourDistribution,
  getTimeSinceLastEvent,
  isTypeActive,
  getNewFoodsCount,
  getAcceptanceRate,
  getLastMilestone,
  getMealSlotDistribution,
  buildAcceptanceTrend,
} from './quick-stats';
import type {
  FeedingEvent, PeeEvent, BabyEvent, BathEvent, MilestoneEvent,
} from '../types/events';
import type { Acceptance, MealEvent } from '../types/food';

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

// ─── Relevance-driven tiles ───

function makeMealEvent(
  date: Date,
  items: { foodId: string; firstTry?: boolean; acceptance?: Acceptance }[] = [],
): MealEvent {
  return {
    id: `m-${date.getTime()}-${Math.random()}`,
    babyId: 'baby-1',
    type: 'meal',
    mealSlot: 'lunch',
    items: items.map((i) => ({
      foodId: i.foodId,
      name: i.foodId,
      quantity: 1,
      unit: 'tsp',
      ...(i.firstTry !== undefined ? { firstTry: i.firstTry } : {}),
      ...(i.acceptance !== undefined ? { acceptance: i.acceptance } : {}),
    })),
    timestamp: Timestamp.fromDate(date),
    createdBy: 'user-1',
    createdAt: Timestamp.fromDate(new Date()),
  };
}

function makeBathEvent(date: Date): BathEvent {
  return {
    id: `b-${date.getTime()}`,
    babyId: 'baby-1',
    type: 'bath',
    timestamp: Timestamp.fromDate(date),
    createdBy: 'user-1',
    createdAt: Timestamp.fromDate(new Date()),
  };
}

function makeMilestoneEvent(date: Date, title: string): MilestoneEvent {
  return {
    id: `ms-${date.getTime()}`,
    babyId: 'baby-1',
    type: 'milestone',
    title,
    timestamp: Timestamp.fromDate(date),
    createdBy: 'user-1',
    createdAt: Timestamp.fromDate(new Date()),
  };
}

const NOW = new Date('2025-06-15T12:00:00');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);

describe('isTypeActive', () => {
  it('should be false when no event of that type exists', () => {
    expect(isTypeActive([makeBathEvent(daysAgo(1))], 'meal', 7, NOW)).toBe(false);
  });

  it('should be true when an event falls inside the lookback window', () => {
    expect(isTypeActive([makeBathEvent(daysAgo(10))], 'bath', 14, NOW)).toBe(true);
  });

  it('should be false when the only event is older than the lookback window', () => {
    expect(isTypeActive([makeBathEvent(daysAgo(20))], 'bath', 14, NOW)).toBe(false);
  });

  it('should judge each type on its own window', () => {
    const events: BabyEvent[] = [makeFeedingEvent(daysAgo(20)), makeMealEvent(daysAgo(1))];
    expect(isTypeActive(events, 'feeding', 7, NOW)).toBe(false);
    expect(isTypeActive(events, 'meal', 7, NOW)).toBe(true);
  });
});

describe('getNewFoodsCount', () => {
  it('should return 0 without meals', () => {
    expect(getNewFoodsCount([], 7, NOW)).toBe(0);
  });

  it('should count only items flagged as a first try', () => {
    const events: BabyEvent[] = [
      makeMealEvent(daysAgo(1), [
        { foodId: 'carrot', firstTry: true },
        { foodId: 'rice' },
      ]),
    ];
    expect(getNewFoodsCount(events, 7, NOW)).toBe(1);
  });

  it('should count a food once even if flagged twice', () => {
    const events: BabyEvent[] = [
      makeMealEvent(daysAgo(1), [{ foodId: 'carrot', firstTry: true }]),
      makeMealEvent(daysAgo(2), [{ foodId: 'carrot', firstTry: true }]),
    ];
    expect(getNewFoodsCount(events, 7, NOW)).toBe(1);
  });

  it('should ignore meals older than the window', () => {
    const events: BabyEvent[] = [
      makeMealEvent(daysAgo(30), [{ foodId: 'carrot', firstTry: true }]),
    ];
    expect(getNewFoodsCount(events, 7, NOW)).toBe(0);
  });
});

describe('getAcceptanceRate', () => {
  it('should return null when no item carries an acceptance', () => {
    const events: BabyEvent[] = [makeMealEvent(daysAgo(1), [{ foodId: 'carrot' }])];
    expect(getAcceptanceRate(events, 7, NOW)).toBeNull();
  });

  it('should count "all" and "most" as eaten', () => {
    const events: BabyEvent[] = [
      makeMealEvent(daysAgo(1), [
        { foodId: 'a', acceptance: 'all' },
        { foodId: 'b', acceptance: 'most' },
        { foodId: 'c', acceptance: 'refused' },
        { foodId: 'd', acceptance: 'taste' },
      ]),
    ];
    expect(getAcceptanceRate(events, 7, NOW)).toEqual({ percent: 50, sampled: 4 });
  });

  it('should ignore items with no acceptance recorded', () => {
    const events: BabyEvent[] = [
      makeMealEvent(daysAgo(1), [
        { foodId: 'a', acceptance: 'all' },
        { foodId: 'b' },
      ]),
    ];
    expect(getAcceptanceRate(events, 7, NOW)).toEqual({ percent: 100, sampled: 1 });
  });

  it('should ignore meals older than the window', () => {
    const events: BabyEvent[] = [
      makeMealEvent(daysAgo(30), [{ foodId: 'a', acceptance: 'all' }]),
    ];
    expect(getAcceptanceRate(events, 7, NOW)).toBeNull();
  });
});

describe('getLastMilestone', () => {
  it('should return null without milestones', () => {
    expect(getLastMilestone([], NOW)).toBeNull();
  });

  it('should return the most recent milestone with its title', () => {
    const events: BabyEvent[] = [
      makeMilestoneEvent(daysAgo(30), 'First tooth'),
      makeMilestoneEvent(daysAgo(3), 'First steps'),
    ];
    expect(getLastMilestone(events, NOW)).toEqual({ title: 'First steps', label: '3d ago' });
  });
});

describe('formatMinutes (via getTimeSinceLastEvent)', () => {
  it('should switch to days beyond 48h rather than pile up hours', () => {
    const result = getTimeSinceLastEvent([makeBathEvent(daysAgo(5))], 'bath', NOW);
    expect(result!.label).toBe('5d ago');
  });

  it('should keep hours below 48h', () => {
    const at = new Date(NOW.getTime() - 30 * 60 * 60 * 1000);
    const result = getTimeSinceLastEvent([makeBathEvent(at)], 'bath', NOW);
    expect(result!.label).toBe('30h ago');
  });
});

describe('getMealSlotDistribution', () => {
  it('should return every slot, zeroed, without meals', () => {
    expect(getMealSlotDistribution([])).toEqual([
      { slot: 'breakfast', label: 'Breakfast', count: 0 },
      { slot: 'lunch', label: 'Lunch', count: 0 },
      { slot: 'dinner', label: 'Dinner', count: 0 },
      { slot: 'snack', label: 'Snack', count: 0 },
    ]);
  });

  it('should count meals per slot', () => {
    const events: BabyEvent[] = [
      { ...makeMealEvent(daysAgo(1)), mealSlot: 'breakfast' },
      { ...makeMealEvent(daysAgo(2)), mealSlot: 'dinner' },
      { ...makeMealEvent(daysAgo(3)), mealSlot: 'dinner' },
    ];
    const rows = getMealSlotDistribution(events);
    expect(rows.find((r) => r.slot === 'breakfast')!.count).toBe(1);
    expect(rows.find((r) => r.slot === 'dinner')!.count).toBe(2);
    expect(rows.find((r) => r.slot === 'lunch')!.count).toBe(0);
  });
});

describe('buildAcceptanceTrend', () => {
  const days = [
    { date: '2025-06-14', label: 'Sat' },
    { date: '2025-06-15', label: 'Sun' },
  ];

  it('should return null for days without a recorded acceptance', () => {
    expect(buildAcceptanceTrend([], days)).toEqual([
      { date: '2025-06-14', label: 'Sat', percent: null },
      { date: '2025-06-15', label: 'Sun', percent: null },
    ]);
  });

  it('should compute the eaten share per day', () => {
    const events: BabyEvent[] = [
      makeMealEvent(new Date('2025-06-15T09:00:00'), [
        { foodId: 'a', acceptance: 'all' },
        { foodId: 'b', acceptance: 'refused' },
      ]),
    ];
    const rows = buildAcceptanceTrend(events, days);
    expect(rows[0].percent).toBeNull();
    expect(rows[1].percent).toBe(50);
  });
});
