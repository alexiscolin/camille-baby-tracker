import { describe, it, expect } from 'vitest';
import { EVENT_CONFIG, EVENT_TYPES, visibleEventTypes } from './event-config';

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

describe('visibleEventTypes', () => {
  it('should show every type when nothing is hidden', () => {
    expect(visibleEventTypes(undefined)).toEqual(EVENT_TYPES);
    expect(visibleEventTypes([])).toEqual(EVENT_TYPES);
  });

  it('should drop the hidden types and keep the rest in their declared order', () => {
    expect(visibleEventTypes(['feeding'])).toEqual(['pee', 'poop', 'medication', 'bath', 'meal']);
    expect(visibleEventTypes(['meal', 'pee'])).toEqual(['feeding', 'poop', 'medication', 'bath']);
  });

  /**
   * The list is stored on a shared document, so it can hold a type this build
   * does not know about — an older client, or one written by a future version.
   */
  it('should ignore a hidden type it does not recognise', () => {
    expect(visibleEventTypes(['nap' as never, 'bath'])).toEqual(
      EVENT_TYPES.filter((t) => t !== 'bath'),
    );
  });

  /**
   * Hiding everything would leave the add button with nothing to offer and
   * every chart with no series; the settings UI prevents it, but a document
   * written by hand must not be able to empty the app either.
   */
  it('should never return an empty list', () => {
    expect(visibleEventTypes(EVENT_TYPES)).toEqual(EVENT_TYPES);
  });
});
