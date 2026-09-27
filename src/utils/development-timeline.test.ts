import { describe, it, expect } from 'vitest';
import { EXPECTED_MILESTONES, ROUGH_NIGHT_BANDS, CARNET_CHECKPOINTS } from './development-timeline';

describe('development timeline data', () => {
  describe('expected milestones', () => {
    it('should have unique keys', () => {
      const keys = EXPECTED_MILESTONES.map((m) => m.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('should have unique labels, since a hand-typed title ticks a step by its label', () => {
      const labels = EXPECTED_MILESTONES.map((m) => m.label.toLowerCase());
      expect(new Set(labels).size).toBe(labels.length);
    });

    it('should order every window early ≤ typical ≤ late', () => {
      for (const m of EXPECTED_MILESTONES) {
        const bounds = [m.early, m.typical, m.late].filter((b): b is number => b !== null);
        expect(bounds, m.key).toEqual([...bounds].sort((a, b) => a - b));
      }
    });

    it('should give every step a typical age or an upper bound to place it by', () => {
      for (const m of EXPECTED_MILESTONES) expect(m.typical ?? m.late, m.key).not.toBeNull();
    });

    /**
     * The whole point of this table is that it excludes the folklore, so a step
     * without a citation is a step that should not be here.
     */
    it('should cite a source for every step', () => {
      for (const m of EXPECTED_MILESTONES) expect(m.source.trim(), m.key).not.toBe('');
    });

    it('should keep the WHO walking window at its real spread', () => {
      const walking = EXPECTED_MILESTONES.find((m) => m.key === 'walkingAlone');
      expect([walking?.early, walking?.late]).toEqual([8.2, 17.6]);
    });

    it('should cover every domain', () => {
      const domains = new Set(EXPECTED_MILESTONES.map((m) => m.domain));
      expect([...domains].sort()).toEqual(['hands', 'language', 'motor', 'play', 'sleep', 'social', 'teeth']);
    });
  });

  it('should cite a source for every rough-night band', () => {
    for (const band of ROUGH_NIGHT_BANDS) expect(band.source.length).toBeGreaterThan(0);
  });

  it('should quote the health record verbatim, never paraphrase it', () => {
    const twoMonths = CARNET_CHECKPOINTS.find((c) => c.ageMonths === 2);
    expect(twoMonths?.items).toContain('réagit à votre voix et gazouille');
  });

  /**
   * In French paediatrics « régression des compétences » is an autism red flag
   * (carnet de santé 2025, HAS). Using the word as reassurance would import a
   * clinical alarm; see the header of development-timeline.ts.
   */
  it('should never use the word « régression » in anything shown', () => {
    const shown = JSON.stringify([EXPECTED_MILESTONES, ROUGH_NIGHT_BANDS, CARNET_CHECKPOINTS]);
    expect(shown).not.toMatch(/r[ée]gression/i);
  });
});
