import type { FeedingEvent } from '../types/events';

/**
 * Raw Firestore document may contain legacy feedingType 'left'|'right'.
 * Normalizes it into the new model with leftCount/rightCount.
 */
export function normalizeFeedingEvent(raw: Record<string, unknown>): Partial<FeedingEvent> {
  const feedingType = raw.feedingType as string;

  if (feedingType === 'left') {
    return { ...raw, feedingType: 'breast', leftCount: 1, rightCount: 0 } as Partial<FeedingEvent>;
  }
  if (feedingType === 'right') {
    return { ...raw, feedingType: 'breast', leftCount: 0, rightCount: 1 } as Partial<FeedingEvent>;
  }

  return raw as Partial<FeedingEvent>;
}

/** Human-readable summary of which sides were used */
export function formatSides(event: FeedingEvent): string {
  if (event.feedingType === 'bottle') return 'Bottle';

  const parts: string[] = [];
  if (event.leftCount > 0) parts.push(event.leftCount > 1 ? `L×${event.leftCount}` : 'L');
  if (event.rightCount > 0) parts.push(event.rightCount > 1 ? `R×${event.rightCount}` : 'R');

  return parts.join(' + ') || 'Breast';
}

/** Determine which side to suggest next based on the last feeding event */
export function getNextSide(lastEvent: FeedingEvent): 'left' | 'right' | null {
  if (lastEvent.feedingType === 'bottle') return null;

  if (lastEvent.leftCount > lastEvent.rightCount) return 'right';
  if (lastEvent.rightCount > lastEvent.leftCount) return 'left';

  // Equal counts — no strong recommendation
  return null;
}
