import { format, eachDayOfInterval } from 'date-fns';
import type { BabyEvent, EventType } from '../types/events';

export interface ChartDataPoint {
  date: string;
  label: string;
  feeding: number;
  pee: number;
  poop: number;
  medication: number;
}

export function buildChartData(
  events: BabyEvent[],
  startDate: Date,
  endDate: Date,
): ChartDataPoint[] {
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const grouped = new Map<string, Record<EventType, number>>();

  for (const day of days) {
    const key = format(day, 'yyyy-MM-dd');
    grouped.set(key, { feeding: 0, pee: 0, poop: 0, medication: 0 });
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
