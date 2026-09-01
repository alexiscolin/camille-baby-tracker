import type { Timestamp } from 'firebase/firestore';
import type { Allergen } from '../utils/allergens';

/** Nutrient values are always per 100 g of the food. */
export interface Nutrients {
  energyKcal: number;
  proteinG: number;
  fatG: number;
  /** Available carbohydrate, excluding fibre. */
  carbsG: number;
  fiberG: number;
  sugarsG: number;
  ironMg: number;
  calciumMg: number;
  zincMg: number;
  sodiumMg: number;
  potassiumMg: number;
  vitaminAUgRae: number;
  vitaminCMg: number;
  vitaminDUg: number;
  vitaminB12Ug: number;
  folateUg: number;
}

export const NUTRIENT_KEYS = [
  'energyKcal', 'proteinG', 'fatG', 'carbsG', 'fiberG', 'sugarsG',
  'ironMg', 'calciumMg', 'zincMg', 'sodiumMg', 'potassiumMg',
  'vitaminAUgRae', 'vitaminCMg', 'vitaminDUg', 'vitaminB12Ug', 'folateUg',
] as const satisfies readonly (keyof Nutrients)[];

export type NutrientKey = (typeof NUTRIENT_KEYS)[number];

export const FOOD_GROUPS = [
  'grain', 'vegetable', 'fruit', 'protein', 'dairy', 'fat', 'other',
] as const;
export type FoodGroup = (typeof FOOD_GROUPS)[number];

/** 1: 初期 5-6mo, 2: 中期 7-8mo, 3: 後期 9-11mo, 4: 完了期 12-18mo. */
export type WeaningStage = 1 | 2 | 3 | 4;

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Acceptance = 'all' | 'most' | 'half' | 'taste' | 'refused';
/** tsp is 小さじ = 5 ml, the unit Japanese weaning guidance is written in. */
export type FoodUnit = 'tsp' | 'g' | 'ml' | 'piece';

export type ReactionSymptom =
  | 'rash_local' | 'hives' | 'swelling' | 'vomiting'
  | 'diarrhea' | 'cough' | 'wheezing' | 'lethargy' | 'other';

export type ReactionSeverity = 'mild' | 'moderate' | 'severe';

/** Symptoms that trigger the static emergency reminder. */
export const SYSTEMIC_SYMPTOMS: readonly ReactionSymptom[] = [
  'hives', 'swelling', 'wheezing', 'lethargy',
];

export interface Reaction {
  symptoms: ReactionSymptom[];
  severity: ReactionSeverity;
  onsetMinutes?: number;
  resolvedMinutes?: number;
  suspectedFoodIds: string[];
  note?: string;
}

export interface MealItem {
  foodId: string;
  /** Denormalised label at logging time, so history survives a rename. */
  name: string;
  quantity: number;
  unit: FoodUnit;
  acceptance?: Acceptance;
  firstTry?: boolean;
}

export type FoodStatus =
  | 'untried' | 'safe' | 'watch' | 'suspected' | 'confirmed_allergy' | 'avoid';

/** A food the family has actually used. Reference data lives in food-seed.ts. */
export interface Food {
  id: string;
  name: string;
  group: FoodGroup;
  allergens: Allergen[];
  gramsPerTsp: number;
  minStage: WeaningStage;
  status: FoodStatus;
  statusUpdatedAt?: Timestamp;
  usageCount: number;
  exposureCount: number;
  firstTriedAt?: Timestamp;
  lastTriedAt?: Timestamp;
  reactionEventIds: string[];
  nutrients?: Nutrients;
  nutrientSource: 'seed' | 'manual';
  sourceRef?: string;
}

/** One row of the committed reference table. */
export interface SeedFood {
  id: string;
  name: string;
  group: FoodGroup;
  allergens: Allergen[];
  gramsPerTsp: number;
  minStage: WeaningStage;
  nutrients: Nutrients;
  sourceRef: string;
}
