import { describe, it, expect } from 'vitest';
import { FOOD_SEED } from '../data/food-seed';
import { ALLERGEN_ENTRY, ASK_DOCTOR_ALLERGENS, LADDERS, NON_SOLID_IDS } from './weaning-rules';

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

  it('should keep peanut and tree nuts out of automatic suggestions, but not egg', () => {
    for (const a of ['peanut', 'walnut', 'cashew', 'almond', 'macadamia', 'pistachio'] as const) {
      expect(ASK_DOCTOR_ALLERGENS).toContain(a);
    }
    expect(ASK_DOCTOR_ALLERGENS).not.toContain('egg');
  });
});
