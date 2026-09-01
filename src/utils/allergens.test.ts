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
