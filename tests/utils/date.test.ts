import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  formatTime,
  formatDate,
  formatShortDate,
  isToday,
  getPreviousDay,
  getNextDay,
  getDayKey,
} from '../../src/utils/date';

describe('formatTime', () => {
  it('should format a timestamp as HH:mm', () => {
    const date = new Date(2026, 2, 15, 14, 30, 0);
    const ts = Timestamp.fromDate(date);
    expect(formatTime(ts)).toBe('14:30');
  });

  it('should zero-pad single digit hours and minutes', () => {
    const date = new Date(2026, 0, 1, 8, 5, 0);
    const ts = Timestamp.fromDate(date);
    expect(formatTime(ts)).toBe('08:05');
  });
});

describe('formatDate', () => {
  it('should format a date as full weekday and month', () => {
    const date = new Date(2026, 2, 15);
    const result = formatDate(date);
    expect(result).toContain('March');
    expect(result).toContain('15');
  });
});

describe('formatShortDate', () => {
  it('should format a date as short month and day', () => {
    const date = new Date(2026, 2, 15);
    expect(formatShortDate(date)).toBe('Mar 15');
  });
});

describe('isToday', () => {
  it('should return true for today', () => {
    expect(isToday(new Date())).toBe(true);
  });

  it('should return false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday)).toBe(false);
  });
});

describe('getPreviousDay / getNextDay', () => {
  it('should return the previous day', () => {
    const date = new Date(2026, 2, 15);
    const prev = getPreviousDay(date);
    expect(prev.getDate()).toBe(14);
  });

  it('should return the next day', () => {
    const date = new Date(2026, 2, 15);
    const next = getNextDay(date);
    expect(next.getDate()).toBe(16);
  });
});

describe('getDayKey', () => {
  it('should return yyyy-MM-dd format', () => {
    const date = new Date(2026, 2, 15);
    expect(getDayKey(date)).toBe('2026-03-15');
  });
});
