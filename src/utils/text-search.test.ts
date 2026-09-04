import { describe, it, expect } from 'vitest';
import { normalizeForSearch, matchesSearch } from './text-search';

describe('normalizeForSearch', () => {
  it('should fold case and accents together', () => {
    expect(normalizeForSearch('Première Dent')).toBe('premiere dent');
    expect(normalizeForSearch('CRÊPE')).toBe('crepe');
  });

  it('should leave a plain string alone', () => {
    expect(normalizeForSearch('first steps')).toBe('first steps');
  });
});

describe('matchesSearch', () => {
  /** An empty box is not a filter — it is the absence of one. */
  it('should match everything when the query is blank', () => {
    expect(matchesSearch('', ['First steps'])).toBe(true);
    expect(matchesSearch('   ', ['First steps'])).toBe(true);
  });

  it('should find a word regardless of case or accent, either way round', () => {
    expect(matchesSearch('premiere', ['Première dent'])).toBe(true);
    expect(matchesSearch('Première', ['premiere dent'])).toBe(true);
  });

  it('should match on any of the fields it is given', () => {
    expect(matchesSearch('tapis', ['First steps', 'sur le tapis du salon'])).toBe(true);
  });

  it('should ignore a field that is not there', () => {
    expect(matchesSearch('steps', ['First steps', undefined])).toBe(true);
    expect(matchesSearch('tapis', ['First steps', undefined])).toBe(false);
  });

  it('should not match what is absent', () => {
    expect(matchesSearch('tooth', ['First steps'])).toBe(false);
  });
});
