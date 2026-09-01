import { describe, it, expect } from 'vitest';
import { FOOD_SEED, NUTRIENT_CEILINGS, IMPLIED_ALLERGENS } from './food-seed';
import { NUTRIENT_KEYS, FOOD_GROUPS } from '../types/food';
import { ALLERGENS } from '../utils/allergens';
import { foodFromSeed } from '../services/food-catalog';

const VALID_GROUPS = new Set<string>(FOOD_GROUPS);
const VALID_ALLERGENS = new Set<string>(ALLERGENS);

describe('food seed table', () => {
  it('should not be empty', () => {
    expect(FOOD_SEED.length).toBeGreaterThan(0);
  });

  it('should have unique slugs', () => {
    const ids = FOOD_SEED.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should use kebab-case slugs', () => {
    for (const food of FOOD_SEED) {
      expect(food.id, food.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('should have a non-empty name and sourceRef', () => {
    for (const food of FOOD_SEED) {
      expect(food.name.trim(), food.id).not.toBe('');
      expect(food.sourceRef.trim(), food.id).not.toBe('');
    }
  });

  // The raw seed sourceRef is a citation for a human reading this file and is
  // allowed to run long (worst case today: 405 characters). What matters is
  // what actually gets written to Firestore, which firestore.rules caps at
  // 200 — so this asserts on foodFromSeed's output, the real write path,
  // rather than on FOOD_SEED itself. Asserting on the raw seed would just
  // force trimming the citations to fit, which is the wrong file to edit.
  it('should produce a sourceRef within firestore.rules\' 200-character limit', () => {
    for (const seedFood of FOOD_SEED) {
      expect((foodFromSeed(seedFood).sourceRef ?? '').length, seedFood.id).toBeLessThanOrEqual(200);
    }
  });

  it('should use a valid group and stage', () => {
    for (const food of FOOD_SEED) {
      expect(VALID_GROUPS.has(food.group), `${food.id}: ${food.group}`).toBe(true);
      expect([1, 2, 3, 4], food.id).toContain(food.minStage);
    }
  });

  it('should use only known allergens, without duplicates', () => {
    for (const food of FOOD_SEED) {
      for (const allergen of food.allergens) {
        expect(VALID_ALLERGENS.has(allergen), `${food.id}: ${allergen}`).toBe(true);
      }
      expect(new Set(food.allergens).size, food.id).toBe(food.allergens.length);
    }
  });

  it('should have a positive gramsPerTsp within a plausible range', () => {
    for (const food of FOOD_SEED) {
      expect(food.gramsPerTsp, food.id).toBeGreaterThan(0);
      expect(food.gramsPerTsp, food.id).toBeLessThanOrEqual(15);
    }
  });

  it('should define all 16 nutrients as non-negative finite numbers', () => {
    for (const food of FOOD_SEED) {
      for (const key of NUTRIENT_KEYS) {
        const value = food.nutrients[key];
        expect(Number.isFinite(value), `${food.id}.${key}`).toBe(true);
        expect(value, `${food.id}.${key}`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('should keep every nutrient below its plausibility ceiling', () => {
    for (const food of FOOD_SEED) {
      for (const key of NUTRIENT_KEYS) {
        expect(food.nutrients[key], `${food.id}.${key}`)
          .toBeLessThanOrEqual(NUTRIENT_CEILINGS[key]);
      }
    }
  });

  it('should keep sugars at or below available carbohydrate', () => {
    for (const food of FOOD_SEED) {
      expect(food.nutrients.sugarsG, food.id)
        .toBeLessThanOrEqual(food.nutrients.carbsG + 0.01);
    }
  });

  it('should keep the macro sum at or below 100 g per 100 g', () => {
    for (const food of FOOD_SEED) {
      const { proteinG, fatG, carbsG, fiberG } = food.nutrients;
      expect(proteinG + fatG + carbsG + fiberG, food.id).toBeLessThanOrEqual(100);
    }
  });

  it('should have energy coherent with its macros within 25%', () => {
    for (const food of FOOD_SEED) {
      const { energyKcal, proteinG, fatG, carbsG, fiberG } = food.nutrients;
      // Skip near-zero-energy foods: the ratio is meaningless there.
      if (energyKcal < 20) continue;
      // carbsG is available carbohydrate, excluding fibre (see Nutrients doc
      // comment). Fibre still contributes ~2 kcal/g in the Japanese and EU
      // schemes, so it must be added back in here or genuinely fibre-rich,
      // low-calorie foods (e.g. boiled spinach) fail this check.
      const computed = 4 * proteinG + 9 * fatG + 4 * carbsG + 2 * fiberG;
      const ratio = computed / energyKcal;
      expect(ratio, `${food.id}: ${computed.toFixed(0)} vs ${energyKcal}`)
        .toBeGreaterThan(0.75);
      expect(ratio, `${food.id}: ${computed.toFixed(0)} vs ${energyKcal}`)
        .toBeLessThan(1.25);
    }
  });

  it('should cover at least 280 foods across every group', () => {
    expect(FOOD_SEED.length).toBeGreaterThanOrEqual(280);
    const groups = new Set(FOOD_SEED.map((f) => f.group));
    for (const group of FOOD_GROUPS) {
      expect(groups.has(group), `no seed food in group ${group}`).toBe(true);
    }
  });

  it('should offer at least 20 stage-1 foods', () => {
    expect(FOOD_SEED.filter((f) => f.minStage === 1).length).toBeGreaterThanOrEqual(20);
  });

  it('should carry the allergen implied by its name', () => {
    for (const food of FOOD_SEED) {
      const segments = food.id.split('-');
      for (const [token, allergen] of Object.entries(IMPLIED_ALLERGENS)) {
        if (segments.includes(token)) {
          expect(food.allergens, `${food.id} should declare ${allergen}`)
            .toContain(allergen);
        }
      }
    }
  });
});
