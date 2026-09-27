import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { buildMilestoneCalendar, type CalendarStep } from './milestone-calendar';
import type { ExpectedMilestone } from './development-timeline';
import type { MilestoneEvent } from '../types/events';

/** Camille's case: born 22 March, read on 22 September — six months to the day. */
const BIRTH = new Date(2026, 2, 22);
const AT_SIX_MONTHS = new Date(2026, 8, 22);

const step = (key: string, early: number | null, typical: number | null, late: number | null): ExpectedMilestone => ({
  key, label: key, domain: 'motor', early, typical, late, source: 'test',
});

const CATALOG: ExpectedMilestone[] = [
  step('smile', 1, 1.5, 3),
  step('sit', 3.8, 5.9, 9.2),
  step('crawl', 5.2, 8.3, 13.5),
  step('walk', 8.2, 12, 17.6),
  step('molars2', 23, 28, 35),
  { ...step('firstNight', 2, 3, null), label: 'Première nuit de 8 h' },
  // CDC-only: nothing but the age by which three children in four do it.
  step('threeWords', null, null, 18),
];

function milestone(title: string, at: Date, milestoneKey?: string): MilestoneEvent {
  return {
    id: title, babyId: 'b', type: 'milestone', title,
    ...(milestoneKey ? { milestoneKey } : {}),
    timestamp: Timestamp.fromDate(at), createdBy: 'u', createdAt: Timestamp.fromDate(at),
  };
}

const build = (recorded: MilestoneEvent[] = [], now = AT_SIX_MONTHS) =>
  buildMilestoneCalendar(BIRTH, now, recorded, CATALOG);

const allSteps = (cal: ReturnType<typeof build>): CalendarStep[] =>
  [...cal.past, ...cal.ahead].flatMap((m) => m.steps);
const find = (cal: ReturnType<typeof build>, key: string) =>
  allSteps(cal).find((s) => s.key === key)!;

describe('buildMilestoneCalendar', () => {
  it('should place each step in the row of its typical month', () => {
    const cal = build();
    const row = cal.ahead.find((m) => m.steps.some((s) => s.key === 'crawl'));
    expect(row?.month).toBe(8);
  });

  it('should head each row with the calendar date that month starts', () => {
    const row = build().ahead.find((m) => m.month === 8)!;
    expect(row.startsOn).toEqual(new Date(2026, 10, 22));
  });

  it('should split the rows at the current month, which leads the rows ahead', () => {
    const cal = build();
    expect(cal.currentMonth).toBe(6);
    expect(cal.ahead[0].month).toBe(6);
    expect(cal.past.every((m) => m.month < 6)).toBe(true);
  });

  it('should keep an empty current month but drop other empty rows', () => {
    const cal = build();
    expect(cal.ahead[0].steps).toEqual([]);
    expect(cal.ahead.slice(1).every((m) => m.steps.length + m.bands.length > 0 || m.checkpoint)).toBe(true);
  });

  it('should fold steps typical after two years into the last row', () => {
    const last = build().ahead.at(-1)!;
    expect(last.month).toBe(24);
    expect(last.steps.map((s) => s.key)).toContain('molars2');
  });

  it('should tell apart steps in their window, ahead of it and past it', () => {
    const cal = build();
    expect(find(cal, 'sit').status).toBe('now');
    expect(find(cal, 'walk').status).toBe('ahead');
    expect(find(cal, 'smile').status).toBe('past');
  });

  it('should keep a step with no upper bound open for ever', () => {
    expect(find(build(), 'firstNight').status).toBe('now');
  });

  it('should place a step known only by its upper bound in that month', () => {
    const row = build().ahead.find((m) => m.steps.some((s) => s.key === 'threeWords'));
    expect(row?.month).toBe(18);
  });

  it('should keep a step with no lower bound ahead until its row comes', () => {
    expect(find(build(), 'threeWords').status).toBe('ahead');
    expect(find(build([], new Date(2027, 8, 22)), 'threeWords').status).not.toBe('ahead');
  });

  it('should mark a step done by its key, with the event that did it', () => {
    const cal = build([milestone('Assis tout seul !', new Date(2026, 8, 1), 'sit')]);
    const sit = find(cal, 'sit');
    expect(sit.status).toBe('done');
    expect(sit.done?.title).toBe('Assis tout seul !');
  });

  it('should mark a step done by a hand-typed title, ignoring case and accents', () => {
    const cal = build([milestone('premiere nuit de 8 H', new Date(2026, 6, 1))]);
    expect(find(cal, 'firstNight').status).toBe('done');
  });

  it('should keep the earliest event when several match one step', () => {
    const early = new Date(2026, 6, 1);
    const cal = build([
      milestone('x', new Date(2026, 8, 1), 'sit'),
      milestone('y', early, 'sit'),
    ]);
    expect(find(cal, 'sit').done?.timestamp.toDate()).toEqual(early);
  });

  it('should put a rough-night band in the row it starts in', () => {
    const cal = build();
    const row = cal.ahead.find((m) => m.bands.some((b) => b.key === 'separation'));
    expect(row?.month).toBe(8);
  });

  it('should list the band running now', () => {
    expect(build([], new Date(2027, 0, 22)).ongoingBands.map((b) => b.key)).toEqual(['separation']);
    expect(build().ongoingBands).toEqual([]);
  });

  it('should put a carnet checkpoint in its month', () => {
    const row = build().ahead.find((m) => m.month === 8)!;
    expect(row.checkpoint?.items).toContain('tient bien assis');
  });
});
