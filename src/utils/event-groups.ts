import type { BabyEvent } from '../types/events';
import { getDayKey } from './date';

export function groupEventsByDay(events: BabyEvent[]): Map<string, BabyEvent[]> {
  const groups = new Map<string, BabyEvent[]>();
  for (const event of events) {
    const key = getDayKey(event.timestamp.toDate());
    const existing = groups.get(key) || [];
    existing.push(event);
    groups.set(key, existing);
  }
  return groups;
}
