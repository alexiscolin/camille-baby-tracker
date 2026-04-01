import { describe, it, expect } from 'vitest';
import {
  STOOL_COLORS,
  getStoolColorWarning,
  type StoolColorId,
  type StoolColorWarning,
} from './stool-color';

describe('STOOL_COLORS', () => {
  it('should define at least 6 stool colors', () => {
    expect(STOOL_COLORS.length).toBeGreaterThanOrEqual(6);
  });

  it('should have unique ids', () => {
    const ids = STOOL_COLORS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have valid hex colors', () => {
    for (const color of STOOL_COLORS) {
      expect(color.hex).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('should have non-empty labels', () => {
    for (const color of STOOL_COLORS) {
      expect(color.label.length).toBeGreaterThan(0);
    }
  });
});

describe('getStoolColorWarning', () => {
  describe('always-abnormal colors', () => {
    it('should warn for red at any age', () => {
      const result = getStoolColorWarning('red', 0);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('alert');
    });

    it('should warn for red at 30 days', () => {
      const result = getStoolColorWarning('red', 30);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('alert');
    });

    it('should warn for white/pale at any age', () => {
      const result = getStoolColorWarning('white', 0);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('alert');
    });

    it('should warn for white/pale at 60 days', () => {
      const result = getStoolColorWarning('white', 60);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('alert');
    });
  });

  describe('meconium (black/dark-green) age logic', () => {
    it('should return no warning for black in first 3 days', () => {
      expect(getStoolColorWarning('black', 0)).toBeNull();
      expect(getStoolColorWarning('black', 1)).toBeNull();
      expect(getStoolColorWarning('black', 2)).toBeNull();
    });

    it('should return warning for black after 3 days', () => {
      const result = getStoolColorWarning('black', 4);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('alert');
    });

    it('should return no warning for dark-green in first 5 days', () => {
      expect(getStoolColorWarning('dark-green', 0)).toBeNull();
      expect(getStoolColorWarning('dark-green', 4)).toBeNull();
    });

    it('should return info for dark-green after 5 days', () => {
      const result = getStoolColorWarning('dark-green', 6);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('warning');
    });
  });

  describe('normal colors', () => {
    it('should return no warning for yellow at any age', () => {
      expect(getStoolColorWarning('yellow', 0)).toBeNull();
      expect(getStoolColorWarning('yellow', 30)).toBeNull();
      expect(getStoolColorWarning('yellow', 180)).toBeNull();
    });

    it('should return no warning for mustard at any age', () => {
      expect(getStoolColorWarning('mustard', 10)).toBeNull();
    });

    it('should return no warning for brown at any age', () => {
      expect(getStoolColorWarning('brown', 10)).toBeNull();
      expect(getStoolColorWarning('brown', 90)).toBeNull();
    });

    it('should return no warning for green at any age', () => {
      expect(getStoolColorWarning('green', 5)).toBeNull();
      expect(getStoolColorWarning('green', 60)).toBeNull();
    });
  });

  describe('return shape', () => {
    it('should return level and message when warning exists', () => {
      const result = getStoolColorWarning('red', 10);
      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('message');
      expect(typeof result!.message).toBe('string');
      expect(result!.message.length).toBeGreaterThan(0);
    });
  });

  describe('unknown color', () => {
    it('should return null for unknown color id', () => {
      expect(getStoolColorWarning('unknown-color' as StoolColorId, 10)).toBeNull();
    });
  });
});
