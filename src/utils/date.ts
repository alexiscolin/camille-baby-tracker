import {
  format,
  formatDistanceToNow,
  subDays,
  addDays,
  addMonths,
  isSameDay,
  differenceInDays,
  differenceInMonths,
} from 'date-fns';
import type { Timestamp } from 'firebase/firestore';

export function formatTime(timestamp: Timestamp): string {
  return format(timestamp.toDate(), 'HH:mm');
}

export function formatDate(date: Date): string {
  return format(date, 'EEEE, MMMM d');
}

export function formatShortDate(date: Date): string {
  return format(date, 'MMM d');
}

export function timeAgo(timestamp: Timestamp): string {
  return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
}

export function getPreviousDay(date: Date): Date {
  return subDays(date, 1);
}

export function getNextDay(date: Date): Date {
  return addDays(date, 1);
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function getDayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getRelativeDayLabel(date: Date): string {
  const today = new Date();
  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, subDays(today, 1))) return 'Yesterday';
  return format(date, 'EEEE, MMMM d');
}

/**
 * How old the baby was at a given moment, defaulting to now.
 *
 * The parameter exists for milestones: "she was 5 months old" is the point of
 * the entry, and it must not drift to her age the day someone reads the list.
 */
export function formatBabyAge(birthDate: Date, at: Date = new Date()): string {
  const diffMs = at.getTime() - birthDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return '';
  if (diffDays === 0) return 'born today';
  if (diffDays === 1) return '1 day old';
  if (diffDays < 14) return `${diffDays} days old`;

  const weeks = Math.floor(diffDays / 7);
  if (diffDays < 60) {
    const remainDays = diffDays % 7;
    if (remainDays === 0) return `${weeks} weeks old`;
    return `${weeks}w ${remainDays}d old`;
  }

  const months = Math.floor(diffDays / 30.44);
  if (months < 12) {
    return `${months} month${months > 1 ? 's' : ''} old`;
  }

  const years = Math.floor(months / 12);
  const remainMonths = months % 12;
  if (remainMonths === 0) return `${years} year${years > 1 ? 's' : ''} old`;
  return `${years}y ${remainMonths}m old`;
}

/**
 * The same age as `formatBabyAge`, spelled out in full.
 *
 * Three readings of one number, because they answer different questions: the
 * calendar breakdown is what you say out loud, the week count is what the
 * growth charts and the health record are indexed on, and the day count is the
 * one that still moves when the other two have stalled.
 */
export function formatDetailedAge(birthDate: Date, at: Date = new Date()): string {
  const totalDays = differenceInDays(at, birthDate);

  if (totalDays < 0) return '';
  if (totalDays === 0) return 'born today';
  // Through the first week the breakdown and both totals are the same number.
  if (totalDays < 7) return `${totalDays}d`;

  const months = differenceInMonths(at, birthDate);
  const sinceMonthMark = differenceInDays(at, addMonths(birthDate, months));
  const weeks = Math.floor(sinceMonthMark / 7);
  const days = sinceMonthMark % 7;

  const breakdown = [
    months > 0 && `${months}mo`,
    weeks > 0 && `${weeks}w`,
    days > 0 && `${days}d`,
  ].filter(Boolean).join(' ');

  // Before the first month the week total only repeats the breakdown.
  const totals =
    months > 0 ? `${Math.floor(totalDays / 7)}w · ${totalDays}d` : `${totalDays}d`;

  return `${breakdown} (${totals})`;
}

export function parseDayKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}
