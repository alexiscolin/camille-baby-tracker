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
 * How old the baby is, or was at a given moment.
 *
 * The `at` parameter exists for milestones: "she was 5 months old" is the
 * point of the entry, and it must not drift to her age the day someone reads
 * the list.
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
