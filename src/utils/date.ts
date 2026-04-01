import { format, formatDistanceToNow, subDays, addDays, isSameDay } from 'date-fns';
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

export function formatBabyAge(birthDate: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - birthDate.getTime();
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

export function parseDayKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}
