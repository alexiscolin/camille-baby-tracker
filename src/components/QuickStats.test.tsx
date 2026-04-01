import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';
import { QuickStats } from './QuickStats';
import type { BabyEvent, FeedingEvent, PeeEvent } from '../types/events';

function makeFeedingEvent(minutesAgo: number, leftCount: number = 1, rightCount: number = 0): FeedingEvent {
  const date = new Date(Date.now() - minutesAgo * 60 * 1000);
  const isBottle = leftCount === 0 && rightCount === 0;
  return {
    id: `f-${minutesAgo}`,
    babyId: 'baby1',
    type: 'feeding',
    feedingType: isBottle ? 'bottle' : 'breast',
    leftCount,
    rightCount,
    timestamp: Timestamp.fromDate(date),
    createdBy: 'user1',
    createdAt: Timestamp.fromDate(date),
  };
}

function makePeeEvent(minutesAgo: number): PeeEvent {
  const date = new Date(Date.now() - minutesAgo * 60 * 1000);
  return {
    id: `p-${minutesAgo}`,
    babyId: 'baby1',
    type: 'pee',
    timestamp: Timestamp.fromDate(date),
    createdBy: 'user1',
    createdAt: Timestamp.fromDate(date),
  };
}

describe('QuickStats', () => {
  it('should show dash when no feedings', () => {
    render(<QuickStats todayEvents={[]} recentEvents={[]} />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('should show last feeding time', () => {
    const events: BabyEvent[] = [makeFeedingEvent(30)];
    render(<QuickStats todayEvents={events} recentEvents={events} />);
    expect(screen.getByText('Last feeding')).toBeInTheDocument();
    expect(screen.getByText('30min ago')).toBeInTheDocument();
  });

  it('should show breast balance', () => {
    const events: BabyEvent[] = [
      makeFeedingEvent(30, 1, 0),
      makeFeedingEvent(120, 1, 0),
      makeFeedingEvent(180, 0, 1),
    ];
    render(<QuickStats todayEvents={events} recentEvents={events} />);
    expect(screen.getByText('L:2')).toBeInTheDocument();
    expect(screen.getByText('R:1')).toBeInTheDocument();
  });

  it('should show wet diapers count', () => {
    const events: BabyEvent[] = [makePeeEvent(30), makePeeEvent(120)];
    render(<QuickStats todayEvents={events} recentEvents={events} />);
    expect(screen.getByText('Wet diapers today')).toBeInTheDocument();
  });

  it('should show avg interval label', () => {
    const events: BabyEvent[] = [
      makeFeedingEvent(30),
      makeFeedingEvent(150),
    ];
    render(<QuickStats todayEvents={events} recentEvents={events} />);
    expect(screen.getByText('Avg feeding interval')).toBeInTheDocument();
  });
});
