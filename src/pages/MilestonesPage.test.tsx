import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  return render(
    <MilestonesPage familyId="fam-1" babyId="baby-1" userId="u1" baby={baby()} />,
  );
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

  /**
   * A page about milestones that cannot add one sends the reader back to the
   * timeline to do the thing the page exists for.
   */
  it('should offer to add one from here', () => {
    renderWith([]);
    expect(screen.getByRole('button', { name: /add a milestone/i })).toBeInTheDocument();
  });

  /**
   * `baby.birthDate.toDate()` builds a new Date on every render. Passing it
   * straight to useRangeEvents made the effect's dependencies change every
   * time, so the subscription was torn down and rebuilt on each render — and
   * a fresh subscription always opens on a cached snapshot, which is why the
   * page sat there saying "Showing cached data".
   */
  it('should not resubscribe on every render', () => {
    const { rerender } = renderWith([]);
    const callsAfterMount = mockUseRangeEvents.mock.calls.length;

    rerender(
      <MilestonesPage familyId="fam-1" babyId="baby-1" userId="u1" baby={baby()} />,
    );

    const [, , startA] = mockUseRangeEvents.mock.calls[callsAfterMount - 1];
    const [, , startB] = mockUseRangeEvents.mock.calls.at(-1)!;
    // Same object, not merely the same instant: the effect compares identity.
    expect(startB).toBe(startA);
  });

  function many(count: number) {
    return Array.from({ length: count }, (_, i) =>
      milestone(`m${i}`, `Milestone ${i}`, new Date(2026, 4, 1 + i)),
    );
  }

  /**
   * Below the threshold the list is a couple of flicks of scrolling, and a
   * search box is more typing than looking.
   */
  it('should not offer search until the list is long enough to need it', () => {
    renderWith(many(11));
    expect(screen.queryByLabelText(/search milestones/i)).not.toBeInTheDocument();
  });

  it('should offer search once the list is long', () => {
    renderWith(many(12));
    expect(screen.getByLabelText(/search milestones/i)).toBeInTheDocument();
  });

  it('should match a title regardless of case and accents', async () => {
    const user = userEvent.setup();
    renderWith([...many(11), milestone('x', 'Première dent', new Date(2026, 6, 1))]);

    await user.type(screen.getByLabelText(/search milestones/i), 'premiere');

    expect(screen.getByText('Première dent')).toBeInTheDocument();
    expect(screen.queryByText('Milestone 0')).not.toBeInTheDocument();
  });

  /** The detail that makes an entry findable is often in the notes. */
  it('should search the notes too', async () => {
    const user = userEvent.setup();
    const withNote = { ...milestone('x', 'First steps', new Date(2026, 6, 1)),
      notes: 'on the living room rug' };
    renderWith([...many(11), withNote]);

    await user.type(screen.getByLabelText(/search milestones/i), 'rug');
    expect(screen.getByText('First steps')).toBeInTheDocument();
  });

  it('should say when nothing matches, distinctly from having nothing', async () => {
    const user = userEvent.setup();
    renderWith(many(12));

    await user.type(screen.getByLabelText(/search milestones/i), 'zzz');

    expect(screen.getByText(/No milestone matches/)).toBeInTheDocument();
    expect(screen.queryByText(/Nothing yet/)).not.toBeInTheDocument();
  });
});
