import { describe, it, expect } from 'vitest';
import { EVENT_CONFIG, EVENT_TYPES } from './event-config';

describe('EVENT_CONFIG', () => {
  it('should include meal as an event type', () => {
    expect(EVENT_TYPES).toContain('meal');
  });

  it('should give meal a label, an icon and CSS variable colours', () => {
    const config = EVENT_CONFIG.meal;
    expect(config.label).toBe('Meals');
    expect(config.icon).toBeTruthy();
    expect(config.color).toBe('var(--color-meal)');
    expect(config.bg).toBe('var(--color-meal-bg)');
  });

  it('should use CSS variables for every event colour', () => {
    for (const type of EVENT_TYPES) {
      expect(EVENT_CONFIG[type].color).toMatch(/^var\(--color-/);
      expect(EVENT_CONFIG[type].bg).toMatch(/^var\(--color-/);
    }
  });
});
