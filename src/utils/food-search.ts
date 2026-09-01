import type { Food, SeedFood, FoodGroup } from '../types/food';

export interface FoodSuggestion {
  id: string;
  name: string;
  group: FoodGroup;
  source: 'catalog' | 'seed';
  usageCount: number;
}

const DEFAULT_LIMIT = 8;

function toCatalogSuggestion(food: Food): FoodSuggestion {
  return {
    id: food.id,
    name: food.name,
    group: food.group,
    source: 'catalog',
    usageCount: food.usageCount,
  };
}

function toSeedSuggestion(seed: SeedFood): FoodSuggestion {
  return { id: seed.id, name: seed.name, group: seed.group, source: 'seed', usageCount: 0 };
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

  if (!q) {
    return [...foods]
      .sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name))
      .slice(0, limit)
      .map(toCatalogSuggestion);
  }

  const catalogIds = new Set(foods.map((f) => f.id));
  const tiered: { suggestion: FoodSuggestion; tier: number }[] = [];

  for (const food of foods) {
    const name = food.name.toLowerCase();
    if (name.startsWith(q)) {
      tiered.push({ suggestion: toCatalogSuggestion(food), tier: 0 });
    } else if (name.includes(q)) {
      tiered.push({ suggestion: toCatalogSuggestion(food), tier: 1 });
    }
  }

  for (const s of seed) {
    if (catalogIds.has(s.id)) continue;
    const name = s.name.toLowerCase();
    if (name.startsWith(q)) {
      tiered.push({ suggestion: toSeedSuggestion(s), tier: 2 });
    } else if (name.includes(q)) {
      tiered.push({ suggestion: toSeedSuggestion(s), tier: 3 });
    }
  }

  tiered.sort(
    (a, b) =>
      a.tier - b.tier ||
      b.suggestion.usageCount - a.suggestion.usageCount ||
      a.suggestion.name.localeCompare(b.suggestion.name),
  );

  return tiered.slice(0, limit).map((t) => t.suggestion);
}
