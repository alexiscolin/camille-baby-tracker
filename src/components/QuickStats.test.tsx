import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';
import { QuickStats } from './QuickStats';
import { VisibleEventTypesProvider } from './VisibleEventTypesProvider';
import type {
  BabyEvent, BathEvent, FeedingEvent, MilestoneEvent, PeeEvent,
} from '../types/events';
import type { Acceptance, MealEvent } from '../types/food';

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

function makeMealEvent(
  minutesAgo: number,
  items: { foodId: string; firstTry?: boolean; acceptance?: Acceptance }[] = [],
): MealEvent {
  const date = new Date(Date.now() - minutesAgo * 60 * 1000);
  return {
    id: `m-${minutesAgo}`,
    babyId: 'baby1',
    type: 'meal',
    mealSlot: 'lunch',
    items: items.map((i) => ({
      foodId: i.foodId,
      name: i.foodId,
      quantity: 1,
      unit: 'tsp',
      ...(i.firstTry !== undefined ? { firstTry: i.firstTry } : {}),
      ...(i.acceptance !== undefined ? { acceptance: i.acceptance } : {}),
    })),
    timestamp: Timestamp.fromDate(date),
    createdBy: 'user1',
    createdAt: Timestamp.fromDate(date),
  };
}

function makeBathEvent(daysAgo: number): BathEvent {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return {
    id: `b-${daysAgo}`,
    babyId: 'baby1',
    type: 'bath',
    timestamp: Timestamp.fromDate(date),
    createdBy: 'user1',
    createdAt: Timestamp.fromDate(date),
  };
}

function makeMilestoneEvent(daysAgo: number, title: string): MilestoneEvent {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return {
    id: `ms-${daysAgo}`,
    babyId: 'baby1',
    type: 'milestone',
    title,
    timestamp: Timestamp.fromDate(date),
    createdBy: 'user1',
    createdAt: Timestamp.fromDate(date),
  };
}

describe('QuickStats', () => {
  it('should render nothing when no type is in use', () => {
    const { container } = render(<QuickStats todayEvents={[]} recentEvents={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  describe('while breastfeeding is in use', () => {
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
      const events: BabyEvent[] = [makeFeedingEvent(30), makeFeedingEvent(150)];
      render(<QuickStats todayEvents={events} recentEvents={events} />);
      expect(screen.getByText('Avg feeding interval')).toBeInTheDocument();
    });
  });

  describe('once breastfeeding has stopped', () => {
    const solids: BabyEvent[] = [
      makeMealEvent(60, [
        { foodId: 'carrot', firstTry: true, acceptance: 'all' },
        { foodId: 'rice', acceptance: 'refused' },
      ]),
      makeBathEvent(2),
      makeMilestoneEvent(5, 'First steps'),
    ];

    it('should drop the feeding tiles', () => {
      render(<QuickStats todayEvents={solids} recentEvents={solids} />);
      expect(screen.queryByText('Last feeding')).not.toBeInTheDocument();
      expect(screen.queryByText('Breast balance today')).not.toBeInTheDocument();
      expect(screen.queryByText('Wet diapers today')).not.toBeInTheDocument();
    });

    it('should show meals, new foods, acceptance and the last bath', () => {
      render(<QuickStats todayEvents={solids} recentEvents={solids} />);
      expect(screen.getByText('Meals today')).toBeInTheDocument();
      expect(screen.getByText('New foods (7d)')).toBeInTheDocument();
      expect(screen.getByText('Eaten (7d)')).toBeInTheDocument();
      expect(screen.getByText('Last bath')).toBeInTheDocument();
    });

    it('should cap the row at four tiles', () => {
      render(<QuickStats todayEvents={solids} recentEvents={solids} />);
      // The milestone tile is next in line and stays out.
      expect(screen.queryByText('Last milestone')).not.toBeInTheDocument();
    });

    it('should hide the acceptance tile when nothing was logged as eaten or not', () => {
      const events: BabyEvent[] = [makeMealEvent(60, [{ foodId: 'carrot' }])];
      render(<QuickStats todayEvents={events} recentEvents={events} />);
      expect(screen.getByText('Meals today')).toBeInTheDocument();
      expect(screen.queryByText('Eaten (7d)')).not.toBeInTheDocument();
    });
  });

  describe('per-type relevance window', () => {
    it('should drop the bath tile after two weeks without a bath', () => {
      const events: BabyEvent[] = [makeMealEvent(60), makeBathEvent(20)];
      render(<QuickStats todayEvents={events} recentEvents={events} />);
      expect(screen.queryByText('Last bath')).not.toBeInTheDocument();
    });

    it('should keep the milestone tile a month after the milestone', () => {
      const events: BabyEvent[] = [makeMilestoneEvent(20, 'First steps')];
      render(<QuickStats todayEvents={events} recentEvents={events} />);
      expect(screen.getByText('Last milestone')).toBeInTheDocument();
      expect(screen.getByText('First steps')).toBeInTheDocument();
    });
  });

  it('should never show a tile for a type the family stopped tracking', () => {
    const events: BabyEvent[] = [makeMealEvent(60), makeBathEvent(1)];
    render(
      <VisibleEventTypesProvider hidden={['bath']}>
        <QuickStats todayEvents={events} recentEvents={events} />
      </VisibleEventTypesProvider>,
    );
    expect(screen.getByText('Meals today')).toBeInTheDocument();
    expect(screen.queryByText('Last bath')).not.toBeInTheDocument();
  });
});
