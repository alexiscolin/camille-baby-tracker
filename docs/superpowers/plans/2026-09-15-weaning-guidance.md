# Weaning Guidance Compliance and Weekly Shopping List — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the food suggestions follow Japanese weaning guidance (progress since the first spoon, order of introduction, allergen policy, 2026 allergen list, corrected seed data) and add a Coop Okinawa weekly shopping list.

**Architecture:** Pure functions carry all logic: `weaning-progress.ts` (where the baby is), `weaning-rules.ts` (sourced constants), `next-foods.ts` (readiness + ranking + pace), `shopping-list.ts` (weekly list). Seed rows gain `minAgeMonths`, `note`, `suggest`. Two optional baby fields (`weaningStartedAt`, `eczema`). UI changes are confined to `FoodPage`, a new presentational `ShoppingList`, `SettingsPage` and `AllergenGrid`.

**Tech Stack:** React 19, TypeScript strict, Vitest + Testing Library, date-fns 4, Firebase Firestore.

**Spec:** `docs/superpowers/specs/2026-09-15-weaning-guidance-design.md` (evidence in `docs/superpowers/specs/2026-09-15-weaning-guidance-research/`)

## Global Constraints

- Recommendations are advisory: no food is ever hidden from logging; every non-`now` suggestion shows a one-line reason.
- TypeScript strict, no `any`; named exports; `kebab-case.ts` utils, `PascalCase.tsx` components; tests colocated.
- All code, comments and UI copy in English.
- **Never commit or push** (project rule). Work stays on local branch `feat/weaning-guidance`; the family asks for the commit and the single PR.
- Run tests with `npx vitest run <path>`; the whole suite with `npm run test`; types with `npx tsc -b`; lint with `npm run lint` (no new errors).
- Dark mode and 375 px width: all new CSS uses existing `var(--…)` tokens only.

---

### Task 1: Allergen lists as of 2026-04-01

**Files:**
- Modify: `src/utils/allergens.ts`, `src/utils/allergens.test.ts`
- Modify: `src/data/food-seed.ts` (matsutake row allergens)
- Modify: `src/components/AllergenGrid.tsx:122` (sheet copy)
- Modify: `src/utils/reaction-export.ts:34` (label fallback)
- Modify: `src/utils/next-foods.test.ts` (28 → 29), `src/pages/FoodPage.test.tsx` (28 → 29)

**Interfaces:**
- Produces: `MANDATORY_ALLERGENS` (9), `RECOMMENDED_ALLERGENS` (20), `ALLERGENS` (29), `isAllergen(value: string): value is Allergen`, `allergenLabel(value: string): string`.

- [ ] **Step 1: Update the failing tests**

`src/utils/allergens.test.ts` — replace the counts and add the membership checks:

```ts
  it('should list the 9 mandatory Japanese allergens (2026-04-01)', () => {
    expect(MANDATORY_ALLERGENS).toHaveLength(9);
    expect(MANDATORY_ALLERGENS).toContain('walnut');
    expect(MANDATORY_ALLERGENS).toContain('cashew');
  });

  it('should list the 20 recommended Japanese allergens (2026-04-01)', () => {
    expect(RECOMMENDED_ALLERGENS).toHaveLength(20);
    expect(RECOMMENDED_ALLERGENS).toContain('macadamia');
    expect(RECOMMENDED_ALLERGENS).toContain('pistachio');
    expect(RECOMMENDED_ALLERGENS).not.toContain('matsutake' as never);
    expect(RECOMMENDED_ALLERGENS).not.toContain('cashew' as never);
  });

  it('should expose 29 allergens in total with no duplicates', () => {
    expect(ALLERGENS).toHaveLength(29);
    expect(new Set(ALLERGENS).size).toBe(29);
  });

  it('should label an allergen no longer on the list with its raw key', () => {
    expect(isAllergen('matsutake')).toBe(false);
    expect(allergenLabel('matsutake')).toBe('matsutake');
    expect(allergenLabel('egg')).toBe('Egg');
  });
```

In `src/utils/next-foods.test.ts` rename `'should return one row per allergen, all 28'` to `all 29` with `toHaveLength(29)`; in `src/pages/FoodPage.test.tsx` rename `'should render 28 allergen tokens'` to 29 with `toHaveLength(29)`.

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/utils/allergens.test.ts`
Expected: FAIL (length 8 ≠ 9, `isAllergen` not exported).

- [ ] **Step 3: Implement**

`src/utils/allergens.ts`:

```ts
/**
 * The 9 allergens Japan requires to be labelled (特定原材料), as of 2026-04-01.
 * Walnut became mandatory in 2023; cashew on 2026-04-01 (消費者庁, 内閣府令第34号).
 */
export const MANDATORY_ALLERGENS = [
  'egg', 'milk', 'wheat', 'shrimp', 'crab', 'buckwheat', 'peanut', 'walnut', 'cashew',
] as const;

/**
 * The 20 allergens Japan recommends labelling (特定原材料に準ずるもの), as of
 * 2026-04-01. Matsutake was removed and macadamia added on 2024-03-28;
 * pistachio was added on 2026-04-01.
 */
export const RECOMMENDED_ALLERGENS = [
  'almond', 'abalone', 'squid', 'salmon_roe', 'orange', 'kiwi', 'beef', 'sesame',
  'salmon', 'mackerel', 'soy', 'chicken', 'banana', 'pistachio', 'pork',
  'macadamia', 'peach', 'yam', 'apple', 'gelatin',
] as const;

export const ALLERGENS = [...MANDATORY_ALLERGENS, ...RECOMMENDED_ALLERGENS] as const;

export type Allergen = (typeof ALLERGENS)[number];

const MANDATORY_SET = new Set<string>(MANDATORY_ALLERGENS);
const ALLERGEN_SET = new Set<string>(ALLERGENS);

export function isMandatoryAllergen(allergen: Allergen): boolean {
  return MANDATORY_SET.has(allergen);
}

/** Firestore food documents written before a list change may carry a retired key. */
export function isAllergen(value: string): value is Allergen {
  return ALLERGEN_SET.has(value);
}

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  egg: 'Egg', milk: 'Milk', wheat: 'Wheat', shrimp: 'Shrimp', crab: 'Crab',
  buckwheat: 'Buckwheat', peanut: 'Peanut', walnut: 'Walnut', cashew: 'Cashew',
  almond: 'Almond', abalone: 'Abalone', squid: 'Squid', salmon_roe: 'Salmon roe',
  orange: 'Orange', kiwi: 'Kiwi', beef: 'Beef', sesame: 'Sesame',
  salmon: 'Salmon', mackerel: 'Mackerel', soy: 'Soy', chicken: 'Chicken',
  banana: 'Banana', pistachio: 'Pistachio', pork: 'Pork', macadamia: 'Macadamia',
  peach: 'Peach', yam: 'Yam', apple: 'Apple', gelatin: 'Gelatin',
};

export function allergenLabel(value: string): string {
  return isAllergen(value) ? ALLERGEN_LABELS[value] : value;
}
```

`src/data/food-seed.ts` matsutake row: `allergens: ['matsutake'],` → `allergens: [],`.

`src/components/AllergenGrid.tsx:122`: `One of the 8 allergens` → `One of the 9 allergens`.

`src/utils/reaction-export.ts:2,34`: import `allergenLabel` instead of `ALLERGEN_LABELS`; `.map((a) => allergenLabel(a))`.

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/utils/allergens.test.ts src/utils/reaction-export.test.ts src/data/food-seed.test.ts`
Expected: PASS. (`next-foods.test.ts` and `FoodPage.test.tsx` are rewritten in Tasks 5 and 7.)

---

### Task 2: Seed fields and row changes

**Files:**
- Modify: `src/types/food.ts` (`SeedFood`, `WeaningPhase`)
- Modify: `src/data/food-seed.ts` (≈120 rows, 5 new rows)
- Test: `src/data/food-seed.test.ts`

**Interfaces:**
- Produces: `SeedFood.minAgeMonths?: number`, `SeedFood.note?: string`, `SeedFood.suggest?: false`, `type WeaningPhase = 'porridge' | 'vegetables' | 'proteins'`.

- [ ] **Step 1: Add the type fields**

`src/types/food.ts`, inside `SeedFood` after `minStage`:

```ts
  /** Hard age floor in months, independent of stage and progress (honey: 12). */
  minAgeMonths?: number;
  /** One-line preparation or safety caveat shown with suggestions. ≤ 120 chars. */
  note?: string;
  /** `false` keeps the food loggable but never suggested (drinks, seasonings, oils, textures). */
  suggest?: false;
```

and after `WeaningStage`:

```ts
/** The first month of 初期, in the guide's order: porridge → vegetables and fruit → protein. */
export type WeaningPhase = 'porridge' | 'vegetables' | 'proteins';
```

- [ ] **Step 2: Write the failing data tests**

Append to `src/data/food-seed.test.ts`:

```ts
const byId = new Map(FOOD_SEED.map((f) => [f.id, f]));
const get = (id: string) => {
  const food = byId.get(id);
  if (!food) throw new Error(`${id} missing from the seed`);
  return food;
};

describe('food seed guidance fields', () => {
  it('should keep notes short and non-empty', () => {
    for (const food of FOOD_SEED) {
      if (food.note === undefined) continue;
      expect(food.note.trim(), food.id).not.toBe('');
      expect(food.note.length, food.id).toBeLessThanOrEqual(120);
    }
  });

  it('should keep minAgeMonths a whole number of months between 1 and 72', () => {
    for (const food of FOOD_SEED) {
      if (food.minAgeMonths === undefined) continue;
      expect(Number.isInteger(food.minAgeMonths), food.id).toBe(true);
      expect(food.minAgeMonths, food.id).toBeGreaterThanOrEqual(1);
      expect(food.minAgeMonths, food.id).toBeLessThanOrEqual(72);
    }
  });

  // Stage placements corrected against the Japanese sources (spec §7).
  it.each([
    ['chicken-sasami-boiled', 2], ['firm-tofu', 2], ['katsuobushi', 2],
    ['aji-boiled', 3], ['sawara-boiled', 3], ['beef-liver-boiled', 3], ['pork-liver-boiled', 3],
    ['cream-cheese', 3], ['kanten-powder', 3], ['avocado', 3], ['blueberry', 3],
    ['prune-dried', 3], ['mikan-canned', 3], ['peach-canned', 3],
    ['apple-juice', 4], ['orange-juice', 4], ['peanut-paste', 4],
    ['cooked-white-rice', 4], ['dashi-granules', 4], ['mango', 4], ['papaya', 4],
    ['barley-boiled', 4], ['millet-cooked', 4], ['quinoa-cooked', 4],
    ['button-mushroom-boiled', 4], ['shiitake-dried', 4], ['atsuage', 4], ['okara', 4],
    ['vegetable-juice', 4], ['almond-ground', 4], ['cashew-ground', 4], ['walnut-ground', 4],
    ['egg-white-boiled', 2], ['katsuo-boiled', 2], ['chicken-mince-cooked', 2],
    ['saury-grilled', 3],
    ['soy-sauce-koikuchi', 3], ['soy-sauce-usukuchi', 3], ['miso-red', 3],
    ['miso-white-sweet', 3], ['salt', 3], ['sugar-white', 2],
  ] as const)('should place %s at stage %i', (id, stage) => {
    expect(get(id).minStage).toBe(stage);
  });

  it.each([
    ['honey', 12],
    ['sencha', 19], ['eringi-boiled', 19], ['tarako', 19], ['unagi-kabayaki', 19],
    ['shrimp-boiled', 24], ['crab-boiled', 24], ['oyster-cooked', 24], ['scallop-boiled', 24],
    ['squid-boiled', 36], ['octopus-boiled', 36], ['ikura', 36], ['konnyaku', 36],
    ['abalone-boiled', 72],
  ] as const)('should not suggest %s before %i months', (id, months) => {
    expect(get(id).minAgeMonths).toBe(months);
  });

  it('should never suggest drinks, seasonings, oils or porridge textures', () => {
    const unsuggested = [
      'water', 'barley-tea', 'rooibos-tea', 'hojicha', 'sencha', 'oral-rehydration-solution',
      'formula-powder', 'formula-prepared', 'omoyu', 'okayu-8x', 'okayu-7x',
      'rice-flour', 'cornstarch', 'katakuriko',
      'kombu-dashi', 'katsuo-dashi', 'awase-dashi', 'niboshi-dashi', 'shiitake-dashi', 'dashi-granules',
      'salt', 'sugar-white', 'soy-sauce-koikuchi', 'soy-sauce-usukuchi', 'miso-red', 'miso-white-sweet',
      'ketchup', 'curry-powder', 'lemon-juice', 'yuzu-juice', 'honey', 'kizami-kombu', 'matsutake',
    ];
    for (const id of unsuggested) expect(get(id).suggest, id).toBe(false);
    for (const food of FOOD_SEED.filter((f) => f.group === 'fat' && f.id !== 'sesame-paste')) {
      expect(food.suggest, food.id).toBe(false);
    }
    expect(get('sesame-paste').suggest).toBeUndefined();
    expect(get('okayu-10x').suggest).toBeUndefined();
  });

  it.each([
    'apple', 'pear-western', 'nashi', 'shokupan', 'roll-bread', 'french-bread',
    'cherry-tomato', 'grape', 'cherry', 'blueberry', 'quail-egg-boiled',
    'processed-cheese', 'mozzarella', 'wiener-sausage', 'ham-roast', 'kamaboko', 'chikuwa', 'hanpen',
    'chickpeas-boiled', 'lentils-boiled', 'soybeans-boiled', 'edamame-boiled', 'azuki-boiled',
    'kidney-beans-boiled', 'soramame-boiled', 'green-peas-boiled', 'sweetcorn-boiled',
    'peanut-paste', 'almond-ground', 'cashew-ground', 'walnut-ground',
    'kombu-dashi', 'awase-dashi', 'hijiki-dried', 'hijiki-boiled', 'shirasu', 'shirasuboshi',
    'milk-whole', 'skim-milk-powder', 'egg-yolk', 'natto', 'hikiwari-natto', 'kinako',
    'nagaimo-boiled', 'udon-dried', 'somen-boiled', 'wakame-dried-cut', 'wakame-desalted',
    'yaki-nori', 'aonori-dried', 'tamago-bolo', 'mayonnaise', 'senbei-shoyu', 'pomegranate',
    'cucumber-raw',
  ])('should carry a preparation note on %s', (id) => {
    expect(get(id).note).toBeTruthy();
  });

  it('should make raw apple and pear a cooked-only food', () => {
    expect(get('apple').note).toMatch(/cook/i);
    expect(get('cherry-tomato').note).toMatch(/quarter/i);
  });

  it('should include the Okinawan staples', () => {
    for (const id of ['shima-dofu', 'yushi-dofu', 'beni-imo', 'ta-imo', 'mozuku-desalted']) {
      expect(byId.has(id), id).toBe(true);
    }
    expect(get('shima-dofu').allergens).toContain('soy');
    expect(get('shima-dofu').minStage).toBe(2);
  });
});
```

Also update the existing `'should offer at least 20 stage-1 foods'` to count only suggestible ones:

```ts
  it('should offer at least 20 suggestible stage-1 foods', () => {
    expect(FOOD_SEED.filter((f) => f.minStage === 1 && f.suggest !== false).length)
      .toBeGreaterThanOrEqual(20);
  });
```

- [ ] **Step 3: Run to verify they fail**

Run: `npx vitest run src/data/food-seed.test.ts`
Expected: FAIL on the stage table, `minAgeMonths`, `suggest`, notes and missing rows.

- [ ] **Step 4: Apply the row changes**

Write a throwaway transform script in the session scratchpad (not in the repo) that edits `src/data/food-seed.ts` by row id. Each row block has `minStage: N,` on its own line; the script replaces that line with `minStage: <new>,` followed by optional `minAgeMonths: N,`, `note: '…',` and `suggest: false,` lines at the same indentation, and fails loudly if an id is not found exactly once. Data it applies:

```js
const STAGE = { 'chicken-sasami-boiled': 2, 'firm-tofu': 2, katsuobushi: 2,
  'aji-boiled': 3, 'sawara-boiled': 3, 'beef-liver-boiled': 3, 'pork-liver-boiled': 3,
  'cream-cheese': 3, 'kanten-powder': 3, avocado: 3, blueberry: 3, 'prune-dried': 3,
  'mikan-canned': 3, 'peach-canned': 3, 'apple-juice': 4, 'orange-juice': 4, 'peanut-paste': 4,
  'cooked-white-rice': 4, 'dashi-granules': 4, mango: 4, papaya: 4, 'barley-boiled': 4,
  'millet-cooked': 4, 'quinoa-cooked': 4, 'button-mushroom-boiled': 4, 'shiitake-dried': 4,
  atsuage: 4, okara: 4, 'vegetable-juice': 4, 'almond-ground': 4, 'cashew-ground': 4,
  'walnut-ground': 4, 'egg-white-boiled': 2, 'katsuo-boiled': 2, 'chicken-mince-cooked': 2,
  'saury-grilled': 3, 'soy-sauce-koikuchi': 3, 'soy-sauce-usukuchi': 3, 'miso-red': 3,
  'miso-white-sweet': 3, salt: 3, 'sugar-white': 2 };

const MIN_AGE = { honey: 12, sencha: 19, 'eringi-boiled': 19, tarako: 19, 'unagi-kabayaki': 19,
  'shrimp-boiled': 24, 'crab-boiled': 24, 'oyster-cooked': 24, 'scallop-boiled': 24,
  'squid-boiled': 36, 'octopus-boiled': 36, ikura: 36, konnyaku: 36, 'abalone-boiled': 72 };

const UNSUGGESTED = ['water', 'barley-tea', 'rooibos-tea', 'hojicha', 'sencha',
  'oral-rehydration-solution', 'formula-powder', 'formula-prepared', 'omoyu', 'okayu-8x',
  'okayu-7x', 'rice-flour', 'cornstarch', 'katakuriko', 'kombu-dashi', 'katsuo-dashi',
  'awase-dashi', 'niboshi-dashi', 'shiitake-dashi', 'dashi-granules', 'salt', 'sugar-white',
  'soy-sauce-koikuchi', 'soy-sauce-usukuchi', 'miso-red', 'miso-white-sweet', 'ketchup',
  'curry-powder', 'lemon-juice', 'yuzu-juice', 'honey', 'kizami-kombu', 'matsutake',
  /* every group: 'fat' row except sesame-paste, resolved by the script from the file */];

const NOTE = {
  apple: 'Cook until soft until 18 months — never raw or only grated (choking).',
  'pear-western': 'Cook until soft until 18 months — never raw or only grated (choking).',
  nashi: 'Cook until soft until 18 months — never raw or only grated (choking).',
  shokupan: 'Serve as bread porridge (パン粥) in small moist pieces — bread is a top choking food.',
  'roll-bread': 'Serve as bread porridge (パン粥) in small moist pieces — bread is a top choking food.',
  'french-bread': 'Serve as bread porridge (パン粥) in small moist pieces — bread is a top choking food.',
  'cherry-tomato': 'Never whole: peel and cut into quarters.',
  grape: 'Never whole: peel and cut into quarters.',
  cherry: 'Never whole: stone and cut into quarters.',
  blueberry: 'Never whole: crush or cut into quarters.',
  'quail-egg-boiled': 'Cut up, never whole (choking).',
  'processed-cheese': 'Grate or chop finely.',
  mozzarella: 'Grate or chop finely.',
  'wiener-sausage': 'Blanch to cut salt; cut lengthwise, then small.',
  'ham-roast': 'Blanch to cut salt; chop finely.',
  kamaboko: 'Blanch to cut salt; chop finely.',
  chikuwa: 'Blanch to cut salt; chop finely.',
  hanpen: 'Blanch to cut salt; chop finely.',
  'chickpeas-boiled': 'Soft-cooked, skins off, mashed. No whole hard beans before age 6.',
  'lentils-boiled': 'Soft-cooked and mashed. No whole hard beans before age 6.',
  'soybeans-boiled': 'Soft-cooked, skins off, mashed. No whole hard beans before age 6.',
  'edamame-boiled': 'Skins off and mashed. No whole beans before age 6.',
  'azuki-boiled': 'Soft-cooked, skins off, mashed. No whole hard beans before age 6.',
  'kidney-beans-boiled': 'Soft-cooked, skins off, mashed. No whole hard beans before age 6.',
  'soramame-boiled': 'Skins off and mashed. No whole beans before age 6.',
  'green-peas-boiled': 'Skins off and mashed.',
  'sweetcorn-boiled': 'Skins off and mashed.',
  'peanut-paste': 'Smooth paste only, never pieces.',
  'almond-ground': 'Fine powder or smooth paste only, never pieces.',
  'cashew-ground': 'Fine powder or smooth paste only, never pieces.',
  'walnut-ground': 'Fine powder or smooth paste only, never pieces.',
  'kombu-dashi': 'High in iodine: a few spoons a day, alternate with katsuo dashi.',
  'awase-dashi': 'High in iodine: a few spoons a day, alternate with katsuo dashi.',
  'hijiki-dried': 'Soak, boil and discard the water (removes most arsenic); small amounts.',
  'hijiki-boiled': 'Soak, boil and discard the water (removes most arsenic); small amounts.',
  shirasu: 'Desalt: pour boiling water over and drain.',
  shirasuboshi: 'Desalt: pour boiling water over and drain.',
  'milk-whole': 'Cooking only before 12 months; as a drink from 12 months.',
  'skim-milk-powder': 'Cooking only before 12 months.',
  'egg-yolk': 'Hard-boiled yolk only; start with a tiny amount.',
  natto: 'Chop; warm it at first.',
  'hikiwari-natto': 'Warm it at first.',
  kinako: 'Mix into moist food — dry powder makes babies choke.',
  'nagaimo-boiled': 'Always cooked.',
  'udon-dried': 'Boil and rinse off the salt.',
  'somen-boiled': 'Rinse off the salt.',
  'wakame-dried-cut': 'Chop finely.',
  'wakame-desalted': 'Desalt well and chop finely.',
  'yaki-nori': 'Crumble finely; no whole sheets.',
  'aonori-dried': 'A pinch, mixed into moist food.',
  'tamago-bolo': 'Still egg despite baking; snacks are not needed before 1 year.',
  mayonnaise: 'Raw-egg based: only once whole egg is tolerated.',
  'senbei-shoyu': 'Adult rice crackers are hard and salty — prefer baby rice crackers.',
  pomegranate: 'Seeds are a choking risk.',
  'cucumber-raw': 'Grate or cook until 18 months.',
};
```

Then insert the 5 new rows (values from the MEXT fetch recorded in the spec's open items if one cannot be confirmed) at the end of `FOOD_SEED`, each carrying `note` as in spec §7. Remove `IMPLIED_ALLERGENS` nothing — `tofu` token: `shima-dofu`/`yushi-dofu` split on `-` gives `dofu`, not `tofu`, so no implied-allergen change is needed.

- [ ] **Step 5: Run to verify they pass**

Run: `npx vitest run src/data/food-seed.test.ts`
Expected: PASS (all mechanical nutrient checks included, so the new rows are validated too).

---

### Task 3: Weaning rules module

**Files:**
- Create: `src/utils/weaning-rules.ts`, `src/utils/weaning-rules.test.ts`

**Interfaces:**
- Consumes: `Allergen`, `FoodGroup`, `WeaningPhase`, `FOOD_SEED`.
- Produces:
  - `ASK_DOCTOR_ALLERGENS: readonly Allergen[]`, `ECZEMA_DOCTOR_ALLERGENS: readonly Allergen[]`, `PUSHED_ALLERGEN: Allergen`
  - `interface Rung { label: string; ids: readonly string[] }`
  - `ALLERGEN_ENTRY: Partial<Record<Allergen, Rung>>`, `LADDERS: Record<string, readonly Rung[]>`
  - `NON_SOLID_IDS: ReadonlySet<string>`, `PHASE_GROUPS: Record<WeaningPhase, readonly FoodGroup[]>`
  - `PHASE_DAYS = { vegetables: 7, proteins: 14 }`, `PROGRESSION_STAGE_DAYS = { 2: 30, 3: 60, 4: 90 }`
  - `NEW_ALLERGEN_SPACING_DAYS = 3`, `MAINTENANCE_GAP_DAYS = 7`, `NUTRIENT_NUDGE_FROM_MONTHS = 6`, `IRON_RICH_MG = 1.5`, `VITAMIN_D_SOURCE_UG = 1`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { FOOD_SEED } from '../data/food-seed';
import { ALLERGEN_ENTRY, LADDERS, NON_SOLID_IDS, ASK_DOCTOR_ALLERGENS } from './weaning-rules';

const seedIds = new Set(FOOD_SEED.map((f) => f.id));

describe('weaning-rules', () => {
  it('should only reference foods that exist in the seed', () => {
    const ids = [
      ...Object.values(LADDERS).flatMap((rungs) => rungs.flatMap((r) => r.ids)),
      ...Object.values(ALLERGEN_ENTRY).flatMap((r) => r?.ids ?? []),
      ...NON_SOLID_IDS,
    ];
    for (const id of ids) expect(seedIds.has(id), id).toBe(true);
  });

  it('should never put a food on two rungs of the same ladder', () => {
    for (const [name, rungs] of Object.entries(LADDERS)) {
      const ids = rungs.flatMap((r) => r.ids);
      expect(new Set(ids).size, name).toBe(ids.length);
    }
  });

  it('should keep peanut and tree nuts out of automatic suggestions', () => {
    for (const a of ['peanut', 'walnut', 'cashew', 'almond', 'macadamia', 'pistachio'] as const) {
      expect(ASK_DOCTOR_ALLERGENS).toContain(a);
    }
    expect(ASK_DOCTOR_ALLERGENS).not.toContain('egg');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/utils/weaning-rules.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
import type { FoodGroup, WeaningPhase } from '../types/food';
import { FOOD_GROUPS } from '../types/food';
import type { Allergen } from './allergens';

/**
 * Every constant here is a rule the suggestions follow, with its source.
 * Evidence: docs/superpowers/specs/2026-09-15-weaning-guidance-research/.
 * "practice" = municipal leaflets fill a gap the official guide leaves;
 * "heuristic" = no source gives a value, chosen here.
 * Re-check when JSPACI's 食物アレルギー診療ガイドライン2026 is published
 * (planned 2026-11-28) or 授乳・離乳の支援ガイド is revised.
 */

/**
 * No Japanese early-introduction advice: JGFA2026 draft p.54, Sakihara 2024
 * (アレルギー 73:265), 消費者庁 2021 on nuts for under-6s. Fish roe, shellfish and
 * buckwheat have no weaning age in the guide.
 */
export const ASK_DOCTOR_ALLERGENS: readonly Allergen[] = [
  'peanut', 'walnut', 'cashew', 'almond', 'macadamia', 'pistachio',
  'shrimp', 'crab', 'buckwheat', 'salmon_roe',
];

/**
 * With eczema: 授乳・離乳の支援ガイド p.33 (必ず医師の指示に基づいて), 鶏卵アレルギー
 * 発症予防に関する提言 2017. Egg, milk and wheat are 95.6 % of reactions at age 0
 * (消費者庁 即時型調査, 2024).
 */
export const ECZEMA_DOCTOR_ALLERGENS: readonly Allergen[] = ['egg', 'milk', 'wheat'];

/** The one allergen Japanese guidance asks not to delay (手引き2023 表7, JGFA2026 draft 表6-2). */
export const PUSHED_ALLERGEN: Allergen = 'egg';

export interface Rung {
  label: string;
  ids: readonly string[];
}

/**
 * A food carrying one of these allergens waits until the allergen has been
 * introduced, unless it is one of the entry foods itself. Guide p.32 order;
 * seed audit §4 prerequisite chains.
 */
export const ALLERGEN_ENTRY: Partial<Record<Allergen, Rung>> = {
  egg: { label: 'egg yolk', ids: ['egg-yolk'] },
  milk: { label: 'yoghurt', ids: ['plain-yoghurt', 'cottage-cheese', 'formula-powder', 'formula-prepared'] },
  wheat: { label: 'udon or somen', ids: ['udon-boiled', 'udon-dried', 'somen-boiled', 'shokupan'] },
  soy: { label: 'silken tofu', ids: ['silken-tofu'] },
  sesame: { label: 'ground sesame', ids: ['sesame-ground', 'sesame-paste'] },
};

/**
 * Each rung waits until a food from the previous rung — or any later one — is
 * introduced. Guide p.32: 「魚は白身魚から赤身魚、青皮魚へ、卵は卵黄から全卵へ」,
 * 初期 proteins 豆腐・白身魚・卵黄 in that order (港区). Meat order: Osaka city
 * table, たまひよ (practice).
 */
export const LADDERS: Record<string, readonly Rung[]> = {
  firstProteins: [
    { label: 'silken tofu or white fish', ids: ['silken-tofu', 'cod', 'flounder-boiled', 'sea-bream-boiled', 'shirasu', 'shirasuboshi'] },
    { label: 'egg yolk', ids: ['egg-yolk'] },
  ],
  fish: [
    { label: 'white fish', ids: ['cod', 'flounder-boiled', 'sea-bream-boiled', 'shirasu', 'shirasuboshi'] },
    { label: 'red fish', ids: ['salmon-boiled', 'salmon-canned', 'tuna-boiled', 'tuna-canned-water', 'katsuo-boiled', 'swordfish-boiled'] },
    { label: 'blue-backed fish', ids: ['aji-boiled', 'sawara-boiled', 'mackerel-boiled', 'mackerel-canned', 'sardine-boiled', 'saury-grilled', 'yellowtail-boiled', 'shishamo-grilled'] },
  ],
  egg: [
    { label: 'egg yolk', ids: ['egg-yolk'] },
    { label: 'whole egg', ids: ['egg-whole-boiled', 'egg-white-boiled'] },
    { label: 'other egg foods', ids: ['quail-egg-boiled', 'mayonnaise', 'tamago-bolo'] },
  ],
  meat: [
    { label: 'chicken sasami', ids: ['chicken-sasami-boiled'] },
    { label: 'lean chicken', ids: ['chicken-breast-boiled', 'chicken-mince-cooked', 'chicken-liver-boiled'] },
    { label: 'pork and beef', ids: ['chicken-thigh-boiled', 'pork-fillet-boiled', 'pork-loin-boiled', 'pork-mince-cooked', 'beef-thigh-lean-boiled', 'beef-mince-cooked', 'beef-liver-boiled', 'pork-liver-boiled'] },
    { label: 'processed meat', ids: ['ham-roast', 'wiener-sausage'] },
  ],
};

/** Drinks: never the start of weaning, never a staple to shop for. */
export const NON_SOLID_IDS: ReadonlySet<string> = new Set([
  'water', 'barley-tea', 'rooibos-tea', 'hojicha', 'sencha',
  'oral-rehydration-solution', 'formula-powder', 'formula-prepared',
]);

/** Groups open in each 初期 phase. Guide p.32 order. */
export const PHASE_GROUPS: Record<WeaningPhase, readonly FoodGroup[]> = {
  porridge: ['grain'],
  vegetables: ['grain', 'vegetable', 'fruit', 'other'],
  proteins: FOOD_GROUPS,
};

/** Practice: 那覇市 (vegetables day 7–10, protein day 11–15), 港区 (weeks 2 and 3). */
export const PHASE_DAYS = { vegetables: 7, proteins: 14 } as const;

/**
 * Heuristic, used only when progress lags age. Leaving stage 1 needs about a
 * month and protein foods in place (2007 guide and 那覇市: two meals after
 * about a month; 2019 guide: protein established by then). Later stages: at
 * least a month each — no source gives a value.
 */
export const PROGRESSION_STAGE_DAYS = { 2: 30, 3: 60, 4: 90 } as const;

/** Practice: a few days watched before the next allergen step (知花 clinic; PETIT stepped far slower). */
export const NEW_ALLERGEN_SPACING_DAYS = 3;

/** At least weekly once introduced (Sakihara 2024 citing CSACI 2023; ASCIA 2026). */
export const MAINTENANCE_GAP_DAYS = 7;

/** Guide p.32: iron and vitamin D sources from about 6 months, especially if breastfed. */
export const NUTRIENT_NUDGE_FROM_MONTHS = 6;
export const IRON_RICH_MG = 1.5;
export const VITAMIN_D_SOURCE_UG = 1;
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/utils/weaning-rules.test.ts`
Expected: PASS.

---

### Task 4: Weaning progress

**Files:**
- Create: `src/utils/weaning-progress.ts`, `src/utils/weaning-progress.test.ts`
- Modify: `src/utils/weaning-stage.ts` (labels)

**Interfaces:**
- Consumes: `getWeaningStage`, `NON_SOLID_IDS`, `PHASE_DAYS`, `PROGRESSION_STAGE_DAYS`.
- Produces:
  - `isIntroduced(food: Food): food is Food & { firstTriedAt: Timestamp }`
  - `deriveWeaningStart(foods: Food[]): Date | null`
  - `interface WeaningProgress { ageMonths; ageStage; startedAt; daysSinceStart; phase; stage; mealsPerDay; eczema }`
  - `getWeaningProgress(input: { birthDate: Date; weaningStartedAt?: Date; eczema?: boolean; foods: Food[]; now: Date }): WeaningProgress`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { subDays, subMonths } from 'date-fns';
import { getWeaningProgress, deriveWeaningStart } from './weaning-progress';
import type { Food, FoodGroup } from '../types/food';

const NOW = new Date('2026-09-15T09:00:00');
const tried = (id: string, group: FoodGroup, daysAgo: number, allergens: Food['allergens'] = []): Food => ({
  id, name: id, group, allergens, gramsPerTsp: 5, minStage: 1, status: 'untried',
  usageCount: 1, exposureCount: 1, reactionEventIds: [], nutrientSource: 'seed',
  firstTriedAt: Timestamp.fromDate(subDays(NOW, daysAgo)),
});
const progress = (months: number, foods: Food[], extra: Partial<Parameters<typeof getWeaningProgress>[0]> = {}) =>
  getWeaningProgress({ birthDate: subMonths(NOW, months), foods, now: NOW, ...extra });

describe('deriveWeaningStart', () => {
  it('should ignore drinks such as formula and water', () => {
    const foods = [tried('formula-prepared', 'dairy', 60), tried('okayu-10x', 'grain', 5)];
    expect(deriveWeaningStart(foods)?.toDateString()).toBe(subDays(NOW, 5).toDateString());
  });
});

describe('getWeaningProgress', () => {
  it('should have no stage before 5 months', () => {
    expect(progress(4, []).stage).toBeNull();
  });

  it('should treat a 7-month-old who has not started as stage 1, porridge', () => {
    const p = progress(7, []);
    expect(p).toMatchObject({ ageStage: 2, stage: 1, phase: 'porridge', startedAt: null, mealsPerDay: 1 });
  });

  it('should stay in porridge on day 6 even with porridge in', () => {
    expect(progress(6, [tried('okayu-10x', 'grain', 6)]).phase).toBe('porridge');
  });

  it('should open vegetables on day 7 once porridge is in', () => {
    const p = progress(6, [tried('okayu-10x', 'grain', 7)]);
    expect(p).toMatchObject({ phase: 'vegetables', daysSinceStart: 7 });
  });

  it('should open protein foods on day 14 once a vegetable is in', () => {
    const foods = [tried('okayu-10x', 'grain', 14), tried('carrot', 'vegetable', 6)];
    expect(progress(6, foods).phase).toBe('proteins');
    expect(progress(6, [tried('okayu-10x', 'grain', 13), tried('carrot', 'vegetable', 6)]).phase).toBe('vegetables');
  });

  it('should follow a family that went faster instead of demoting it', () => {
    const foods = [tried('okayu-10x', 'grain', 3), tried('silken-tofu', 'protein', 1)];
    expect(progress(6, foods).phase).toBe('proteins');
  });

  it('should keep a 7-month-old one week into weaning at stage 1', () => {
    const foods = [tried('okayu-10x', 'grain', 7), tried('carrot', 'vegetable', 1)];
    expect(progress(7, foods)).toMatchObject({ ageStage: 2, stage: 1, daysSinceStart: 7 });
  });

  it('should reach stage 2 after a month with protein foods in, capped by age', () => {
    const foods = [tried('okayu-10x', 'grain', 35), tried('carrot', 'vegetable', 28), tried('cod', 'protein', 20)];
    expect(progress(7, foods)).toMatchObject({ stage: 2, mealsPerDay: 2, phase: 'proteins' });
    expect(progress(6, foods).stage).toBe(1);
  });

  it('should not jump a late starter straight to stage 3', () => {
    const foods = [tried('okayu-10x', 'grain', 40), tried('carrot', 'vegetable', 30), tried('cod', 'protein', 25)];
    expect(progress(10, foods).stage).toBe(2);
  });

  it('should prefer the date set in settings over the first logged food', () => {
    const p = progress(7, [tried('okayu-10x', 'grain', 2)], { weaningStartedAt: subDays(NOW, 20) });
    expect(p.daysSinceStart).toBe(20);
  });

  it('should treat a start date in the future as not started', () => {
    expect(progress(7, [], { weaningStartedAt: subDays(NOW, -3) }).startedAt).toBeNull();
  });

  it('should carry the eczema flag', () => {
    expect(progress(7, [], { eczema: true }).eczema).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/utils/weaning-progress.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
import { differenceInCalendarDays, differenceInMonths } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import type { Food, FoodGroup, WeaningPhase, WeaningStage } from '../types/food';
import { getWeaningStage } from './weaning-stage';
import { NON_SOLID_IDS, PHASE_DAYS, PROGRESSION_STAGE_DAYS } from './weaning-rules';

export interface WeaningProgress {
  ageMonths: number;
  /** Age-only stage. Null under 5 months. */
  ageStage: WeaningStage | null;
  startedAt: Date | null;
  daysSinceStart: number | null;
  /** The 初期 phase; always 'proteins' from stage 2. */
  phase: WeaningPhase;
  /** min(age stage, progression stage). Null under 5 months. */
  stage: WeaningStage | null;
  mealsPerDay: 1 | 2 | 3;
  eczema: boolean;
}

export function isIntroduced(food: Food): food is Food & { firstTriedAt: Timestamp } {
  return Boolean(food.firstTriedAt);
}

function solids(foods: Food[]) {
  return foods.filter(isIntroduced).filter((f) => !NON_SOLID_IDS.has(f.id));
}

/** The first solid food logged. Drinks do not start weaning. */
export function deriveWeaningStart(foods: Food[]): Date | null {
  return solids(foods).reduce<Date | null>((earliest, f) => {
    const d = f.firstTriedAt.toDate();
    return !earliest || d < earliest ? d : earliest;
  }, null);
}

function progressionStage(days: number, hasProtein: boolean): WeaningStage {
  if (days < PROGRESSION_STAGE_DAYS[2] || !hasProtein) return 1;
  if (days < PROGRESSION_STAGE_DAYS[3]) return 2;
  if (days < PROGRESSION_STAGE_DAYS[4]) return 3;
  return 4;
}

export function getWeaningProgress(input: {
  birthDate: Date;
  weaningStartedAt?: Date;
  eczema?: boolean;
  foods: Food[];
  now: Date;
}): WeaningProgress {
  const { birthDate, foods, now } = input;
  const introduced = solids(foods);
  const has = (groups: readonly FoodGroup[]) => introduced.some((f) => groups.includes(f.group));

  const start = input.weaningStartedAt ?? deriveWeaningStart(foods);
  const startedAt = start && start.getTime() <= now.getTime() ? start : null;
  const daysSinceStart = startedAt ? differenceInCalendarDays(now, startedAt) : null;
  const days = daysSinceStart ?? 0;

  const hasGrain = has(['grain']);
  const hasVegFruit = has(['vegetable', 'fruit']);
  const hasProtein = has(['protein', 'dairy']);
  // The "already introduced" branches follow a family that went faster.
  const vegetablesOpen = hasVegFruit || hasProtein || (hasGrain && days >= PHASE_DAYS.vegetables);
  const proteinsOpen = hasProtein || (vegetablesOpen && hasVegFruit && days >= PHASE_DAYS.proteins);

  const ageStage = getWeaningStage(birthDate, now);
  const byProgress = startedAt ? progressionStage(days, hasProtein) : 1;
  const stage = ageStage === null ? null : (Math.min(ageStage, byProgress) as WeaningStage);

  const phase: WeaningPhase = (stage ?? 1) >= 2 || proteinsOpen
    ? 'proteins'
    : vegetablesOpen ? 'vegetables' : 'porridge';

  return {
    ageMonths: differenceInMonths(now, birthDate),
    ageStage,
    startedAt,
    daysSinceStart,
    phase,
    stage,
    mealsPerDay: stage === null || stage === 1 ? 1 : stage === 2 ? 2 : 3,
    eczema: input.eczema ?? false,
  };
}
```

`src/utils/weaning-stage.ts` labels:

```ts
export const STAGE_LABELS: Record<WeaningStage, string> = {
  1: 'Stage 1 · 初期 · 5-6 months',
  2: 'Stage 2 · 中期 · 7-8 months',
  3: 'Stage 3 · 後期 · 9-11 months',
  4: 'Stage 4 · 完了期 · 12-18 months',
};
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/utils/weaning-progress.test.ts src/utils/weaning-stage.test.ts`
Expected: PASS (update `weaning-stage.test.ts` if it asserts the old label strings).

---

### Task 5: Readiness, ranking and pace

**Files:**
- Modify: `src/utils/next-foods.ts` (rewrite `rankNextFoods`, add `getPace`, remove `getIntroductionWindow`, `INTRODUCTION_GAP_DAYS`, gap-nutrient code; `MAINTENANCE_GAP_DAYS` re-exported from rules)
- Rewrite: `src/utils/next-foods.test.ts`
- Modify: `src/components/AllergenGrid.tsx:6` (import `MAINTENANCE_GAP_DAYS` from `weaning-rules`)

**Interfaces:**
- Consumes: `WeaningProgress`, `isIntroduced`, rules from Task 3, `allergenLabel`, `isAllergen`.
- Produces:
  - `type Readiness = 'now' | 'later' | 'doctor' | 'held'`
  - `type NextFoodCandidate = { seed: SeedFood; readiness: Readiness; score: number; reasons: string[]; heldBy?: { allergen: Allergen; foodName: string } }`
  - `rankNextFoods(input: { seed: readonly SeedFood[]; foods: Food[]; progress: WeaningProgress; now: Date }): NextFoodCandidate[]`
  - `getPace(foods: Food[], now: Date): { newToday: Food | null; lastAllergen: { name: string; at: Date } | null; allergensOpenFrom: Date | null }`
  - `getAllergenStatus` unchanged signature, 7-day gap.

- [ ] **Step 1: Write the failing tests**

Replace `src/utils/next-foods.test.ts` with:

```ts
import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { subDays } from 'date-fns';
import { rankNextFoods, getAllergenStatus, getPace } from './next-foods';
import type { NextFoodCandidate } from './next-foods';
import type { WeaningProgress } from './weaning-progress';
import { FOOD_SEED } from '../data/food-seed';
import type { Food, SeedFood } from '../types/food';

const NOW = new Date('2026-09-15T09:00:00');
const ts = (d: Date) => Timestamp.fromDate(d);

const food = (over: Partial<Food>): Food => ({
  id: 'x', name: 'X', group: 'vegetable', allergens: [], gramsPerTsp: 5,
  minStage: 1, status: 'safe', usageCount: 1, exposureCount: 3,
  reactionEventIds: [], nutrientSource: 'seed', firstTriedAt: ts(subDays(NOW, 20)), ...over,
});

const fromSeed = (id: string, daysAgo: number, over: Partial<Food> = {}): Food => {
  const s = FOOD_SEED.find((f) => f.id === id);
  if (!s) throw new Error(id);
  return food({ id, name: s.name, group: s.group, allergens: [...s.allergens],
    minStage: s.minStage, firstTriedAt: ts(subDays(NOW, daysAgo)), ...over });
};

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

const progress = (over: Partial<WeaningProgress> = {}): WeaningProgress => ({
  ageMonths: 8, ageStage: 2, startedAt: subDays(NOW, 40), daysSinceStart: 40,
  phase: 'proteins', stage: 2, mealsPerDay: 2, eczema: false, ...over,
});

const find = (list: NextFoodCandidate[], id: string) => {
  const c = list.find((x) => x.seed.id === id);
  if (!c) throw new Error(`${id} not ranked`);
  return c;
};

describe('rankNextFoods — the guide order', () => {
  // The bug the family reported: one week in, allergens were the top picks.
  it('should suggest no allergen to a 7-month-old one week into weaning', () => {
    const foods = [fromSeed('okayu-10x', 7), fromSeed('carrot', 1)];
    const p = progress({ ageMonths: 7, stage: 1, phase: 'vegetables', daysSinceStart: 7, mealsPerDay: 1 });
    const result = rankNextFoods({ seed: FOOD_SEED, foods, progress: p, now: NOW });
    const now = result.filter((c) => c.readiness === 'now');
    expect(now.length).toBeGreaterThan(0);
    for (const c of now) expect(c.seed.allergens, c.seed.id).toEqual([]);
    expect(['vegetable', 'fruit']).toContain(now[0].seed.group);
  });

  it('should offer only porridge before weaning starts', () => {
    const p = progress({ ageMonths: 6, ageStage: 1, stage: 1, phase: 'porridge', startedAt: null, daysSinceStart: null, mealsPerDay: 1 });
    const now = rankNextFoods({ seed: FOOD_SEED, foods: [], progress: p, now: NOW })
      .filter((c) => c.readiness === 'now');
    expect(now.map((c) => c.seed.id)).toEqual(['okayu-10x']);
  });

  it('should explain when vegetables and proteins open', () => {
    const p = progress({ stage: 1, phase: 'porridge', daysSinceStart: 2, mealsPerDay: 1 });
    const result = rankNextFoods({ seed: FOOD_SEED, foods: [fromSeed('okayu-10x', 2)], progress: p, now: NOW });
    expect(find(result, 'carrot').reasons[0]).toMatch(/vegetables are in/i);
    expect(find(result, 'silken-tofu').reasons[0]).toMatch(/protein foods start/i);
  });

  it('should hold egg yolk until silken tofu or white fish is in, then push it', () => {
    const base = [fromSeed('okayu-10x', 20), fromSeed('carrot', 12)];
    const p = progress({ ageMonths: 6, ageStage: 1, stage: 1, phase: 'proteins', daysSinceStart: 20, mealsPerDay: 1 });
    const before = rankNextFoods({ seed: FOOD_SEED, foods: base, progress: p, now: NOW });
    expect(find(before, 'egg-yolk')).toMatchObject({ readiness: 'later' });
    expect(find(before, 'egg-yolk').reasons[0]).toMatch(/after silken tofu or white fish/i);

    const after = rankNextFoods({ seed: FOOD_SEED, foods: [...base, fromSeed('silken-tofu', 5)], progress: p, now: NOW });
    const yolk = find(after, 'egg-yolk');
    expect(yolk.readiness).toBe('now');
    expect(yolk.reasons.join(' ')).toMatch(/not to delay/i);
    expect(after.find((c) => c.readiness === 'now')?.seed.id).toBe('egg-yolk');
  });

  it('should keep white → red → blue-backed fish in order', () => {
    const foods = [fromSeed('okayu-5x', 40), fromSeed('carrot', 35), fromSeed('silken-tofu', 30)];
    const result = rankNextFoods({ seed: FOOD_SEED, foods, progress: progress({ stage: 3, ageStage: 3, ageMonths: 9 }), now: NOW });
    expect(find(result, 'salmon-boiled').reasons[0]).toMatch(/after white fish/i);
    const withCod = rankNextFoods({ seed: FOOD_SEED, foods: [...foods, fromSeed('cod', 10)], progress: progress({ stage: 3, ageStage: 3, ageMonths: 9 }), now: NOW });
    expect(find(withCod, 'salmon-boiled').readiness).toBe('now');
    expect(find(withCod, 'aji-boiled').reasons[0]).toMatch(/after red fish/i);
  });

  it('should wait for the entry food of an allergen', () => {
    const foods = [fromSeed('okayu-5x', 40), fromSeed('carrot', 35), fromSeed('cod', 30)];
    const result = rankNextFoods({ seed: FOOD_SEED, foods, progress: progress(), now: NOW });
    expect(find(result, 'natto').reasons[0]).toMatch(/after silken tofu/i);
  });

  it('should explain a stage that is not reached yet', () => {
    const result = rankNextFoods({ seed: FOOD_SEED, foods: [fromSeed('okayu-10x', 30)], progress: progress({ stage: 1, ageStage: 1, ageMonths: 6, phase: 'proteins' }), now: NOW });
    expect(find(result, 'okayu-5x').reasons[0]).toMatch(/stage 2/i);
  });
});

describe('rankNextFoods — allergen policy', () => {
  it('should route peanut and tree nuts to the paediatrician, never to now', () => {
    const result = rankNextFoods({ seed: FOOD_SEED, foods: [], progress: progress({ stage: 4, ageStage: 4, ageMonths: 14 }), now: NOW });
    for (const id of ['peanut-paste', 'walnut-ground', 'cashew-ground', 'soba-boiled']) {
      expect(find(result, id).readiness, id).toBe('doctor');
    }
    expect(find(result, 'peanut-paste').reasons[0]).toMatch(/paediatrician/i);
  });

  it('should treat an allergen already introduced by the family as a normal food', () => {
    const foods = [fromSeed('peanut-paste', 30)];
    const result = rankNextFoods({ seed: [seed({ id: 'peanut-cookie', allergens: ['peanut'], minStage: 1 })], foods, progress: progress(), now: NOW });
    expect(result[0].readiness).not.toBe('doctor');
  });

  it('should send egg, milk and wheat to the doctor when the baby has eczema', () => {
    const foods = [fromSeed('okayu-10x', 20), fromSeed('carrot', 12), fromSeed('silken-tofu', 5)];
    const p = progress({ ageMonths: 6, ageStage: 1, stage: 1, daysSinceStart: 20, mealsPerDay: 1, eczema: true });
    const yolk = find(rankNextFoods({ seed: FOOD_SEED, foods, progress: p, now: NOW }), 'egg-yolk');
    expect(yolk.readiness).toBe('doctor');
    expect(yolk.reasons[0]).toMatch(/eczema/i);
  });

  it('should space new allergens and say from when', () => {
    const foods = [fromSeed('okayu-5x', 40), fromSeed('silken-tofu', 30), fromSeed('egg-yolk', 1)];
    const result = rankNextFoods({ seed: FOOD_SEED, foods, progress: progress(), now: NOW });
    const yoghurt = find(result, 'plain-yoghurt');
    expect(yoghurt.readiness).toBe('later');
    expect(yoghurt.reasons[0]).toMatch(/between new allergens/i);
  });

  it('should hold back a food sharing an allergen with a suspected food', () => {
    const result = rankNextFoods({ seed: [seed({ id: 'kiwi', allergens: ['kiwi'] })],
      foods: [food({ id: 'mango', name: 'Mango', status: 'suspected', allergens: ['kiwi'] })],
      progress: progress(), now: NOW });
    expect(result[0]).toMatchObject({ readiness: 'held', heldBy: { allergen: 'kiwi', foodName: 'Mango' } });
  });

  it('should ignore an allergen key retired from the labelling list', () => {
    const result = rankNextFoods({ seed: [seed({ id: 'daikon' })],
      foods: [food({ id: 'm', name: 'M', status: 'suspected', allergens: ['matsutake' as never] })],
      progress: progress(), now: NOW });
    expect(result[0].readiness).toBe('now');
  });
});

describe('rankNextFoods — ages, exclusions and order', () => {
  it('should never list unsuggested foods such as honey or water', () => {
    const ids = rankNextFoods({ seed: FOOD_SEED, foods: [], progress: progress({ stage: 4, ageStage: 4, ageMonths: 15 }), now: NOW })
      .map((c) => c.seed.id);
    expect(ids).not.toContain('honey');
    expect(ids).not.toContain('water');
  });

  it('should put squid off until after weaning', () => {
    const result = rankNextFoods({ seed: FOOD_SEED, foods: [], progress: progress({ stage: 4, ageStage: 4, ageMonths: 15 }), now: NOW });
    expect(find(result, 'squid-boiled')).toMatchObject({ readiness: 'later' });
    expect(find(result, 'squid-boiled').reasons[0]).toMatch(/not during weaning/i);
  });

  it('should exclude foods already in the catalog', () => {
    const result = rankNextFoods({ seed: [seed({ id: 'carrot' }), seed({ id: 'daikon' })],
      foods: [food({ id: 'carrot' })], progress: progress(), now: NOW });
    expect(result.map((c) => c.seed.id)).toEqual(['daikon']);
  });

  it('should order now, later, doctor, held', () => {
    const order = { now: 0, later: 1, doctor: 2, held: 3 };
    const result = rankNextFoods({ seed: FOOD_SEED, foods: [fromSeed('okayu-10x', 10)], progress: progress({ stage: 1, phase: 'vegetables' }), now: NOW });
    const ranks = result.map((c) => order[c.readiness]);
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
  });

  it('should nudge iron-rich foods from 6 months without claiming a deficit', () => {
    const result = rankNextFoods({ seed: [
      seed({ id: 'daikon' }),
      seed({ id: 'komatsuna', nutrients: { ...seed({}).nutrients, ironMg: 2.1 } }),
    ], foods: [food({ id: 'carrot' })], progress: progress(), now: NOW });
    expect(result[0].seed.id).toBe('komatsuna');
    expect(result[0].reasons.join(' ')).toMatch(/rich in iron/i);
    expect(result[0].reasons.join(' ')).not.toMatch(/running low/i);
  });

  it('should alternate groups among tied candidates', () => {
    const result = rankNextFoods({ seed: [
      seed({ id: 'a1', group: 'vegetable' }), seed({ id: 'a2', group: 'vegetable' }),
      seed({ id: 'b1', group: 'fruit' }), seed({ id: 'b2', group: 'fruit' }),
    ], foods: [food({ id: 'v', group: 'vegetable' }), food({ id: 'f', group: 'fruit' })], progress: progress(), now: NOW });
    expect(result.map((c) => c.seed.group)).toEqual(['vegetable', 'fruit', 'vegetable', 'fruit']);
  });

  it('should carry the seed note', () => {
    const result = rankNextFoods({ seed: FOOD_SEED, foods: [fromSeed('okayu-10x', 10)], progress: progress({ stage: 1, phase: 'vegetables' }), now: NOW });
    expect(find(result, 'apple').seed.note).toMatch(/cook/i);
  });
});

describe('getPace', () => {
  it('should report a food first tried today', () => {
    const pace = getPace([food({ name: 'Carrot', firstTriedAt: ts(NOW) })], NOW);
    expect(pace.newToday?.name).toBe('Carrot');
  });

  it('should open the next allergen three calendar days after the last', () => {
    const pace = getPace([food({ name: 'Egg yolk', allergens: ['egg'], firstTriedAt: ts(new Date('2026-09-14T18:00:00')) })], NOW);
    expect(pace.lastAllergen?.name).toBe('Egg yolk');
    expect(pace.allergensOpenFrom?.toDateString()).toBe(new Date('2026-09-17T00:00:00').toDateString());
  });

  it('should leave allergens open when the last one is old enough', () => {
    const pace = getPace([food({ allergens: ['egg'], firstTriedAt: ts(subDays(NOW, 3)) })], NOW);
    expect(pace.allergensOpenFrom).toBeNull();
  });

  it('should count an allergen as new only on its first food', () => {
    const pace = getPace([
      food({ id: 'y', allergens: ['egg'], firstTriedAt: ts(subDays(NOW, 10)) }),
      food({ id: 'w', allergens: ['egg'], firstTriedAt: ts(subDays(NOW, 1)) }),
    ], NOW);
    expect(pace.allergensOpenFrom).toBeNull();
  });
});

describe('getAllergenStatus', () => {
  it('should return one row per allergen, all 29', () => {
    expect(getAllergenStatus([], NOW)).toHaveLength(29);
  });

  it('should flag maintenance just past 7 days, not at 7', () => {
    const at = (d: Date) => [food({ allergens: ['egg'], firstTriedAt: ts(subDays(NOW, 30)), lastTriedAt: ts(d) })];
    const egg = (d: Date) => getAllergenStatus(at(d), NOW).find((a) => a.allergen === 'egg');
    expect(egg(subDays(NOW, 7))?.needsMaintenance).toBe(false);
    expect(egg(new Date(subDays(NOW, 7).getTime() - 1000))?.needsMaintenance).toBe(true);
  });

  it('should not flag maintenance for an allergen never introduced', () => {
    expect(getAllergenStatus([], NOW).find((a) => a.allergen === 'egg')?.needsMaintenance).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/utils/next-foods.test.ts`
Expected: FAIL — `getPace` not exported, `progress` not accepted, readiness missing.

- [ ] **Step 3: Implement**

Replace `src/utils/next-foods.ts` with:

```ts
import { addDays, format, isSameDay, startOfDay } from 'date-fns';
import type { Food, FoodGroup, FoodStatus, SeedFood, WeaningStage } from '../types/food';
import { FOOD_GROUPS } from '../types/food';
import type { Allergen } from './allergens';
import { ALLERGENS, allergenLabel, isAllergen, isMandatoryAllergen } from './allergens';
import { isManualStatus } from './food-status';
import type { WeaningProgress } from './weaning-progress';
import { isIntroduced } from './weaning-progress';
import {
  ALLERGEN_ENTRY, ASK_DOCTOR_ALLERGENS, ECZEMA_DOCTOR_ALLERGENS, IRON_RICH_MG, LADDERS,
  MAINTENANCE_GAP_DAYS, NEW_ALLERGEN_SPACING_DAYS, NUTRIENT_NUDGE_FROM_MONTHS, PHASE_GROUPS,
  PUSHED_ALLERGEN, VITAMIN_D_SOURCE_UG,
} from './weaning-rules';

export { MAINTENANCE_GAP_DAYS };

const DAY_MS = 24 * 60 * 60 * 1000;

export type Readiness = 'now' | 'later' | 'doctor' | 'held';

export type NextFoodsInput = {
  seed: readonly SeedFood[];
  foods: Food[];
  progress: WeaningProgress;
  now: Date;
};

export type NextFoodCandidate = {
  seed: SeedFood;
  readiness: Readiness;
  score: number;
  reasons: string[];
  heldBy?: { allergen: Allergen; foodName: string };
};

export type AllergenStatus = {
  allergen: Allergen;
  mandatory: boolean;
  introduced: boolean;
  firstTriedAt?: Date;
  lastTriedAt?: Date;
  exposureCount: number;
  status: FoodStatus;
  needsMaintenance: boolean;
};

export type Pace = {
  /** A food first tried today: the guide's practice is one new food a day. */
  newToday: Food | null;
  lastAllergen: { name: string; at: Date } | null;
  /** When the next new allergen fits; null when one is fine today. */
  allergensOpenFrom: Date | null;
};

const READINESS_ORDER: Record<Readiness, number> = { now: 0, later: 1, doctor: 2, held: 3 };

const STATUS_PRIORITY: readonly FoodStatus[] = [
  'confirmed_allergy', 'avoid', 'suspected', 'watch', 'safe', 'untried',
];

const STAGE_LATER_REASON: Record<WeaningStage, string> = {
  1: '',
  2: 'At stage 2 — tongue-mashable foods, around 7–8 months.',
  3: 'At stage 3 — gum-mashable foods, around 9–11 months.',
  4: 'At stage 4 — around 12–18 months.',
};

const GROUP_NOUN: Record<FoodGroup, string> = {
  grain: 'grain', vegetable: 'vegetable', fruit: 'fruit', protein: 'protein food',
  dairy: 'dairy food', fat: 'fat', other: 'food of its kind',
};

/** Foods whose status should hold back anything sharing their allergen. */
function isBlockingStatus(status: FoodStatus): boolean {
  return status === 'suspected' || isManualStatus(status);
}

function buildHoldBackMap(foods: Food[]): Map<Allergen, string> {
  const map = new Map<Allergen, string>();
  for (const f of foods) {
    if (!isBlockingStatus(f.status)) continue;
    for (const allergen of f.allergens) {
      if (isAllergen(allergen) && !map.has(allergen)) map.set(allergen, f.name);
    }
  }
  return map;
}

function rollupStatus(foods: Food[]): FoodStatus {
  for (const status of STATUS_PRIORITY) {
    if (foods.some((f) => f.status === status)) return status;
  }
  return 'untried';
}

/**
 * Pace informs; it never hides a suggestion. An allergen counts as new on
 * the day its first food was tried.
 */
export function getPace(foods: Food[], now: Date): Pace {
  const tried = foods.filter(isIntroduced);
  const newToday = tried.find((f) => isSameDay(f.firstTriedAt.toDate(), now)) ?? null;

  const firstByAllergen = new Map<Allergen, { name: string; at: Date }>();
  for (const f of tried) {
    const at = f.firstTriedAt.toDate();
    for (const a of f.allergens) {
      if (!isAllergen(a)) continue;
      const current = firstByAllergen.get(a);
      if (!current || at < current.at) firstByAllergen.set(a, { name: f.name, at });
    }
  }
  const lastAllergen = [...firstByAllergen.values()]
    .reduce<{ name: string; at: Date } | null>((latest, x) => (!latest || x.at > latest.at ? x : latest), null);

  const openFrom = lastAllergen ? startOfDay(addDays(lastAllergen.at, NEW_ALLERGEN_SPACING_DAYS)) : null;
  return {
    newToday,
    lastAllergen,
    allergensOpenFrom: openFrom && now < openFrom ? openFrom : null,
  };
}

/** The label of the first prerequisite still missing, or null. */
function missingPrerequisite(
  s: SeedFood,
  introducedIds: Set<string>,
  introducedAllergens: Set<string>,
): string | null {
  for (const rungs of Object.values(LADDERS)) {
    const index = rungs.findIndex((r) => r.ids.includes(s.id));
    if (index <= 0) continue;
    // A later rung already reached satisfies an earlier one.
    const reached = rungs.slice(index - 1).some((r) => r.ids.some((id) => introducedIds.has(id)));
    if (!reached) return rungs[index - 1].label;
  }
  for (const a of s.allergens) {
    const entry = ALLERGEN_ENTRY[a];
    if (entry && !entry.ids.includes(s.id) && !introducedAllergens.has(a)) return entry.label;
  }
  return null;
}

/** +30 reason when the food opens a new rung or group, else null. */
function stepReason(s: SeedFood, introducedIds: Set<string>, introducedGroups: Set<FoodGroup>): string | null {
  const rungs = Object.values(LADDERS)
    .flatMap((ladder) => ladder)
    .filter((r) => r.ids.includes(s.id));
  if (rungs.length > 0) {
    const fresh = rungs.find((r) => !r.ids.some((id) => introducedIds.has(id)));
    return fresh ? `Next step in the guide's order: ${fresh.label}.` : null;
  }
  return introducedGroups.has(s.group) ? null : `First ${GROUP_NOUN[s.group]}.`;
}

/**
 * Ranks the seed foods the family has not logged, following Japanese
 * guidance: 授乳・離乳の支援ガイド 2019 order and stages, JSPACI on allergens.
 * Every food gets one readiness; nothing is dropped except `suggest: false`
 * rows, so a parent always sees the reason and can log it anyway.
 */
export function rankNextFoods({ seed, foods, progress, now }: NextFoodsInput): NextFoodCandidate[] {
  const { stage } = progress;
  if (stage === null) return [];

  const existingIds = new Set(foods.map((f) => f.id));
  const introduced = foods.filter(isIntroduced);
  const introducedIds = new Set(introduced.map((f) => f.id));
  const introducedAllergens = new Set<string>(introduced.flatMap((f) => f.allergens));
  const introducedGroups = new Set(introduced.map((f) => f.group));
  const holdBackMap = buildHoldBackMap(foods);
  const pace = getPace(foods, now);
  const doctorAllergens = new Set<Allergen>([
    ...ASK_DOCTOR_ALLERGENS,
    ...(progress.eczema ? ECZEMA_DOCTOR_ALLERGENS : []),
  ]);
  const openGroups = new Set<FoodGroup>(stage === 1 ? PHASE_GROUPS[progress.phase] : FOOD_GROUPS);

  const groupCounts = Object.fromEntries(FOOD_GROUPS.map((g) => [g, 0])) as Record<FoodGroup, number>;
  for (const f of foods) groupCounts[f.group] += 1;
  const minGroupCount = Math.min(...Object.values(groupCounts));

  const classify = (s: SeedFood): NextFoodCandidate => {
    const waiting = (readiness: Readiness, reason: string): NextFoodCandidate =>
      ({ seed: s, readiness, score: 0, reasons: [reason] });
    const newAllergens = s.allergens.filter((a) => !introducedAllergens.has(a));

    const heldAllergen = s.allergens.find((a) => holdBackMap.has(a));
    if (heldAllergen) {
      const foodName = holdBackMap.get(heldAllergen) as string;
      return {
        ...waiting('held', `Shares ${allergenLabel(heldAllergen)} with ${foodName}, which is flagged.`),
        heldBy: { allergen: heldAllergen, foodName },
      };
    }

    const doctorAllergen = newAllergens.find((a) => doctorAllergens.has(a));
    if (doctorAllergen) {
      const label = allergenLabel(doctorAllergen);
      return waiting('doctor', progress.eczema && ECZEMA_DOCTOR_ALLERGENS.includes(doctorAllergen)
        ? `With eczema, introduce ${label} with your doctor.`
        : `Japanese guidance gives no early-introduction advice for ${label} — decide with your paediatrician.`);
    }

    if (s.minAgeMonths !== undefined && progress.ageMonths < s.minAgeMonths) {
      return waiting('later', s.minAgeMonths > 18
        ? `Not during weaning (from about ${s.minAgeMonths} months).`
        : `From ${s.minAgeMonths} months.`);
    }

    if (!openGroups.has(s.group)) {
      return waiting('later', PHASE_GROUPS.vegetables.includes(s.group)
        ? 'Once vegetables are in (around day 7).'
        : 'Once protein foods start (around day 14).');
    }

    if (s.minStage > stage) return waiting('later', STAGE_LATER_REASON[s.minStage]);

    const missing = missingPrerequisite(s, introducedIds, introducedAllergens);
    if (missing) return waiting('later', `After ${missing}.`);

    if (newAllergens.length > 0 && pace.allergensOpenFrom && pace.lastAllergen) {
      return waiting('later',
        `From ${format(pace.allergensOpenFrom, 'EEE d MMM')} — a few days between new allergens (last: ${pace.lastAllergen.name}).`);
    }

    const reasons: string[] = [];
    let score = 0;
    if (s.allergens.includes(PUSHED_ALLERGEN) && !introducedAllergens.has(PUSHED_ALLERGEN)) {
      score += 40;
      reasons.push('Egg is the one allergen Japanese guidance says not to delay — well cooked, a tiny amount first.');
    }
    const step = stepReason(s, introducedIds, introducedGroups);
    if (step) {
      score += 30;
      reasons.push(step);
    }
    if (progress.ageMonths >= NUTRIENT_NUDGE_FROM_MONTHS && s.nutrients.ironMg >= IRON_RICH_MG) {
      score += 20;
      reasons.push('Rich in iron — the guide asks for iron-rich foods from about 6 months.');
    }
    if (progress.ageMonths >= NUTRIENT_NUDGE_FROM_MONTHS && s.nutrients.vitaminDUg >= VITAMIN_D_SOURCE_UG) {
      score += 10;
      reasons.push('A source of vitamin D, which breastfed babies can run short of.');
    }
    if (groupCounts[s.group] === minGroupCount) {
      score += 20;
      reasons.push(`Adds variety — ${s.group} is the least-represented group so far.`);
    }
    if (s.minStage === stage) {
      score += 5;
      reasons.push('Made for this stage.');
    }
    if (newAllergens.length > 1) {
      reasons.push(`Carries ${newAllergens.length} new allergens — harder to attribute a reaction if one occurs.`);
    }
    if (newAllergens.length > 0) {
      reasons.push('Give it on a weekday morning, when a clinic is open.');
    }
    return { seed: s, readiness: 'now', score, reasons };
  };

  const candidates = seed
    .filter((s) => s.suggest !== false && !existingIds.has(s.id))
    .map(classify)
    .sort((a, b) => READINESS_ORDER[a.readiness] - READINESS_ORDER[b.readiness] || b.score - a.score);

  return spreadGroups(candidates);
}

/** Two candidates the sort could not separate, so we are free to reorder them. */
function isTied(a: NextFoodCandidate, b: NextFoodCandidate): boolean {
  return a.score === b.score && a.readiness === b.readiness;
}

/**
 * Within a block of tied candidates, take the first whose group differs from
 * the one just placed; no candidate ever overtakes a higher-ranked one.
 */
function spreadGroups(sorted: NextFoodCandidate[]): NextFoodCandidate[] {
  const remaining = [...sorted];
  const out: NextFoodCandidate[] = [];
  let lastGroup: FoodGroup | null = null;

  while (remaining.length > 0) {
    const index = remaining.findIndex(
      (c) => isTied(c, remaining[0]) && c.seed.group !== lastGroup,
    );
    const [picked] = remaining.splice(index === -1 ? 0 : index, 1);
    out.push(picked);
    lastGroup = picked.seed.group;
  }

  return out;
}

/**
 * Per-allergen status across the whole catalog, for the maintenance
 * checklist. `needsMaintenance` only ever applies to an allergen that has
 * actually been introduced — never-tried is "not started", not "lapsed".
 */
export function getAllergenStatus(foods: Food[], now: Date): AllergenStatus[] {
  return ALLERGENS.map((allergen) => {
    const relevant = foods.filter((f) => f.allergens.includes(allergen));
    const triedFoods = relevant.filter(isIntroduced);
    const introduced = triedFoods.length > 0;

    const firstTriedAt = introduced
      ? new Date(Math.min(...triedFoods.map((f) => f.firstTriedAt.toDate().getTime())))
      : undefined;
    const lastTriedAt = introduced
      ? new Date(Math.max(...triedFoods.map((f) => (f.lastTriedAt ?? f.firstTriedAt).toDate().getTime())))
      : undefined;

    const needsMaintenance =
      introduced && lastTriedAt !== undefined && now.getTime() - lastTriedAt.getTime() > MAINTENANCE_GAP_DAYS * DAY_MS;

    return {
      allergen,
      mandatory: isMandatoryAllergen(allergen),
      introduced,
      firstTriedAt,
      lastTriedAt,
      exposureCount: relevant.reduce((sum, f) => sum + f.exposureCount, 0),
      status: rollupStatus(relevant),
      needsMaintenance,
    };
  });
}
```

`src/components/AllergenGrid.tsx:6`: `import { MAINTENANCE_GAP_DAYS } from '../utils/weaning-rules';`

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/utils/next-foods.test.ts`
Expected: PASS.

---

### Task 6: Baby fields, rules and Settings

**Files:**
- Modify: `src/types/events.ts` (`Baby`), `src/services/family.ts` (`updateBaby` type, `setWeaningStartedAt`)
- Modify: `firestore.rules` (baby create/update), `specs/data-model.md`
- Modify: `src/pages/SettingsPage.tsx`, `src/pages/SettingsPage.test.tsx`

**Interfaces:**
- Consumes: `deriveWeaningStart` (Task 4), `useFoods` (already used by Settings).
- Produces: `Baby.weaningStartedAt?: Timestamp`, `Baby.eczema?: boolean`, `setWeaningStartedAt(familyId: string, babyId: string, date: Date | null): Promise<void>`.

- [ ] **Step 1: Write the failing tests**

`src/pages/SettingsPage.test.tsx` — extend the service mock and add a `useFoods` mock at the top:

```ts
const mockSetWeaningStartedAt = vi.fn();

vi.mock('../services/family', () => ({
  updateBaby: (...args: unknown[]) => mockUpdateBaby(...args),
  setWeaningStartedAt: (...args: unknown[]) => mockSetWeaningStartedAt(...args),
}));
```

(Keep the existing mocks for `useFoods` / `useRangeEvents` if the file already has them; if it does not, add `vi.mock('../hooks/useFoods', () => ({ useFoods: () => ({ foods: [], loading: false, fromCache: false, hasPendingWrites: false }) }))`.)

Tests:

```ts
  it('should write the eczema setting straight through', async () => {
    const user = userEvent.setup();
    render(<SettingsPage {...baseProps} baby={makeBaby()} />);
    await user.click(screen.getByRole('checkbox', { name: /eczema/i }));
    expect(mockUpdateBaby).toHaveBeenCalledWith('fam-1', 'baby-1', { eczema: true });
  });

  it('should reflect a stored eczema flag', () => {
    render(<SettingsPage {...baseProps} baby={makeBaby({ eczema: true })} />);
    expect(screen.getByRole('checkbox', { name: /eczema/i })).toBeChecked();
  });

  it('should save the date solids started', async () => {
    const { fireEvent } = await import('@testing-library/react');
    render(<SettingsPage {...baseProps} baby={makeBaby()} />);
    fireEvent.change(screen.getByLabelText(/solids started/i), { target: { value: '2026-09-01' } });
    expect(mockSetWeaningStartedAt).toHaveBeenCalledWith('fam-1', 'baby-1', new Date(2026, 8, 1));
  });

  it('should clear the start date back to the first logged food', async () => {
    const user = userEvent.setup();
    render(<SettingsPage {...baseProps} baby={makeBaby({ weaningStartedAt: Timestamp.fromDate(new Date(2026, 8, 1)) })} />);
    expect(screen.getByLabelText(/solids started/i)).toHaveValue('2026-09-01');
    await user.click(screen.getByRole('button', { name: /use first logged food/i }));
    expect(mockSetWeaningStartedAt).toHaveBeenCalledWith('fam-1', 'baby-1', null);
  });
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/pages/SettingsPage.test.tsx`
Expected: FAIL — no eczema checkbox, no date field.

- [ ] **Step 3: Implement**

`src/types/events.ts`, in `Baby` after `hiddenEventTypes`:

```ts
  /** Set in Settings when solids started before logging; absent = first logged solid food. */
  weaningStartedAt?: Timestamp;
  /** Eczema or atopic dermatitis: allergens are introduced with a doctor. */
  eczema?: boolean;
```

`src/services/family.ts`:

```ts
export async function updateBaby(
  familyId: string,
  babyId: string,
  data: Partial<Pick<Baby, 'firstName' | 'sex' | 'hiddenEventTypes' | 'eczema'>>,
) {
  return updateDoc(doc(db, 'families', familyId, 'babies', babyId), data);
}

/** `null` deletes the field, so the start date is derived from the log again. */
export async function setWeaningStartedAt(familyId: string, babyId: string, date: Date | null) {
  return updateDoc(doc(db, 'families', familyId, 'babies', babyId), {
    weaningStartedAt: date ? Timestamp.fromDate(date) : deleteField(),
  });
}
```

(add `deleteField` to the `firebase/firestore` import).

`firestore.rules`, next to `hasValidHiddenEventTypes()`:

```
    // Helper: optional weaning fields on a baby. Absent means "derive the
    // start from the log" and "no eczema".
    function hasValidWeaningFields() {
      let data = request.resource.data;
      return (!('weaningStartedAt' in data) || data.weaningStartedAt is timestamp)
        && (!('eczema' in data) || data.eczema is bool);
    }
```

and append `&& hasValidWeaningFields()` to both the baby `allow create` and `allow update` conditions.

`src/pages/SettingsPage.tsx` — imports `parse` from date-fns, `setWeaningStartedAt`, `deriveWeaningStart`; state and handlers:

```ts
  const derivedStart = useMemo(() => deriveWeaningStart(foods), [foods]);
  const storedStart = baby?.weaningStartedAt?.toDate() ?? null;
  const [weaningError, setWeaningError] = useState('');

  async function saveWeaning(write: () => Promise<unknown>) {
    setWeaningError('');
    try {
      await write();
    } catch {
      setWeaningError('Could not save. Please try again.');
    }
  }

  function changeStart(value: string) {
    if (!value) return;
    const date = parse(value, 'yyyy-MM-dd', new Date());
    if (Number.isNaN(date.getTime())) return;
    void saveWeaning(() => setWeaningStartedAt(familyId, babyId, date));
  }
```

JSX — a new section after "Baby Profile":

```tsx
      {/* ─── Solids ─── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Salad size={20} className={styles.sectionIcon} />
          Solids
        </h2>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="weaning-start">Solids started</label>
          <input
            id="weaning-start"
            type="date"
            value={storedStart ? format(storedStart, 'yyyy-MM-dd') : ''}
            onChange={(e) => changeStart(e.target.value)}
          />
        </div>
        <p className={styles.hint}>
          {storedStart
            ? 'Set by hand. Suggestions count days from this date.'
            : derivedStart
              ? `Taken from the first logged food (${format(derivedStart, 'd MMM yyyy')}). Set it if you started before logging.`
              : 'Taken from the first logged food once there is one.'}
        </p>
        {storedStart && (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => void saveWeaning(() => setWeaningStartedAt(familyId, babyId, null))}
            >
              Use first logged food
            </button>
          </div>
        )}
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={baby?.eczema ?? false}
            onChange={(e) => void saveWeaning(() => updateBaby(familyId, babyId, { eczema: e.target.checked }))}
          />
          <span className={styles.checkLabel}>Eczema or atopic dermatitis</span>
        </label>
        <p className={styles.hint}>
          Japanese guidance: get eczema under control first, and introduce egg, milk
          and wheat with your doctor.
        </p>
        {weaningError && (
          <div className={styles.error}>
            <AlertCircle size={16} />
            <span>{weaningError}</span>
          </div>
        )}
      </div>
```

Add `Salad` to the lucide import. If `.secondaryBtn` does not exist in `SettingsPage.module.css`, add:

```css
.secondaryBtn {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-full);
  border: var(--space-micro) solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 600;
}
```

`specs/data-model.md` `Baby` interface: add `hiddenEventTypes?: EventType[];`, `weaningStartedAt?: Timestamp; // absent = first logged solid food` and `eczema?: boolean;`.

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/pages/SettingsPage.test.tsx`
Expected: PASS.

---

### Task 7: Food page — progress, hero, grouped options

**Files:**
- Modify: `src/pages/FoodPage.tsx`, `src/pages/FoodPage.module.css`, `src/pages/FoodPage.test.tsx`
- Modify: `docs/superpowers/specs/2026-09-01-food-diversification-design.md` (§8 superseded line)

**Interfaces:**
- Consumes: `getWeaningProgress`, `rankNextFoods`, `getPace`, `NextFoodCandidate`, `Readiness`.

- [ ] **Step 1: Write the failing tests**

In `src/pages/FoodPage.test.tsx` replace `'should show a hold card with a date inside the 3-day window'` and add:

```ts
  it('should keep suggesting on a day a new food was already tried', async () => {
    withFoods([makeFood({ id: 'okayu-10x', name: 'Okayu', group: 'grain',
      firstTriedAt: Timestamp.fromDate(new Date()) })]);
    render(<FoodPage {...props} />);
    expect(await screen.findByText(/already tried something new today/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log it/i })).toBeInTheDocument();
  });

  it('should start a baby who has not started on rice porridge', async () => {
    withFoods([]);
    render(<FoodPage {...props} />);
    expect(await screen.findByText(/Okayu, 10:1/)).toBeInTheDocument();
  });

  it('should not put egg, wheat or dairy first one week into weaning', async () => {
    const daysAgo = (n: number) => Timestamp.fromDate(new Date(Date.now() - n * 86_400_000));
    withFoods([
      makeFood({ id: 'okayu-10x', name: 'Okayu', group: 'grain', firstTriedAt: daysAgo(7) }),
      makeFood({ id: 'carrot', name: 'Carrot', group: 'vegetable', firstTriedAt: daysAgo(2) }),
    ]);
    render(<FoodPage {...props} />);
    expect(await screen.findByText(/try next/i)).toBeInTheDocument();
    const hero = screen.getByTestId('hero-food');
    expect(hero.textContent).not.toMatch(/egg|udon|yoghurt|peanut|bread|milk/i);
  });

  it('should list foods for the paediatrician separately', async () => {
    const user = userEvent.setup();
    withFoods([]);
    render(<FoodPage {...props} />);
    await user.click(await screen.findByRole('button', { name: /other options/i }));
    expect(screen.getByRole('heading', { name: /with your paediatrician/i })).toBeInTheDocument();
  });

  it('should say which stage and day of solids the baby is on', async () => {
    const daysAgo = (n: number) => Timestamp.fromDate(new Date(Date.now() - n * 86_400_000));
    withFoods([makeFood({ id: 'okayu-10x', name: 'Okayu', group: 'grain', firstTriedAt: daysAgo(7) })]);
    render(<FoodPage {...props} />);
    expect(await screen.findByText(/Stage 1 · 初期 .*day 8 of solids/)).toBeInTheDocument();
  });
```

and update `'should render 28 allergen tokens'` → 29 (if not done in Task 1).

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/pages/FoodPage.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

In `FoodPage.tsx`:
- Remove imports `mealNutrients`, `getIntroductionWindow`, `getWeaningStage`; remove `recentStart`, `recentNutrients`, `introWindow`, `RECENT_DAYS` if unused.
- Add:

```ts
import { getWeaningProgress } from '../utils/weaning-progress';
import { rankNextFoods, getPace, getAllergenStatus } from '../utils/next-foods';
import type { AllergenStatus, NextFoodCandidate, Readiness } from '../utils/next-foods';

  const progress = useMemo(
    () => (baby ? getWeaningProgress({
      birthDate: baby.birthDate.toDate(),
      weaningStartedAt: baby.weaningStartedAt?.toDate(),
      eczema: baby.eczema,
      foods,
      now: today,
    }) : null),
    [baby, foods, today],
  );
  const stage = progress?.stage ?? null;
  const pace = useMemo(() => getPace(foods, today), [foods, today]);

  const candidates = useMemo(
    () => (progress ? rankNextFoods({ seed: FOOD_SEED, foods, progress, now: today }) : []),
    [foods, progress, today],
  );

  const hero = candidates.find((c) => c.readiness === 'now') ?? null;
  const rest = candidates.filter((c) => c !== hero);
  const byReadiness = (r: Readiness) => rest.filter((c) => c.readiness === r);
  const optionGroups: { readiness: Readiness; title: string; items: NextFoodCandidate[]; limit: number }[] = [
    { readiness: 'now', title: 'Also fine now', items: byReadiness('now'), limit: OPTION_LIMIT },
    { readiness: 'later', title: 'Later', items: byReadiness('later'), limit: OPTION_LIMIT },
    { readiness: 'doctor', title: 'With your paediatrician', items: byReadiness('doctor'), limit: Infinity },
    { readiness: 'held', title: 'Held back', items: byReadiness('held'), limit: OPTION_LIMIT },
  ];
```

- Subtitle:

```tsx
          {baby && (
            <p className={styles.subtitle}>
              {formatBabyAge(baby.birthDate.toDate())}
              {stage ? ` — ${STAGE_LABELS[stage]}` : ''}
              {stage && progress?.daysSinceStart != null ? ` · day ${progress.daysSinceStart + 1} of solids` : ''}
            </p>
          )}
```

- Hero:

```tsx
      <section className={styles.hero}>
        {!stage ? (
          <>
            <span className={styles.kicker}>Not yet</span>
            <p className={styles.heroName}>Weaning normally starts around 5 months</p>
            <p className={styles.heroNote}>Suggestions appear once the first stage begins.</p>
          </>
        ) : hero ? (
          <>
            <span className={styles.kicker}>{pace.newToday ? 'Tomorrow' : 'Try next'}</span>
            {pace.newToday && (
              <p className={styles.heroNote}>
                Already tried something new today ({pace.newToday.name}) — one new food a day.
              </p>
            )}
            {!progress?.startedAt && (
              <p className={styles.heroNote}>
                Start when the baby sits with support and shows interest in food: one spoon a day.
              </p>
            )}
            <div className={styles.heroRow}>
              <p className={styles.heroName} data-testid="hero-food">{hero.seed.name}</p>
              <button type="button" className={styles.logBtn} onClick={() => setLogTarget(hero.seed)}>
                Log it
              </button>
            </div>
            <ul className={styles.reasons}>
              {hero.reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
            {hero.seed.note && <p className={styles.caution}>{hero.seed.note}</p>}
          </>
        ) : (
          <>
            <span className={styles.kicker}>Nothing clear</span>
            <p className={styles.heroName}>Nothing to suggest right now</p>
            <p className={styles.heroNote}>Every option is listed below with its reason.</p>
          </>
        )}

        {stage && rest.length > 0 && (
          <>
            <button type="button" className={styles.disclosure} aria-expanded={showOptions}
              onClick={() => setShowOptions((v) => !v)}>
              Other options
              <ChevronDown size={16} className={showOptions ? styles.chevronOpen : ''} />
            </button>
            {showOptions && optionGroups.filter((g) => g.items.length > 0).map((g) => (
              <div key={g.readiness} className={styles.optionGroup}>
                <h3 className={styles.optionsHeading}>{g.title}</h3>
                <ul className={styles.options}>
                  {g.items.slice(0, g.limit).map((c) => (
                    <OptionRow key={c.seed.id} candidate={c} onSelect={setLogTarget} />
                  ))}
                  {g.items.length > g.limit && (
                    <li className={styles.moreHeld}>+{g.items.length - g.limit} more</li>
                  )}
                </ul>
              </div>
            ))}
          </>
        )}
      </section>
```

- `OptionRow`:

```tsx
const READINESS_CLASS: Record<Readiness, string> = {
  now: '', later: styles.later, doctor: styles.doctor, held: styles.held,
};

function OptionRow({ candidate, onSelect }: OptionRowProps) {
  const { seed, reasons, heldBy, readiness } = candidate;
  return (
    <li>
      <button type="button" className={`${styles.option} ${READINESS_CLASS[readiness]}`} onClick={() => onSelect(seed)}>
        <span className={styles.optionName}>{seed.name}</span>
        <span className={styles.optionReason}>
          {heldBy ? `Held back — ${reasons[0]}` : reasons[0] ?? 'Allowed at the current stage.'}
        </span>
        {seed.note && <span className={styles.optionNote}>{seed.note}</span>}
      </button>
    </li>
  );
}
```

`FoodPage.module.css` additions:

```css
.caution,
.optionNote {
  font-size: var(--font-size-2xs);
  color: var(--color-feeding);
}

.optionGroup {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.optionsHeading {
  font-size: var(--font-size-2xs);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  padding-top: var(--space-xs);
}

.later .optionName,
.doctor .optionName {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.doctor .optionReason {
  color: var(--color-primary);
}
```

`docs/superpowers/specs/2026-09-01-food-diversification-design.md` §8 heading: add the line `> Superseded by 2026-09-15-weaning-guidance-design.md §4–5.`

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/pages/FoodPage.test.tsx`
Expected: PASS.

---

### Task 8: Coop Okinawa buy hints and the weekly shopping list

**Files:**
- Create: `src/data/coop-okinawa.ts`, `src/data/coop-okinawa.test.ts`
- Create: `src/utils/shopping-list.ts`, `src/utils/shopping-list.test.ts`
- Create: `src/components/ShoppingList.tsx`, `src/components/ShoppingList.module.css`, `src/components/ShoppingList.test.tsx`
- Modify: `src/pages/FoodPage.tsx` (disclosure), `src/pages/FoodPage.test.tsx`

**Interfaces:**
- Consumes: `rankNextFoods`, `getAllergenStatus`, `WeaningProgress`, `isIntroduced`, `PHASE_GROUPS`, `NEW_ALLERGEN_SPACING_DAYS`, `NON_SOLID_IDS`, `LADDERS`.
- Produces:
  - `type BuyHint = { kind: 'coop'; product: string; packGrams?: number; leadWeeks: 1 | 2 } | { kind: 'local'; name: string; months: readonly number[] } | { kind: 'store' }`
  - `COOP_OKINAWA: Record<string, readonly BuyHint[]>`, `pickBuyHint(foodId: string, month: number): BuyHint`
  - `ShoppingLine`, `ShoppingList`, `buildShoppingList(input: { progress: WeaningProgress; foods: Food[]; seed: readonly SeedFood[]; now: Date }): ShoppingList | null`
  - `<ShoppingList list={ShoppingList} />`

- [ ] **Step 1: Write the failing data test**

`src/data/coop-okinawa.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { FOOD_SEED } from './food-seed';
import { COOP_OKINAWA, pickBuyHint } from './coop-okinawa';

describe('coop-okinawa', () => {
  it('should only map foods that exist in the seed', () => {
    const ids = new Set(FOOD_SEED.map((f) => f.id));
    for (const id of Object.keys(COOP_OKINAWA)) expect(ids.has(id), id).toBe(true);
  });

  it('should use real months', () => {
    for (const [id, hints] of Object.entries(COOP_OKINAWA)) {
      for (const h of hints) {
        if (h.kind === 'local') for (const m of h.months) expect(m >= 1 && m <= 12, id).toBe(true);
      }
    }
  });

  it('should prefer the local island carrot in season and fall back to frozen', () => {
    expect(pickBuyHint('carrot', 11)).toMatchObject({ kind: 'local', name: '島にんじん' });
    expect(pickBuyHint('carrot', 9)).toMatchObject({ kind: 'coop' });
  });

  it('should send an unmapped food to the store', () => {
    expect(pickBuyHint('daikon-boiled', 9)).toEqual({ kind: 'store' });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/data/coop-okinawa.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hints**

```ts
/**
 * Where a family in Okinawa can buy each food. Coop products are from
 * すくすくスマイル 2026年6月号 (Coop Okinawa edition) and あっぷる 611; the range
 * rotates, so product names are hints, not a catalogue — no numbers or prices.
 * CO-OP brand items arrive the week after ordering; other brands in
 * すくすくスマイル take two weeks. Seasons: くゎっちーおきなわ, JAおきなわ.
 * Evidence: docs/superpowers/specs/2026-09-15-weaning-guidance-research/coop-okinawa.md
 */
export type BuyHint =
  | { kind: 'coop'; product: string; packGrams?: number; leadWeeks: 1 | 2 }
  | { kind: 'local'; name: string; months: readonly number[] }
  | { kind: 'store' };

const ALL_YEAR = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const coop = (product: string, packGrams?: number, leadWeeks: 1 | 2 = 1): BuyHint =>
  ({ kind: 'coop', product, packGrams, leadWeeks });
const local = (name: string, months: readonly number[] = ALL_YEAR): BuyHint =>
  ({ kind: 'local', name, months });

const WHITE_OKAYU = coop('CO-OP きらきらステップ 白かゆ (8倍がゆ)', 260);

export const COOP_OKINAWA: Record<string, readonly BuyHint[]> = {
  'okayu-10x': [WHITE_OKAYU],
  'okayu-8x': [WHITE_OKAYU],
  carrot: [local('島にんじん', [10, 11, 12, 1, 2, 3]), coop('CO-OP 北海道のうらごしにんじん', 310)],
  kabocha: [local('島かぼちゃ', [10, 11, 12, 1, 2, 3, 4, 5, 6]), coop('CO-OP 北海道のうらごしかぼちゃ', 280)],
  spinach: [coop('CO-OP 九州のうらごしほうれん草', 120)],
  'broccoli-boiled': [coop('CO-OP 北海道のうらごしブロッコリー', 150)],
  'edamame-boiled': [coop('CO-OP 北海道のうらごし枝豆', 120)],
  'sweet-potato': [coop('ジーピーフーズ さつまいものうらごし', 240, 2)],
  'potato-boiled': [coop('パイオニアフーズ うらごしポテト', 400, 2)],
  'sweetcorn-boiled': [coop('ノースイ うらごしコーン', 200, 2)],
  'komatsuna-boiled': [coop('JAフーズみやざき こまつな 小さめカット', 180, 2)],
  'udon-boiled': [coop('CO-OP きらきらステップ やわらかいミニうどん', 480)],
  natto: [coop('CO-OP 国産大豆で作った納豆ペースト', 120)],
  'hikiwari-natto': [coop('CO-OP 国産大豆で作った納豆ペースト', 120)],
  cod: [coop('CO-OP 北海道産白身魚のほぐし身', 60)],
  shirasu: [coop('CO-OP 食塩不使用ふっくらしらす干し', 60)],
  shirasuboshi: [coop('CO-OP 食塩不使用ふっくらしらす干し', 60)],
  'silken-tofu': [coop('CO-OP 国産大豆カット絹とうふ', 360)],
  'salmon-boiled': [coop('松岡水産 小さめダイスカット秋鮭', 80, 2)],
  'chicken-sasami-boiled': [coop('いなば とりささみフレーク 食塩無添加', 210, 2)],
  'tuna-canned-water': [coop('いなば ライトツナフレーク 食塩・オイル無添加', 210, 2)],
  'beni-imo': [local('紅いも', [8, 9, 10, 11, 12, 1])],
  'togan-boiled': [local('シブイ')],
  banana: [local('島バナナ', [6, 7, 8, 9, 10])],
  'ta-imo': [local('田芋', [12, 1, 2, 3, 4])],
  'shima-dofu': [local('島豆腐')],
  'yushi-dofu': [local('ゆし豆腐')],
  'mozuku-desalted': [local('もずく (unseasoned)')],
  'tuna-boiled': [local('マグロ, very fresh')],
  'katsuo-boiled': [local('カツオ, very fresh')],
};

/** The first hint available that month; a local food out of season falls through. */
export function pickBuyHint(foodId: string, month: number): BuyHint {
  const hints = COOP_OKINAWA[foodId] ?? [];
  return hints.find((h) => h.kind !== 'local' || h.months.includes(month)) ?? { kind: 'store' };
}
```

- [ ] **Step 4: Run the data test**

Run: `npx vitest run src/data/coop-okinawa.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing shopping-list tests**

`src/utils/shopping-list.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { subDays } from 'date-fns';
import { buildShoppingList } from './shopping-list';
import type { WeaningProgress } from './weaning-progress';
import { FOOD_SEED } from '../data/food-seed';
import type { Food } from '../types/food';

const NOW = new Date('2026-09-15T09:00:00');
const fromSeed = (id: string, daysAgo: number, over: Partial<Food> = {}): Food => {
  const s = FOOD_SEED.find((f) => f.id === id);
  if (!s) throw new Error(id);
  return { id, name: s.name, group: s.group, allergens: [...s.allergens], gramsPerTsp: 5,
    minStage: s.minStage, status: 'untried', usageCount: 5, exposureCount: 5, reactionEventIds: [],
    nutrientSource: 'seed', firstTriedAt: Timestamp.fromDate(subDays(NOW, daysAgo)),
    lastTriedAt: Timestamp.fromDate(subDays(NOW, 1)), ...over };
};
const progress = (over: Partial<WeaningProgress> = {}): WeaningProgress => ({
  ageMonths: 8, ageStage: 2, startedAt: subDays(NOW, 40), daysSinceStart: 47,
  phase: 'proteins', stage: 2, mealsPerDay: 2, eczema: false, ...over,
});
const build = (p: WeaningProgress, foods: Food[], now = NOW) =>
  buildShoppingList({ progress: p, foods, seed: FOOD_SEED, now });

describe('buildShoppingList', () => {
  it('should return nothing before 5 months', () => {
    expect(build(progress({ stage: null, ageStage: null, ageMonths: 4 }), [])).toBeNull();
  });

  it('should list only porridge for a baby about to start', () => {
    const list = build(progress({ ageMonths: 6, ageStage: 1, stage: 1, phase: 'porridge', startedAt: null, daysSinceStart: null, mealsPerDay: 1 }), []);
    expect(list?.vegFruit).toEqual([]);
    expect(list?.protein).toEqual([]);
    expect(list?.grain.map((l) => l.foodId)).toEqual(['okayu-10x']);
    expect(list?.grain[0]).toMatchObject({ reason: 'new', grams: 210, packs: 1 });
    expect(list?.grain[0].buy).toMatchObject({ kind: 'coop' });
  });

  it('should size a stage-2 staple grain from the guide portion', () => {
    const foods = [fromSeed('okayu-5x', 40), fromSeed('carrot', 30), fromSeed('silken-tofu', 20)];
    const list = build(progress(), foods);
    expect(list?.grain.find((l) => l.reason === 'staple')).toMatchObject({ foodId: 'okayu-5x', grams: 1120 });
  });

  it('should split protein meals across kinds, never summing portions', () => {
    const foods = [fromSeed('okayu-5x', 40), fromSeed('carrot', 30), fromSeed('silken-tofu', 20), fromSeed('cod', 15)];
    const list = build(progress(), foods);
    const staples = list?.protein.filter((l) => l.reason === 'staple') ?? [];
    expect(staples.find((l) => l.foodId === 'silken-tofu')?.grams).toBe(280); // 7 meals × 40 g
    expect(staples.find((l) => l.foodId === 'cod')?.grams).toBe(110);         // 7 meals × 15 g, rounded up
  });

  it('should plan at most one new food a day and space new allergens', () => {
    const foods = [fromSeed('okayu-5x', 40), fromSeed('carrot', 30), fromSeed('silken-tofu', 20), fromSeed('cod', 15)];
    const list = build(progress(), foods);
    const fresh = [...(list?.grain ?? []), ...(list?.vegFruit ?? []), ...(list?.protein ?? [])].filter((l) => l.reason === 'new');
    expect(fresh.length).toBeLessThanOrEqual(7);
    const withAllergen = fresh.filter((l) => FOOD_SEED.find((s) => s.id === l.foodId)?.allergens.length);
    expect(withAllergen.length).toBeLessThanOrEqual(3);
  });

  it('should add a portion for an allergen not eaten this week', () => {
    const foods = [fromSeed('okayu-5x', 40), fromSeed('silken-tofu', 30),
      fromSeed('egg-yolk', 25, { lastTriedAt: Timestamp.fromDate(subDays(NOW, 10)), usageCount: 1 }),
      fromSeed('cod', 20, { usageCount: 9 }), fromSeed('salmon-boiled', 18, { usageCount: 9 }),
      fromSeed('plain-yoghurt', 16, { usageCount: 9 }), fromSeed('chicken-sasami-boiled', 14, { usageCount: 9 })];
    const list = build(progress(), foods);
    expect(list?.protein.find((l) => l.foodId === 'egg-yolk')).toMatchObject({ reason: 'maintenance', eggs: 1 });
  });

  it('should buy the island carrot in November and the frozen purée in September', () => {
    const foods = [fromSeed('okayu-5x', 40), fromSeed('carrot', 30, { usageCount: 20 })];
    const sept = build(progress(), foods)?.vegFruit.find((l) => l.foodId === 'carrot');
    const nov = build(progress(), foods, new Date('2026-11-10T09:00:00'))?.vegFruit.find((l) => l.foodId === 'carrot');
    expect(sept?.buy).toMatchObject({ kind: 'coop' });
    expect(nov?.buy).toMatchObject({ kind: 'local', name: '島にんじん' });
  });

  it('should carry the preparation note', () => {
    const foods = [fromSeed('okayu-5x', 40), fromSeed('shirasu', 30), fromSeed('carrot', 30)];
    expect(build(progress(), foods)?.protein.find((l) => l.foodId === 'shirasu')?.note).toMatch(/desalt/i);
  });
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `npx vitest run src/utils/shopping-list.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 7: Implement the list**

`src/utils/shopping-list.ts`:

```ts
import { addDays } from 'date-fns';
import type { Food, FoodGroup, SeedFood, WeaningStage } from '../types/food';
import { FOOD_GROUPS } from '../types/food';
import type { BuyHint } from '../data/coop-okinawa';
import { pickBuyHint } from '../data/coop-okinawa';
import { getAllergenStatus, rankNextFoods } from './next-foods';
import type { WeaningProgress } from './weaning-progress';
import { isIntroduced } from './weaning-progress';
import { LADDERS, NEW_ALLERGEN_SPACING_DAYS, NON_SOLID_IDS, PHASE_GROUPS } from './weaning-rules';

export type Slot = 'grain' | 'vegFruit' | 'protein';
type ProteinKind = 'fish' | 'meat' | 'tofu' | 'egg' | 'dairy';

export interface ShoppingLine {
  foodId: string;
  name: string;
  reason: 'staple' | 'new' | 'maintenance';
  /** For the whole week, rounded up to 10 g. */
  grams?: number;
  eggs?: number;
  packs?: number;
  buy: BuyHint;
  note?: string;
}

export interface ShoppingList {
  from: Date;
  to: Date;
  stage: WeaningStage;
  mealsPerDay: 1 | 2 | 3;
  grain: ShoppingLine[];
  vegFruit: ShoppingLine[];
  protein: ShoppingLine[];
}

/**
 * Upper bound of each 1回当たりの目安量 range (授乳・離乳の支援ガイド p.34). Stage 1
 * has no grams in the guide: 那覇市's end-of-month-one amounts. Protein rows are
 * alternatives (「又は」) — one per meal, never summed. `egg` is eggs per meal;
 * stage 1 buys one egg for the week (yolk only).
 */
const PORTIONS: Record<WeaningStage, Record<'grain' | 'vegFruit' | ProteinKind, number>> = {
  1: { grain: 30, vegFruit: 15, fish: 10, meat: 10, tofu: 10, egg: 0, dairy: 0 },
  2: { grain: 80, vegFruit: 30, fish: 15, meat: 15, tofu: 40, egg: 1 / 3, dairy: 70 },
  3: { grain: 90, vegFruit: 40, fish: 15, meat: 15, tofu: 45, egg: 1 / 2, dairy: 80 },
  4: { grain: 90, vegFruit: 50, fish: 20, meat: 20, tofu: 55, egg: 2 / 3, dairy: 100 },
};

const FIRST_TASTE_GRAMS = 15;
const DAYS = 7;
const VEG_FRUIT_STAPLES = 4;
const PROTEIN_KINDS = 3;
const LEGUME_IDS = new Set(['chickpeas-boiled', 'lentils-boiled', 'azuki-boiled', 'kidney-beans-boiled']);
const MEAT_IDS = new Set(LADDERS.meat.flatMap((r) => r.ids));

const roundUp10 = (g: number) => Math.ceil(g / 10) * 10;

function slotOf(group: FoodGroup): Slot | null {
  if (group === 'grain') return 'grain';
  if (group === 'vegetable' || group === 'fruit') return 'vegFruit';
  if (group === 'protein' || group === 'dairy') return 'protein';
  return null;
}

function proteinKind(food: Pick<Food, 'id' | 'group' | 'allergens'>): ProteinKind {
  if (food.group === 'dairy') return 'dairy';
  if (food.allergens.includes('egg')) return 'egg';
  if (MEAT_IDS.has(food.id) || food.allergens.some((a) => a === 'chicken' || a === 'beef' || a === 'pork')) return 'meat';
  if (food.allergens.includes('soy') || LEGUME_IDS.has(food.id)) return 'tofu';
  return 'fish';
}

/**
 * Next week's shopping, from the guide's portions and what the family has
 * logged. Advisory: a plan to buy for, not a menu to follow.
 */
export function buildShoppingList(input: {
  /** Computed for a week from now, so a phase that opens mid-week is covered. */
  progress: WeaningProgress;
  foods: Food[];
  seed: readonly SeedFood[];
  now: Date;
}): ShoppingList | null {
  const { progress, foods, seed, now } = input;
  const { stage, mealsPerDay } = progress;
  if (stage === null) return null;

  const portions = PORTIONS[stage];
  const meals = mealsPerDay * DAYS;
  const month = addDays(now, DAYS).getMonth() + 1;
  const seedById = new Map(seed.map((s) => [s.id, s]));
  const openGroups = new Set<FoodGroup>(stage === 1 ? PHASE_GROUPS[progress.phase] : FOOD_GROUPS);
  const slotOpen: Record<Slot, boolean> = {
    grain: true,
    vegFruit: openGroups.has('vegetable'),
    protein: openGroups.has('protein'),
  };

  const line = (food: Pick<Food, 'id' | 'name'>, reason: ShoppingLine['reason'], amount: { grams?: number; eggs?: number }): ShoppingLine => {
    const buy = pickBuyHint(food.id, month);
    const grams = amount.grams !== undefined ? roundUp10(amount.grams) : undefined;
    const packs = buy.kind === 'coop' && buy.packGrams && grams ? Math.ceil(grams / buy.packGrams) : undefined;
    const note = seedById.get(food.id)?.note;
    return {
      foodId: food.id, name: food.name, reason, buy,
      ...(grams !== undefined ? { grams } : {}),
      ...(amount.eggs !== undefined ? { eggs: amount.eggs } : {}),
      ...(packs !== undefined ? { packs } : {}),
      ...(note ? { note } : {}),
    };
  };

  // 1. New foods: one a day, new allergens spaced (spec §8). No unlock simulation.
  const planned: SeedFood[] = [];
  let lastAllergenDay = -Infinity;
  for (const c of rankNextFoods({ seed, foods, progress, now })) {
    if (planned.length >= DAYS) break;
    if (c.readiness !== 'now') continue;
    const slot = slotOf(c.seed.group);
    if (!slot || !slotOpen[slot]) continue;
    if (c.seed.allergens.length > 0) {
      if (planned.length - lastAllergenDay < NEW_ALLERGEN_SPACING_DAYS) continue;
      lastAllergenDay = planned.length;
    }
    planned.push(c.seed);
  }

  // 2. Staples: the most-used introduced solids per slot.
  const introduced = foods
    .filter(isIntroduced)
    .filter((f) => !NON_SOLID_IDS.has(f.id) && seedById.get(f.id)?.suggest !== false)
    .sort((a, b) => b.usageCount - a.usageCount);
  const inSlot = (slot: Slot) => introduced.filter((f) => slotOf(f.group) === slot);

  const grainStaples = slotOpen.grain ? inSlot('grain').slice(0, 1) : [];
  const vegStaples = slotOpen.vegFruit ? inSlot('vegFruit').slice(0, VEG_FRUIT_STAPLES) : [];
  const kindStaples = new Map<ProteinKind, Food>();
  if (slotOpen.protein) {
    for (const f of inSlot('protein')) {
      const kind = proteinKind(f);
      if (portions[kind] === 0 && kind !== 'egg') continue;
      if (!kindStaples.has(kind) && kindStaples.size < PROTEIN_KINDS) kindStaples.set(kind, f);
    }
  }

  const sections: Record<Slot, ShoppingLine[]> = { grain: [], vegFruit: [], protein: [] };

  // Grain and vegetables: the slot's weekly total, minus first tastes, split across staples.
  // A slot with no staple gives its whole total to its new foods instead.
  for (const slot of ['grain', 'vegFruit'] as const) {
    const staples = slot === 'grain' ? grainStaples : vegStaples;
    const fresh = planned.filter((s) => slotOf(s.group) === slot);
    const total = portions[slot] * meals;
    if (staples.length === 0) {
      for (const s of fresh) sections[slot].push(line(s, 'new', { grams: total / fresh.length }));
      continue;
    }
    for (const s of fresh) sections[slot].push(line(s, 'new', { grams: FIRST_TASTE_GRAMS }));
    const left = Math.max(total - fresh.length * FIRST_TASTE_GRAMS, 0);
    for (const f of staples) sections[slot].push(line(f, 'staple', { grams: left / staples.length }));
  }

  // Protein: the week's meals split across kinds; each kind uses its own portion.
  for (const s of planned.filter((x) => slotOf(x.group) === 'protein')) {
    sections.protein.push(line(s, 'new', proteinKind(s) === 'egg' ? { eggs: 1 } : { grams: FIRST_TASTE_GRAMS }));
  }
  const kindMeals = kindStaples.size > 0 ? meals / kindStaples.size : 0;
  for (const [kind, f] of kindStaples) {
    sections.protein.push(line(f, 'staple', kind === 'egg'
      ? { eggs: Math.max(1, Math.ceil(kindMeals * portions.egg)) }
      : { grams: kindMeals * portions[kind] }));
  }

  // 3. Maintenance: an introduced allergen not eaten lately and not already on the list.
  const listed = [...sections.grain, ...sections.vegFruit, ...sections.protein];
  const covered = new Set(listed.flatMap((l) => seedById.get(l.foodId)?.allergens ?? foods.find((f) => f.id === l.foodId)?.allergens ?? []));
  for (const status of getAllergenStatus(foods, now)) {
    if (!status.needsMaintenance || covered.has(status.allergen)) continue;
    const f = introduced.find((x) => x.allergens.includes(status.allergen));
    const slot = f ? slotOf(f.group) : null;
    if (!f || !slot) continue;
    const kind = proteinKind(f);
    sections[slot].push(line(f, 'maintenance', slot === 'protein'
      ? (kind === 'egg' ? { eggs: 1 } : { grams: portions[kind] || FIRST_TASTE_GRAMS })
      : { grams: portions[slot] }));
    for (const a of f.allergens) covered.add(a);
  }

  return {
    from: addDays(now, 1),
    to: addDays(now, DAYS),
    stage,
    mealsPerDay,
    ...sections,
  };
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `npx vitest run src/utils/shopping-list.test.ts`
Expected: PASS.

- [ ] **Step 9: Write the failing component tests**

`src/components/ShoppingList.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShoppingList } from './ShoppingList';
import type { ShoppingList as List } from '../utils/shopping-list';

const list: List = {
  from: new Date('2026-09-16'), to: new Date('2026-09-22'), stage: 2, mealsPerDay: 2,
  grain: [{ foodId: 'okayu-10x', name: 'Okayu', reason: 'staple', grams: 1120, packs: 5,
    buy: { kind: 'coop', product: 'CO-OP きらきらステップ 白かゆ (8倍がゆ)', packGrams: 260, leadWeeks: 1 } }],
  vegFruit: [{ foodId: 'beni-imo', name: 'Beni-imo', reason: 'new', grams: 20,
    buy: { kind: 'local', name: '紅いも', months: [9] } }],
  protein: [{ foodId: 'shirasu', name: 'Shirasu', reason: 'maintenance', grams: 30, note: 'Desalt: pour boiling water over and drain.',
    buy: { kind: 'coop', product: 'Salmon dice', packGrams: 80, leadWeeks: 2 } }],
};

describe('ShoppingList', () => {
  it('should show amounts, packs and where to buy', () => {
    render(<ShoppingList list={list} />);
    expect(screen.getByText(/白かゆ/)).toBeInTheDocument();
    expect(screen.getByText(/up to 1120 g · 5 packs/)).toBeInTheDocument();
    expect(screen.getByText(/紅いも \(local, in season\)/)).toBeInTheDocument();
  });

  it('should tag new and keep-up lines and show the note', () => {
    render(<ShoppingList list={list} />);
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Keep up')).toBeInTheDocument();
    expect(screen.getByText(/desalt/i)).toBeInTheDocument();
    expect(screen.getByText(/2 weeks/)).toBeInTheDocument();
  });

  it('should explain the delivery cycle', () => {
    render(<ShoppingList list={list} />);
    expect(screen.getByText(/this week's 宅配/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 10: Run to verify it fails**

Run: `npx vitest run src/components/ShoppingList.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 11: Implement the component**

`src/components/ShoppingList.tsx`:

```tsx
import { format } from 'date-fns';
import type { BuyHint } from '../data/coop-okinawa';
import type { ShoppingLine, ShoppingList as List } from '../utils/shopping-list';
import styles from './ShoppingList.module.css';

const SECTIONS = [
  ['grain', 'Grain'],
  ['vegFruit', 'Vegetables & fruit'],
  ['protein', 'Protein'],
] as const;

const TAG: Record<ShoppingLine['reason'], string | null> = { staple: null, new: 'New', maintenance: 'Keep up' };

function where(buy: BuyHint): string {
  if (buy.kind === 'coop') return `🧊 ${buy.product}${buy.leadWeeks === 2 ? ' · 2 weeks' : ''}`;
  if (buy.kind === 'local') return `🥬 ${buy.name} (local, in season)`;
  return '🛒 In store';
}

function amount(l: ShoppingLine): string {
  const parts = [
    l.grams !== undefined ? `up to ${l.grams} g` : null,
    l.eggs !== undefined ? `${l.eggs} egg${l.eggs > 1 ? 's' : ''}` : null,
    l.packs !== undefined ? `${l.packs} pack${l.packs > 1 ? 's' : ''}` : null,
  ];
  return parts.filter(Boolean).join(' · ');
}

export function ShoppingList({ list }: { list: List }) {
  return (
    <div className={styles.list}>
      <p className={styles.period}>
        {format(list.from, 'EEE d MMM')} – {format(list.to, 'EEE d MMM')} · {list.mealsPerDay} meal{list.mealsPerDay > 1 ? 's' : ''} a day
      </p>
      <p className={styles.cycle}>
        🧊 Frozen: order in this week's 宅配 — it arrives next week (other brands in
        すくすくスマイル take two weeks). 🥬 Fresh and local: in store. The Coop range
        changes; check the catalogue.
      </p>
      {SECTIONS.map(([key, title]) => list[key].length > 0 && (
        <div key={key} className={styles.section}>
          <h3 className={styles.heading}>{title}</h3>
          <ul className={styles.lines}>
            {list[key].map((l) => (
              <li key={`${l.reason}-${l.foodId}`} className={styles.line}>
                <div className={styles.row}>
                  <span className={styles.name}>{l.name}</span>
                  {TAG[l.reason] && <span className={styles.tag}>{TAG[l.reason]}</span>}
                </div>
                <span className={styles.where}>{where(l.buy)}</span>
                <span className={styles.amount}>{amount(l)}</span>
                {l.note && <span className={styles.note}>{l.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

`src/components/ShoppingList.module.css`:

```css
.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.period {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.cycle {
  font-size: var(--font-size-2xs);
  color: var(--color-text-muted);
  line-height: 1.4;
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.heading {
  font-size: var(--font-size-2xs);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.lines {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  list-style: none;
  margin: 0;
  padding: 0;
}

.line {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  background: var(--color-bg);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

.name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
  min-width: 0;
}

.tag {
  flex-shrink: 0;
  padding: 0 var(--space-xs);
  border-radius: var(--radius-full);
  background: var(--color-meal-bg);
  color: var(--color-meal);
  font-size: var(--font-size-2xs);
  font-weight: 700;
}

.where,
.amount {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  overflow-wrap: anywhere;
}

.note {
  font-size: var(--font-size-2xs);
  color: var(--color-feeding);
}
```

- [ ] **Step 12: Wire the disclosure into FoodPage — test first**

Add to `src/pages/FoodPage.test.tsx`:

```ts
  it('should open next week\'s shopping list', async () => {
    const user = userEvent.setup();
    withFoods([]);
    render(<FoodPage {...props} />);
    const toggle = await screen.findByRole('button', { name: /next week's shopping/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(screen.getByText(/this week's 宅配/)).toBeInTheDocument();
  });
```

Run: `npx vitest run src/pages/FoodPage.test.tsx` → FAIL.

In `FoodPage.tsx`:

```ts
import { addDays } from 'date-fns';
import { buildShoppingList } from '../utils/shopping-list';
import { ShoppingList } from '../components/ShoppingList';
import { ShoppingCart } from 'lucide-react';

  const [showShopping, setShowShopping] = useState(false);
  const shoppingList = useMemo(() => {
    if (!baby || !showShopping) return null;
    const nextWeek = getWeaningProgress({
      birthDate: baby.birthDate.toDate(),
      weaningStartedAt: baby.weaningStartedAt?.toDate(),
      eczema: baby.eczema,
      foods,
      now: addDays(today, 7),
    });
    return buildShoppingList({ progress: nextWeek, foods, seed: FOOD_SEED, now: today });
  }, [baby, foods, today, showShopping]);
```

JSX, a section right after the hero:

```tsx
      {stage && (
        <section className={styles.hero}>
          <button type="button" className={styles.shoppingToggle} aria-expanded={showShopping}
            onClick={() => setShowShopping((v) => !v)}>
            <ShoppingCart size={18} />
            Next week's shopping
            <ChevronDown size={16} className={showShopping ? styles.chevronOpen : ''} />
          </button>
          {showShopping && shoppingList && <ShoppingList list={shoppingList} />}
        </section>
      )}
```

CSS:

```css
.shoppingToggle {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.shoppingToggle svg:last-child {
  margin-left: auto;
}
```

Run: `npx vitest run src/pages/FoodPage.test.tsx src/components/ShoppingList.test.tsx` → PASS.

---

### Task 9: Whole-suite verification

**Files:** none new.

- [ ] **Step 1: Full test suite**

Run: `npm run test`
Expected: all suites PASS (baseline was 501 passing).

- [ ] **Step 2: Types and build**

Run: `npx tsc -b && npx vite build`
Expected: no type errors; build succeeds.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no new errors versus `main` (`git stash`-free check: compare the error count with `git worktree`-less run on main is not needed — the baseline in the decisions doc is 3 known errors).

- [ ] **Step 4: Run the app at 375 px, light and dark**

Launch with `npm run dev`, open `/food` in a 375 px viewport: hero, grouped options, shopping disclosure and Settings "Solids" section render without horizontal scroll in both colour schemes.
