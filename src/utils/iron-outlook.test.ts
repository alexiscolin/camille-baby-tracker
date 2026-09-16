import { describe, it, expect } from 'vitest';
import { ironOutlook } from './iron-outlook';
import { FOOD_SEED } from '../data/food-seed';

const byId = new Map(FOOD_SEED.map((s) => [s.id, s]));
const at = (over: Partial<Parameters<typeof ironOutlook>[0]> = {}) =>
  ironOutlook({ ageMonths: 8, sex: 'female', source: 'breast', mlPerDay: 600, fromFood: 0.4, byId, ...over });

describe('ironOutlook', () => {
  it('should say what the meals must bring once milk is counted', () => {
    // 4.5 mg needed, breast milk at 600 ml brings about 0.24.
    expect(at().needFromFood).toBeCloseTo(4.26, 2);
  });

  it('should not ask the meals for iron that formula already brings', () => {
    expect(at({ source: 'formula' }).needFromFood).toBe(0);
  });

  it('should still ask for some once a bottle-fed baby drinks less', () => {
    // Every Japanese formula falls short of 4.5 mg at 450 ml.
    expect(at({ source: 'formula', mlPerDay: 450 }).needFromFood).toBeGreaterThan(0);
  });

  it('should ask the meals for the lot once milk has stopped', () => {
    expect(at({ source: 'none', mlPerDay: 0 }).needFromFood).toBeCloseTo(4.5, 2);
  });

  it('should treat mixed feeding as breast, the conservative side', () => {
    expect(at({ source: 'mixed' }).needFromFood).toBeCloseTo(at().needFromFood, 6);
  });

  it('should count what the meals already bring', () => {
    expect(at({ fromFood: 1.2 }).shortBy).toBeCloseTo(3.06, 2);
  });

  it('should not report a shortfall once the meals have caught up', () => {
    expect(at({ fromFood: 9 }).shortBy).toBe(0);
  });

  it('should say the job has not started yet before six months', () => {
    expect(at({ ageMonths: 5 }).startsAtSixMonths).toBe(true);
    expect(at({ ageMonths: 6 }).startsAtSixMonths).toBe(false);
  });

  it('should quote the six-month figure while still under six months', () => {
    // The point of showing it early is the size of what is coming.
    expect(at({ ageMonths: 5, mlPerDay: 780 }).needFromFood).toBeGreaterThan(4);
  });

  it('should name iron-rich foods that are worth the trouble', () => {
    const foods = at().suggestions;
    expect(foods.length).toBeGreaterThan(0);
    expect(foods.every((f) => f.nutrients.ironMg >= 1.5)).toBe(true);
  });

  it('should warn on a food whose serving would pass another limit', () => {
    const liver = at().suggestions.find((f) => f.id === 'chicken-liver-boiled');
    if (liver) expect(at().caution).toMatch(/vitamin a/i);
  });

  it('should have nothing to suggest when formula already covers it', () => {
    expect(at({ source: 'formula' }).suggestions).toEqual([]);
  });
});
