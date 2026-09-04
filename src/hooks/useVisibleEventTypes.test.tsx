import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisibleEventTypesProvider } from '../components/VisibleEventTypesProvider';
import { RATE_EVENT_TYPES } from '../utils/event-config';
import { DaySection } from '../components/DaySection';
import { ActivityRadar } from '../components/ActivityRadar';
import { EVENT_TYPES } from '../utils/event-config';
import { createEmptySummary } from '../utils/summary';
import { Timestamp } from 'firebase/firestore';
import type { BabyEvent, FeedingEvent } from '../types/events';
import type { MealEvent } from '../types/food';

const today = new Date();

function feeding(): FeedingEvent {
  return {
    id: 'f1', babyId: 'b1', type: 'feeding', feedingType: 'breast',
    leftCount: 1, rightCount: 0,
    timestamp: Timestamp.fromDate(today), createdBy: 'u1',
    createdAt: Timestamp.fromDate(today),
  };
}

function meal(): MealEvent {
  return {
    id: 'm1', babyId: 'b1', type: 'meal', mealSlot: 'lunch', items: [],
    timestamp: Timestamp.fromDate(today), createdBy: 'u1',
    createdAt: Timestamp.fromDate(today),
  } as MealEvent;
}

function renderDay(events: BabyEvent[], hidden: Parameters<typeof VisibleEventTypesProvider>[0]['hidden']) {
  return render(
    <VisibleEventTypesProvider hidden={hidden}>
      <DaySection date={today} events={events} onEventClick={() => {}} onAddClick={() => {}} />
    </VisibleEventTypesProvider>,
  );
}

describe('hiding an event type', () => {
  it('should drop its day-summary badge while leaving the event in the log', () => {
    const { container } = renderDay([feeding(), meal()], ['feeding']);

    // Two events logged, one badge: the feeding is still listed, not counted.
    expect(container.querySelectorAll('[class*="badge"]')).toHaveLength(1);
    expect(screen.getAllByText(/feedings/i).length).toBeGreaterThan(0);
  });

  it('should still count a tracked type', () => {
    const { container } = renderDay([feeding(), meal()], []);
    expect(container.querySelectorAll('[class*="badge"]')).toHaveLength(2);
  });

  /** A radar of two axes is a line, of one a dot. */
  it('should hide the activity radar once fewer than three types are tracked', () => {
    const summary = createEmptySummary();
    const fourHidden = EVENT_TYPES.slice(0, 4);

    const { container: withRadar } = render(
      <VisibleEventTypesProvider hidden={EVENT_TYPES.slice(0, 3)}>
        <ActivityRadar today={summary} average={summary} />
      </VisibleEventTypesProvider>,
    );
    expect(withRadar).not.toBeEmptyDOMElement();

    const { container: withoutRadar } = render(
      <VisibleEventTypesProvider hidden={fourHidden}>
        <ActivityRadar today={summary} average={summary} />
      </VisibleEventTypesProvider>,
    );
    expect(withoutRadar).toBeEmptyDOMElement();
  });
});

/**
 * A milestone belongs in the chronology and nowhere in the statistics: it
 * happens once, so a per-day average or a chart series for it is noise.
 */
describe('milestones and the rate surfaces', () => {
  it('should not be one of the types that get counted per day', () => {
    expect(RATE_EVENT_TYPES).not.toContain('milestone');
  });

  it('should still be offered, and shown, like any other type', () => {
    expect(EVENT_TYPES).toContain('milestone');
  });
});
