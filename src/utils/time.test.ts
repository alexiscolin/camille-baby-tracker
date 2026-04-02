import { describe, it, expect } from 'vitest';
import { getTimeString, addMinutesToTime, computeDurationMinutes } from './time';

describe('getTimeString', () => {
  it('should format date as HH:MM', () => {
    expect(getTimeString(new Date(2026, 0, 1, 9, 5))).toBe('09:05');
  });

  it('should handle midnight', () => {
    expect(getTimeString(new Date(2026, 0, 1, 0, 0))).toBe('00:00');
  });

  it('should handle 23:59', () => {
    expect(getTimeString(new Date(2026, 0, 1, 23, 59))).toBe('23:59');
  });
});

describe('addMinutesToTime', () => {
  it('should add minutes within same hour', () => {
    expect(addMinutesToTime('09:00', 15)).toBe('09:15');
  });

  it('should roll over to next hour', () => {
    expect(addMinutesToTime('09:50', 20)).toBe('10:10');
  });

  it('should handle midnight crossing', () => {
    expect(addMinutesToTime('23:50', 20)).toBe('00:10');
  });

  it('should handle adding zero minutes', () => {
    expect(addMinutesToTime('14:30', 0)).toBe('14:30');
  });
});

describe('computeDurationMinutes', () => {
  const MAX = 300;

  it('should compute simple duration', () => {
    expect(computeDurationMinutes('09:00', '09:25', MAX)).toBe(25);
  });

  it('should handle midnight crossing', () => {
    expect(computeDurationMinutes('23:50', '00:10', MAX)).toBe(20);
  });

  it('should return undefined for empty start', () => {
    expect(computeDurationMinutes('', '09:00', MAX)).toBeUndefined();
  });

  it('should return undefined for empty end', () => {
    expect(computeDurationMinutes('09:00', '', MAX)).toBeUndefined();
  });

  it('should return undefined when duration exceeds max', () => {
    expect(computeDurationMinutes('09:00', '15:01', MAX)).toBeUndefined();
  });

  it('should return undefined for invalid time strings', () => {
    expect(computeDurationMinutes('abc', '09:00', MAX)).toBeUndefined();
  });

  it('should treat same start and end as full day (undefined if > max)', () => {
    expect(computeDurationMinutes('09:00', '09:00', MAX)).toBeUndefined();
  });
});
