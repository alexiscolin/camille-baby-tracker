import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';
import { EventTimeline } from './EventTimeline';
import type { FeedingEvent } from '../types/events';

function makeFeedingEvent(overrides: Partial<FeedingEvent> = {}): FeedingEvent {
  return {
    id: 'evt-1',
    babyId: 'baby-1',
    type: 'feeding',
    feedingType: 'left',
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
});
