import type { BabyEvent, DailySummary } from '../types/events';
import { EVENT_TYPES } from './event-config';

export function createEmptySummary(): DailySummary {
  return Object.fromEntries(EVENT_TYPES.map((t) => [t, 0])) as DailySummary;
}

export function computeSummary(events: BabyEvent[]): DailySummary {
  return events.reduce<DailySummary>(
    (acc, event) => {
      acc[event.type]++;
      return acc;
    },
    createEmptySummary(),
  );
}
