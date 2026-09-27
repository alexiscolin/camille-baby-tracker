import { addMonths, differenceInDays, differenceInMonths } from 'date-fns';
import {
  CARNET_CHECKPOINTS,
  ROUGH_NIGHT_BANDS,
  type Checkpoint,
  type ExpectedMilestone,
  type RoughNightBand,
  placedAt,
} from './development-timeline';
import type { MilestoneEvent } from '../types/events';

/** Average days in a month; the windows are months, the app counts days. */
const DAYS_PER_MONTH = 30.4375;

/** The last row. Steps typical later than this (second molars) fold into it. */
export const CALENDAR_END_MONTH = 24;

export type StepStatus = 'done' | 'now' | 'ahead' | 'past';

export interface CalendarStep extends ExpectedMilestone {
  status: StepStatus;
  /** The recorded milestone that ticked it, earliest if several did. */
  done?: MilestoneEvent;
}

export interface CalendarMonth {
  /** Age in whole months at the start of the row. */
  month: number;
  startsOn: Date;
  steps: CalendarStep[];
  /** Rough-night bands that begin during this month. */
  bands: RoughNightBand[];
  checkpoint?: Checkpoint;
}

export interface MilestoneCalendar {
  ageMonths: number;
  currentMonth: number;
  /** Rows before the current month, oldest first. */
  past: CalendarMonth[];
  /** The current month first, then every later row that has something in it. */
  ahead: CalendarMonth[];
  ongoingBands: RoughNightBand[];
}

/** Case- and accent-blind, so "premiere dent" ticks "Première dent". */
const normalise = (text: string) =>
  text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

const rowOf = (months: number) => Math.min(Math.floor(months), CALENDAR_END_MONTH);

function findDone(step: ExpectedMilestone, recorded: MilestoneEvent[]): MilestoneEvent | undefined {
  const label = normalise(step.label);
  return recorded
    .filter((m) => (m.milestoneKey ? m.milestoneKey === step.key : normalise(m.title) === label))
    .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis())[0];
}

function statusOf(step: ExpectedMilestone, ageMonths: number, done: boolean): StepStatus {
  if (done) return 'done';
  // No lower bound in the sources: it is ahead until its row comes round.
  if (ageMonths < (step.early ?? rowOf(placedAt(step)))) return 'ahead';
  if (step.late !== null && ageMonths > step.late) return 'past';
  return 'now';
}

/**
 * Month-by-month rows of what can happen, from birth to two years. Each step
 * sits in the row of its typical month; its window, not the row, says what is
 * normal. Nothing here turns a window into a date.
 */
export function buildMilestoneCalendar(
  birthDate: Date,
  now: Date,
  recorded: MilestoneEvent[],
  catalog: readonly ExpectedMilestone[],
): MilestoneCalendar {
  const ageMonths = differenceInDays(now, birthDate) / DAYS_PER_MONTH;
  const currentMonth = Math.min(Math.max(differenceInMonths(now, birthDate), 0), CALENDAR_END_MONTH);

  const rows: CalendarMonth[] = Array.from({ length: CALENDAR_END_MONTH + 1 }, (_, month) => ({
    month,
    startsOn: addMonths(birthDate, month),
    steps: [],
    bands: [],
  }));

  for (const step of catalog) {
    const done = findDone(step, recorded);
    rows[rowOf(placedAt(step))].steps.push({ ...step, status: statusOf(step, ageMonths, !!done), done });
  }
  for (const band of ROUGH_NIGHT_BANDS) rows[rowOf(band.fromMonths)].bands.push(band);
  for (const checkpoint of CARNET_CHECKPOINTS) rows[rowOf(checkpoint.ageMonths)].checkpoint = checkpoint;
  for (const row of rows) row.steps.sort((a, b) => placedAt(a) - placedAt(b));

  const hasContent = (row: CalendarMonth) =>
    row.steps.length > 0 || row.bands.length > 0 || row.checkpoint !== undefined;

  return {
    ageMonths,
    currentMonth,
    past: rows.slice(0, currentMonth).filter(hasContent),
    ahead: rows.slice(currentMonth).filter((row) => row.month === currentMonth || hasContent(row)),
    ongoingBands: ROUGH_NIGHT_BANDS.filter((b) => ageMonths >= b.fromMonths && ageMonths < b.toMonths),
  };
}
