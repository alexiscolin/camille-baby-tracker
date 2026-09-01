import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Timestamp } from 'firebase/firestore';
import { EventTimeline } from './EventTimeline';
import type { FeedingEvent, PeeEvent } from '../types/events';
import type { MealEvent, MealItem } from '../types/food';

function makeMealEvent(items: MealItem[]): MealEvent {
  return {
    id: 'evt-meal',
    babyId: 'baby-1',
    type: 'meal',
    mealSlot: 'lunch',
    items,
    timestamp: Timestamp.fromDate(new Date()),
    createdBy: 'user-1',
    createdAt: Timestamp.fromDate(new Date()),
  };
}

function makeFeedingEvent(overrides: Partial<FeedingEvent> = {}): FeedingEvent {
  return {
    id: 'evt-1',
    babyId: 'baby-1',
    type: 'feeding',
    feedingType: 'breast',
    leftCount: 1,
    rightCount: 0,
    timestamp: Timestamp.fromDate(new Date()),
    createdBy: 'user-1',
    createdAt: Timestamp.fromDate(new Date()),
    ...overrides,
  };
}

function makePeeEvent(overrides: Partial<PeeEvent> = {}): PeeEvent {
  return {
    id: 'evt-2',
    babyId: 'baby-1',
    type: 'pee',
    timestamp: Timestamp.fromDate(new Date()),
    createdBy: 'user-1',
    createdAt: Timestamp.fromDate(new Date()),
    ...overrides,
  };
}

describe('EventTimeline', () => {
  it('should display infection flag on feeding event', () => {
    const event = makeFeedingEvent({ infection: true });
    render(<EventTimeline events={[event]} />);

    expect(screen.getByText(/infection/i)).toBeInTheDocument();
  });

  it('should display engorgement flag on feeding event', () => {
    const event = makeFeedingEvent({ engorgement: true });
    render(<EventTimeline events={[event]} />);

    expect(screen.getByText(/engorgement/i)).toBeInTheDocument();
  });

  it('should display both flags when both are true', () => {
    const event = makeFeedingEvent({ infection: true, engorgement: true });
    render(<EventTimeline events={[event]} />);

    expect(screen.getByText(/infection/i)).toBeInTheDocument();
    expect(screen.getByText(/engorgement/i)).toBeInTheDocument();
  });

  it('should not display flags when they are false or absent', () => {
    const event = makeFeedingEvent();
    render(<EventTimeline events={[event]} />);

    expect(screen.queryByText(/infection/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/engorgement/i)).not.toBeInTheDocument();
  });

  it('should show the food names for a meal event', () => {
    const event = makeMealEvent([
      { foodId: 'rice', name: 'Rice', quantity: 1, unit: 'tsp' },
      { foodId: 'kabocha', name: 'Kabocha', quantity: 1, unit: 'tsp' },
    ]);
    render(<EventTimeline events={[event]} />);
    expect(screen.getByText('Rice, Kabocha')).toBeInTheDocument();
  });

  it('should truncate a long list of meal food names', () => {
    const event = makeMealEvent([
      { foodId: 'a', name: 'Aaaaaaaaaaaaaaaaaaaa', quantity: 1, unit: 'tsp' },
      { foodId: 'b', name: 'Bbbbbbbbbbbbbbbbbbbb', quantity: 1, unit: 'tsp' },
      { foodId: 'c', name: 'Cccccccccccccccccccc', quantity: 1, unit: 'tsp' },
    ]);
    render(<EventTimeline events={[event]} />);
    const detail = screen.getByText(/\.\.\.$/);
    expect(detail.textContent!.length).toBeLessThanOrEqual(43);
  });

  it('should show empty message when no events', () => {
    render(<EventTimeline events={[]} />);
    expect(screen.getByText(/no events/i)).toBeInTheDocument();
  });

  it('should call onEventClick when an event is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const event = makePeeEvent();

    render(<EventTimeline events={[event]} onEventClick={onClick} />);

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith(event);
  });

  it('should not be clickable when onEventClick is not provided', () => {
    const event = makePeeEvent();
    render(<EventTimeline events={[event]} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should call onEventClick on keyboard Enter', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const event = makePeeEvent();

    render(<EventTimeline events={[event]} onEventClick={onClick} />);

    const button = screen.getByRole('button');
    button.focus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledWith(event);
  });
});
