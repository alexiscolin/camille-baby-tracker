import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';
import { QuickStats } from './QuickStats';
import type { BabyEvent, FeedingEvent, PeeEvent } from '../types/events';

function makeFeedingEvent(minutesAgo: number, side: 'left' | 'right' = 'left'): FeedingEvent {
  const date = new Date(Date.now() - minutesAgo * 60 * 1000);
  return {
    id: `f-${minutesAgo}`,
    babyId: 'baby1',
    type: 'feeding',
    feedingType: side,
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
      makeFeedingEvent(30, 'left'),
      makeFeedingEvent(120, 'left'),
      makeFeedingEvent(180, 'right'),
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
