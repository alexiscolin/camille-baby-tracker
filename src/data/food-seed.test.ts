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

  it('should offer at least 20 suggestible stage-1 foods', () => {
    expect(FOOD_SEED.filter((f) => f.minStage === 1 && f.suggest !== false).length)
      .toBeGreaterThanOrEqual(20);
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

/**
 * The okayu dilutions are the one place in the table where the rows are
 * arithmetically related: each step thickens the porridge, so each carries
 * more rice per 100 g than the one before it. A ratio entered the wrong way
 * round passes every generic check above and is invisible in review, but it
 * breaks this ordering immediately.
 */
describe('okayu dilution series', () => {
  const SERIES = ['omoyu', 'okayu-10x', 'okayu-8x', 'okayu-7x', 'okayu-5x', 'soft-rice', 'cooked-white-rice'];

  it('should gain energy as the porridge thickens', () => {
    const energies = SERIES.map((id) => {
      const food = FOOD_SEED.find((f) => f.id === id);
      expect(food, `${id} missing from the seed`).toBeDefined();
      return { id, kcal: food!.nutrients.energyKcal };
    });

    for (let i = 1; i < energies.length; i++) {
      expect(
        energies[i].kcal,
        `${energies[i].id} (${energies[i].kcal}) should exceed ${energies[i - 1].id} (${energies[i - 1].kcal})`,
      ).toBeGreaterThan(energies[i - 1].kcal);
    }
  });
});

const byId = new Map(FOOD_SEED.map((f) => [f.id, f]));
const get = (id: string) => {
  const food = byId.get(id);
  if (!food) throw new Error(`${id} missing from the seed`);
  return food;
};

/**
 * Placements, age floors, exclusions and notes corrected against Japanese
 * guidance. Evidence: docs/superpowers/specs/2026-09-15-weaning-guidance-research/seed-audit.md
 */
describe('food seed Japanese names', () => {
  // Hiragana, katakana or kanji: the name printed on a label in a Japanese shop.
  const JAPANESE = /[\u3040-\u30ff\u3400-\u9fff]/;

  it('should give every food a short Japanese name', () => {
    for (const food of FOOD_SEED) {
      expect(food.nameJa, food.id).toMatch(JAPANESE);
      expect(food.nameJa.length, food.id).toBeLessThanOrEqual(24);
    }
  });

  it('should name the staples the way a Japanese shop does', () => {
    expect(get('carrot').nameJa).toBe('にんじん');
    expect(get('okayu-10x').nameJa).toBe('10倍がゆ');
    expect(get('shima-dofu').nameJa).toBe('島豆腐');
  });
});

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

  it('should make raw apple a cooked-only food and cherry tomatoes quartered', () => {
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
