import { describe, it, expect, vi, afterEach } from 'vitest';
import { getRelativeDayLabel, parseDayKey, getDayKey, formatBabyAge} from './date';

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

describe('formatBabyAge', () => {
  const birth = new Date(2026, 2, 20);

  it('should measure against now by default', () => {
    expect(formatBabyAge(birth)).toMatch(/old|born today/);
  });

  /**
   * A milestone is worth "she was 5 months old", not the age she happens to be
   * the day you look at the list.
   */
  it('should measure against a given moment when one is passed', () => {
    expect(formatBabyAge(birth, new Date(2026, 2, 20))).toBe('born today');
    expect(formatBabyAge(birth, new Date(2026, 2, 21))).toBe('1 day old');
    expect(formatBabyAge(birth, new Date(2026, 8, 3))).toBe('5 months old');
  });

  it('should say nothing for a moment before the birth', () => {
    expect(formatBabyAge(birth, new Date(2026, 1, 1))).toBe('');
  });
});
