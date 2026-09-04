import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';
import { MilestonesPage } from './MilestonesPage';
import type { Baby, BabyEvent, MilestoneEvent, PeeEvent } from '../types/events';

const mockUseRangeEvents = vi.fn();
vi.mock('../hooks/useRangeEvents', () => ({
  useRangeEvents: (...args: unknown[]) => mockUseRangeEvents(...args),
}));

const birth = new Date(2026, 2, 20);

function baby(): Baby {
  return {
    id: 'baby-1',
    firstName: 'Camille',
    birthDate: Timestamp.fromDate(birth),
    createdAt: Timestamp.fromDate(birth),
  };
}

function milestone(id: string, title: string, at: Date): MilestoneEvent {
  return {
    id, babyId: 'baby-1', type: 'milestone', title,
    timestamp: Timestamp.fromDate(at),
    createdBy: 'u1', createdAt: Timestamp.fromDate(at),
  };
}

function pee(at: Date): PeeEvent {
  return {
    id: 'p1', babyId: 'baby-1', type: 'pee',
    timestamp: Timestamp.fromDate(at),
    createdBy: 'u1', createdAt: Timestamp.fromDate(at),
  };
}

function renderWith(events: BabyEvent[]) {
  mockUseRangeEvents.mockReturnValue({
    events, fromCache: false, hasPendingWrites: false, settled: true,
  });
  return render(<MilestonesPage familyId="fam-1" babyId="baby-1" baby={baby()} />);
}

describe('MilestonesPage', () => {
  it('should list only milestones, newest first', () => {
    renderWith([
      pee(new Date(2026, 7, 1)),
      milestone('m1', 'First smile', new Date(2026, 4, 10)),
      milestone('m2', 'First steps', new Date(2026, 8, 1)),
    ]);

    const titles = screen.getAllByText(/First (smile|steps)/).map((n) => n.textContent);
    expect(titles).toEqual(['First steps', 'First smile']);
    expect(screen.queryByText(/Pees/)).not.toBeInTheDocument();
  });

  /**
   * The age at the time is the point of the entry — it must not drift to the
   * age the baby happens to be on the day someone opens the list.
   */
  it('should show how old the baby was when it happened', () => {
    // Born 20 March, milestone on 1 August: four months old that day, and
    // older than that by the time anyone reads this. The assertion is only
    // meaningful because those two differ.
    renderWith([milestone('m1', 'First smile', new Date(2026, 7, 1))]);
    expect(screen.getByText(/4 months old/)).toBeInTheDocument();
  });

  it('should say so when nothing has been recorded', () => {
    renderWith([pee(new Date(2026, 7, 1))]);
    expect(screen.getByText(/Nothing recorded yet/)).toBeInTheDocument();
  });
});
