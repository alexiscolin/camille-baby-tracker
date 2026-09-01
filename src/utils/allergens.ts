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
