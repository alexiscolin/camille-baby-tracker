import { describe, it, expect } from 'vitest';
import { getWeaningStage, STAGE_LABELS, EXPECTED_MEALS_PER_DAY } from './weaning-stage';

const birth = new Date('2026-02-01T00:00:00Z');
const at = (months: number) => {
  const d = new Date(birth);
  d.setMonth(d.getMonth() + months);
  return d;
};

describe('getWeaningStage', () => {
  it('should return null before 5 months', () => {
    expect(getWeaningStage(birth, at(4))).toBeNull();
  });

  it('should return stage 1 from 5 to 6 months', () => {
    expect(getWeaningStage(birth, at(5))).toBe(1);
    expect(getWeaningStage(birth, at(6))).toBe(1);
  });

  it('should return stage 2 from 7 to 8 months', () => {
    expect(getWeaningStage(birth, at(7))).toBe(2);
    expect(getWeaningStage(birth, at(8))).toBe(2);
  });

  it('should return stage 3 from 9 to 11 months', () => {
    expect(getWeaningStage(birth, at(9))).toBe(3);
    expect(getWeaningStage(birth, at(11))).toBe(3);
  });

  it('should return stage 4 from 12 months onward', () => {
    expect(getWeaningStage(birth, at(12))).toBe(4);
    expect(getWeaningStage(birth, at(24))).toBe(4);
  });

  it('should label and set expected meal counts for every stage', () => {
    for (const stage of [1, 2, 3, 4] as const) {
      expect(STAGE_LABELS[stage]).toBeTruthy();
      expect(EXPECTED_MEALS_PER_DAY[stage]).toBeGreaterThan(0);
    }
  });
});
