import { describe, it, expect } from 'vitest';
import {
  getGrowthData,
  estimatePercentileRange,
  METRIC_LABELS,
  METRIC_UNITS,
} from './who-growth-data';

describe('getGrowthData', () => {
  it('should return weight data for boys', () => {
    const data = getGrowthData('weight', 'male');
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].month).toBe(0);
    expect(data[0].p50).toBeGreaterThan(0);
  });

  it('should return weight data for girls', () => {
    const data = getGrowthData('weight', 'female');
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].p50).toBeGreaterThan(0);
  });

  it('should return height data', () => {
    const boys = getGrowthData('height', 'male');
    const girls = getGrowthData('height', 'female');
    expect(boys.length).toBe(25); // 0-24 months
    expect(girls.length).toBe(25);
  });

  it('should return head circumference data', () => {
    const data = getGrowthData('head', 'male');
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].p50).toBeGreaterThan(30); // head circ > 30cm at birth
  });

  it('should have increasing p50 values over time for weight', () => {
    const data = getGrowthData('weight', 'male');
    for (let i = 1; i < data.length; i++) {
      expect(data[i].p50).toBeGreaterThan(data[i - 1].p50);
    }
  });

  it('should have percentiles in correct order (p3 < p15 < p50 < p85 < p97)', () => {
    const data = getGrowthData('weight', 'female');
    for (const row of data) {
      expect(row.p3).toBeLessThan(row.p15);
      expect(row.p15).toBeLessThan(row.p50);
      expect(row.p50).toBeLessThan(row.p85);
      expect(row.p85).toBeLessThan(row.p97);
    }
  });
});

describe('estimatePercentileRange', () => {
  it('should identify a value at the 50th percentile range', () => {
    // At birth, boy weight P50 = 3.3kg
    const result = estimatePercentileRange('weight', 'male', 0, 3.5);
    expect(result).toBe('between 50th and 85th percentile');
  });

  it('should identify below 3rd percentile', () => {
    const result = estimatePercentileRange('weight', 'male', 0, 2.0);
    expect(result).toBe('below 3rd percentile');
  });

  it('should identify above 97th percentile', () => {
    const result = estimatePercentileRange('weight', 'male', 0, 5.0);
    expect(result).toBe('above 97th percentile');
  });

  it('should interpolate between months', () => {
    // At 1.5 months, should interpolate between month 1 and month 2
    const result = estimatePercentileRange('weight', 'male', 1.5, 5.0);
    expect(result).toContain('percentile');
  });

  it('should work for height', () => {
    // At birth, girl height P50 ≈ 49.1cm
    const result = estimatePercentileRange('height', 'female', 0, 49.0);
    expect(result).toBe('between 15th and 50th percentile');
  });

  it('should handle age beyond data range', () => {
    const result = estimatePercentileRange('weight', 'male', 30, 14.0);
    expect(result).toContain('percentile');
  });
});

describe('METRIC_LABELS and METRIC_UNITS', () => {
  it('should have labels for all metrics', () => {
    expect(METRIC_LABELS.weight).toBe('Weight');
    expect(METRIC_LABELS.height).toBe('Height');
    expect(METRIC_LABELS.head).toBe('Head Circ.');
  });

  it('should have units for all metrics', () => {
    expect(METRIC_UNITS.weight).toBe('kg');
    expect(METRIC_UNITS.height).toBe('cm');
    expect(METRIC_UNITS.head).toBe('cm');
  });
});
