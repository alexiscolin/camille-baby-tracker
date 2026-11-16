import { FOOD_SEED, IMPLIED_ALLERGENS } from '../data/food-seed';
import type { Allergen } from './allergens';
import type { Food, FoodGroup, SeedFood } from '../types/food';

/** One form for katakana/hiragana and half/full-width, so ウドン, ｳﾄﾞﾝ and うどん compare equal. */
export function foldText(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

function words(text: string): string[] {
  return foldText(text).split(/[^a-z0-9]+/).filter(Boolean);
}

/**
 * Names whose seed row the plain word would not reach: a cooking prefix
 * (ゆでうどん, 食パン), a spelling (ソーメン), or a generic word (pasta).
 * 焼きそば is wheat noodles: without it, そば would make it buckwheat.
 * "peanut butter" stops its butter from reading as milk.
 */
const KEYWORDS: Record<string, string> = {
  うどん: 'udon-boiled',
  そーめん: 'somen-boiled',
  ぱん: 'shokupan',
  らーめん: 'chukamen-boiled',
  焼きそば: 'chukamen-boiled',
  焼そば: 'chukamen-boiled',
  やきそば: 'chukamen-boiled',
  卵: 'egg-whole-boiled',
  たまご: 'egg-whole-boiled',
  小麦: 'wheat-flour-soft',
  pasta: 'spaghetti-boiled',
  'peanut butter': 'peanut-paste',
};

interface Match {
  text: string;
  group?: FoodGroup;
  allergens: readonly Allergen[];
}

/** Every seed row, keyword and allergen-implying word the typed name contains. */
function findMatches(name: string, seed: readonly SeedFood[]): Match[] {
  const folded = foldText(name);
  const typed = words(name);
  const matches: Match[] = [];
  const add = (text: string, food: SeedFood | undefined) => {
    if (food) matches.push({ text, group: food.group, allergens: food.allergens });
  };

  for (const food of seed) {
    // "Udon, boiled" and "Roll bread (butter roll)" are named by what comes before the qualifier.
    const base = words(food.name.split(/[,(]/)[0]);
    if (base.length > 0 && base.every((w) => typed.includes(w))) add(base.join(' '), food);
    const ja = food.nameJa ? foldText(food.nameJa) : '';
    if (ja && folded.includes(ja)) add(ja, food);
  }
  for (const [keyword, id] of Object.entries(KEYWORDS)) {
    if (folded.includes(keyword)) add(keyword, seed.find((f) => f.id === id));
  }
  for (const w of typed) {
    const allergen = IMPLIED_ALLERGENS[w];
    if (allergen) matches.push({ text: w, allergens: [allergen] });
  }
  return matches;
}

/**
 * Group and allergens for a food typed by hand. Every food the name contains
 * adds its allergens (かぼちゃパン is pumpkin and wheat), except one read
 * inside a longer match (the パン of パン粉, the そば of 焼きそば). The group
 * is the longest match's. Without this a free-typed "kitsune udon" was saved
 * as `other` with no allergens, so wheat never counted.
 * ponytail: name matching, not understanding — "cod liver oil" reads as cod,
 * "chicken nuggets" misses wheat. An allergen picker on custom foods is the upgrade.
 */
export function inferCustomFood(
  name: string,
  seed: readonly SeedFood[] = FOOD_SEED,
): { group: FoodGroup; allergens: Allergen[] } {
  const all = findMatches(name, seed);
  const kept = all.filter((m) => !all.some((o) => o.text.length > m.text.length && o.text.includes(m.text)));
  const grouped = kept.filter((m) => m.group).sort((a, b) => b.text.length - a.text.length);
  return {
    group: grouped[0]?.group ?? 'other',
    allergens: [...new Set(kept.flatMap((m) => m.allergens))],
  };
}

/**
 * Applied on read, so custom foods saved before inference existed are repaired
 * without a migration. Only adds allergens; keeps a group other than `other`.
 */
export function repairCustomFood(food: Food): Food {
  if (food.nutrientSource !== 'manual') return food;
  const inferred = inferCustomFood(food.name);
  return {
    ...food,
    group: food.group === 'other' ? inferred.group : food.group,
    allergens: [...new Set([...food.allergens, ...inferred.allergens])],
  };
}
