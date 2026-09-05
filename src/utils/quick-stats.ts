import { differenceInMinutes, subDays } from 'date-fns';
import type { BabyEvent, EventType, FeedingEvent, MilestoneEvent } from '../types/events';
import { MEAL_SLOTS, MEAL_SLOT_LABELS } from '../types/food';
import type { MealEvent, MealSlot } from '../types/food';
import { getNextSide } from './feeding-helpers';
import { getDayKey } from './date';

export interface TimeSinceLast {
  minutes: number;
  label: string;
  type: string;
  sideHint: string;
}

export function getTimeSinceLastFeeding(events: BabyEvent[]): TimeSinceLast | null {
  const feedings = events
    .filter((e) => e.type === 'feeding')
    .sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());

  if (feedings.length === 0) return null;

  const last = feedings[0] as FeedingEvent;
  const now = new Date();
  const mins = differenceInMinutes(now, last.timestamp.toDate());

  let sideHint: string;
  if (last.feedingType === 'bottle') {
    sideHint = 'Bottle';
  } else {
    const parts: string[] = [];
    if (last.leftCount > 0) parts.push('Left');
    if (last.rightCount > 0) parts.push('Right');
    sideHint = parts.join(' + ') || 'Breast';
  }

  return {
    minutes: mins,
    label: formatMinutes(mins),
    type: last.feedingType,
    sideHint,
  };
}

export function getTimeSinceLastEvent(
  events: BabyEvent[],
  eventType: string,
  now: Date = new Date(),
): TimeSinceLast | null {
  const filtered = events
    .filter((e) => e.type === eventType)
    .sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());

  if (filtered.length === 0) return null;

  const last = filtered[0];
  const mins = differenceInMinutes(now, last.timestamp.toDate());

  return { minutes: mins, label: formatMinutes(mins), type: eventType, sideHint: '' };
}

/**
 * Past two days the hour count stops meaning anything — "312h ago" is a number
 * you have to divide in your head. The cutoff sits at 48h so a feeding, which
 * never goes that long, keeps reading in hours.
 */
const HOURS_BEFORE_DAYS = 48;

function formatMinutes(mins: number): string {
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}min ago`;
  const hours = Math.floor(mins / 60);
  if (hours >= HOURS_BEFORE_DAYS) return `${Math.floor(hours / 24)}d ago`;
  const remainder = mins % 60;
  if (remainder === 0) return `${hours}h ago`;
  return `${hours}h${String(remainder).padStart(2, '0')} ago`;
}

/**
 * Whether a type is still in use, and so whether the tiles and sections built
 * on it are worth the screen space.
 *
 * The window is per-type rather than global: a feeding happens hourly, a bath
 * weekly, a milestone every few months, and one cutoff cannot serve all three.
 * Nothing is stored — the answer is read off the events already subscribed to,
 * so a type that comes back into use brings its tiles back with it.
 */
export function isTypeActive(
  events: BabyEvent[],
  type: EventType,
  lookbackDays: number,
  now: Date = new Date(),
): boolean {
  const cutoff = subDays(now, lookbackDays);
  return events.some((e) => e.type === type && e.timestamp.toDate() >= cutoff);
}

function mealsSince(events: BabyEvent[], days: number, now: Date): MealEvent[] {
  const cutoff = subDays(now, days);
  return events.filter(
    (e): e is MealEvent => e.type === 'meal' && e.timestamp.toDate() >= cutoff,
  );
}

/**
 * Distinct foods tried for the first time — the pace of diversification.
 * Counted by food rather than by item so a food logged as a first try twice,
 * which the modal does not prevent, does not read as two new foods.
 */
export function getNewFoodsCount(
  events: BabyEvent[],
  days: number,
  now: Date = new Date(),
): number {
  const seen = new Set<string>();
  for (const meal of mealsSince(events, days, now)) {
    for (const item of meal.items) {
      if (item.firstTry) seen.add(item.foodId);
    }
  }
  return seen.size;
}

export interface AcceptanceRate {
  percent: number;
  sampled: number;
}

/**
 * Share of served items actually eaten, over the items where acceptance was
 * recorded at all. The field is optional in the modal, so null — meaning "not
 * enough logged to say" — is a real answer, and a truer one than 0%.
 */
export function getAcceptanceRate(
  events: BabyEvent[],
  days: number,
  now: Date = new Date(),
): AcceptanceRate | null {
  let eaten = 0;
  let sampled = 0;
  for (const meal of mealsSince(events, days, now)) {
    for (const item of meal.items) {
      if (!item.acceptance) continue;
      sampled++;
      if (item.acceptance === 'all' || item.acceptance === 'most') eaten++;
    }
  }
  if (sampled === 0) return null;
  return { percent: Math.round((eaten / sampled) * 100), sampled };
}

export interface LastMilestone {
  title: string;
  label: string;
}

export function getLastMilestone(
  events: BabyEvent[],
  now: Date = new Date(),
): LastMilestone | null {
  const milestones = events
    .filter((e): e is MilestoneEvent => e.type === 'milestone')
    .sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());

  if (milestones.length === 0) return null;

  const last = milestones[0];
  return {
    title: last.title,
    label: formatMinutes(differenceInMinutes(now, last.timestamp.toDate())),
  };
}

export interface FeedingBalance {
  left: number;
  right: number;
  bottle: number;
  nextSide: 'left' | 'right' | null;
}

export function getFeedingBalance(todayEvents: BabyEvent[]): FeedingBalance {
  const feedings = todayEvents.filter((e) => e.type === 'feeding') as FeedingEvent[];

  let left = 0;
  let right = 0;
  let bottle = 0;

  for (const f of feedings) {
    if (f.feedingType === 'bottle') {
      bottle++;
    } else {
      left += f.leftCount;
      right += f.rightCount;
    }
  }

  const sorted = [...feedings].sort(
    (a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime(),
  );

  const nextSide = sorted.length > 0 ? getNextSide(sorted[0]) : null;

  return { left, right, bottle, nextSide };
}

export type DiaperStatus = 'ok' | 'warning' | 'alert';

export interface DiaperInfo {
  count: number;
  status: DiaperStatus;
  expected: number;
  message: string;
}

export function getDiaperStatus(todayEvents: BabyEvent[]): DiaperInfo {
  const count = todayEvents.filter((e) => e.type === 'pee').length;

  // Weight the expected count by how far through the day we are
  const now = new Date();
  const hoursElapsed = now.getHours() + now.getMinutes() / 60;
  const dayProgress = Math.max(hoursElapsed / 24, 0.1);

  // A healthy newborn should have ~6-8 wet diapers per 24h
  // Scale expectation by time of day
  const expectedByNow = Math.round(7 * dayProgress);

  let status: DiaperStatus = 'ok';
  let message = `${count} wet diaper${count !== 1 ? 's' : ''} today — on track`;

  if (expectedByNow >= 2) {
    if (count < expectedByNow * 0.5) {
      status = 'alert';
      message = `Only ${count} wet diaper${count !== 1 ? 's' : ''} — expected ~${expectedByNow} by now`;
    } else if (count < expectedByNow * 0.75) {
      status = 'warning';
      message = `${count} wet diaper${count !== 1 ? 's' : ''} — slightly below expected ~${expectedByNow}`;
    }
  }

  return { count, status, expected: expectedByNow, message };
}

export interface FeedingIntervalInfo {
  avgMinutes: number;
  label: string;
}

export function getAverageFeedingInterval(events: BabyEvent[]): FeedingIntervalInfo | null {
  const feedings = events
    .filter((e) => e.type === 'feeding')
    .sort((a, b) => a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime());

  if (feedings.length < 2) return null;

  let totalMinutes = 0;
  for (let i = 1; i < feedings.length; i++) {
    totalMinutes += differenceInMinutes(
      feedings[i].timestamp.toDate(),
      feedings[i - 1].timestamp.toDate(),
    );
  }

  const avg = Math.round(totalMinutes / (feedings.length - 1));
  return { avgMinutes: avg, label: formatInterval(avg) };
}

function formatInterval(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

export interface DayNightSplit {
  day: number;
  night: number;
  dayPercent: number;
}

export function getDayNightSplit(events: BabyEvent[]): DayNightSplit {
  const feedings = events.filter((e) => e.type === 'feeding');
  let day = 0;
  let night = 0;

  for (const f of feedings) {
    const hour = f.timestamp.toDate().getHours();
    if (hour >= 6 && hour < 20) {
      day++;
    } else {
      night++;
    }
  }

  const total = day + night;
  const dayPercent = total > 0 ? Math.round((day / total) * 100) : 0;

  return { day, night, dayPercent };
}

export interface HourDistribution {
  hour: number;
  label: string;
  count: number;
}

export function getFeedingHourDistribution(events: BabyEvent[]): HourDistribution[] {
  const feedings = events.filter((e) => e.type === 'feeding');
  const buckets = new Array(24).fill(0) as number[];

  for (const f of feedings) {
    const hour = f.timestamp.toDate().getHours();
    buckets[hour]++;
  }

  return buckets.map((count, hour) => ({
    hour,
    label: `${String(hour).padStart(2, '0')}h`,
    count,
  }));
}

export interface DurationTrendPoint {
  date: string;
  label: string;
  avgMinutes: number | null;
}

export function buildFeedingDurationTrend(events: BabyEvent[], days: { date: string; label: string }[]): DurationTrendPoint[] {
  const feedings = events.filter((e) => e.type === 'feeding') as FeedingEvent[];

  const grouped = new Map<string, number[]>();
  for (const f of feedings) {
    if (f.durationMinutes) {
      const key = getDayKey(f.timestamp.toDate());
      const arr = grouped.get(key) || [];
      arr.push(f.durationMinutes);
      grouped.set(key, arr);
    }
  }

  return days.map(({ date, label }) => {
    const durations = grouped.get(date);
    const avgMinutes = durations && durations.length > 0
      ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
      : null;
    return { date, label, avgMinutes };
  });
}

export interface IntervalTrendPoint {
  date: string;
  label: string;
  avgMinutes: number | null;
}

export function buildFeedingIntervalTrend(events: BabyEvent[], days: { date: string; label: string }[]): IntervalTrendPoint[] {
  const feedings = events.filter((e) => e.type === 'feeding');

  const grouped = new Map<string, Date[]>();
  for (const f of feedings) {
    const d = f.timestamp.toDate();
    const key = getDayKey(d);
    const arr = grouped.get(key) || [];
    arr.push(d);
    grouped.set(key, arr);
  }

  return days.map(({ date, label }) => {
    const times = grouped.get(date);
    if (!times || times.length < 2) return { date, label, avgMinutes: null };

    times.sort((a, b) => a.getTime() - b.getTime());
    let total = 0;
    for (let i = 1; i < times.length; i++) {
      total += differenceInMinutes(times[i], times[i - 1]);
    }
    return { date, label, avgMinutes: Math.round(total / (times.length - 1)) };
  });
}

export interface LRTrendPoint {
  date: string;
  label: string;
  left: number;
  right: number;
  bottle: number;
}

export function buildLRTrend(events: BabyEvent[], days: { date: string; label: string }[]): LRTrendPoint[] {
  const feedings = events.filter((e) => e.type === 'feeding') as FeedingEvent[];

  const grouped = new Map<string, { left: number; right: number; bottle: number }>();
  for (const f of feedings) {
    const key = getDayKey(f.timestamp.toDate());
    const entry = grouped.get(key) || { left: 0, right: 0, bottle: 0 };
    if (f.feedingType === 'bottle') {
      entry.bottle++;
    } else {
      entry.left += f.leftCount;
      entry.right += f.rightCount;
    }
    grouped.set(key, entry);
  }

  return days.map(({ date, label }) => {
    const entry = grouped.get(date) || { left: 0, right: 0, bottle: 0 };
    return { date, label, ...entry };
  });
}

export interface MealSlotCount {
  slot: MealSlot;
  label: string;
  count: number;
}

/**
 * Meals per slot. The counterpart of the feeding hour histogram: a meal happens
 * at a named moment of the day rather than at a clock hour, and the shape worth
 * seeing is whether the four slots are actually being used.
 */
export function getMealSlotDistribution(events: BabyEvent[]): MealSlotCount[] {
  const counts = new Map<MealSlot, number>(MEAL_SLOTS.map((slot) => [slot, 0]));

  for (const event of events) {
    if (event.type !== 'meal') continue;
    const slot = (event as MealEvent).mealSlot;
    counts.set(slot, (counts.get(slot) ?? 0) + 1);
  }

  return MEAL_SLOTS.map((slot) => ({
    slot,
    label: MEAL_SLOT_LABELS[slot],
    count: counts.get(slot) ?? 0,
  }));
}

export interface AcceptanceTrendPoint {
  date: string;
  label: string;
  percent: number | null;
}

/**
 * Daily eaten share. Null on a day where nothing carried an acceptance, so the
 * line breaks rather than dropping to zero — a day that was not logged is not
 * a day the baby refused everything.
 */
export function buildAcceptanceTrend(
  events: BabyEvent[],
  days: { date: string; label: string }[],
): AcceptanceTrendPoint[] {
  const grouped = new Map<string, { eaten: number; sampled: number }>();

  for (const event of events) {
    if (event.type !== 'meal') continue;
    const key = getDayKey(event.timestamp.toDate());
    for (const item of (event as MealEvent).items) {
      if (!item.acceptance) continue;
      const entry = grouped.get(key) ?? { eaten: 0, sampled: 0 };
      entry.sampled++;
      if (item.acceptance === 'all' || item.acceptance === 'most') entry.eaten++;
      grouped.set(key, entry);
    }
  }

  return days.map(({ date, label }) => {
    const entry = grouped.get(date);
    return {
      date,
      label,
      percent: entry ? Math.round((entry.eaten / entry.sampled) * 100) : null,
    };
  });
}
