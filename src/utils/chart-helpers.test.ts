import { describe, it, expect } from 'vitest';
import {
  getRangeDays,
  computeAverageSummary,
  computeDailyAverages,
  CHART_COLORS,
  hideZero,
} from './chart-helpers';
import { createEmptySummary } from './summary';
import { EVENT_TYPES } from './event-config';
import type { ChartDataPoint } from './chart-data';

describe('getRangeDays', () => {
  it('should return 7 for "7d"', () => {
    expect(getRangeDays('7d')).toBe(7);
  });

  it('should return 14 for "14d"', () => {
    expect(getRangeDays('14d')).toBe(14);
  });

  it('should return 30 for "30d"', () => {
    expect(getRangeDays('30d')).toBe(30);
  });
});

describe('CHART_COLORS', () => {
  it('should have all event types', () => {
    for (const type of EVENT_TYPES) {
      expect(CHART_COLORS).toHaveProperty(type);
    }
  });
});

function makeChartPoint(overrides: Partial<ChartDataPoint> = {}): ChartDataPoint {
  return {
    date: '2025-03-01',
    label: 'Mar 1',
    ...createEmptySummary(),
    ...overrides,
  };
}

describe('computeAverageSummary', () => {
  it('should return zeros for empty data', () => {
    const result = computeAverageSummary([]);
    expect(result).toEqual(createEmptySummary());
  });

  it('should compute correct averages', () => {
    const data = [
      makeChartPoint({ feeding: 8, pee: 6, poop: 2, medication: 1 }),
      makeChartPoint({ feeding: 10, pee: 8, poop: 4, medication: 1 }),
    ];
    const result = computeAverageSummary(data);
    expect(result.feeding).toBe(9);
    expect(result.pee).toBe(7);
    expect(result.poop).toBe(3);
    expect(result.medication).toBe(1);
  });
});

describe('computeDailyAverages', () => {
  it('should return "0" strings for empty data', () => {
    const result = computeDailyAverages([]);
    expect(result.feeding).toBe('0');
  });

  it('should compute string averages', () => {
    const data = [
      makeChartPoint({ feeding: 8 }),
      makeChartPoint({ feeding: 10 }),
      makeChartPoint({ feeding: 6 }),
    ];
    const result = computeDailyAverages(data);
    expect(result.feeding).toBe('8.0');
  });
});

/**
 * Recharts skips a tooltip row whose formatter returns null. Every series of a
 * stacked day chart is in the payload, so without this the tooltip listed one
 * "0" row per unused event type and outgrew the card on a phone.
 */
describe('hideZero', () => {
  it('should drop a zero row and keep everything else', () => {
    expect(hideZero(0)).toBeNull();
    expect(hideZero('0')).toBeNull();
    expect(hideZero(5)).toBe('5');
    expect(hideZero(0.4)).toBe('0.4');
  });

  it('should keep a value it cannot read as a number', () => {
    expect(hideZero('left')).toBe('left');
  });
});
