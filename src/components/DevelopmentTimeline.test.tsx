import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Timestamp } from 'firebase/firestore';
import { DevelopmentTimeline } from './DevelopmentTimeline';
import type { ExpectedMilestone } from '../utils/development-timeline';
import type { MilestoneEvent } from '../types/events';

/** Camille's case: born 22 March, read on 22 September — six months to the day. */
const BIRTH = new Date(2026, 2, 22);
const AT_SIX_MONTHS = new Date(2026, 8, 22);

const CATALOG: ExpectedMilestone[] = [
  { key: 'smile', label: 'Premier sourire', domain: 'social', early: 1, typical: 1.5, late: 3, source: 'S1' },
  { key: 'sit', label: 'Assis sans appui', domain: 'motor', early: 3.8, typical: 6.2, late: 9.2, source: 'OMS' },
  { key: 'crawl', label: 'Quatre pattes', domain: 'motor', early: 5.2, typical: 8.3, late: 13.5,
    note: '4,3 % des enfants ne passent jamais par le quatre pattes.', source: 'OMS' },
  { key: 'words', label: 'Dit 3 mots', domain: 'language', early: null, typical: null, late: 18, source: 'CDC' },
  { key: 'night', label: 'Première nuit de 22 h à 6 h', domain: 'sleep', early: 3, typical: 5, late: null, source: 'Henderson 2010' },
];

function milestone(key: string, at: Date): MilestoneEvent {
  return {
    id: `m-${key}`, babyId: 'b', type: 'milestone', title: 'Premier sourire', milestoneKey: key,
    timestamp: Timestamp.fromDate(at), createdBy: 'u', createdAt: Timestamp.fromDate(at),
  };
}

function renderAt(now: Date, recorded: MilestoneEvent[] = [], handlers = { onDone: vi.fn(), onOpen: vi.fn() }) {
  render(
    <DevelopmentTimeline
      birthDate={BIRTH}
      now={now}
      recorded={recorded}
      catalog={CATALOG}
      {...handlers}
    />,
  );
  return handlers;
}

const rowOf = (label: string) => screen.getByText(label).closest('li') as HTMLElement;

describe('DevelopmentTimeline', () => {
  it('should head each month with the age and the calendar month', () => {
    renderAt(AT_SIX_MONTHS);
    expect(screen.getByRole('heading', { name: /8 mois · novembre 2026/ })).toBeInTheDocument();
  });

  it('should mark the current month', () => {
    renderAt(AT_SIX_MONTHS);
    expect(screen.getByRole('heading', { name: /6 mois · septembre 2026/ })).toHaveTextContent(/maintenant/);
  });

  it('should give each step its domain and its normal window in words', () => {
    renderAt(AT_SIX_MONTHS);
    const crawl = rowOf('Quatre pattes');
    expect(within(crawl).getByText(/Moteur · entre 5,2 et 13,5 mois/)).toBeInTheDocument();
    expect(within(crawl).getByText(/4,3 %/)).toBeInTheDocument();
  });

  it('should word a window with no upper bound as a start only', () => {
    renderAt(AT_SIX_MONTHS);
    expect(within(rowOf('Première nuit de 22 h à 6 h')).getByText(/dès 3 mois/)).toBeInTheDocument();
  });

  it('should word a window known only by its upper bound as where most are', () => {
    renderAt(AT_SIX_MONTHS);
    expect(within(rowOf('Dit 3 mots')).getByText(/Langage · la plupart avant 18 mois/)).toBeInTheDocument();
  });

  it('should hand the step back when "C’est fait" is tapped', async () => {
    const { onDone } = renderAt(AT_SIX_MONTHS);
    await userEvent.click(within(rowOf('Quatre pattes')).getByRole('button', { name: /c’est fait/i }));
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ key: 'crawl' }));
  });

  it('should show a done step with its date, and open the event on tap', async () => {
    const { onOpen } = renderAt(AT_SIX_MONTHS, [milestone('crawl', new Date(2026, 8, 3))]);
    const crawl = rowOf('Quatre pattes');
    const done = within(crawl).getByRole('button', { name: /fait le 3 sept/i });
    expect(within(crawl).queryByRole('button', { name: /c’est fait/i })).not.toBeInTheDocument();
    await userEvent.click(done);
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'm-crawl' }));
  });

  it('should fold the months already gone into one disclosure with a count', () => {
    renderAt(AT_SIX_MONTHS, [milestone('smile', new Date(2026, 4, 1))]);
    expect(screen.getByText(/Mois passés · 1 fait/)).toBeInTheDocument();
  });

  it('should show the rough-night band in the month it starts, with its caveat', () => {
    renderAt(AT_SIX_MONTHS);
    expect(screen.getByText('Angoisse de séparation')).toBeInTheDocument();
    expect(screen.getByText(/1 bébé sur 8/)).toBeInTheDocument();
  });

  it('should lead with the band she is inside when there is one', () => {
    renderAt(new Date(2027, 0, 22));
    expect(screen.getByText(/en cours/)).toBeInTheDocument();
  });

  it('should quote the health-record checkpoint verbatim in its month', () => {
    renderAt(AT_SIX_MONTHS);
    expect(screen.getByText(/Examen des 8 mois/)).toBeInTheDocument();
    expect(screen.getByText('tient bien assis')).toBeInTheDocument();
  });

  it('should cite its sources on screen', () => {
    renderAt(AT_SIX_MONTHS);
    expect(screen.getAllByText(/OMS/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Kearsley/)).toBeInTheDocument();
  });

  it('should never call a step late', () => {
    renderAt(new Date(2027, 8, 22));
    expect(screen.queryByText(/retard/i)).not.toBeInTheDocument();
  });
});
