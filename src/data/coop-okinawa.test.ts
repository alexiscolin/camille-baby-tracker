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
