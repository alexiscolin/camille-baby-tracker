import { describe, it, expect } from 'vitest';
import {
  ALLERGENS,
  MANDATORY_ALLERGENS,
  RECOMMENDED_ALLERGENS,
  ALLERGEN_LABELS,
  allergenLabel,
  isAllergen,
  isMandatoryAllergen,
} from './allergens';

describe('allergens', () => {
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
