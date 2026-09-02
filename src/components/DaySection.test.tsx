import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Timestamp } from 'firebase/firestore';
import { format, subDays } from 'date-fns';
import { DaySection } from './DaySection';
import type { PeeEvent, FeedingEvent } from '../types/events';

function makePeeEvent(date: Date): PeeEvent {
  return {
    id: 'pee-1',
    babyId: 'baby-1',
    type: 'pee',
    timestamp: Timestamp.fromDate(date),
    createdBy: 'user-1',
    createdAt: Timestamp.fromDate(new Date()),
  };
}

function makeFeedingEvent(date: Date): FeedingEvent {
  return {
    id: 'feed-1',
    babyId: 'baby-1',
    type: 'feeding',
    feedingType: 'breast',
    leftCount: 1,
    rightCount: 0,
    timestamp: Timestamp.fromDate(date),
    createdBy: 'user-1',
    createdAt: Timestamp.fromDate(new Date()),
  };
}

describe('DaySection', () => {
  const today = new Date();

  it('should display "Today" label for today', () => {
    render(
      <DaySection
        date={today}
        events={[]}
        onEventClick={vi.fn()}
        onAddClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('should repeat the short date only next to a relative label', () => {
    const yesterday = subDays(today, 1);
    const older = subDays(today, 4);

    const { rerender } = render(
      <DaySection date={yesterday} events={[]} onEventClick={vi.fn()} onAddClick={vi.fn()} />,
    );
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    expect(screen.getByText(format(yesterday, 'MMM d'))).toBeInTheDocument();

    // An absolute label already spells the date out; repeating it overflowed
    // the row on a 320px screen.
    rerender(
      <DaySection date={older} events={[]} onEventClick={vi.fn()} onAddClick={vi.fn()} />,
    );
    expect(screen.getByText(format(older, 'EEEE, MMMM d'))).toBeInTheDocument();
    expect(screen.queryByText(format(older, 'MMM d'))).not.toBeInTheDocument();
  });

  it('should show summary badges for events', () => {
    const events = [
      makePeeEvent(today),
      makeFeedingEvent(today),
    ];

    render(
      <DaySection
        date={today}
        events={events}
        onEventClick={vi.fn()}
        onAddClick={vi.fn()}
      />,
    );

    const badges = screen.getAllByText('1');
    expect(badges).toHaveLength(2);
  });

  it('should show empty message when no events', () => {
    render(
      <DaySection
        date={today}
        events={[]}
        onEventClick={vi.fn()}
        onAddClick={vi.fn()}
      />,
    );

    expect(screen.getByText(/no events/i)).toBeInTheDocument();
  });

  it('should call onAddClick when add button is pressed', async () => {
    const user = userEvent.setup();
    const onAddClick = vi.fn();

    render(
      <DaySection
        date={today}
        events={[]}
        onEventClick={vi.fn()}
        onAddClick={onAddClick}
      />,
    );

    await user.click(screen.getByLabelText(/add event/i));
    expect(onAddClick).toHaveBeenCalledOnce();
  });

  it('should call onEventClick when an event is clicked', async () => {
    const user = userEvent.setup();
    const onEventClick = vi.fn();
    const event = makePeeEvent(today);

    render(
      <DaySection
        date={today}
        events={[event]}
        onEventClick={onEventClick}
        onAddClick={vi.fn()}
      />,
    );

    // The event timeline item has role="button" - find by text content
    await user.click(screen.getByText('Pees'));
    expect(onEventClick).toHaveBeenCalledWith(event);
  });
});
