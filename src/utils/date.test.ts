import { describe, it, expect, vi, afterEach } from 'vitest';
import { getRelativeDayLabel, parseDayKey, getDayKey } from './date';

describe('getRelativeDayLabel', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "Today" for today', () => {
    expect(getRelativeDayLabel(new Date())).toBe('Today');
  });

  it('should return "Yesterday" for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(getRelativeDayLabel(yesterday)).toBe('Yesterday');
  });

  it('should return formatted date for older dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 1));

    const date = new Date(2026, 2, 28);
    const result = getRelativeDayLabel(date);
    expect(result).toBe('Saturday, March 28');
  });
});

describe('parseDayKey', () => {
  it('should parse a day key string into a Date', () => {
    const date = parseDayKey('2026-04-01');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(3); // April = 3
    expect(date.getDate()).toBe(1);
  });

  it('should roundtrip with getDayKey', () => {
    const original = new Date(2026, 0, 15);
    const key = getDayKey(original);
    const parsed = parseDayKey(key);
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(0);
    expect(parsed.getDate()).toBe(15);
  });
});
