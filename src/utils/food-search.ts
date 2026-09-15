import type { Food, SeedFood, FoodGroup } from '../types/food';

export interface FoodSuggestion {
  id: string;
  name: string;
  /** From the seed row, so a catalog food keeps the label name a shop uses. */
  nameJa?: string;
  group: FoodGroup;
  source: 'catalog' | 'seed';
  usageCount: number;
}

const DEFAULT_LIMIT = 8;

function toCatalogSuggestion(food: Food, nameJa: string | undefined): FoodSuggestion {
  return {
    id: food.id,
    name: food.name,
    ...(nameJa ? { nameJa } : {}),
    group: food.group,
    source: 'catalog',
    usageCount: food.usageCount,
  };
}

function toSeedSuggestion(seed: SeedFood): FoodSuggestion {
  return { id: seed.id, name: seed.name, nameJa: seed.nameJa, group: seed.group, source: 'seed', usageCount: 0 };
}

/** 0 prefix, 1 substring, null no match — on the English or the Japanese name. */
function matchTier(q: string, name: string, nameJa: string | undefined): 0 | 1 | null {
  const names = [name.toLowerCase(), nameJa ?? ''];
  if (names.some((n) => n.startsWith(q))) return 0;
  if (names.some((n) => n.includes(q))) return 1;
  return null;
}

/**
 * Ranks catalog + seed foods for the tag input's suggestion list.
 * Tiers, highest first: catalog prefix, catalog substring, seed prefix,
 * seed substring. Ties break on usageCount desc, then name asc. A seed
 * entry whose id already exists in the catalog is shadowed (dropped).
 */
export function rankSuggestions(
  query: string,
  foods: Food[],
  seed: readonly SeedFood[],
  limit = DEFAULT_LIMIT,
): FoodSuggestion[] {
  const q = query.trim().toLowerCase();

  const nameJaById = new Map(seed.map((s) => [s.id, s.nameJa]));

  if (!q) {
    return [...foods]
      .sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name))
      .slice(0, limit)
      .map((f) => toCatalogSuggestion(f, nameJaById.get(f.id)));
  }

  const catalogIds = new Set(foods.map((f) => f.id));
  const tiered: { suggestion: FoodSuggestion; tier: number }[] = [];

  for (const food of foods) {
    const nameJa = nameJaById.get(food.id);
    const tier = matchTier(q, food.name, nameJa);
    if (tier !== null) tiered.push({ suggestion: toCatalogSuggestion(food, nameJa), tier });
  }

  for (const s of seed) {
    if (catalogIds.has(s.id)) continue;
    const tier = matchTier(q, s.name, s.nameJa);
    if (tier !== null) tiered.push({ suggestion: toSeedSuggestion(s), tier: tier + 2 });
  }

  tiered.sort(
    (a, b) =>
      a.tier - b.tier ||
      b.suggestion.usageCount - a.suggestion.usageCount ||
      a.suggestion.name.localeCompare(b.suggestion.name),
  );

  return tiered.slice(0, limit).map((t) => t.suggestion);
}
