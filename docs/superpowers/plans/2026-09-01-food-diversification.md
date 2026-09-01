# Food Diversification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add solid-food (離乳食) tracking to the baby tracker: multi-food meals logged as a sixth event type, a food catalog with autocomplete, allergy reaction and status tracking, a "what to try next" screen, and food-specific charts.

**Architecture:** A meal is an ordinary `BabyEvent` in the existing `families/{id}/events` collection, discriminated by `type: 'meal'`, carrying an `items[]` array. A new `families/{id}/foods` subcollection is the family's food catalog — the exact sibling pattern already used by `measurements`. A committed 300-entry seed table supplies nutrient data offline; there is no runtime LLM. Everything renders through the existing `EVENT_CONFIG` registry, so the timeline, summaries, radar and stats charts pick up meals for free.

**Tech Stack:** React 19, TypeScript strict, Vite, Firebase Firestore, Recharts, lucide-react, Vitest + Testing Library, CSS Modules with the design tokens in `src/index.css`.

**Spec:** `docs/superpowers/specs/2026-09-01-food-diversification-design.md`

## Global Constraints

- TypeScript strict mode. **No `any`.** No default exports — named exports only.
- File naming: `kebab-case.ts` for utils/services, `PascalCase.tsx` for components.
- All code, comments, commit messages and docs in **English**. Conversation with the user is in French.
- TDD, strictly: write the failing test, run it, watch it fail, then implement.
- No new npm dependencies. Everything uses what is already in `package.json`.
- All colours go through `var(--color-*)`. No hard-coded hex outside `src/index.css`.
- Every new colour token is defined in **both** `:root` and the `@media (prefers-color-scheme: dark)` block.
- Nutrient values are **per 100 g**. `tsp` means 小さじ = 5 ml; grams come from the food's `gramsPerTsp`.
- The UI never uses the word "safe" for a food. The label is `No reaction ×N`.
- `confirmed_allergy` and `avoid` statuses are set by a human only, never derived.
- Existing tests must stay green. Run `npm run test` before every commit.
- **Never `git push` and never open a PR** without asking the user first.
- Work happens on branch `feat/food-diversification`.

## File Structure

**Created**

| Path | Responsibility |
| --- | --- |
| `src/types/food.ts` | `MealEvent`, `MealItem`, `Reaction`, `Food`, `Nutrients`, `SeedFood`, enums |
| `src/utils/allergens.ts` | The 28 Japanese allergen ids, labels, and grouping |
| `src/utils/weaning-stage.ts` | Age → stage derivation, expected meals per day |
| `src/data/food-seed.ts` | The 300-entry seed table (lazily imported) |
| `src/data/food-seed.test.ts` | Mechanical integrity suite for the seed table |
| `src/services/food-catalog.ts` | Firestore CRUD + subscription for `families/{id}/foods` |
| `src/hooks/useFoods.ts` | Subscription hook, mirrors `useMeasurements` |
| `src/utils/food-status.ts` | Pure status derivation from exposures and reactions |
| `src/utils/next-foods.ts` | Pure "try next" ranking + 3-day window + allergen maintenance |
| `src/utils/meal-nutrition.ts` | tsp→g conversion, per-meal and per-range nutrient roll-up |
| `src/components/FoodTagInput.tsx` | Chip input with autocomplete |
| `src/components/EventModal/FeedingFields.tsx` | Extracted from `EventModal.tsx` |
| `src/components/EventModal/PoopFields.tsx` | Extracted from `EventModal.tsx` |
| `src/components/EventModal/MedicationFields.tsx` | Extracted from `EventModal.tsx` |
| `src/components/EventModal/MealFields.tsx` | Meal slot, food chips, reaction block |
| `src/components/AllergenGrid.tsx` | 7×4 token grid + detail sheet |
| `src/pages/FoodPage.tsx` | Hero, allergen grid, recently-introduced strip |
| `src/pages/FoodCharts.tsx` | The 4 charts, lazily loaded (P2) |
| `src/utils/food-chart-data.ts` | Chart series builders (P2) |

**Modified**

| Path | Change |
| --- | --- |
| `src/types/events.ts` | `'meal'` joins `EventType`; `MealEvent` joins `BabyEvent` |
| `src/utils/event-config.ts` | `meal` entry in `EVENT_CONFIG` |
| `src/index.css` | `--color-meal` / `--color-meal-bg` in both themes |
| `src/components/Layout.module.css:84` | `.navItem` horizontal padding `--space-lg` → `--space-md` |
| `src/components/Layout.tsx` | Fifth nav entry, sidebar + bottom nav |
| `src/components/EventModal.tsx` | Slimmed to time/type/notes/save; delegates fields |
| `src/services/events.ts` | `MealEvent` joins the `NewEvent` union |
| `src/App.tsx` | `/food` route |
| `src/pages/StatsPage.module.css` | Grids recalibrated for 6 event types |
| `firestore.rules` | `meal` branch, `foods` subcollection rules |
| `firestore.indexes.json` | Two missing composite indexes |
| `specs/data-model.md` | Bring up to date (stale: `bath`, `sex`, `feedingType`) |

---

## Task 1: Food domain types and allergen constants

**Files:**
- Create: `src/types/food.ts`
- Create: `src/utils/allergens.ts`
- Create: `src/utils/allergens.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `Nutrients`, `NUTRIENT_KEYS`, `FoodGroup`, `FOOD_GROUPS`, `WeaningStage`, `MealSlot`, `Acceptance`, `FoodUnit`, `MealItem`, `Reaction`, `ReactionSymptom`, `ReactionSeverity`, `FoodStatus`, `Food`, `SeedFood`; `ALLERGENS`, `MANDATORY_ALLERGENS`, `RECOMMENDED_ALLERGENS`, `ALLERGEN_LABELS`, `Allergen`, `isMandatoryAllergen(a: Allergen): boolean`.

- [ ] **Step 1: Write the failing test**

`src/utils/allergens.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  ALLERGENS,
  MANDATORY_ALLERGENS,
  RECOMMENDED_ALLERGENS,
  ALLERGEN_LABELS,
  isMandatoryAllergen,
} from './allergens';

describe('allergens', () => {
  it('should list the 8 mandatory Japanese allergens', () => {
    expect(MANDATORY_ALLERGENS).toHaveLength(8);
    expect(MANDATORY_ALLERGENS).toContain('egg');
    expect(MANDATORY_ALLERGENS).toContain('walnut');
  });

  it('should list the 20 recommended Japanese allergens', () => {
    expect(RECOMMENDED_ALLERGENS).toHaveLength(20);
    expect(RECOMMENDED_ALLERGENS).toContain('soy');
    expect(RECOMMENDED_ALLERGENS).toContain('gelatin');
  });

  it('should expose 28 allergens in total with no duplicates', () => {
    expect(ALLERGENS).toHaveLength(28);
    expect(new Set(ALLERGENS).size).toBe(28);
  });

  it('should provide a human label for every allergen', () => {
    for (const allergen of ALLERGENS) {
      expect(ALLERGEN_LABELS[allergen]).toBeTruthy();
    }
  });

  it('should identify mandatory allergens', () => {
    expect(isMandatoryAllergen('egg')).toBe(true);
    expect(isMandatoryAllergen('banana')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/allergens.test.ts`
Expected: FAIL — "Failed to resolve import ./allergens"

- [ ] **Step 3: Write `src/utils/allergens.ts`**

```ts
/** The 8 allergens Japan requires to be labelled (特定原材料). */
export const MANDATORY_ALLERGENS = [
  'egg', 'milk', 'wheat', 'shrimp', 'crab', 'buckwheat', 'peanut', 'walnut',
] as const;

/** The 20 allergens Japan recommends labelling (推奨表示). */
export const RECOMMENDED_ALLERGENS = [
  'almond', 'abalone', 'squid', 'salmon_roe', 'orange', 'cashew', 'kiwi',
  'beef', 'sesame', 'salmon', 'mackerel', 'soy', 'chicken', 'banana',
  'pork', 'matsutake', 'peach', 'yam', 'apple', 'gelatin',
] as const;

export const ALLERGENS = [...MANDATORY_ALLERGENS, ...RECOMMENDED_ALLERGENS] as const;

export type Allergen = (typeof ALLERGENS)[number];

const MANDATORY_SET = new Set<string>(MANDATORY_ALLERGENS);

export function isMandatoryAllergen(allergen: Allergen): boolean {
  return MANDATORY_SET.has(allergen);
}

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  egg: 'Egg', milk: 'Milk', wheat: 'Wheat', shrimp: 'Shrimp', crab: 'Crab',
  buckwheat: 'Buckwheat', peanut: 'Peanut', walnut: 'Walnut',
  almond: 'Almond', abalone: 'Abalone', squid: 'Squid', salmon_roe: 'Salmon roe',
  orange: 'Orange', cashew: 'Cashew', kiwi: 'Kiwi', beef: 'Beef', sesame: 'Sesame',
  salmon: 'Salmon', mackerel: 'Mackerel', soy: 'Soy', chicken: 'Chicken',
  banana: 'Banana', pork: 'Pork', matsutake: 'Matsutake', peach: 'Peach',
  yam: 'Yam', apple: 'Apple', gelatin: 'Gelatin',
};
```

- [ ] **Step 4: Write `src/types/food.ts`**

```ts
import type { Timestamp } from 'firebase/firestore';
import type { Allergen } from '../utils/allergens';
import type { BaseEvent } from './events';

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

export interface MealEvent extends BaseEvent {
  type: 'meal';
  mealSlot: MealSlot;
  items: MealItem[];
  reaction?: Reaction;
}

export const MAX_MEAL_ITEMS = 12;

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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/utils/allergens.test.ts && npx tsc -b`
Expected: PASS, and the type-check is clean.

- [ ] **Step 6: Commit**

```bash
git checkout -b feat/food-diversification
git add src/types/food.ts src/utils/allergens.ts src/utils/allergens.test.ts
git commit -m "feat(food): add food domain types and Japanese allergen constants"
```

---

## Task 2: Weaning stage derivation

**Files:**
- Create: `src/utils/weaning-stage.ts`
- Create: `src/utils/weaning-stage.test.ts`

**Interfaces:**
- Consumes: `WeaningStage` from `src/types/food.ts`.
- Produces: `getWeaningStage(birthDate: Date, on?: Date): WeaningStage | null`, `STAGE_LABELS: Record<WeaningStage, string>`, `EXPECTED_MEALS_PER_DAY: Record<WeaningStage, number>`.

- [ ] **Step 1: Write the failing test**

`src/utils/weaning-stage.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/weaning-stage.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/utils/weaning-stage.ts`**

```ts
import { differenceInMonths } from 'date-fns';
import type { WeaningStage } from '../types/food';

export const STAGE_LABELS: Record<WeaningStage, string> = {
  1: 'Stage 1 · 5-6 months',
  2: 'Stage 2 · 7-8 months',
  3: 'Stage 3 · 9-11 months',
  4: 'Stage 4 · 12-18 months',
};

export const EXPECTED_MEALS_PER_DAY: Record<WeaningStage, number> = {
  1: 1, 2: 2, 3: 3, 4: 3,
};

/** Returns null before weaning normally starts at 5 months. */
export function getWeaningStage(birthDate: Date, on: Date = new Date()): WeaningStage | null {
  const months = differenceInMonths(on, birthDate);
  if (months < 5) return null;
  if (months < 7) return 1;
  if (months < 9) return 2;
  if (months < 12) return 3;
  return 4;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/weaning-stage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/weaning-stage.ts src/utils/weaning-stage.test.ts
git commit -m "feat(food): derive Japanese weaning stage from baby age"
```

---
## Task 3: Seed table integrity harness

Build the validator **before** the data, so the 300 rows are generated against a
gate that already exists. Ship a 12-row starter table to prove the harness.

**Files:**
- Create: `src/data/food-seed.ts`
- Create: `src/data/food-seed.test.ts`

**Interfaces:**
- Consumes: `SeedFood`, `Nutrients`, `NUTRIENT_KEYS`, `FOOD_GROUPS` from `src/types/food.ts`; `ALLERGENS` from `src/utils/allergens.ts`.
- Produces: `FOOD_SEED: readonly SeedFood[]`, `NUTRIENT_CEILINGS: Record<NutrientKey, number>`, `IMPLIED_ALLERGENS: Record<string, Allergen>`.

- [ ] **Step 1: Write the failing test**

`src/data/food-seed.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { FOOD_SEED, NUTRIENT_CEILINGS, IMPLIED_ALLERGENS } from './food-seed';
import { NUTRIENT_KEYS, FOOD_GROUPS } from '../types/food';
import { ALLERGENS } from '../utils/allergens';

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
      const { energyKcal, proteinG, fatG, carbsG } = food.nutrients;
      // Skip near-zero-energy foods: the ratio is meaningless there.
      if (energyKcal < 20) continue;
      const computed = 4 * proteinG + 9 * fatG + 4 * carbsG;
      const ratio = computed / energyKcal;
      expect(ratio, `${food.id}: ${computed.toFixed(0)} vs ${energyKcal}`)
        .toBeGreaterThan(0.75);
      expect(ratio, `${food.id}: ${computed.toFixed(0)} vs ${energyKcal}`)
        .toBeLessThan(1.25);
    }
  });

  it('should carry the allergen implied by its name', () => {
    for (const food of FOOD_SEED) {
      for (const [token, allergen] of Object.entries(IMPLIED_ALLERGENS)) {
        if (food.id.includes(token)) {
          expect(food.allergens, `${food.id} should declare ${allergen}`)
            .toContain(allergen);
        }
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/food-seed.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/data/food-seed.ts` with the ceilings and a 12-row starter**

Ceilings are per 100 g and deliberately generous — they exist to catch order-of-magnitude hallucinations, not to second-guess real outliers such as liver (vitamin A, B12), oysters (zinc) or soy sauce (sodium).

```ts
import type { SeedFood, NutrientKey } from '../types/food';
import type { Allergen } from '../utils/allergens';

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

/** Slug substring → allergen it necessarily implies. Guards the data. */
export const IMPLIED_ALLERGENS: Record<string, Allergen> = {
  tofu: 'soy',
  natto: 'soy',
  kinako: 'soy',
  miso: 'soy',
  edamame: 'soy',
  udon: 'wheat',
  somen: 'wheat',
  bread: 'wheat',
  soba: 'buckwheat',
  shirasu: 'other' as Allergen, // placeholder removed below
};

export const FOOD_SEED: readonly SeedFood[] = [
  {
    id: 'okayu-10x',
    name: 'Okayu, 10:1 rice porridge',
    group: 'grain',
    allergens: [],
    gramsPerTsp: 5,
    minStage: 1,
    sourceRef: 'rice, boiled, 10:1 dilution',
    nutrients: {
      energyKcal: 36, proteinG: 0.6, fatG: 0.1, carbsG: 7.9, fiberG: 0.1,
      sugarsG: 0, ironMg: 0.1, calciumMg: 1, zincMg: 0.2, sodiumMg: 1,
      potassiumMg: 12, vitaminAUgRae: 0, vitaminCMg: 0, vitaminDUg: 0,
      vitaminB12Ug: 0, folateUg: 1,
    },
  },
  // ... 11 more starter rows covering: carrot, kabocha, spinach, sweet potato,
  // tofu (silken), shirasu, cod, banana, apple, egg yolk, plain yoghurt.
];
```

**Important:** delete the `shirasu` line from `IMPLIED_ALLERGENS` — shirasu (whitebait) is not one of the 28 listed allergens. The map must contain only real slug→allergen implications. The final map is:

```ts
export const IMPLIED_ALLERGENS: Record<string, Allergen> = {
  tofu: 'soy', natto: 'soy', kinako: 'soy', miso: 'soy', edamame: 'soy',
  udon: 'wheat', somen: 'wheat', bread: 'wheat', soba: 'buckwheat',
  yoghurt: 'milk', cheese: 'milk', butter: 'milk',
  shrimp: 'shrimp', crab: 'crab', peanut: 'peanut', walnut: 'walnut',
  salmon: 'salmon', mackerel: 'mackerel', chicken: 'chicken',
  beef: 'beef', pork: 'pork', sesame: 'sesame', banana: 'banana',
  kiwi: 'kiwi', peach: 'peach', apple: 'apple', orange: 'orange',
};
```

Write the 12 starter rows in full, with real values. They are the reference style for Task 4.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/food-seed.test.ts`
Expected: PASS, all 13 assertions green against the 12 starter rows.

- [ ] **Step 5: Commit**

```bash
git add src/data/food-seed.ts src/data/food-seed.test.ts
git commit -m "feat(food): add seed table integrity harness and starter entries"
```

---

## Task 4: Grow the seed table to 300 entries

**Files:**
- Modify: `src/data/food-seed.ts`

**Interfaces:**
- Consumes: everything from Task 3.
- Produces: `FOOD_SEED` with ~300 rows.

- [ ] **Step 1: Add a count assertion to the existing test**

Append to `src/data/food-seed.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/food-seed.test.ts`
Expected: FAIL — "expected 12 to be greater than or equal to 280".

- [ ] **Step 3: Generate the rows in batches, by group**

Write the rows group by group so each batch stays reviewable. Target coverage —
what a baby in Japan actually eats during weaning:

- **grain (~45):** okayu at 10:1, 7:1, 5:1, soft rice, udon, somen, macaroni, shokupan, oatmeal, cornflakes, potato, sweet potato, taro, yam
- **vegetable (~80):** carrot, daikon, kabocha, spinach, komatsuna, broccoli, cauliflower, cabbage, hakusai, onion, tomato, cucumber, aubergine, courgette, green beans, peas, corn, turnip, lotus root, burdock, okra, bell pepper, mushrooms
- **fruit (~35):** banana, apple, pear, nashi, strawberry, mandarin, melon, watermelon, peach, grape, kiwi, persimmon, blueberry, prune
- **protein (~70):** shirasu, cod, flounder, sea bream, salmon, tuna, mackerel, chicken breast and mince, pork, beef, egg yolk, whole egg, tofu (silken and firm), natto, kinako, koya-dofu, atsuage, edamame, lentils, chickpeas, high-iron liver
- **dairy (~20):** plain yoghurt, cottage cheese, processed cheese, milk, formula, butter
- **fat (~10):** vegetable oil, olive oil, sesame oil, sesame paste
- **other (~40):** wakame, hijiki, nori, katsuo dashi, kombu dashi, miso, soy sauce, ketchup, aonori, water, barley tea

Every row must pass the Task 3 gate. Run the suite after each batch:

Run: `npx vitest run src/data/food-seed.test.ts`

- [ ] **Step 4: Dispatch the cross-check subagent**

Once the table is complete, dispatch a subagent with this brief:

> You are cross-checking a nutrient reference table. Read `src/data/food-seed.ts`. For each entry, independently estimate the 16 per-100 g nutrient values from your own knowledge of food composition (Japanese Standard Tables of Food Composition where applicable, USDA otherwise). Report ONLY entries where your estimate diverges from the table by more than 2× on any nutrient, or where the food group, `minStage` or allergen list looks wrong. Output a list of `{id, field, tableValue, yourEstimate, confidence}`. Do not edit any file. Do not report agreement.

- [ ] **Step 5: Arbitrate the divergences**

For each reported divergence: correct the row if the subagent is right, or add a
brief `sourceRef` note explaining why the table value stands. Never accept a
divergence silently. Re-run the suite after edits.

- [ ] **Step 6: Spot-check 30 well-known entries by hand**

Verify against published values: banana, apple, carrot, spinach, egg yolk, cod,
salmon, chicken breast, silken tofu, natto, plain yoghurt, white rice, udon,
sweet potato, kabocha, broccoli, tomato, milk, olive oil, sesame, and 10 more of
your choosing. Fix what is wrong.

- [ ] **Step 7: Run the full suite**

Run: `npm run test`
Expected: PASS, existing 232 tests plus the new seed tests.

- [ ] **Step 8: Commit**

```bash
git add src/data/food-seed.ts src/data/food-seed.test.ts
git commit -m "feat(food): grow seed table to 300 verified entries"
```

---
## Task 5: Split EventModal into per-type field components

Prerequisite refactor. `EventModal.tsx` is 530 lines with one `useState` per
field of every type; adding a multi-food form takes it past 900. The 534-line
`EventModal.test.tsx` is the safety net — it must stay green untouched.

**Files:**
- Create: `src/components/EventModal/FeedingFields.tsx`
- Create: `src/components/EventModal/PoopFields.tsx`
- Create: `src/components/EventModal/MedicationFields.tsx`
- Modify: `src/components/EventModal.tsx`

**Interfaces:**
- Consumes: `EventModal.module.css` classes, `ColorSelector`, `getStoolColorWarning`, `addMinutesToTime`, `computeDurationMinutes`.
- Produces:
  - `FeedingFields({ feedingType, onFeedingTypeChange, leftCount, onLeftCountChange, rightCount, onRightCountChange, startTime, endTime, onEndTimeChange, infection, onInfectionChange, engorgement, onEngorgementChange }): JSX.Element`
  - `PoopFields({ color, onColorChange, warning }): JSX.Element`
  - `MedicationFields({ medicationName, onMedicationNameChange, dose, onDoseChange, maxLength }): JSX.Element`

- [ ] **Step 1: Run the existing suite to capture the baseline**

Run: `npx vitest run src/components/EventModal.test.tsx`
Expected: PASS. Note the test count — it must not change.

- [ ] **Step 2: Extract the three components**

Move the JSX for each type out of `EventModal.tsx` verbatim into its own file.
State stays in `EventModal`; the children are presentational and take value +
change-handler props. Do not rename any DOM id, label text, `aria-label` or
`htmlFor` — the existing tests query by those.

`src/components/EventModal/PoopFields.tsx` is the smallest and shows the shape:

```tsx
import { ColorSelector } from '../ColorSelector';
import type { StoolColorId, StoolColorWarning } from '../../utils/stool-color';

interface PoopFieldsProps {
  color: StoolColorId | undefined;
  onColorChange: (value: StoolColorId | undefined) => void;
  warning: StoolColorWarning | null;
}

export function PoopFields({ color, onColorChange, warning }: PoopFieldsProps) {
  return <ColorSelector value={color} onChange={onColorChange} warning={warning} />;
}
```

- [ ] **Step 3: Run the suite to verify nothing moved**

Run: `npx vitest run src/components/EventModal.test.tsx`
Expected: PASS, exactly the same number of tests as in Step 1.

- [ ] **Step 4: Run the full suite and type-check**

Run: `npm run test && npx tsc -b && npm run lint`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/components/EventModal.tsx src/components/EventModal/
git commit -m "refactor(modal): extract per-type field components from EventModal"
```

---

## Task 6: Register meal as the sixth event type

Adding one entry to `EVENT_CONFIG` propagates meals to `DaySection`,
`EventTimeline`, `ActivityRadar`, `DashboardChart`, `StatsCharts`,
`chart-helpers`, `summary` and the modal's type grid. This task also fixes the
bottom nav, which measurement shows overflows by 59 px at a fifth entry.

**Files:**
- Modify: `src/types/events.ts`
- Modify: `src/utils/event-config.ts`
- Modify: `src/services/events.ts`
- Modify: `src/index.css`
- Modify: `src/components/Layout.module.css` (line 84)
- Modify: `src/pages/StatsPage.module.css`
- Create: `src/utils/event-config.test.ts`

**Interfaces:**
- Consumes: `MealEvent` from `src/types/food.ts`.
- Produces: `EventType` including `'meal'`; `EVENT_CONFIG.meal`; `BabyEvent` including `MealEvent`.

- [ ] **Step 1: Write the failing test**

`src/utils/event-config.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { EVENT_CONFIG, EVENT_TYPES } from './event-config';

describe('EVENT_CONFIG', () => {
  it('should include meal as an event type', () => {
    expect(EVENT_TYPES).toContain('meal');
  });

  it('should give meal a label, an icon and CSS variable colours', () => {
    const config = EVENT_CONFIG.meal;
    expect(config.label).toBe('Meals');
    expect(config.icon).toBeTruthy();
    expect(config.color).toBe('var(--color-meal)');
    expect(config.bg).toBe('var(--color-meal-bg)');
  });

  it('should use CSS variables for every event colour', () => {
    for (const type of EVENT_TYPES) {
      expect(EVENT_CONFIG[type].color).toMatch(/^var\(--color-/);
      expect(EVENT_CONFIG[type].bg).toMatch(/^var\(--color-/);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/event-config.test.ts`
Expected: FAIL — `EVENT_TYPES` does not contain `'meal'`.

- [ ] **Step 3: Add the type**

In `src/types/events.ts`:

```ts
export type EventType = 'feeding' | 'pee' | 'poop' | 'medication' | 'bath' | 'meal';
```

and extend the union (import `MealEvent` from `./food`):

```ts
export type BabyEvent =
  | FeedingEvent | PeeEvent | PoopEvent | MedicationEvent | BathEvent | MealEvent;
```

In `src/utils/event-config.ts`, import `Salad` from `lucide-react` and add:

```ts
meal: { icon: Salad, label: 'Meals', color: 'var(--color-meal)', bg: 'var(--color-meal-bg)' },
```

In `src/services/events.ts`, add `| Omit<MealEvent, 'id' | 'createdAt'>` to the
`NewEvent` union.

- [ ] **Step 4: Add the colour tokens**

In `src/index.css`, in `:root`, after the `--color-bath` pair:

```css
  --color-meal: #22c55e;
  --color-meal-bg: #dcfce7;
```

and inside `@media (prefers-color-scheme: dark) { :root { ... } }`, after
`--color-bath-bg`:

```css
    --color-meal-bg: rgba(34, 197, 94, 0.15);
```

- [ ] **Step 5: Fix the bottom navigation**

In `src/components/Layout.module.css`, line 84, change `.navItem` padding:

```css
  padding: var(--space-xs) var(--space-md);
```

Measured at a 375 px viewport: five items need 432 px with `--space-lg` against
373 px available (59 px overflow, "Settings" clipped); with `--space-md` they
need exactly 373 px, with a 60×50 px minimum tap target.

- [ ] **Step 6: Recalibrate the stats grids for six types**

In `src/pages/StatsPage.module.css`, in the `@media (min-width: 1024px)` block,
change `.metricsRow` from `repeat(5, 1fr)` to `repeat(3, 1fr)` so six metrics
form two clean rows instead of one row of five plus an orphan.

- [ ] **Step 7: Run everything**

Run: `npm run test && npx tsc -b && npm run lint`
Expected: PASS. Meals now appear in the modal's type grid, the timeline badges,
the radar and the stats charts with no further wiring.

- [ ] **Step 8: Commit**

```bash
git add src/types/events.ts src/utils/event-config.ts src/utils/event-config.test.ts \
        src/services/events.ts src/index.css src/components/Layout.module.css \
        src/pages/StatsPage.module.css
git commit -m "feat(food): register meal as the sixth event type and fix nav overflow"
```

---

## Task 7: Food catalog service and hook

Mirrors `src/services/measurements.ts` and `src/hooks/useMeasurements.ts`
exactly. Read those two files first and follow their structure.

**Files:**
- Create: `src/services/food-catalog.ts`
- Create: `src/hooks/useFoods.ts`
- Create: `src/services/food-catalog.test.ts`

**Interfaces:**
- Consumes: `Food`, `SeedFood`, `FoodStatus` from `src/types/food.ts`; `db` from `src/services/firebase.ts`.
- Produces:
  - `foodFromSeed(seed: SeedFood): Omit<Food, 'firstTriedAt' | 'lastTriedAt' | 'statusUpdatedAt'>`
  - `slugify(name: string): string`
  - `isValidFoodData(data: Record<string, unknown>): boolean`
  - `upsertFood(familyId: string, food: Food): Promise<void>`
  - `updateFood(familyId: string, foodId: string, data: Partial<Food>): Promise<void>`
  - `subscribeToFoods(familyId, callback, onError?): Unsubscribe`
  - `useFoods(familyId?: string): { foods: Food[]; loading: boolean; fromCache: boolean; hasPendingWrites: boolean }`

- [ ] **Step 1: Write the failing test**

`src/services/food-catalog.test.ts` — tests only the pure helpers; the Firestore
calls follow the already-proven `measurements.ts` shape and are not unit-tested,
consistent with the rest of the codebase.

```ts
import { describe, it, expect } from 'vitest';
import { slugify, foodFromSeed, isValidFoodData } from './food-catalog';
import type { SeedFood } from '../types/food';

const seed: SeedFood = {
  id: 'kabocha',
  name: 'Kabocha squash',
  group: 'vegetable',
  allergens: [],
  gramsPerTsp: 5,
  minStage: 1,
  sourceRef: 'pumpkin, western, boiled',
  nutrients: {
    energyKcal: 60, proteinG: 1.6, fatG: 0.3, carbsG: 12.2, fiberG: 3.6,
    sugarsG: 4.1, ironMg: 0.5, calciumMg: 14, zincMg: 0.3, sodiumMg: 1,
    potassiumMg: 430, vitaminAUgRae: 330, vitaminCMg: 32, vitaminDUg: 0,
    vitaminB12Ug: 0, folateUg: 38,
  },
};

describe('slugify', () => {
  it('should lowercase and hyphenate', () => {
    expect(slugify('Kabocha Squash')).toBe('kabocha-squash');
  });

  it('should strip punctuation and collapse separators', () => {
    expect(slugify('Okayu (10:1)  rice')).toBe('okayu-10-1-rice');
  });

  it('should trim leading and trailing hyphens', () => {
    expect(slugify('  --Tofu--  ')).toBe('tofu');
  });

  it('should keep non-latin names usable by falling back to a stable hash', () => {
    const slug = slugify('しらす');
    expect(slug).not.toBe('');
    expect(slug).toMatch(/^[a-z0-9-]+$/);
    expect(slugify('しらす')).toBe(slug);
  });
});

describe('foodFromSeed', () => {
  it('should carry the seed data across', () => {
    const food = foodFromSeed(seed);
    expect(food.id).toBe('kabocha');
    expect(food.name).toBe('Kabocha squash');
    expect(food.group).toBe('vegetable');
    expect(food.minStage).toBe(1);
    expect(food.nutrients).toEqual(seed.nutrients);
    expect(food.sourceRef).toBe(seed.sourceRef);
  });

  it('should start untried with no exposures', () => {
    const food = foodFromSeed(seed);
    expect(food.status).toBe('untried');
    expect(food.usageCount).toBe(0);
    expect(food.exposureCount).toBe(0);
    expect(food.reactionEventIds).toEqual([]);
  });

  it('should mark the nutrient source as seed', () => {
    expect(foodFromSeed(seed).nutrientSource).toBe('seed');
  });
});

describe('isValidFoodData', () => {
  const valid = {
    name: 'Tofu', group: 'protein', allergens: ['soy'], gramsPerTsp: 5,
    minStage: 2, status: 'untried', usageCount: 0, exposureCount: 0,
    reactionEventIds: [], nutrientSource: 'seed',
  };

  it('should accept a well-formed document', () => {
    expect(isValidFoodData(valid)).toBe(true);
  });

  it('should reject a missing name', () => {
    expect(isValidFoodData({ ...valid, name: '' })).toBe(false);
  });

  it('should reject an unknown group', () => {
    expect(isValidFoodData({ ...valid, group: 'candy' })).toBe(false);
  });

  it('should reject an unknown status', () => {
    expect(isValidFoodData({ ...valid, status: 'delicious' })).toBe(false);
  });

  it('should reject an out-of-range stage', () => {
    expect(isValidFoodData({ ...valid, minStage: 9 })).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/food-catalog.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/services/food-catalog.ts`**

`slugify` must be deterministic for non-latin input — Japanese food names typed
directly must still produce a stable, usable document id:

```ts
export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (base) return base;
  // Non-latin input: stable FNV-1a hash so the same name always maps to the
  // same document id.
  let hash = 2166136261;
  for (let i = 0; i < name.length; i += 1) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `food-${(hash >>> 0).toString(36)}`;
}
```

The rest follows `measurements.ts`: `foodsCollection(familyId)`,
`isValidFoodData`, `upsertFood` using `setDoc(doc(...), data, { merge: true })`
keyed by the slug, `updateFood`, and `subscribeToFoods` with
`{ includeMetadataChanges: true }` returning `{ foods, fromCache, hasPendingWrites }`.

- [ ] **Step 4: Implement `src/hooks/useFoods.ts`**

Copy `useMeasurements.ts` structure exactly, substituting the food subscription.
It takes only `familyId` — the catalog is family-scoped, not baby-scoped.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/services/food-catalog.test.ts && npx tsc -b`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/services/food-catalog.ts src/services/food-catalog.test.ts src/hooks/useFoods.ts
git commit -m "feat(food): add food catalog service and subscription hook"
```

---
## Task 8: Allergy status derivation

A reaction is a property of a meal; a status is a property of a food. Pure
functions, fully testable without Firebase. `confirmed_allergy` and `avoid` are
never derived — the app records and suggests, it never concludes.

**Files:**
- Create: `src/utils/food-status.ts`
- Create: `src/utils/food-status.test.ts`

**Interfaces:**
- Consumes: `Food`, `FoodStatus`, `MealEvent`, `Reaction` from `src/types/food.ts`.
- Produces:
  - `deriveStatus(food: Pick<Food, 'status' | 'exposureCount' | 'reactionEventIds'>, cleanExposuresSinceReaction: number): FoodStatus`
  - `novelFoodIds(items: MealItem[]): string[]`
  - `applyReaction(foods: Food[], meal: MealEvent, mealId: string): Food[]`
  - `statusLabel(food: Pick<Food, 'status' | 'exposureCount'>): string`
  - `isManualStatus(status: FoodStatus): boolean`

- [ ] **Step 1: Write the failing test**

`src/utils/food-status.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { deriveStatus, novelFoodIds, statusLabel, isManualStatus } from './food-status';
import type { MealItem } from '../types/food';

const food = (status: string, exposures: number, reactions: string[] = []) =>
  ({ status, exposureCount: exposures, reactionEventIds: reactions }) as never;

describe('deriveStatus', () => {
  it('should keep a food untried below three clean exposures', () => {
    expect(deriveStatus(food('untried', 0), 0)).toBe('untried');
    expect(deriveStatus(food('untried', 2), 2)).toBe('untried');
  });

  it('should promote to safe after three clean exposures', () => {
    expect(deriveStatus(food('untried', 3), 3)).toBe('safe');
  });

  it('should keep a suspected food suspected with no clean re-exposure', () => {
    expect(deriveStatus(food('suspected', 4, ['e1']), 0)).toBe('suspected');
  });

  it('should move suspected to watch after one clean re-exposure', () => {
    expect(deriveStatus(food('suspected', 5, ['e1']), 1)).toBe('watch');
  });

  it('should move watch back to safe after three clean re-exposures', () => {
    expect(deriveStatus(food('suspected', 7, ['e1']), 3)).toBe('safe');
  });

  it('should never derive a manual status away', () => {
    expect(deriveStatus(food('confirmed_allergy', 9), 9)).toBe('confirmed_allergy');
    expect(deriveStatus(food('avoid', 9), 9)).toBe('avoid');
  });
});

describe('novelFoodIds', () => {
  it('should return only the items flagged as a first try', () => {
    const items = [
      { foodId: 'a', name: 'A', quantity: 1, unit: 'tsp', firstTry: true },
      { foodId: 'b', name: 'B', quantity: 1, unit: 'tsp', firstTry: false },
      { foodId: 'c', name: 'C', quantity: 1, unit: 'tsp' },
    ] as MealItem[];
    expect(novelFoodIds(items)).toEqual(['a']);
  });

  it('should fall back to every item when nothing is flagged novel', () => {
    const items = [
      { foodId: 'a', name: 'A', quantity: 1, unit: 'tsp' },
      { foodId: 'b', name: 'B', quantity: 1, unit: 'tsp' },
    ] as MealItem[];
    expect(novelFoodIds(items)).toEqual(['a', 'b']);
  });
});

describe('statusLabel', () => {
  it('should never say the word safe', () => {
    expect(statusLabel({ status: 'safe', exposureCount: 5 })).toBe('No reaction ×5');
  });

  it('should label the other statuses', () => {
    expect(statusLabel({ status: 'untried', exposureCount: 0 })).toBe('Not introduced');
    expect(statusLabel({ status: 'watch', exposureCount: 4 })).toBe('Watch');
    expect(statusLabel({ status: 'suspected', exposureCount: 2 })).toBe('Suspected');
    expect(statusLabel({ status: 'confirmed_allergy', exposureCount: 1 })).toBe('Allergy');
    expect(statusLabel({ status: 'avoid', exposureCount: 0 })).toBe('Avoid');
  });
});

describe('isManualStatus', () => {
  it('should treat allergy and avoid as human-set only', () => {
    expect(isManualStatus('confirmed_allergy')).toBe(true);
    expect(isManualStatus('avoid')).toBe(true);
    expect(isManualStatus('safe')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/food-status.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/utils/food-status.ts`**

```ts
import type { Food, FoodStatus, MealEvent, MealItem } from '../types/food';

const CLEAN_EXPOSURES_FOR_SAFE = 3;
const MANUAL_STATUSES: readonly FoodStatus[] = ['confirmed_allergy', 'avoid'];

export function isManualStatus(status: FoodStatus): boolean {
  return MANUAL_STATUSES.includes(status);
}

export function deriveStatus(
  food: Pick<Food, 'status' | 'exposureCount' | 'reactionEventIds'>,
  cleanExposuresSinceReaction: number,
): FoodStatus {
  if (isManualStatus(food.status)) return food.status;

  const hasReaction = food.reactionEventIds.length > 0;
  if (!hasReaction) {
    return food.exposureCount >= CLEAN_EXPOSURES_FOR_SAFE ? 'safe' : 'untried';
  }
  if (cleanExposuresSinceReaction === 0) return 'suspected';
  if (cleanExposuresSinceReaction >= CLEAN_EXPOSURES_FOR_SAFE) return 'safe';
  return 'watch';
}

/** Foods to suspect after a reaction: the novel ones, or all of them. */
export function novelFoodIds(items: MealItem[]): string[] {
  const novel = items.filter((i) => i.firstTry).map((i) => i.foodId);
  return novel.length > 0 ? novel : items.map((i) => i.foodId);
}

export function applyReaction(foods: Food[], meal: MealEvent, mealId: string): Food[] {
  const suspects = new Set(
    meal.reaction?.suspectedFoodIds.length
      ? meal.reaction.suspectedFoodIds
      : novelFoodIds(meal.items),
  );
  return foods.map((food) => {
    if (!suspects.has(food.id) || isManualStatus(food.status)) return food;
    if (food.reactionEventIds.includes(mealId)) return food;
    return {
      ...food,
      status: 'suspected',
      reactionEventIds: [...food.reactionEventIds, mealId],
    };
  });
}

const LABELS: Record<Exclude<FoodStatus, 'safe'>, string> = {
  untried: 'Not introduced',
  watch: 'Watch',
  suspected: 'Suspected',
  confirmed_allergy: 'Allergy',
  avoid: 'Avoid',
};

/**
 * Never says "safe". Three uneventful meals mean "no reaction observed",
 * not "harmless" — the distinction matters most on the major allergens.
 */
export function statusLabel(food: Pick<Food, 'status' | 'exposureCount'>): string {
  if (food.status === 'safe') return `No reaction ×${food.exposureCount}`;
  return LABELS[food.status];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/food-status.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/food-status.ts src/utils/food-status.test.ts
git commit -m "feat(food): derive per-food allergy status from exposures and reactions"
```

---

## Task 9: FoodTagInput

Chip input with autocomplete over the family catalog plus the seed table. Native
`<input>` and an `aria-autocomplete` listbox — no combobox library.

**Files:**
- Create: `src/components/FoodTagInput.tsx`
- Create: `src/components/FoodTagInput.module.css`
- Create: `src/components/FoodTagInput.test.tsx`
- Create: `src/utils/food-search.ts`
- Create: `src/utils/food-search.test.ts`

**Interfaces:**
- Consumes: `Food`, `SeedFood`, `MealItem` from `src/types/food.ts`; `FOOD_SEED`.
- Produces:
  - `rankSuggestions(query: string, foods: Food[], seed: readonly SeedFood[], limit?: number): FoodSuggestion[]`
  - `type FoodSuggestion = { id: string; name: string; group: FoodGroup; source: 'catalog' | 'seed'; usageCount: number }`
  - `FoodTagInput({ items, onChange, foods, maxItems })`

- [ ] **Step 1: Write the failing ranking test**

`src/utils/food-search.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { rankSuggestions } from './food-search';
import type { Food, SeedFood } from '../types/food';

const catalogFood = (id: string, name: string, usageCount: number) =>
  ({ id, name, group: 'vegetable', usageCount }) as Food;
const seedFood = (id: string, name: string) =>
  ({ id, name, group: 'protein' }) as SeedFood;

const foods = [
  catalogFood('shirasu', 'Shirasu', 12),
  catalogFood('shiitake', 'Shiitake', 2),
  catalogFood('kabocha', 'Kabocha', 30),
];
const seed = [seedFood('shiratamako', 'Shiratamako'), seedFood('shirasu', 'Shirasu')];

describe('rankSuggestions', () => {
  it('should return the most used foods when the query is empty', () => {
    const result = rankSuggestions('', foods, seed, 3);
    expect(result[0].id).toBe('kabocha');
    expect(result[1].id).toBe('shirasu');
  });

  it('should rank a prefix match above a substring match', () => {
    const result = rankSuggestions('shi', foods, seed);
    const ids = result.map((r) => r.id);
    expect(ids.indexOf('shirasu')).toBeLessThan(ids.indexOf('shiratamako'));
  });

  it('should rank catalog entries above unused seed entries', () => {
    const result = rankSuggestions('shir', foods, seed);
    expect(result[0].source).toBe('catalog');
  });

  it('should not return a seed entry that is already in the catalog', () => {
    const result = rankSuggestions('shirasu', foods, seed);
    expect(result.filter((r) => r.id === 'shirasu')).toHaveLength(1);
  });

  it('should be case-insensitive', () => {
    expect(rankSuggestions('KABO', foods, seed)[0].id).toBe('kabocha');
  });

  it('should honour the limit', () => {
    expect(rankSuggestions('', foods, seed, 2)).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/food-search.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/utils/food-search.ts`**

Scoring, highest first: exact prefix on a catalog entry, substring on a catalog
entry, prefix on a seed entry, substring on a seed entry. Ties break on
`usageCount` descending, then name ascending. Catalog ids shadow seed ids.

- [ ] **Step 4: Run the ranking test to verify it passes**

Run: `npx vitest run src/utils/food-search.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing component test**

`src/components/FoodTagInput.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FoodTagInput } from './FoodTagInput';
import type { Food, MealItem } from '../types/food';

const foods = [
  { id: 'kabocha', name: 'Kabocha', group: 'vegetable', usageCount: 5 },
  { id: 'shirasu', name: 'Shirasu', group: 'protein', usageCount: 3 },
] as Food[];

describe('FoodTagInput', () => {
  it('should render a chip per selected item', () => {
    const items = [
      { foodId: 'kabocha', name: 'Kabocha', quantity: 2, unit: 'tsp' },
    ] as MealItem[];
    render(<FoodTagInput items={items} onChange={vi.fn()} foods={foods} />);
    expect(screen.getByText(/Kabocha/)).toBeInTheDocument();
  });

  it('should show suggestions when typing', async () => {
    const user = userEvent.setup();
    render(<FoodTagInput items={[]} onChange={vi.fn()} foods={foods} />);
    await user.type(screen.getByRole('combobox'), 'kab');
    expect(await screen.findByRole('option', { name: /Kabocha/ })).toBeInTheDocument();
  });

  it('should add an item when a suggestion is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FoodTagInput items={[]} onChange={onChange} foods={foods} />);
    await user.type(screen.getByRole('combobox'), 'kab');
    await user.click(await screen.findByRole('option', { name: /Kabocha/ }));
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ foodId: 'kabocha', quantity: 1, unit: 'tsp' }),
    ]);
  });

  it('should add the highlighted suggestion on Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FoodTagInput items={[]} onChange={onChange} foods={foods} />);
    await user.type(screen.getByRole('combobox'), 'shi');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalled();
  });

  it('should close the suggestion list on Escape', async () => {
    const user = userEvent.setup();
    render(<FoodTagInput items={[]} onChange={vi.fn()} foods={foods} />);
    await user.type(screen.getByRole('combobox'), 'kab');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('should remove an item when its chip remove button is pressed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const items = [
      { foodId: 'kabocha', name: 'Kabocha', quantity: 2, unit: 'tsp' },
    ] as MealItem[];
    render(<FoodTagInput items={items} onChange={onChange} foods={foods} />);
    await user.click(screen.getByRole('button', { name: /remove kabocha/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('should stop accepting items at the maximum', async () => {
    const user = userEvent.setup();
    const items = Array.from({ length: 12 }, (_, i) => ({
      foodId: `f${i}`, name: `F${i}`, quantity: 1, unit: 'tsp',
    })) as MealItem[];
    render(<FoodTagInput items={items} onChange={vi.fn()} foods={foods} maxItems={12} />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run the component test to verify it fails**

Run: `npx vitest run src/components/FoodTagInput.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 7: Implement the component and its CSS**

`role="combobox"` on the input with `aria-expanded`, `aria-controls` and
`aria-activedescendant`; `role="listbox"` on the suggestion list; `role="option"`
with `aria-selected` on each row. Free text that matches nothing creates a new
food via `slugify`. New items default to `quantity: 1, unit: 'tsp'`.

CSS reuses the tokens only: chips at `--radius-full` on `--color-meal-bg` in
`--color-meal`; the input inherits the global `input` rule; the listbox sits on
`--color-surface` with `--shadow-md` and `--radius-md`.

- [ ] **Step 8: Run both tests to verify they pass**

Run: `npx vitest run src/components/FoodTagInput.test.tsx src/utils/food-search.test.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/utils/food-search.ts src/utils/food-search.test.ts \
        src/components/FoodTagInput.tsx src/components/FoodTagInput.module.css \
        src/components/FoodTagInput.test.tsx
git commit -m "feat(food): add food tag input with catalog and seed autocomplete"
```

---
## Task 10: MealFields and meal persistence

**Files:**
- Create: `src/components/EventModal/MealFields.tsx`
- Modify: `src/components/EventModal.tsx`
- Modify: `src/components/EventModal.module.css`
- Create: `src/components/EventModal/MealFields.test.tsx`
- Create: `src/utils/meal-nutrition.ts`
- Create: `src/utils/meal-nutrition.test.ts`

**Interfaces:**
- Consumes: `FoodTagInput`, `useFoods`, `upsertFood`, `updateFood`, `slugify`, `foodFromSeed`, `applyReaction`, `SYSTEMIC_SYMPTOMS`, `MAX_MEAL_ITEMS`.
- Produces:
  - `toGrams(item: MealItem, food?: Pick<Food, 'gramsPerTsp'>): number`
  - `mealNutrients(items: MealItem[], byId: Map<string, Food>): Nutrients`
  - `MealFields({ mealSlot, onMealSlotChange, items, onItemsChange, foods, reaction, onReactionChange })`

- [ ] **Step 1: Write the failing nutrition test**

`src/utils/meal-nutrition.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { toGrams, mealNutrients } from './meal-nutrition';
import type { Food, MealItem, Nutrients } from '../types/food';

const zero = (): Nutrients => ({
  energyKcal: 0, proteinG: 0, fatG: 0, carbsG: 0, fiberG: 0, sugarsG: 0,
  ironMg: 0, calciumMg: 0, zincMg: 0, sodiumMg: 0, potassiumMg: 0,
  vitaminAUgRae: 0, vitaminCMg: 0, vitaminDUg: 0, vitaminB12Ug: 0, folateUg: 0,
});

const kabocha = {
  id: 'kabocha', gramsPerTsp: 5,
  nutrients: { ...zero(), energyKcal: 60, proteinG: 1.6, ironMg: 0.5 },
} as Food;

const item = (over: Partial<MealItem>): MealItem =>
  ({ foodId: 'kabocha', name: 'Kabocha', quantity: 1, unit: 'tsp', ...over });

describe('toGrams', () => {
  it('should convert tsp using the food gramsPerTsp', () => {
    expect(toGrams(item({ quantity: 3, unit: 'tsp' }), kabocha)).toBe(15);
  });

  it('should default to 5 g per tsp when the food is unknown', () => {
    expect(toGrams(item({ quantity: 2, unit: 'tsp' }), undefined)).toBe(10);
  });

  it('should pass grams through unchanged', () => {
    expect(toGrams(item({ quantity: 30, unit: 'g' }), kabocha)).toBe(30);
  });

  it('should treat millilitres as grams', () => {
    expect(toGrams(item({ quantity: 50, unit: 'ml' }), kabocha)).toBe(50);
  });

  it('should treat a piece as 30 g by default', () => {
    expect(toGrams(item({ quantity: 2, unit: 'piece' }), kabocha)).toBe(60);
  });
});

describe('mealNutrients', () => {
  const byId = new Map([['kabocha', kabocha]]);

  it('should scale nutrients from per-100 g to the eaten amount', () => {
    const result = mealNutrients([item({ quantity: 4, unit: 'tsp' })], byId);
    // 4 tsp = 20 g = 0.2 x per-100g values
    expect(result.energyKcal).toBeCloseTo(12, 5);
    expect(result.proteinG).toBeCloseTo(0.32, 5);
    expect(result.ironMg).toBeCloseTo(0.1, 5);
  });

  it('should sum across several items', () => {
    const result = mealNutrients(
      [item({ quantity: 2, unit: 'tsp' }), item({ quantity: 2, unit: 'tsp' })],
      byId,
    );
    expect(result.energyKcal).toBeCloseTo(12, 5);
  });

  it('should skip items whose food has no nutrients', () => {
    const result = mealNutrients([item({ foodId: 'unknown' })], new Map());
    expect(result.energyKcal).toBe(0);
  });

  it('should return an all-zero object for an empty meal', () => {
    expect(mealNutrients([], byId)).toEqual(zero());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/meal-nutrition.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/utils/meal-nutrition.ts`**

```ts
import { NUTRIENT_KEYS } from '../types/food';
import type { Food, MealItem, Nutrients } from '../types/food';

const DEFAULT_GRAMS_PER_TSP = 5;
const DEFAULT_GRAMS_PER_PIECE = 30;

export function toGrams(item: MealItem, food?: Pick<Food, 'gramsPerTsp'>): number {
  switch (item.unit) {
    case 'tsp':
      return item.quantity * (food?.gramsPerTsp ?? DEFAULT_GRAMS_PER_TSP);
    case 'piece':
      return item.quantity * DEFAULT_GRAMS_PER_PIECE;
    case 'g':
    case 'ml':
    default:
      return item.quantity;
  }
}

function emptyNutrients(): Nutrients {
  return Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, 0])) as unknown as Nutrients;
}

export function mealNutrients(items: MealItem[], byId: Map<string, Food>): Nutrients {
  const total = emptyNutrients();
  for (const item of items) {
    const food = byId.get(item.foodId);
    if (!food?.nutrients) continue;
    const factor = toGrams(item, food) / 100;
    for (const key of NUTRIENT_KEYS) {
      total[key] += food.nutrients[key] * factor;
    }
  }
  return total;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/meal-nutrition.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing MealFields test**

`src/components/EventModal/MealFields.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MealFields } from './MealFields';
import type { Food, MealItem } from '../../types/food';

const foods = [{ id: 'kabocha', name: 'Kabocha', group: 'vegetable', usageCount: 1 }] as Food[];
const base = {
  mealSlot: 'lunch' as const,
  onMealSlotChange: vi.fn(),
  items: [] as MealItem[],
  onItemsChange: vi.fn(),
  foods,
  reaction: undefined,
  onReactionChange: vi.fn(),
};

describe('MealFields', () => {
  it('should offer the four meal slots', () => {
    render(<MealFields {...base} />);
    for (const slot of ['Breakfast', 'Lunch', 'Dinner', 'Snack']) {
      expect(screen.getByRole('button', { name: slot })).toBeInTheDocument();
    }
  });

  it('should keep the reaction block collapsed by default', () => {
    render(<MealFields {...base} />);
    expect(screen.queryByRole('group', { name: /reaction/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log a reaction/i })).toBeInTheDocument();
  });

  it('should expand the reaction block on demand', async () => {
    const user = userEvent.setup();
    render(<MealFields {...base} />);
    await user.click(screen.getByRole('button', { name: /log a reaction/i }));
    expect(await screen.findByRole('group', { name: /reaction/i })).toBeInTheDocument();
  });

  it('should warn when a systemic symptom is selected', async () => {
    const user = userEvent.setup();
    render(<MealFields {...base} />);
    await user.click(screen.getByRole('button', { name: /log a reaction/i }));
    await user.click(await screen.findByRole('button', { name: /wheezing/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/emergency/i);
  });

  it('should not warn for a local rash alone', async () => {
    const user = userEvent.setup();
    render(<MealFields {...base} />);
    await user.click(screen.getByRole('button', { name: /log a reaction/i }));
    await user.click(await screen.findByRole('button', { name: /local rash/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should hint when a food has never been eaten', async () => {
    const user = userEvent.setup();
    const items = [
      { foodId: 'natto', name: 'Natto', quantity: 1, unit: 'tsp', firstTry: true },
    ] as MealItem[];
    render(<MealFields {...base} items={items} />);
    expect(screen.getByText(/new food/i)).toBeInTheDocument();
    expect(screen.getByText(/3 days/i)).toBeInTheDocument();
  });

  it('should keep per-item detail collapsed until the chip is tapped', async () => {
    const user = userEvent.setup();
    const items = [
      { foodId: 'kabocha', name: 'Kabocha', quantity: 2, unit: 'tsp' },
    ] as MealItem[];
    render(<MealFields {...base} items={items} />);
    expect(screen.queryByLabelText(/acceptance/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /edit kabocha/i }));
    expect(await screen.findByLabelText(/acceptance/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/components/EventModal/MealFields.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 7: Implement MealFields**

Layout, top to bottom: meal-slot `SegmentedControl`; `FoodTagInput`; a "new
food" hint when any item has `firstTry` ("New food. Best in the morning, alone,
then wait 3 days." — a hint, never a blocker); the collapsed reaction
disclosure. Per-item quantity, unit and acceptance appear only once a chip's
edit button is pressed. The systemic-symptom warning is a static
`role="alert"` reminder to contact emergency services; it never assesses the
situation.

- [ ] **Step 8: Wire the meal into EventModal**

In `EventModal.tsx`: add `mealSlot`, `items` and `reaction` state; call
`useFoods(familyId)`; render `MealFields` when `selectedType === 'meal'`.

On save, in this order:
1. For each item whose `foodId` is absent from the catalog, create the food
   document — from the matching seed entry via `foodFromSeed` if there is one,
   otherwise a minimal record with `nutrientSource: 'manual'` and no nutrients.
2. Set `firstTry: true` on every item whose food has no `firstTriedAt`.
3. `addEvent(familyId, { type: 'meal', mealSlot, items, reaction, ... })`.
4. For each item's food: increment `usageCount` and `exposureCount`, set
   `lastTriedAt`, and set `firstTriedAt` if unset.
5. If a reaction was logged, apply `applyReaction` and persist the changed foods.

Reject an empty `items` array with "Add at least one food". Cap at
`MAX_MEAL_ITEMS`. Add a sticky save row in `EventModal.module.css`:

```css
.stickyActions {
  position: sticky;
  bottom: 0;
  background: var(--color-surface);
  padding-top: var(--space-md);
  margin-top: var(--space-sm);
}
```

- [ ] **Step 9: Run everything**

Run: `npm run test && npx tsc -b && npm run lint`
Expected: PASS, including the untouched `EventModal.test.tsx`.

- [ ] **Step 10: Commit**

```bash
git add src/utils/meal-nutrition.ts src/utils/meal-nutrition.test.ts \
        src/components/EventModal/MealFields.tsx \
        src/components/EventModal/MealFields.test.tsx \
        src/components/EventModal.tsx src/components/EventModal.module.css
git commit -m "feat(food): add meal logging with reactions and catalog upkeep"
```

---

## Task 11: Firestore rules, indexes and stale docs

**Files:**
- Modify: `firestore.rules`
- Modify: `firestore.indexes.json`
- Modify: `specs/data-model.md`

- [ ] **Step 1: Add the meal branch to the rules**

In `hasValidBaseFields()`, extend the type list to include `'meal'`. Add:

```
    function hasValidMealFields() {
      let data = request.resource.data;
      return data.type == 'meal'
        && data.mealSlot in ['breakfast', 'lunch', 'dinner', 'snack']
        && data.items is list
        && data.items.size() >= 1
        && data.items.size() <= 12
        && (!('reaction' in data) || data.reaction is map);
    }
```

Add `|| (data.type == 'meal' && hasValidMealFields())` to both `isValidEvent()`
and `isValidEventUpdate()`.

**Known limitation, do not attempt to work around it:** the rules language
cannot iterate lists, so per-item field validation is client-side only. This is
not fixable without Cloud Functions (Blaze plan). Leave a comment saying so.

- [ ] **Step 2: Add the foods subcollection rules**

Inside `match /families/{familyId}`, mirroring the `measurements` block:

```
      match /foods/{foodId} {
        allow read: if isFamilyMember(familyId);
        allow create, update: if isFamilyMember(familyId) && isValidFood();
        allow delete: if isFamilyMember(familyId)
          && resource.data.exposureCount == 0;
      }
```

with an `isValidFood()` helper validating `name` (string, 1..100),
`group` in the seven groups, `allergens is list`, `gramsPerTsp` a number in
(0, 15], `minStage` in [1,2,3,4], `status` in the six statuses, `usageCount` and
`exposureCount` non-negative ints, `reactionEventIds is list`, and
`nutrientSource` in `['seed', 'manual']`.

- [ ] **Step 3: Add the missing indexes**

`firestore.indexes.json` declares one index while `specs/data-model.md`
documents three. Add the two missing composites: `type ASC, timestamp DESC` and
`babyId ASC, type ASC, timestamp DESC`, both on `events`.

- [ ] **Step 4: Bring `specs/data-model.md` up to date**

It is stale on three counts: `EventType` is missing `bath` and `meal`; `Baby` is
missing `sex`; `FeedingEvent.feedingType` is documented as
`'left' | 'right' | 'bottle'` when the code uses `'breast' | 'bottle'` with
`leftCount` / `rightCount`. Fix all three and document `MealEvent`, `Food` and
the `foods` subcollection.

- [ ] **Step 5: Verify**

Run: `npm run test && npx tsc -b`
Expected: PASS. (Rules are not unit-tested anywhere in this project — see the
open items in the spec.)

- [ ] **Step 6: Commit**

```bash
git add firestore.rules firestore.indexes.json specs/data-model.md
git commit -m "feat(food): add meal and foods security rules, fix stale indexes and data model"
```

---
## Task 12: Try-next ranking

Pure functions over the seed table and the catalog. No new state, no new writes.

**Files:**
- Create: `src/utils/next-foods.ts`
- Create: `src/utils/next-foods.test.ts`

**Interfaces:**
- Consumes: `Food`, `SeedFood`, `WeaningStage`, `Nutrients`; `ALLERGENS`, `isMandatoryAllergen`; `isManualStatus`.
- Produces:
  - `getIntroductionWindow(foods: Food[], now: Date): { open: true } | { open: false; nextDate: Date }`
  - `type NextFoodsInput = { seed: readonly SeedFood[]; foods: Food[]; stage: WeaningStage; now: Date; recentNutrients: Nutrients | null }`
  - `rankNextFoods(input: NextFoodsInput): NextFoodCandidate[]`
  - `getAllergenStatus(foods: Food[], now: Date): AllergenStatus[]`
  - `type NextFoodCandidate = { seed: SeedFood; score: number; reasons: string[]; heldBy?: { allergen: Allergen; foodName: string } }`
  - `type AllergenStatus = { allergen: Allergen; mandatory: boolean; introduced: boolean; firstTriedAt?: Date; lastTriedAt?: Date; exposureCount: number; status: FoodStatus; needsMaintenance: boolean }`

- [ ] **Step 1: Write the failing test**

`src/utils/next-foods.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getIntroductionWindow, rankNextFoods, getAllergenStatus } from './next-foods';
import type { Food, SeedFood } from '../types/food';
import { Timestamp } from 'firebase/firestore';

const NOW = new Date('2026-09-01T08:00:00Z');
const ts = (iso: string) => Timestamp.fromDate(new Date(iso));

const food = (over: Partial<Food>): Food => ({
  id: 'x', name: 'X', group: 'vegetable', allergens: [], gramsPerTsp: 5,
  minStage: 1, status: 'safe', usageCount: 1, exposureCount: 3,
  reactionEventIds: [], nutrientSource: 'seed', ...over,
});

const seed = (over: Partial<SeedFood>): SeedFood => ({
  id: 's', name: 'S', group: 'vegetable', allergens: [], gramsPerTsp: 5,
  minStage: 1, sourceRef: 'ref',
  nutrients: {
    energyKcal: 30, proteinG: 1, fatG: 0, carbsG: 6, fiberG: 1, sugarsG: 2,
    ironMg: 0, calciumMg: 10, zincMg: 0, sodiumMg: 1, potassiumMg: 100,
    vitaminAUgRae: 0, vitaminCMg: 5, vitaminDUg: 0, vitaminB12Ug: 0, folateUg: 10,
  },
  ...over,
});

describe('getIntroductionWindow', () => {
  it('should be open when nothing new was introduced recently', () => {
    const foods = [food({ firstTriedAt: ts('2026-08-20T00:00:00Z') })];
    expect(getIntroductionWindow(foods, NOW)).toEqual({ open: true });
  });

  it('should be closed within three days of the last new food', () => {
    const foods = [food({ firstTriedAt: ts('2026-08-31T00:00:00Z') })];
    const result = getIntroductionWindow(foods, NOW);
    expect(result.open).toBe(false);
  });

  it('should report the date the window reopens', () => {
    const foods = [food({ firstTriedAt: ts('2026-08-31T00:00:00Z') })];
    const result = getIntroductionWindow(foods, NOW);
    if (result.open) throw new Error('expected a closed window');
    expect(result.nextDate.toISOString().slice(0, 10)).toBe('2026-09-03');
  });

  it('should be open when nothing has ever been introduced', () => {
    expect(getIntroductionWindow([], NOW)).toEqual({ open: true });
  });
});

describe('rankNextFoods', () => {
  const base = { foods: [] as Food[], stage: 2 as const, now: NOW,
                 recentNutrients: null };

  it('should exclude foods above the current stage', () => {
    const result = rankNextFoods({ ...base,
      seed: [seed({ id: 'natto', minStage: 3 }), seed({ id: 'carrot', minStage: 1 })] });
    expect(result.map((c) => c.seed.id)).toEqual(['carrot']);
  });

  it('should exclude foods already in the catalog', () => {
    const result = rankNextFoods({ ...base,
      foods: [food({ id: 'carrot', exposureCount: 1 })],
      seed: [seed({ id: 'carrot' }), seed({ id: 'daikon' })] });
    expect(result.map((c) => c.seed.id)).toEqual(['daikon']);
  });

  it('should rank an un-introduced mandatory allergen first', () => {
    const result = rankNextFoods({ ...base,
      seed: [seed({ id: 'daikon' }), seed({ id: 'egg-yolk', allergens: ['egg'] })] });
    expect(result[0].seed.id).toBe('egg-yolk');
    expect(result[0].reasons.join(' ')).toMatch(/allergen/i);
  });

  it('should rank an iron-rich food up when recent iron is low', () => {
    const lowIron = { ironMg: 0.2 } as never;
    const result = rankNextFoods({ ...base, recentNutrients: lowIron,
      seed: [
        seed({ id: 'daikon' }),
        seed({ id: 'liver', group: 'protein',
               nutrients: { ...seed({}).nutrients, ironMg: 9 } }),
      ] });
    expect(result[0].seed.id).toBe('liver');
    expect(result[0].reasons.join(' ')).toMatch(/iron/i);
  });

  it('should hold back a food sharing an allergen with a suspected food', () => {
    const result = rankNextFoods({ ...base,
      foods: [food({ id: 'mango', name: 'Mango', status: 'suspected',
                     allergens: ['kiwi'] })],
      seed: [seed({ id: 'kiwi', allergens: ['kiwi'] })] });
    expect(result[0].heldBy).toEqual({ allergen: 'kiwi', foodName: 'Mango' });
  });

  it('should sort held-back candidates last but still return them', () => {
    const result = rankNextFoods({ ...base,
      foods: [food({ id: 'mango', name: 'Mango', status: 'confirmed_allergy',
                     allergens: ['kiwi'] })],
      seed: [seed({ id: 'kiwi', allergens: ['kiwi'] }), seed({ id: 'daikon' })] });
    expect(result[result.length - 1].seed.id).toBe('kiwi');
    expect(result).toHaveLength(2);
  });
});

describe('getAllergenStatus', () => {
  it('should return one row per allergen, all 28', () => {
    expect(getAllergenStatus([], NOW)).toHaveLength(28);
  });

  it('should mark an allergen introduced when a food carrying it was tried', () => {
    const foods = [food({ allergens: ['egg'], firstTriedAt: ts('2026-08-01T00:00:00Z'),
                          lastTriedAt: ts('2026-08-30T00:00:00Z') })];
    const egg = getAllergenStatus(foods, NOW).find((a) => a.allergen === 'egg');
    expect(egg?.introduced).toBe(true);
  });

  it('should flag maintenance when an introduced allergen went 14 days unused', () => {
    const foods = [food({ allergens: ['egg'], firstTriedAt: ts('2026-08-01T00:00:00Z'),
                          lastTriedAt: ts('2026-08-10T00:00:00Z') })];
    const egg = getAllergenStatus(foods, NOW).find((a) => a.allergen === 'egg');
    expect(egg?.needsMaintenance).toBe(true);
  });

  it('should not flag maintenance for a recently eaten allergen', () => {
    const foods = [food({ allergens: ['egg'], firstTriedAt: ts('2026-08-01T00:00:00Z'),
                          lastTriedAt: ts('2026-08-30T00:00:00Z') })];
    const egg = getAllergenStatus(foods, NOW).find((a) => a.allergen === 'egg');
    expect(egg?.needsMaintenance).toBe(false);
  });

  it('should not flag maintenance for an allergen never introduced', () => {
    const egg = getAllergenStatus([], NOW).find((a) => a.allergen === 'egg');
    expect(egg?.needsMaintenance).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/next-foods.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/utils/next-foods.ts`**

Constants: `INTRODUCTION_GAP_DAYS = 3`, `MAINTENANCE_GAP_DAYS = 14`.

Scoring, additive, highest wins:
- `+100` un-introduced mandatory allergen at or below the current stage. Current
  paediatric guidance (LEAP, PETIT) is to introduce allergens early and
  repeatedly; most parents do the opposite, and this ordering is the single most
  useful thing the screen does.
- `+60` un-introduced recommended allergen.
- `+50 × deficit` where a tracked gap nutrient (`ironMg`, `zincMg`, `vitaminDUg`)
  is below its 7-day reference and the candidate is a strong source.
- `+20` the candidate's group is the least represented in the catalog.
- `+5` `minStage` equals the current stage exactly (age-appropriate rather than
  merely permitted).

A candidate sharing an allergen with a `suspected`, `confirmed_allergy` or
`avoid` food gets `heldBy` set and sorts last — **returned, never hidden**, so
the reason is visible and overridable.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/next-foods.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/next-foods.ts src/utils/next-foods.test.ts
git commit -m "feat(food): rank next foods by allergen priority, nutrient gap and diversity"
```

---

## Task 13: Food page, route and navigation entry

The page is one scroll ordered by usage frequency. Measured at 375 px: 936 px
total — hero 142, allergens 226, chart slot 275, strip 80. That is 1.7 screens
on an iPhone SE and 1.3 on an iPhone 15. No tabs.

**Files:**
- Create: `src/pages/FoodPage.tsx`
- Create: `src/pages/FoodPage.module.css`
- Create: `src/pages/FoodPage.test.tsx`
- Create: `src/components/AllergenGrid.tsx`
- Create: `src/components/AllergenGrid.module.css`
- Modify: `src/App.tsx`
- Modify: `src/components/Layout.tsx`

**Interfaces:**
- Consumes: `useFoods`, `useRangeEvents`, `rankNextFoods`, `getIntroductionWindow`, `getAllergenStatus`, `getWeaningStage`, `statusLabel`, `FOOD_SEED` (dynamic import), `SegmentedControl`, `EventModal`.
- Produces: `FoodPage({ familyId, babyId, userId, baby })`, `AllergenGrid({ statuses, onSelect })`.

- [ ] **Step 1: Write the failing page test**

`src/pages/FoodPage.test.tsx` — mock `useFoods` and `useRangeEvents`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Timestamp } from 'firebase/firestore';
import { FoodPage } from './FoodPage';
import type { Food } from '../types/food';

vi.mock('../hooks/useFoods', () => ({ useFoods: vi.fn() }));
vi.mock('../hooks/useRangeEvents', () => ({ useRangeEvents: vi.fn() }));

const { useFoods } = await import('../hooks/useFoods');
const { useRangeEvents } = await import('../hooks/useRangeEvents');

const baby = { id: 'b1', firstName: 'Mei',
               birthDate: Timestamp.fromDate(new Date('2026-02-01')) } as never;

const props = { familyId: 'f1', babyId: 'b1', userId: 'u1', baby };

beforeEach(() => {
  vi.mocked(useRangeEvents).mockReturnValue({
    events: [], loading: false, fromCache: false, hasPendingWrites: false } as never);
});

const withFoods = (foods: Food[]) =>
  vi.mocked(useFoods).mockReturnValue({
    foods, loading: false, fromCache: false, hasPendingWrites: false } as never);

describe('FoodPage', () => {
  it('should suggest a food when the introduction window is open', async () => {
    withFoods([]);
    render(<FoodPage {...props} />);
    expect(await screen.findByText(/try next/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log it/i })).toBeInTheDocument();
  });

  it('should show a hold card with a date inside the 3-day window', async () => {
    withFoods([{ id: 'kabocha', name: 'Kabocha', group: 'vegetable', allergens: [],
      gramsPerTsp: 5, minStage: 1, status: 'untried', usageCount: 1, exposureCount: 1,
      reactionEventIds: [], nutrientSource: 'seed',
      firstTriedAt: Timestamp.fromDate(new Date()) } as Food]);
    render(<FoodPage {...props} />);
    expect(await screen.findByText(/hold/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /log it/i })).not.toBeInTheDocument();
  });

  it('should collapse the ranked list behind a disclosure', async () => {
    const user = userEvent.setup();
    withFoods([]);
    render(<FoodPage {...props} />);
    const toggle = await screen.findByRole('button', { name: /other options/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('should render 28 allergen tokens', async () => {
    withFoods([]);
    render(<FoodPage {...props} />);
    expect(await screen.findAllByTestId('allergen-token')).toHaveLength(28);
  });

  it('should never use the word safe', async () => {
    withFoods([]);
    const { container } = render(<FoodPage {...props} />);
    await screen.findByText(/allergens/i);
    expect(container.textContent).not.toMatch(/\bsafe\b/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/FoodPage.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement AllergenGrid**

A `repeat(7, 1fr)` grid of `aspect-ratio: 1` round tokens carrying
`data-testid="allergen-token"`. Colour maps status to existing tokens:
`--color-success` for no-reaction, `--color-feeding` for watch and suspected,
`--color-medication` for confirmed, `--color-border-light` for not introduced.
A tap opens a detail sheet reusing `EventModal`'s overlay pattern — ✕, outside
click and Escape all close it — showing first tried, last eaten, exposure count,
the maintenance warning, and manual `Watch` / `Allergy` buttons.

- [ ] **Step 4: Implement FoodPage**

Structure reusing `StatsPage.module.css` vocabulary: `.page`, `.pageHeader` with
`.title` and `.subtitle` (age and stage), then in order —

1. **Hero.** Open window: the top candidate's name, `[Log it]`, the reasons, and
   an `Other options ▾` disclosure that expands in place (`aria-expanded`, local
   `useState`, re-tap collapses). Tapping a row opens `EventModal` in
   `type=meal` with that food already chipped. Closed window: a "Hold" card
   naming the date the window reopens.
2. **Allergen grid**, with a `12/28 introduced` `.sectionHint`.
3. **Chart section slot** — a `.section` rendering nothing yet. Task 15 fills it.
4. **Recently introduced** — a horizontal chip strip.

`FOOD_SEED` is imported dynamically (`await import('../data/food-seed')`) so the
seed table stays out of the initial bundle.

- [ ] **Step 5: Add the route and the nav entry**

In `src/App.tsx`, add the `/food` route passing `familyId`, `babyId`, `userId`
and `baby`, matching the existing route props.

In `src/components/Layout.tsx`, add a `Salad` `NavLink` to `/food` in both the
desktop sidebar and the mobile bottom nav, placed between Timeline and Stats,
labelled `Food`. The padding fix from Task 6 is what makes the fifth entry fit.

- [ ] **Step 6: Run everything**

Run: `npm run test && npx tsc -b && npm run lint`
Expected: PASS

- [ ] **Step 7: Verify the nav in a real browser at 375 px**

Run `npm run dev`, open the app, and confirm at a 375 px viewport that the five
nav items fit with no clipping and no horizontal scroll, in both light and dark
mode. Measurement predicts exactly 373 px used of 373 available — verify it.

- [ ] **Step 8: Commit**

```bash
git add src/pages/FoodPage.tsx src/pages/FoodPage.module.css src/pages/FoodPage.test.tsx \
        src/components/AllergenGrid.tsx src/components/AllergenGrid.module.css \
        src/App.tsx src/components/Layout.tsx
git commit -m "feat(food): add food page with try-next hero and allergen grid"
```

---

## Task 14: Food chart data builders

**Files:**
- Create: `src/utils/food-chart-data.ts`
- Create: `src/utils/food-chart-data.test.ts`

**Interfaces:**
- Consumes: `BabyEvent`, `MealEvent`, `Food`, `Nutrients`, `NUTRIENT_KEYS`, `mealNutrients`, `toGrams`.
- Produces:
  - `buildGroupIntake(events: BabyEvent[], byId: Map<string, Food>, days: {date: Date; label: string}[]): GroupIntakeRow[]`
  - `buildVarietyCurve(events: BabyEvent[], days): { label: string; total: number }[]`
  - `buildFirstExposure(events: BabyEvent[], byId): { nutrient: NutrientKey; date: Date | null; foodName: string | null }[]`
  - `buildNutrientCoverage(events: BabyEvent[], byId, days: number): { nutrient: NutrientKey; perDay: number }[]`

- [ ] **Step 1: Write the failing test**

`src/utils/food-chart-data.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  buildGroupIntake, buildVarietyCurve, buildFirstExposure, buildNutrientCoverage,
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

describe('buildFirstExposure', () => {
  it('should report the earliest date a nutrient appeared, and the food', () => {
    const rows = buildFirstExposure(
      [meal(D2, ['kabocha']), meal(D1, ['kabocha'])], byId);
    const vitA = rows.find((r) => r.nutrient === 'vitaminAUgRae');
    expect(vitA?.date?.toISOString()).toBe(D1.toISOString());
    expect(vitA?.foodName).toBe('Kabocha');
  });

  it('should return null for a nutrient never seen', () => {
    const rows = buildFirstExposure([meal(D1, ['cod'])], byId);
    expect(rows.find((r) => r.nutrient === 'vitaminDUg')?.date).toBeNull();
  });

  it('should ignore non-meal events', () => {
    const rows = buildFirstExposure([pee(D1)], byId);
    expect(rows.every((r) => r.date === null)).toBe(true);
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/food-chart-data.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the builders**

Reuse `mealNutrients` and `toGrams` from Task 10. Follow the shape of the
existing `src/utils/chart-data.ts` so the Recharts wiring matches the rest of the
app.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/food-chart-data.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/food-chart-data.ts src/utils/food-chart-data.test.ts
git commit -m "feat(food): add chart data builders for intake, variety, exposure and coverage"
```

---

## Task 15: Food charts section

Fills the slot Task 13 left. One `.chartCard` with a `SegmentedControl` picker,
not four stacked cards.

**Files:**
- Create: `src/pages/FoodCharts.tsx`
- Modify: `src/pages/FoodPage.tsx`
- Modify: `src/pages/FoodPage.module.css`
- Create: `src/pages/FoodCharts.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/pages/FoodCharts.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Timestamp } from 'firebase/firestore';
import { FoodCharts } from './FoodCharts';
import type { BabyEvent } from '../types/events';
import type { Food } from '../types/food';

const kabocha = { id: 'kabocha', name: 'Kabocha', group: 'vegetable', gramsPerTsp: 5,
  nutrients: { energyKcal: 60, proteinG: 1.6, fatG: 0.3, carbsG: 12.2, fiberG: 3.6,
    sugarsG: 4.1, ironMg: 0.5, calciumMg: 14, zincMg: 0.3, sodiumMg: 1,
    potassiumMg: 430, vitaminAUgRae: 330, vitaminCMg: 32, vitaminDUg: 0,
    vitaminB12Ug: 0, folateUg: 38 } } as Food;

const D1 = new Date('2026-08-30T12:00:00Z');
const days = [{ date: D1, label: '30' }];
const meal = {
  id: 'm1', babyId: 'b1', type: 'meal', mealSlot: 'lunch',
  timestamp: Timestamp.fromDate(D1), createdBy: 'u1',
  createdAt: Timestamp.fromDate(D1),
  items: [{ foodId: 'kabocha', name: 'Kabocha', quantity: 4, unit: 'tsp' }],
} as unknown as BabyEvent;

const props = {
  events: [meal],
  byId: new Map([['kabocha', kabocha]]),
  days,
  rangeDays: 7,
};

describe('FoodCharts', () => {
  it('should offer the four chart views', () => {
    render(<FoodCharts {...props} />);
    for (const label of ['Groups', 'Variety', 'First', 'Coverage']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('should start on the group intake view', () => {
    render(<FoodCharts {...props} />);
    expect(screen.getByTestId('chart-groups')).toBeInTheDocument();
  });

  it('should swap the chart when the picker changes', async () => {
    const user = userEvent.setup();
    render(<FoodCharts {...props} />);
    await user.click(screen.getByRole('button', { name: 'Variety' }));
    expect(screen.getByTestId('chart-variety')).toBeInTheDocument();
    expect(screen.queryByTestId('chart-groups')).not.toBeInTheDocument();
  });

  it('should show the no-data message instead of an empty chart frame', () => {
    render(<FoodCharts {...props} events={[]} />);
    expect(screen.getByText(/no meals logged/i)).toBeInTheDocument();
    expect(screen.queryByTestId('chart-groups')).not.toBeInTheDocument();
  });
});
```

Each chart wrapper carries `data-testid="chart-groups" | "chart-variety" |
"chart-first" | "chart-coverage"`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/FoodCharts.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement FoodCharts**

Four Recharts views over the Task 14 builders: stacked bar for group intake,
line for the variety curve, a dot plot for nutrient first exposure, and a radar
for coverage. Every colour is a `var(--color-*)`; no hard-coded hex. Chart card
heights follow `StatsPage.module.css`: 240 px mobile, 300 px from 1024 px.

- [ ] **Step 4: Mount it lazily in FoodPage**

```tsx
const FoodCharts = lazy(() =>
  import('./FoodCharts').then((m) => ({ default: m.FoodCharts })),
);
```

wrapped in `<Suspense>`, matching how `StatsPage` loads `StatsCharts` and
`ActivityRadar`.

- [ ] **Step 5: Add the range control**

A `SegmentedControl` for `7d` / `14d` / `30d` in the page's `.controls`, driving
`useRangeEvents`, exactly as `StatsPage` does.

- [ ] **Step 6: Run everything**

Run: `npm run test && npx tsc -b && npm run lint && npm run build`
Expected: PASS

- [ ] **Step 7: Verify in a browser**

At 375 px and at desktop width, in light and dark mode: the four charts render,
the page scrolls without horizontal overflow, and the nav still fits.

- [ ] **Step 8: Commit**

```bash
git add src/pages/FoodCharts.tsx src/pages/FoodCharts.test.tsx \
        src/pages/FoodPage.tsx src/pages/FoodPage.module.css
git commit -m "feat(food): add nutrition charts section to the food page"
```

---

## Task 16: Reaction history export

Spec §9 places the reaction history behind an allergen token and as an export
from Settings. The allergen sheet ships in Task 13; this task adds the export.
It is the screen opened in a paediatrician's office, so it must work offline
from cached data alone.

**Files:**
- Create: `src/utils/reaction-export.ts`
- Create: `src/utils/reaction-export.test.ts`
- Modify: `src/pages/SettingsPage.tsx`

**Interfaces:**
- Consumes: `BabyEvent`, `MealEvent`, `Food`, `Reaction`, `ALLERGEN_LABELS`.
- Produces: `buildReactionCsv(events: BabyEvent[], byId: Map<string, Food>): string`

- [ ] **Step 1: Write the failing test**

`src/utils/reaction-export.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { buildReactionCsv } from './reaction-export';
import type { BabyEvent } from '../types/events';
import type { Food } from '../types/food';

const D = new Date('2026-08-30T09:15:00Z');
const byId = new Map([
  ['kiwi', { id: 'kiwi', name: 'Kiwi', allergens: ['kiwi'] } as Food],
]);

const reaction = {
  symptoms: ['hives', 'vomiting'], severity: 'moderate',
  onsetMinutes: 25, suspectedFoodIds: ['kiwi'], note: 'around the mouth',
};

const mealWithReaction = {
  id: 'm1', babyId: 'b1', type: 'meal', mealSlot: 'breakfast',
  timestamp: Timestamp.fromDate(D), createdBy: 'u1', createdAt: Timestamp.fromDate(D),
  items: [{ foodId: 'kiwi', name: 'Kiwi', quantity: 2, unit: 'tsp', firstTry: true }],
  reaction,
} as unknown as BabyEvent;

const mealWithout = {
  id: 'm2', babyId: 'b1', type: 'meal', mealSlot: 'lunch',
  timestamp: Timestamp.fromDate(D), createdBy: 'u1', createdAt: Timestamp.fromDate(D),
  items: [{ foodId: 'kiwi', name: 'Kiwi', quantity: 1, unit: 'tsp' }],
} as unknown as BabyEvent;

const withNote = (note: string) => ({
  ...mealWithReaction, reaction: { ...reaction, note },
} as unknown as BabyEvent);

const lines = (csv: string) => csv.trim().split('\n');

describe('buildReactionCsv', () => {
  it('should emit a header row', () => {
    expect(lines(buildReactionCsv([], byId))[0]).toBe(
      'date,time,meal,severity,symptoms,onset_minutes,suspected_foods,allergens,note',
    );
  });

  it('should emit one row per meal carrying a reaction', () => {
    expect(lines(buildReactionCsv([mealWithReaction, mealWithout], byId))).toHaveLength(2);
  });

  it('should include the symptoms, severity and suspected foods', () => {
    const csv = buildReactionCsv([mealWithReaction], byId);
    expect(csv).toContain('moderate');
    expect(csv).toContain('hives;vomiting');
    expect(csv).toContain('Kiwi');
  });

  it('should resolve the allergens of the suspected foods', () => {
    expect(buildReactionCsv([mealWithReaction], byId)).toContain('Kiwi');
  });

  it('should quote a note containing a comma', () => {
    expect(buildReactionCsv([withNote('red, itchy')], byId)).toContain('"red, itchy"');
  });

  it('should escape a double quote inside a field', () => {
    const csv = buildReactionCsv([withNote('said "ow"')], byId);
    expect(csv).toContain('""ow""');
  });

  it('should ignore non-meal events', () => {
    const pee = {
      id: 'p1', babyId: 'b1', type: 'pee', timestamp: Timestamp.fromDate(D),
      createdBy: 'u1', createdAt: Timestamp.fromDate(D),
    } as unknown as BabyEvent;
    expect(lines(buildReactionCsv([pee], byId))).toHaveLength(1);
  });

  it('should sort rows oldest first', () => {
    const later = {
      ...mealWithReaction, id: 'm3',
      timestamp: Timestamp.fromDate(new Date('2026-08-31T09:00:00Z')),
    } as unknown as BabyEvent;
    const rows = lines(buildReactionCsv([later, mealWithReaction], byId));
    expect(rows[1]).toContain('2026-08-30');
    expect(rows[2]).toContain('2026-08-31');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/reaction-export.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/utils/reaction-export.ts`**

```ts
import { format } from 'date-fns';
import { ALLERGEN_LABELS } from './allergens';
import type { BabyEvent } from '../types/events';
import type { Food, MealEvent } from '../types/food';

const HEADER = [
  'date', 'time', 'meal', 'severity', 'symptoms',
  'onset_minutes', 'suspected_foods', 'allergens', 'note',
];

function escapeCsv(value: string): string {
  if (!/["\n,]/.test(value)) return value;
  return '"' + value.replace(/"/g, '""') + '"';
}

export function buildReactionCsv(events: BabyEvent[], byId: Map<string, Food>): string {
  const meals = events
    .filter((e): e is MealEvent => e.type === 'meal' && Boolean(e.reaction))
    .sort((a, b) => a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime());

  const rows = meals.map((meal) => {
    const reaction = meal.reaction;
    if (!reaction) return '';
    const suspects = reaction.suspectedFoodIds.length
      ? reaction.suspectedFoodIds
      : meal.items.map((i) => i.foodId);
    const names = suspects.map((id) => byId.get(id)?.name ?? id);
    const allergens = [
      ...new Set(suspects.flatMap((id) => byId.get(id)?.allergens ?? [])),
    ].map((a) => ALLERGEN_LABELS[a]);
    const at = meal.timestamp.toDate();

    return [
      format(at, 'yyyy-MM-dd'),
      format(at, 'HH:mm'),
      meal.mealSlot,
      reaction.severity,
      reaction.symptoms.join(';'),
      reaction.onsetMinutes != null ? String(reaction.onsetMinutes) : '',
      names.join(';'),
      allergens.join(';'),
      reaction.note ?? '',
    ].map(escapeCsv).join(',');
  });

  return [HEADER.join(','), ...rows].join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/reaction-export.test.ts`
Expected: PASS

- [ ] **Step 5: Add the Settings entry**

In `src/pages/SettingsPage.tsx`, add a "Reaction history" card following the
existing card structure. A button builds the CSV from the events already in the
Firestore cache and hands it to the user through a `Blob` and an object URL:

```tsx
function downloadCsv(csv: string, filename: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
```

Disable the button and show "No reactions logged" when the CSV has only its
header row.

- [ ] **Step 6: Run everything**

Run: `npm run test && npx tsc -b && npm run lint`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/utils/reaction-export.ts src/utils/reaction-export.test.ts \
        src/pages/SettingsPage.tsx
git commit -m "feat(food): export reaction history as CSV from settings"
```

---

## Final verification

- [ ] `npm run test` — all suites green, including the original 232 tests
- [ ] `npx tsc -b` — clean
- [ ] `npm run lint` — clean
- [ ] `npm run build` — succeeds; note the bundle delta from the seed table
- [ ] Manual pass at 375 px, light and dark: log a meal with 3 foods, one of them
      new; log a reaction with a systemic symptom and confirm the static warning;
      confirm the food's status becomes `suspected`; confirm the hero switches to
      the hold card and names the right date
- [ ] **Ask the user before `git push` and before opening the PR.** The project's
      `CLAUDE.md` forbids both without an explicit request.
