import type { BabyEvent, DailySummary } from '../types/events';

export function computeSummary(events: BabyEvent[]): DailySummary {
  return events.reduce<DailySummary>(
    (acc, event) => {
      acc[event.type]++;
      return acc;
    },
    { feeding: 0, pee: 0, poop: 0, medication: 0 },
  );
}
