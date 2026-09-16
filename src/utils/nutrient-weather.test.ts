import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  bandOf,
  buildNutrientWeather,
  dailyTargets,
  milkNutrients,
  nutrientGaps,
} from './nutrient-weather';
import type { ReferenceValue } from './nutrient-weather';
import type { BabyEvent } from '../types/events';
import type { Food, MealEvent, Nutrients } from '../types/food';

const zero = (): Nutrients => ({
  energyKcal: 0, proteinG: 0, fatG: 0, carbsG: 0, fiberG: 0, sugarsG: 0,
  ironMg: 0, calciumMg: 0, zincMg: 0, sodiumMg: 0, potassiumMg: 0,
  vitaminAUgRae: 0, vitaminCMg: 0, vitaminDUg: 0, vitaminB12Ug: 0, folateUg: 0,
});

const food = (id: string, nutrients: Partial<Nutrients>): Food =>
  ({ id, name: id, gramsPerTsp: 5, nutrients: { ...zero(), ...nutrients } } as Food);

/** Stand-ins, not the real seed rows: these tests must not move when the table lands.
 *  Both milk rows are per 100 mL, so no density factor is involved. */
const humanMilk = food('human-milk', { ironMg: 0.04, calciumMg: 27, sodiumMg: 15 });
const formula = food('formula-prepared', { ironMg: 0.9, calciumMg: 48, sodiumMg: 18 });
const liver = food('liver', { ironMg: 9, vitaminAUgRae: 14000 });
const kabocha = food('kabocha', { ironMg: 0.5, vitaminAUgRae: 330 });

const byId = new Map([humanMilk, formula, liver, kabocha].map((f) => [f.id, f]));

const day = (n: number) => new Date(2026, 8, n);
const days = [1, 2, 3, 4, 5, 6, 7].map((n) => ({ date: day(n), label: `d${n}` }));

const meal = (n: number, foodId: string, grams: number): MealEvent =>
  ({
    id: `m${n}-${foodId}`,
    type: 'meal',
    mealSlot: 'lunch',
    timestamp: Timestamp.fromDate(day(n)),
    items: [{ foodId, name: foodId, quantity: grams, unit: 'g' }],
  } as MealEvent);

const ref = (over: Partial<ReferenceValue> & Pick<ReferenceValue, 'key'>): ReferenceValue =>
  ({ kind: 'target', amount: 0, ...over });

describe('milkNutrients', () => {
  it('should return zeros once milk has stopped', () => {
    expect(milkNutrients('none', 530, byId)).toEqual(zero());
  });

  it('should scale the human milk row by the daily volume', () => {
    // 530 mL -> 5.3 hundred-millilitre units -> 5.3 x 0.04 mg
    expect(milkNutrients('breast', 530, byId).ironMg).toBeCloseTo(0.212, 6);
  });

  it('should give formula an order of magnitude more iron than breast milk', () => {
    const breast = milkNutrients('breast', 530, byId).ironMg;
    expect(milkNutrients('formula', 530, byId).ironMg).toBeGreaterThan(breast * 10);
  });

  it('should treat mixed feeding as breast milk, so a real iron gap is not hidden', () => {
    expect(milkNutrients('mixed', 530, byId)).toEqual(milkNutrients('breast', 530, byId));
  });

  it('should scale linearly with volume', () => {
    expect(milkNutrients('breast', 1000, byId).ironMg)
      .toBeCloseTo(milkNutrients('breast', 500, byId).ironMg * 2, 6);
  });

  it('should return zeros when the milk food is missing from the catalog', () => {
    expect(milkNutrients('breast', 530, new Map())).toEqual(zero());
  });
});

describe('dailyTargets', () => {
  const milk = { ...zero(), ironMg: 0.2, calciumMg: 150, sodiumMg: 80 };

  it('should subtract what milk already supplies', () => {
    const [iron] = dailyTargets([ref({ key: 'ironMg', amount: 5 })], milk);
    expect(iron.fromFood).toBeCloseTo(4.8, 6);
  });

  it('should floor at zero rather than going negative', () => {
    const [calcium] = dailyTargets([ref({ key: 'calciumMg', amount: 100 })], milk);
    expect(calcium.fromFood).toBe(0);
  });

  it('should leave the full reference intake once milk has stopped', () => {
    const [iron] = dailyTargets([ref({ key: 'ironMg', amount: 5 })], zero());
    expect(iron.fromFood).toBe(5);
  });

  it('should subtract from a limit too, so the food budget is what milk leaves', () => {
    const [sodium] = dailyTargets([ref({ key: 'sodiumMg', kind: 'limit', amount: 300 })], milk);
    expect(sodium).toMatchObject({ kind: 'limit', fromFood: 220 });
  });

  it('should give a context nutrient no target at all', () => {
    const [carbs] = dailyTargets([ref({ key: 'carbsG', kind: 'context', amount: 0 })], milk);
    expect(carbs).toMatchObject({ kind: 'context', fromFood: 0 });
  });
});

describe('bandOf', () => {
  it('should call a target met at four fifths of the way', () => {
    expect(bandOf(0.8, 'target')).toBe('met');
    expect(bandOf(0.79, 'target')).toBe('partial');
  });

  it('should call a target low below two fifths', () => {
    expect(bandOf(0.4, 'target')).toBe('partial');
    expect(bandOf(0.39, 'target')).toBe('low');
  });

  it('should invert the bands on a limit, where under is good', () => {
    expect(bandOf(0.5, 'limit')).toBe('met');
    expect(bandOf(0.9, 'limit')).toBe('partial');
    expect(bandOf(1.2, 'limit')).toBe('low');
  });

  it('should never grade a context nutrient', () => {
    expect(bandOf(3, 'context')).toBeNull();
  });
});

describe('buildNutrientWeather', () => {
  const targets = dailyTargets(
    [ref({ key: 'ironMg', amount: 5 }), ref({ key: 'carbsG', kind: 'context' })],
    zero(),
  );

  it('should give a zero cell to a day with no meals rather than skipping it', () => {
    const [iron] = buildNutrientWeather([], byId, days, targets);
    expect(iron.cells).toHaveLength(7);
    expect(iron.cells.every((c) => c.amount === 0 && c.band === 'low')).toBe(true);
  });

  it('should place each meal on its own day', () => {
    const [iron] = buildNutrientWeather([meal(3, 'liver', 50)], byId, days, targets);
    expect(iron.cells[2].amount).toBeCloseTo(4.5, 6);
    expect(iron.cells[2].band).toBe('met');
    expect(iron.cells[1].amount).toBe(0);
  });

  it('should ignore events outside the requested days', () => {
    const [iron] = buildNutrientWeather([meal(20, 'liver', 50)], byId, days, targets);
    expect(iron.cells.every((c) => c.amount === 0)).toBe(true);
  });

  it('should ignore events that are not meals', () => {
    const feeding = { id: 'f', type: 'feeding', timestamp: Timestamp.fromDate(day(3)) } as BabyEvent;
    const [iron] = buildNutrientWeather([feeding], byId, days, targets);
    expect(iron.cells.every((c) => c.amount === 0)).toBe(true);
  });

  it('should average the window, not sum it', () => {
    // One 50 g serving of liver in seven days: 4.5 mg spread over a 5 mg/day target.
    const [iron] = buildNutrientWeather([meal(3, 'liver', 50)], byId, days, targets);
    expect(iron.ratio).toBeCloseTo(4.5 / 7 / 5, 6);
  });

  it('should leave a context row ungraded', () => {
    const rows = buildNutrientWeather([meal(3, 'liver', 50)], byId, days, targets);
    const carbs = rows.find((r) => r.key === 'carbsG')!;
    expect(carbs.ratio).toBeNull();
    expect(carbs.cells.every((c) => c.band === null)).toBe(true);
  });

  it('should report a falling trend when the later days are leaner', () => {
    const early = [meal(1, 'liver', 50), meal(2, 'liver', 50)];
    const [iron] = buildNutrientWeather(early, byId, days, targets);
    expect(iron.trend).toBe('down');
  });

  it('should report a rising trend when the later days are richer', () => {
    const late = [meal(6, 'liver', 50), meal(7, 'liver', 50)];
    const [iron] = buildNutrientWeather(late, byId, days, targets);
    expect(iron.trend).toBe('up');
  });
});

describe('upper limits', () => {
  // Liver is the reason this exists: 14 000 ugRAE/100 g against a 600 ugRAE
  // daily limit, on a food the ranker actively suggests for its iron.
  const targets = dailyTargets(
    [ref({ key: 'vitaminAUgRae', amount: 400, ceiling: 600 }), ref({ key: 'ironMg', amount: 4.5 })],
    zero(),
  );

  it('should flag the day a limit was passed', () => {
    const [vitA] = buildNutrientWeather([meal(3, 'liver', 10)], byId, days, targets);
    expect(vitA.cells[2].overCeiling).toBe(true);
    expect(vitA.cells[1].overCeiling).toBe(false);
  });

  it('should flag the window when the average is over, not just one day', () => {
    const daily = days.map((_, i) => meal(i + 1, 'liver', 10));
    const [vitA] = buildNutrientWeather(daily, byId, days, targets);
    expect(vitA.overCeiling).toBe(true);
  });

  it('should not call a single big day an over-limit week', () => {
    const [vitA] = buildNutrientWeather([meal(3, 'liver', 4)], byId, days, targets);
    expect(vitA.overCeiling).toBe(false);
  });

  it('should leave a nutrient with no published limit unflagged', () => {
    const daily = days.map((_, i) => meal(i + 1, 'liver', 50));
    const iron = buildNutrientWeather(daily, byId, days, targets)[1];
    expect(iron.overCeiling).toBe(false);
  });

  it('should take milk off the headroom, not just off the target', () => {
    const milk = { ...zero(), vitaminAUgRae: 250 };
    const [vitA] = dailyTargets([ref({ key: 'vitaminAUgRae', amount: 400, ceiling: 600 })], milk);
    expect(vitA).toMatchObject({ fromFood: 150, ceiling: 350 });
  });
});

describe('nutrientGaps', () => {
  const targets = dailyTargets([
    ref({ key: 'ironMg', amount: 5 }),
    ref({ key: 'vitaminAUgRae', amount: 300 }),
    ref({ key: 'sodiumMg', kind: 'limit', amount: 300 }),
    ref({ key: 'carbsG', kind: 'context' }),
  ], zero());

  it('should name the short nutrients worst first', () => {
    // Kabocha is generous with vitamin A and thin on iron, so iron is the worse gap.
    const rows = buildNutrientWeather(
      days.map((_, i) => meal(i + 1, 'kabocha', 40)), byId, days, targets,
    );
    expect(nutrientGaps(rows)).toEqual(['ironMg', 'vitaminAUgRae']);
  });

  it('should not name a nutrient that is already met', () => {
    const rows = buildNutrientWeather(
      days.map((_, i) => meal(i + 1, 'liver', 50)), byId, days, targets,
    );
    expect(nutrientGaps(rows)).not.toContain('ironMg');
  });

  it('should never name a limit or a context nutrient', () => {
    const rows = buildNutrientWeather([], byId, days, targets);
    expect(nutrientGaps(rows)).not.toContain('sodiumMg');
    expect(nutrientGaps(rows)).not.toContain('carbsG');
  });
});

describe('perDay', () => {
  const targets = dailyTargets([ref({ key: 'ironMg', kind: 'context' })], zero());

  it('should carry the daily average, so an ungraded row still has a number to show', () => {
    const [iron] = buildNutrientWeather([meal(3, 'liver', 50)], byId, days, targets);
    expect(iron.perDay).toBeCloseTo(4.5 / 7, 6);
  });
});
