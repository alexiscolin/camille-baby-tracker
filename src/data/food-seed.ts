import type { SeedFood, NutrientKey } from '../types/food';
import type { Allergen } from '../utils/allergens';

/**
 * Per-100g plausibility ceilings. Deliberately generous — they exist to catch
 * order-of-magnitude hallucinations, not to second-guess real outliers such
 * as liver (vitamin A, B12), oysters (zinc) or soy sauce (sodium).
 */
export const NUTRIENT_CEILINGS: Record<NutrientKey, number> = {
  energyKcal: 900,
  proteinG: 90,
  fatG: 100,
  carbsG: 100,
  fiberG: 80,
  sugarsG: 100,
  ironMg: 60,
  calciumMg: 1500,
  zincMg: 80,
  sodiumMg: 40000,
  potassiumMg: 4000,
  vitaminAUgRae: 15000,
  vitaminCMg: 2000,
  vitaminDUg: 60,
  vitaminB12Ug: 100,
  folateUg: 1500,
};

/** Slug segment → allergen it necessarily implies. Guards the data. */
export const IMPLIED_ALLERGENS: Record<string, Allergen> = {
  tofu: 'soy', natto: 'soy', kinako: 'soy', miso: 'soy', edamame: 'soy',
  udon: 'wheat', somen: 'wheat', bread: 'wheat', soba: 'buckwheat',
  yoghurt: 'milk', cheese: 'milk', butter: 'milk',
  shrimp: 'shrimp', crab: 'crab', peanut: 'peanut', walnut: 'walnut',
  salmon: 'salmon', mackerel: 'mackerel', chicken: 'chicken',
  beef: 'beef', pork: 'pork', sesame: 'sesame', banana: 'banana',
  kiwi: 'kiwi', peach: 'peach', apple: 'apple', orange: 'orange',
};

/**
 * 12-row starter table. Reference style for Task 4's full 300-row expansion.
 * Nutrient values are indicative per-100g estimates from Japanese Standard
 * Tables of Food Composition (8th ed.) for Japanese foods, or USDA
 * FoodData Central otherwise — see each row's sourceRef.
 */
export const FOOD_SEED: readonly SeedFood[] = [
  {
    id: 'okayu-10x',
    name: 'Okayu, 10:1 rice porridge',
    group: 'grain',
    allergens: [],
    gramsPerTsp: 5,
    minStage: 1,
    sourceRef: 'Japanese Standard Tables of Food Composition (8th ed.), rice, boiled, diluted 10:1 (okayu)',
    nutrients: {
      energyKcal: 36, proteinG: 0.6, fatG: 0.1, carbsG: 7.9, fiberG: 0.1,
      sugarsG: 0, ironMg: 0.1, calciumMg: 1, zincMg: 0.2, sodiumMg: 1,
      potassiumMg: 12, vitaminAUgRae: 0, vitaminCMg: 0, vitaminDUg: 0,
      vitaminB12Ug: 0, folateUg: 1,
    },
  },
  {
    id: 'carrot',
    name: 'Carrot, boiled',
    group: 'vegetable',
    allergens: [],
    gramsPerTsp: 5,
    minStage: 1,
    sourceRef: 'Japanese Standard Tables of Food Composition (8th ed.), carrot, root, boiled',
    nutrients: {
      energyKcal: 30, proteinG: 0.6, fatG: 0.1, carbsG: 6.4, fiberG: 2.8,
      sugarsG: 4.7, ironMg: 0.2, calciumMg: 28, zincMg: 0.1, sodiumMg: 25,
      potassiumMg: 240, vitaminAUgRae: 590, vitaminCMg: 3, vitaminDUg: 0,
      vitaminB12Ug: 0, folateUg: 19,
    },
  },
  {
    id: 'kabocha',
    name: 'Kabocha, boiled',
    group: 'vegetable',
    allergens: [],
    gramsPerTsp: 6,
    minStage: 1,
    sourceRef: 'Japanese Standard Tables of Food Composition (8th ed.), kabocha (Japanese pumpkin), boiled',
    nutrients: {
      energyKcal: 55, proteinG: 1.1, fatG: 0.1, carbsG: 11.3, fiberG: 3.1,
      sugarsG: 3.9, ironMg: 0.4, calciumMg: 17, zincMg: 0.3, sodiumMg: 1,
      potassiumMg: 400, vitaminAUgRae: 330, vitaminCMg: 16, vitaminDUg: 0,
      vitaminB12Ug: 0, folateUg: 24,
    },
  },
  {
    id: 'spinach',
    name: 'Spinach, boiled and drained',
    group: 'vegetable',
    allergens: [],
    gramsPerTsp: 4,
    minStage: 1,
    sourceRef: 'Japanese Standard Tables of Food Composition (8th ed.), spinach, boiled and drained',
    nutrients: {
      energyKcal: 23, proteinG: 2.6, fatG: 0.4, carbsG: 1.9, fiberG: 3.1,
      sugarsG: 0.4, ironMg: 1.0, calciumMg: 69, zincMg: 0.6, sodiumMg: 20,
      potassiumMg: 350, vitaminAUgRae: 350, vitaminCMg: 12, vitaminDUg: 0,
      vitaminB12Ug: 0, folateUg: 90,
    },
  },
  {
    id: 'sweet-potato',
    name: 'Sweet potato (satsumaimo), steamed',
    group: 'vegetable',
    allergens: [],
    gramsPerTsp: 7,
    minStage: 1,
    sourceRef: 'Japanese Standard Tables of Food Composition (8th ed.), sweet potato (satsumaimo), steamed',
    nutrients: {
      energyKcal: 131, proteinG: 1.2, fatG: 0.2, carbsG: 30.3, fiberG: 2.3,
      sugarsG: 8.0, ironMg: 0.6, calciumMg: 36, zincMg: 0.3, sodiumMg: 11,
      potassiumMg: 480, vitaminAUgRae: 3, vitaminCMg: 20, vitaminDUg: 0,
      vitaminB12Ug: 0, folateUg: 39,
    },
  },
  {
    id: 'silken-tofu',
    name: 'Silken tofu',
    group: 'protein',
    allergens: ['soy'],
    gramsPerTsp: 5,
    minStage: 1,
    sourceRef: 'Japanese Standard Tables of Food Composition (8th ed.), tofu, silken (kinugoshi)',
    nutrients: {
      energyKcal: 56, proteinG: 4.9, fatG: 3.0, carbsG: 1.7, fiberG: 0.3,
      sugarsG: 0.8, ironMg: 0.8, calciumMg: 57, zincMg: 0.5, sodiumMg: 5,
      potassiumMg: 150, vitaminAUgRae: 0, vitaminCMg: 0, vitaminDUg: 0,
      vitaminB12Ug: 0, folateUg: 12,
    },
  },
  {
    id: 'shirasu',
    name: 'Shirasu (whitebait), boiled and desalted',
    group: 'protein',
    allergens: [],
    gramsPerTsp: 3,
    minStage: 1,
    sourceRef: 'Japanese Standard Tables of Food Composition (8th ed.), shirasu (whitebait), boiled, values for a desalted preparation suitable for infant feeding',
    nutrients: {
      energyKcal: 76, proteinG: 15.0, fatG: 1.1, carbsG: 0.1, fiberG: 0,
      sugarsG: 0, ironMg: 0.4, calciumMg: 60, zincMg: 0.6, sodiumMg: 170,
      potassiumMg: 170, vitaminAUgRae: 8, vitaminCMg: 0, vitaminDUg: 6.7,
      vitaminB12Ug: 4.3, folateUg: 13,
    },
  },
  {
    id: 'cod',
    name: 'Cod (madara), boiled',
    group: 'protein',
    allergens: [],
    gramsPerTsp: 5,
    minStage: 1,
    sourceRef: 'Japanese Standard Tables of Food Composition (8th ed.), cod (madara), raw; used as an estimate for the boiled/steamed preparation typical for weaning',
    nutrients: {
      energyKcal: 77, proteinG: 17.6, fatG: 0.2, carbsG: 0.1, fiberG: 0,
      sugarsG: 0, ironMg: 0.2, calciumMg: 32, zincMg: 0.5, sodiumMg: 110,
      potassiumMg: 350, vitaminAUgRae: 10, vitaminCMg: 0, vitaminDUg: 1.0,
      vitaminB12Ug: 1.3, folateUg: 13,
    },
  },
  {
    id: 'banana',
    name: 'Banana',
    group: 'fruit',
    allergens: ['banana'],
    gramsPerTsp: 6,
    minStage: 1,
    sourceRef: 'USDA FoodData Central, banana, raw',
    nutrients: {
      energyKcal: 89, proteinG: 1.1, fatG: 0.2, carbsG: 20.0, fiberG: 2.6,
      sugarsG: 12.2, ironMg: 0.3, calciumMg: 5, zincMg: 0.2, sodiumMg: 1,
      potassiumMg: 360, vitaminAUgRae: 3, vitaminCMg: 9, vitaminDUg: 0,
      vitaminB12Ug: 0, folateUg: 20,
    },
  },
  {
    id: 'apple',
    name: 'Apple',
    group: 'fruit',
    allergens: ['apple'],
    gramsPerTsp: 5,
    minStage: 1,
    sourceRef: 'USDA FoodData Central, apple, raw with skin; used as an estimate for peeled/cooked apple compote typical for weaning',
    nutrients: {
      energyKcal: 52, proteinG: 0.3, fatG: 0.2, carbsG: 11.4, fiberG: 2.4,
      sugarsG: 10.1, ironMg: 0.1, calciumMg: 6, zincMg: 0.04, sodiumMg: 1,
      potassiumMg: 107, vitaminAUgRae: 2, vitaminCMg: 5, vitaminDUg: 0,
      vitaminB12Ug: 0, folateUg: 3,
    },
  },
  {
    id: 'egg-yolk',
    name: 'Egg yolk, boiled',
    group: 'protein',
    allergens: ['egg'],
    gramsPerTsp: 6,
    minStage: 1,
    sourceRef: 'Japanese Standard Tables of Food Composition (8th ed.), chicken egg, yolk, raw; used as an estimate for hard-boiled yolk',
    nutrients: {
      energyKcal: 336, proteinG: 16.5, fatG: 34.3, carbsG: 0.2, fiberG: 0,
      sugarsG: 0, ironMg: 4.8, calciumMg: 140, zincMg: 3.6, sodiumMg: 53,
      potassiumMg: 100, vitaminAUgRae: 690, vitaminCMg: 0, vitaminDUg: 12.0,
      vitaminB12Ug: 3.5, folateUg: 150,
    },
  },
  {
    id: 'plain-yoghurt',
    name: 'Plain yoghurt, whole milk, unsweetened',
    group: 'dairy',
    allergens: ['milk'],
    gramsPerTsp: 5,
    minStage: 2,
    sourceRef: 'USDA FoodData Central, yogurt, plain, whole milk',
    nutrients: {
      energyKcal: 62, proteinG: 3.6, fatG: 3.0, carbsG: 4.9, fiberG: 0,
      sugarsG: 4.9, ironMg: 0.1, calciumMg: 120, zincMg: 0.4, sodiumMg: 48,
      potassiumMg: 150, vitaminAUgRae: 33, vitaminCMg: 1, vitaminDUg: 0,
      vitaminB12Ug: 0.1, folateUg: 11,
    },
  },
];
