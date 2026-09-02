import type { DailySummary, EventType } from '../types/events';
import type { ChartDataPoint } from './chart-data';
import { EVENT_CONFIG, EVENT_TYPES } from './event-config';
import { createEmptySummary } from './summary';

export type RangeType = '7d' | '14d' | '30d';
export type ChartType = 'bar' | 'line';

export function getRangeDays(range: RangeType): number {
  return range === '7d' ? 7 : range === '14d' ? 14 : 30;
}

export const CHART_COLORS: Record<EventType, string> = Object.fromEntries(
  EVENT_TYPES.map((t) => [t, EVENT_CONFIG[t].color]),
) as Record<EventType, string>;

/**
 * Recharts drops an item whose formatter returns null. Every multi-series chart
 * here has one series per event type or food group, and a real day uses one or
 * two of them — the default tooltip listed all six or seven, so it grew taller
 * than the card it lives in and spilled over the legend on a phone. Only the
 * series that actually carry a value are worth a row.
 */
export function hideZero(value: unknown): string | null {
  // Only an exact zero is dropped: anything that does not read as a number is
  // a label the chart meant to show, not an empty series.
  if (value == null || Number(value) === 0) return null;
  return String(value);
}

export const TOOLTIP_STYLE = {
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  fontSize: '13px',
  padding: '12px 16px',
} as const;

export function computeAverageSummary(chartData: ChartDataPoint[]): DailySummary {
  if (chartData.length === 0) return createEmptySummary();
  const len = chartData.length;
  return Object.fromEntries(
    EVENT_TYPES.map((type) => [
      type,
      Number((chartData.reduce((s, d) => s + d[type], 0) / len).toFixed(1)),
    ]),
  ) as DailySummary;
}

export function computeDailyAverages(chartData: ChartDataPoint[]): Record<string, string> {
  if (chartData.length === 0) {
    return Object.fromEntries(EVENT_TYPES.map((t) => [t, '0'])) as Record<string, string>;
  }
  return Object.fromEntries(
    EVENT_TYPES.map((type) => {
      const total = chartData.reduce((sum, d) => sum + d[type], 0);
      return [type, (total / chartData.length).toFixed(1)];
    }),
  ) as Record<string, string>;
}
