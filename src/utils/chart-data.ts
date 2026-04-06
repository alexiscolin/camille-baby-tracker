import { format, eachDayOfInterval } from 'date-fns';
import type { BabyEvent, EventType, DailySummary } from '../types/events';
import { createEmptySummary } from './summary';

export type ChartDataPoint = { date: string; label: string } & DailySummary;

export function buildChartData(
  events: BabyEvent[],
  startDate: Date,
  endDate: Date,
): ChartDataPoint[] {
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const grouped = new Map<string, Record<EventType, number>>();

  for (const day of days) {
    const key = format(day, 'yyyy-MM-dd');
    grouped.set(key, createEmptySummary());
  }

  for (const event of events) {
    const key = format(event.timestamp.toDate(), 'yyyy-MM-dd');
    const counts = grouped.get(key);
    if (counts) {
      counts[event.type]++;
    }
  }

  return days.map((day) => {
    const key = format(day, 'yyyy-MM-dd');
    const counts = grouped.get(key)!;
    return {
      date: key,
      label: format(day, 'MMM d'),
      ...counts,
    };
  });
}
