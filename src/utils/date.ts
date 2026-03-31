import { format, formatDistanceToNow, subDays, addDays } from 'date-fns';
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
