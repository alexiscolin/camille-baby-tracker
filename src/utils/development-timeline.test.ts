import { describe, it, expect } from 'vitest';
import { getDevelopmentOutlook, ROUGH_NIGHT_BANDS, CARNET_CHECKPOINTS } from './development-timeline';

/** Camille's case: born 22 March, read on 22 September — six months to the day. */
const BIRTH = new Date(2026, 2, 22);
const AT_SIX_MONTHS = new Date(2026, 8, 22);

describe('getDevelopmentOutlook', () => {
  describe('rough nights', () => {
    it('should report the crying peak while the baby is inside it', () => {
      // Six weeks old: the peak of the one band that is over before four months.
      const outlook = getDevelopmentOutlook(BIRTH, new Date(2026, 4, 3));
      expect(outlook.roughNights.current.map((b) => b.key)).toContain('crying-peak');
    });

    it('should report nothing current at six months, between the two bands', () => {
      const outlook = getDevelopmentOutlook(BIRTH, AT_SIX_MONTHS);
      expect(outlook.roughNights.current).toEqual([]);
    });

    it('should flag separation protest as upcoming at six months', () => {
      const outlook = getDevelopmentOutlook(BIRTH, AT_SIX_MONTHS);
      const next = outlook.roughNights.upcoming[0];
      expect(next.key).toBe('separation');
      // Starts at 8 months, so roughly two months out.
      expect(next.startsInDays).toBeGreaterThan(40);
      expect(next.startsInDays).toBeLessThan(75);
    });

    it('should report separation protest as current at ten months', () => {
      const outlook = getDevelopmentOutlook(BIRTH, new Date(2027, 0, 22));
      expect(outlook.roughNights.current.map((b) => b.key)).toEqual(['separation']);
      expect(outlook.roughNights.upcoming).toEqual([]);
    });

    it('should leave both bands behind by two years', () => {
      const outlook = getDevelopmentOutlook(BIRTH, new Date(2028, 2, 22));
      expect(outlook.roughNights.current).toEqual([]);
      expect(outlook.roughNights.upcoming).toEqual([]);
    });

    /**
     * Every band has to carry the source that justifies it on screen. The whole
     * point of this table is that it excludes the folklore, so a band without a
     * citation is a band that should not be here.
     */
    it('should cite a source for every band', () => {
      for (const band of ROUGH_NIGHT_BANDS) {
        expect(band.source.length).toBeGreaterThan(0);
      }
    });
  });

  describe('next checkpoint', () => {
    it('should point at the eight-month exam for a six-month-old', () => {
      const outlook = getDevelopmentOutlook(BIRTH, AT_SIX_MONTHS);
      expect(outlook.nextCheckpoint?.ageMonths).toBe(8);
      expect(outlook.nextCheckpoint?.items).toContain('tient bien assis');
    });

    it('should point at the next exam up, not the one just passed', () => {
      // Two days after the eight-month mark.
      const outlook = getDevelopmentOutlook(BIRTH, new Date(2026, 10, 24));
      expect(outlook.nextCheckpoint?.ageMonths).toBe(11);
    });

    it('should return nothing once the table runs out', () => {
      const outlook = getDevelopmentOutlook(BIRTH, new Date(2028, 2, 22));
      expect(outlook.nextCheckpoint).toBeNull();
    });

    it('should quote the health record verbatim, never paraphrase it', () => {
      const twoMonths = CARNET_CHECKPOINTS.find((c) => c.ageMonths === 2);
      expect(twoMonths?.items).toContain('réagit à votre voix et gazouille');
    });
  });

  describe('motor windows', () => {
    it('should place a six-month-old inside the four earliest windows', () => {
      const outlook = getDevelopmentOutlook(BIRTH, AT_SIX_MONTHS);
      const within = outlook.motor.filter((m) => m.status === 'within').map((m) => m.key);
      expect(within).toEqual([
        'sitting',
        'standingWithAssistance',
        'crawling',
        'walkingWithAssistance',
      ]);
    });

    it('should mark the windows a six-month-old has not reached', () => {
      const outlook = getDevelopmentOutlook(BIRTH, AT_SIX_MONTHS);
      const before = outlook.motor.filter((m) => m.status === 'before').map((m) => m.key);
      expect(before).toEqual(['standingAlone', 'walkingAlone']);
    });

    it('should mark a window as passed once the 99th percentile is behind', () => {
      // Walking alone tops out at 17.6 months.
      const outlook = getDevelopmentOutlook(BIRTH, new Date(2028, 2, 22));
      expect(outlook.motor.every((m) => m.status === 'after')).toBe(true);
    });
  });

  it('should report the age in months it reasoned from', () => {
    const outlook = getDevelopmentOutlook(BIRTH, AT_SIX_MONTHS);
    expect(outlook.ageMonths).toBeCloseTo(6, 1);
  });
});
