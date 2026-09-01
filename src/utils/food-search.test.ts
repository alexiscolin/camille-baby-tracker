import { describe, it, expect } from 'vitest';
import { rankSuggestions } from './food-search';
import type { Food, SeedFood } from '../types/food';

const catalogFood = (id: string, name: string, usageCount: number) =>
  ({ id, name, group: 'vegetable', usageCount }) as Food;
const seedFood = (id: string, name: string) =>
  ({ id, name, group: 'protein' }) as SeedFood;

const foods = [
  catalogFood('shirasu', 'Shirasu', 12),
  catalogFood('shiitake', 'Shiitake', 2),
  catalogFood('kabocha', 'Kabocha', 30),
];
const seed = [seedFood('shiratamako', 'Shiratamako'), seedFood('shirasu', 'Shirasu')];

describe('rankSuggestions', () => {
  it('should return the most used foods when the query is empty', () => {
    const result = rankSuggestions('', foods, seed, 3);
    expect(result[0].id).toBe('kabocha');
    expect(result[1].id).toBe('shirasu');
  });

  it('should rank a prefix match above a substring match', () => {
    const result = rankSuggestions('shi', foods, seed);
    const ids = result.map((r) => r.id);
    expect(ids.indexOf('shirasu')).toBeLessThan(ids.indexOf('shiratamako'));
  });

  it('should rank catalog entries above unused seed entries', () => {
    const result = rankSuggestions('shir', foods, seed);
    expect(result[0].source).toBe('catalog');
  });

  it('should not return a seed entry that is already in the catalog', () => {
    const result = rankSuggestions('shirasu', foods, seed);
    expect(result.filter((r) => r.id === 'shirasu')).toHaveLength(1);
  });

  it('should be case-insensitive', () => {
    expect(rankSuggestions('KABO', foods, seed)[0].id).toBe('kabocha');
  });

  it('should honour the limit', () => {
    expect(rankSuggestions('', foods, seed, 2)).toHaveLength(2);
  });
});
