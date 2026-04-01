import { differenceInMinutes } from 'date-fns';
import type { BabyEvent, FeedingEvent, FeedingType } from '../types/events';

export interface TimeSinceLast {
  minutes: number;
  label: string;
  type: string;
}

export function getTimeSinceLastFeeding(events: BabyEvent[]): TimeSinceLast | null {
  const feedings = events
    .filter((e) => e.type === 'feeding')
    .sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());

  if (feedings.length === 0) return null;

  const last = feedings[0];
  const now = new Date();
  const mins = differenceInMinutes(now, last.timestamp.toDate());

  return {
    minutes: mins,
    label: formatMinutes(mins),
    type: (last as FeedingEvent).feedingType,
  };
}

export function getTimeSinceLastEvent(events: BabyEvent[], eventType: string): TimeSinceLast | null {
  const filtered = events
    .filter((e) => e.type === eventType)
    .sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());

  if (filtered.length === 0) return null;

  const last = filtered[0];
  const now = new Date();
  const mins = differenceInMinutes(now, last.timestamp.toDate());

  return { minutes: mins, label: formatMinutes(mins), type: eventType };
}

function formatMinutes(mins: number): string {
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}min ago`;
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  if (remainder === 0) return `${hours}h ago`;
  return `${hours}h${String(remainder).padStart(2, '0')} ago`;
}

export interface FeedingBalance {
  left: number;
  right: number;
  bottle: number;
  nextSide: FeedingType | null;
  lastSide: FeedingType | null;
}

export function getFeedingBalance(todayEvents: BabyEvent[]): FeedingBalance {
  const feedings = todayEvents.filter((e) => e.type === 'feeding') as FeedingEvent[];

  const left = feedings.filter((f) => f.feedingType === 'left').length;
  const right = feedings.filter((f) => f.feedingType === 'right').length;
  const bottle = feedings.filter((f) => f.feedingType === 'bottle').length;

  const sorted = feedings.sort(
    (a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime(),
  );
  const lastSide = sorted.length > 0 ? sorted[0].feedingType : null;

  let nextSide: FeedingType | null = null;
  if (lastSide === 'left') nextSide = 'right';
  else if (lastSide === 'right') nextSide = 'left';

  return { left, right, bottle, nextSide, lastSide };
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
      const key = f.timestamp.toDate().toISOString().slice(0, 10);
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
    const key = d.toISOString().slice(0, 10);
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
    const key = f.timestamp.toDate().toISOString().slice(0, 10);
    const entry = grouped.get(key) || { left: 0, right: 0, bottle: 0 };
    entry[f.feedingType]++;
    grouped.set(key, entry);
  }

  return days.map(({ date, label }) => {
    const entry = grouped.get(date) || { left: 0, right: 0, bottle: 0 };
    return { date, label, ...entry };
  });
}
