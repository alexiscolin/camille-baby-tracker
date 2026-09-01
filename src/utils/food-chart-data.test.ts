import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  buildGroupIntake, buildVarietyCurve, buildNutrientCoverage,
  buildFirstExposureFromCatalog,
} from './food-chart-data';
import type { BabyEvent } from '../types/events';
import type { Food, Nutrients } from '../types/food';

const zero = (): Nutrients => ({
  energyKcal: 0, proteinG: 0, fatG: 0, carbsG: 0, fiberG: 0, sugarsG: 0,
  ironMg: 0, calciumMg: 0, zincMg: 0, sodiumMg: 0, potassiumMg: 0,
  vitaminAUgRae: 0, vitaminCMg: 0, vitaminDUg: 0, vitaminB12Ug: 0, folateUg: 0,
});

const kabocha = { id: 'kabocha', name: 'Kabocha', group: 'vegetable', gramsPerTsp: 5,
  nutrients: { ...zero(), energyKcal: 60, ironMg: 0.5, vitaminAUgRae: 330 } } as Food;
const cod = { id: 'cod', name: 'Cod', group: 'protein', gramsPerTsp: 5,
  nutrients: { ...zero(), energyKcal: 77, proteinG: 17 } } as Food;
const byId = new Map([['kabocha', kabocha], ['cod', cod]]);

const D1 = new Date('2026-08-30T12:00:00Z');
const D2 = new Date('2026-08-31T12:00:00Z');
const days = [
  { date: D1, label: '30' },
  { date: D2, label: '31' },
];

const meal = (date: Date, foodIds: string[]): BabyEvent => ({
  id: `m-${date.toISOString()}-${foodIds.join()}`,
  babyId: 'b1', type: 'meal', mealSlot: 'lunch',
  timestamp: Timestamp.fromDate(date), createdBy: 'u1',
  createdAt: Timestamp.fromDate(date),
  items: foodIds.map((id) => ({
    foodId: id, name: id, quantity: 4, unit: 'tsp' as const,
  })),
}) as BabyEvent;

const pee = (date: Date): BabyEvent => ({
  id: `p-${date.toISOString()}`, babyId: 'b1', type: 'pee',
  timestamp: Timestamp.fromDate(date), createdBy: 'u1',
  createdAt: Timestamp.fromDate(date),
}) as BabyEvent;

describe('buildGroupIntake', () => {
  it('should sum grams per group per day', () => {
    const rows = buildGroupIntake([meal(D1, ['kabocha', 'cod'])], byId, days);
    expect(rows[0].vegetable).toBeCloseTo(20, 5); // 4 tsp x 5 g
    expect(rows[0].protein).toBeCloseTo(20, 5);
  });

  it('should emit a zero row for a day with no meals', () => {
    const rows = buildGroupIntake([meal(D1, ['kabocha'])], byId, days);
    expect(rows).toHaveLength(2);
    expect(rows[1].vegetable).toBe(0);
  });

  it('should ignore non-meal events', () => {
    const rows = buildGroupIntake([pee(D1)], byId, days);
    expect(rows[0].vegetable).toBe(0);
  });
});

describe('buildVarietyCurve', () => {
  it('should be monotonically non-decreasing', () => {
    const curve = buildVarietyCurve(
      [meal(D1, ['kabocha']), meal(D2, ['cod'])], days);
    expect(curve.map((c) => c.total)).toEqual([1, 2]);
  });

  it('should count a food once even when eaten on several days', () => {
    const curve = buildVarietyCurve(
      [meal(D1, ['kabocha']), meal(D2, ['kabocha'])], days);
    expect(curve.map((c) => c.total)).toEqual([1, 1]);
  });

  it('should ignore non-meal events', () => {
    expect(buildVarietyCurve([pee(D1)], days).map((c) => c.total)).toEqual([0, 0]);
  });
});

describe('buildNutrientCoverage', () => {
  it('should divide the range total by the day count', () => {
    const rows = buildNutrientCoverage(
      [meal(D1, ['kabocha']), meal(D2, ['kabocha'])], byId, 2);
    // 4 tsp = 20 g = 0.2 x 60 kcal = 12 kcal per meal, 24 over 2 days, 12 per day
    expect(rows.find((r) => r.nutrient === 'energyKcal')?.perDay).toBeCloseTo(12, 5);
  });

  it('should ignore non-meal events', () => {
    const rows = buildNutrientCoverage([pee(D1)], byId, 2);
    expect(rows.every((r) => r.perDay === 0)).toBe(true);
  });
});

describe('buildFirstExposureFromCatalog', () => {
  /** A catalog food: nutrients as given, and the day it entered the diet. */
  const tried = (id: string, name: string, on: Date, nutrients: Partial<Nutrients>): Food =>
    ({ id, name, group: 'other', gramsPerTsp: 5,
       firstTriedAt: Timestamp.fromDate(on),
       nutrients: { ...zero(), ...nutrients } } as Food);

  it('should date a nutrient from the food that carries it', () => {
    const rows = buildFirstExposureFromCatalog([tried('k', 'Kabocha', D1, { vitaminAUgRae: 330 })]);
    const vitA = rows.find((r) => r.nutrient === 'vitaminAUgRae');
    expect(vitA?.date?.toISOString()).toBe(D1.toISOString());
    expect(vitA?.foodName).toBe('Kabocha');
  });

  it('should keep the earliest food when several carry the nutrient', () => {
    const rows = buildFirstExposureFromCatalog([
      tried('late', 'Carrot', D2, { vitaminAUgRae: 700 }),
      tried('early', 'Kabocha', D1, { vitaminAUgRae: 330 }),
    ]);
    const vitA = rows.find((r) => r.nutrient === 'vitaminAUgRae');
    expect(vitA?.date?.toISOString()).toBe(D1.toISOString());
    expect(vitA?.foodName).toBe('Kabocha');
  });

  it('should skip a food that was never tried', () => {
    const untried = { id: 'u', name: 'Natto', group: 'protein', gramsPerTsp: 5,
      nutrients: { ...zero(), vitaminB12Ug: 1 } } as Food;
    const rows = buildFirstExposureFromCatalog([untried]);
    expect(rows.find((r) => r.nutrient === 'vitaminB12Ug')?.date).toBeNull();
  });

  it('should skip a food with no nutrient data', () => {
    const bare = { id: 'b', name: 'Mystery', group: 'other', gramsPerTsp: 5,
      firstTriedAt: Timestamp.fromDate(D1) } as Food;
    expect(buildFirstExposureFromCatalog([bare]).every((r) => r.date === null)).toBe(true);
  });

  it('should leave a nutrient no food supplies as null', () => {
    const rows = buildFirstExposureFromCatalog([tried('k', 'Kabocha', D1, { vitaminAUgRae: 330 })]);
    expect(rows.find((r) => r.nutrient === 'vitaminDUg')?.date).toBeNull();
  });

  it('should count a trace amount that scaling by quantity would round away', () => {
    const rows = buildFirstExposureFromCatalog([tried('k', 'Kabocha', D1, { vitaminDUg: 0.0001 })]);
    expect(rows.find((r) => r.nutrient === 'vitaminDUg')?.foodName).toBe('Kabocha');
  });
});
