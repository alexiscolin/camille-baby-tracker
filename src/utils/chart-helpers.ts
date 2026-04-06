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
