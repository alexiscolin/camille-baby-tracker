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
