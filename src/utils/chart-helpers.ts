import type { DailySummary, EventType } from '../types/events';
import type { ChartDataPoint } from './chart-data';
import { EVENT_CONFIG, EVENT_TYPES } from './event-config';

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
  if (chartData.length === 0) return { feeding: 0, pee: 0, poop: 0, medication: 0 };
  const len = chartData.length;
  return {
    feeding: Number((chartData.reduce((s, d) => s + d.feeding, 0) / len).toFixed(1)),
    pee: Number((chartData.reduce((s, d) => s + d.pee, 0) / len).toFixed(1)),
    poop: Number((chartData.reduce((s, d) => s + d.poop, 0) / len).toFixed(1)),
    medication: Number((chartData.reduce((s, d) => s + d.medication, 0) / len).toFixed(1)),
  };
}

export function computeDailyAverages(chartData: ChartDataPoint[]): Record<string, string> {
  if (chartData.length === 0) return { feeding: '0', pee: '0', poop: '0', medication: '0' };
  return Object.fromEntries(
    EVENT_TYPES.map((type) => {
      const total = chartData.reduce((sum, d) => sum + d[type], 0);
      return [type, (total / chartData.length).toFixed(1)];
    }),
  ) as Record<string, string>;
}
