import { describe, it, expect, vi, afterEach } from 'vitest';
import { getRelativeDayLabel, parseDayKey, getDayKey, formatDetailedAge } from './date';

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

describe('formatDetailedAge', () => {
  const birth = new Date(2026, 2, 20);

  it('should break the age into months, weeks and days with both totals', () => {
    // 20 Mar + 6 months = 20 Sep (184 days), then 15 more days = 2w 1d.
    expect(formatDetailedAge(birth, new Date(2026, 9, 5))).toBe('6mo 2w 1d (28w · 199d)');
  });

  it('should drop the parts that are zero', () => {
    expect(formatDetailedAge(birth, new Date(2026, 8, 20))).toBe('6mo (26w · 184d)');
  });

  /**
   * Under a month the month slot is empty and the week total repeats the
   * breakdown, so only the day total earns its place.
   */
  it('should give only the day total before the first month', () => {
    expect(formatDetailedAge(birth, new Date(2026, 3, 12))).toBe('3w 2d (23d)');
  });

  it('should stay on days through the first week', () => {
    expect(formatDetailedAge(birth, new Date(2026, 2, 21))).toBe('1d');
    expect(formatDetailedAge(birth, new Date(2026, 2, 26))).toBe('6d');
  });

  it('should handle the day of birth and anything before it', () => {
    expect(formatDetailedAge(birth, new Date(2026, 2, 20))).toBe('born today');
    expect(formatDetailedAge(birth, new Date(2026, 1, 1))).toBe('');
  });

  it('should measure against now by default', () => {
    expect(formatDetailedAge(birth)).toMatch(/^(born today|\d|$)/);
  });
});
