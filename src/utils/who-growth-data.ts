import type { BabySex } from '../types/events';

/**
 * WHO Child Growth Standards (0–24 months)
 * Source: WHO Multicentre Growth Reference Study
 *
 * Each entry: [ageMonths, P3, P15, P50, P85, P97]
 * Weight in kg, Height/Length in cm, Head circumference in cm
 */

export interface PercentileRow {
  month: number;
  p3: number;
  p15: number;
  p50: number;
  p85: number;
  p97: number;
}

export type GrowthDataSet = PercentileRow[];

// ─── WEIGHT (kg) ───

const WEIGHT_BOYS: GrowthDataSet = [
  { month: 0, p3: 2.5, p15: 2.9, p50: 3.3, p85: 3.9, p97: 4.4 },
  { month: 1, p3: 3.4, p15: 3.9, p50: 4.5, p85: 5.1, p97: 5.8 },
  { month: 2, p3: 4.3, p15: 4.9, p50: 5.6, p85: 6.3, p97: 7.1 },
  { month: 3, p3: 5.0, p15: 5.7, p50: 6.4, p85: 7.2, p97: 8.0 },
  { month: 4, p3: 5.6, p15: 6.2, p50: 7.0, p85: 7.8, p97: 8.7 },
  { month: 5, p3: 6.0, p15: 6.7, p50: 7.5, p85: 8.4, p97: 9.3 },
  { month: 6, p3: 6.4, p15: 7.1, p50: 7.9, p85: 8.8, p97: 9.8 },
  { month: 7, p3: 6.7, p15: 7.4, p50: 8.3, p85: 9.2, p97: 10.3 },
  { month: 8, p3: 6.9, p15: 7.7, p50: 8.6, p85: 9.6, p97: 10.7 },
  { month: 9, p3: 7.1, p15: 8.0, p50: 8.9, p85: 9.9, p97: 11.0 },
  { month: 10, p3: 7.4, p15: 8.2, p50: 9.2, p85: 10.2, p97: 11.4 },
  { month: 11, p3: 7.6, p15: 8.4, p50: 9.4, p85: 10.5, p97: 11.7 },
  { month: 12, p3: 7.7, p15: 8.6, p50: 9.6, p85: 10.8, p97: 12.0 },
  { month: 13, p3: 7.9, p15: 8.8, p50: 9.9, p85: 11.0, p97: 12.3 },
  { month: 14, p3: 8.1, p15: 9.0, p50: 10.1, p85: 11.3, p97: 12.6 },
  { month: 15, p3: 8.3, p15: 9.2, p50: 10.3, p85: 11.5, p97: 12.8 },
  { month: 16, p3: 8.4, p15: 9.4, p50: 10.5, p85: 11.7, p97: 13.1 },
  { month: 17, p3: 8.6, p15: 9.6, p50: 10.7, p85: 12.0, p97: 13.4 },
  { month: 18, p3: 8.8, p15: 9.8, p50: 10.9, p85: 12.2, p97: 13.7 },
  { month: 19, p3: 8.9, p15: 10.0, p50: 11.1, p85: 12.5, p97: 13.9 },
  { month: 20, p3: 9.1, p15: 10.1, p50: 11.3, p85: 12.7, p97: 14.2 },
  { month: 21, p3: 9.2, p15: 10.3, p50: 11.5, p85: 12.9, p97: 14.5 },
  { month: 22, p3: 9.4, p15: 10.5, p50: 11.8, p85: 13.2, p97: 14.7 },
  { month: 23, p3: 9.5, p15: 10.7, p50: 12.0, p85: 13.4, p97: 15.0 },
  { month: 24, p3: 9.7, p15: 10.8, p50: 12.2, p85: 13.6, p97: 15.3 },
];

const WEIGHT_GIRLS: GrowthDataSet = [
  { month: 0, p3: 2.4, p15: 2.8, p50: 3.2, p85: 3.7, p97: 4.2 },
  { month: 1, p3: 3.2, p15: 3.6, p50: 4.2, p85: 4.8, p97: 5.5 },
  { month: 2, p3: 3.9, p15: 4.5, p50: 5.1, p85: 5.8, p97: 6.6 },
  { month: 3, p3: 4.5, p15: 5.2, p50: 5.8, p85: 6.6, p97: 7.5 },
  { month: 4, p3: 5.0, p15: 5.7, p50: 6.4, p85: 7.3, p97: 8.2 },
  { month: 5, p3: 5.4, p15: 6.1, p50: 6.9, p85: 7.8, p97: 8.8 },
  { month: 6, p3: 5.7, p15: 6.5, p50: 7.3, p85: 8.2, p97: 9.3 },
  { month: 7, p3: 6.0, p15: 6.8, p50: 7.6, p85: 8.6, p97: 9.8 },
  { month: 8, p3: 6.3, p15: 7.0, p50: 7.9, p85: 9.0, p97: 10.2 },
  { month: 9, p3: 6.5, p15: 7.3, p50: 8.2, p85: 9.3, p97: 10.5 },
  { month: 10, p3: 6.7, p15: 7.5, p50: 8.5, p85: 9.6, p97: 10.9 },
  { month: 11, p3: 6.9, p15: 7.7, p50: 8.7, p85: 9.9, p97: 11.2 },
  { month: 12, p3: 7.0, p15: 7.9, p50: 8.9, p85: 10.1, p97: 11.5 },
  { month: 13, p3: 7.2, p15: 8.1, p50: 9.2, p85: 10.4, p97: 11.8 },
  { month: 14, p3: 7.4, p15: 8.3, p50: 9.4, p85: 10.6, p97: 12.1 },
  { month: 15, p3: 7.6, p15: 8.5, p50: 9.6, p85: 10.9, p97: 12.4 },
  { month: 16, p3: 7.7, p15: 8.7, p50: 9.8, p85: 11.1, p97: 12.6 },
  { month: 17, p3: 7.9, p15: 8.9, p50: 10.0, p85: 11.4, p97: 12.9 },
  { month: 18, p3: 8.1, p15: 9.1, p50: 10.2, p85: 11.6, p97: 13.2 },
  { month: 19, p3: 8.2, p15: 9.2, p50: 10.4, p85: 11.8, p97: 13.5 },
  { month: 20, p3: 8.4, p15: 9.4, p50: 10.6, p85: 12.1, p97: 13.7 },
  { month: 21, p3: 8.6, p15: 9.6, p50: 10.9, p85: 12.3, p97: 14.0 },
  { month: 22, p3: 8.7, p15: 9.8, p50: 11.1, p85: 12.5, p97: 14.3 },
  { month: 23, p3: 8.9, p15: 10.0, p50: 11.3, p85: 12.8, p97: 14.6 },
  { month: 24, p3: 9.0, p15: 10.2, p50: 11.5, p85: 13.0, p97: 14.8 },
];

// ─── HEIGHT / LENGTH (cm) ───

const HEIGHT_BOYS: GrowthDataSet = [
  { month: 0, p3: 46.1, p15: 47.9, p50: 49.9, p85: 51.8, p97: 53.7 },
  { month: 1, p3: 50.8, p15: 52.4, p50: 54.7, p85: 56.7, p97: 58.6 },
  { month: 2, p3: 54.4, p15: 56.0, p50: 58.4, p85: 60.6, p97: 62.4 },
  { month: 3, p3: 57.3, p15: 59.0, p50: 61.4, p85: 63.5, p97: 65.5 },
  { month: 4, p3: 59.7, p15: 61.4, p50: 63.9, p85: 66.0, p97: 68.0 },
  { month: 5, p3: 61.7, p15: 63.4, p50: 65.9, p85: 68.0, p97: 70.1 },
  { month: 6, p3: 63.3, p15: 65.1, p50: 67.6, p85: 69.8, p97: 71.9 },
  { month: 7, p3: 64.8, p15: 66.7, p50: 69.2, p85: 71.3, p97: 73.5 },
  { month: 8, p3: 66.2, p15: 68.0, p50: 70.6, p85: 72.8, p97: 75.0 },
  { month: 9, p3: 67.5, p15: 69.3, p50: 72.0, p85: 74.2, p97: 76.5 },
  { month: 10, p3: 68.7, p15: 70.5, p50: 73.3, p85: 75.6, p97: 77.9 },
  { month: 11, p3: 69.9, p15: 71.7, p50: 74.5, p85: 76.9, p97: 79.2 },
  { month: 12, p3: 71.0, p15: 72.8, p50: 75.7, p85: 78.1, p97: 80.5 },
  { month: 13, p3: 72.1, p15: 73.9, p50: 76.9, p85: 79.3, p97: 81.8 },
  { month: 14, p3: 73.1, p15: 75.0, p50: 78.0, p85: 80.5, p97: 83.0 },
  { month: 15, p3: 74.1, p15: 76.0, p50: 79.1, p85: 81.7, p97: 84.2 },
  { month: 16, p3: 75.0, p15: 77.0, p50: 80.2, p85: 82.8, p97: 85.4 },
  { month: 17, p3: 76.0, p15: 78.0, p50: 81.2, p85: 83.9, p97: 86.5 },
  { month: 18, p3: 76.9, p15: 78.9, p50: 82.3, p85: 85.0, p97: 87.7 },
  { month: 19, p3: 77.7, p15: 79.9, p50: 83.2, p85: 86.1, p97: 88.8 },
  { month: 20, p3: 78.6, p15: 80.8, p50: 84.2, p85: 87.1, p97: 89.8 },
  { month: 21, p3: 79.4, p15: 81.7, p50: 85.1, p85: 88.1, p97: 90.9 },
  { month: 22, p3: 80.2, p15: 82.5, p50: 86.0, p85: 89.1, p97: 91.9 },
  { month: 23, p3: 81.0, p15: 83.3, p50: 86.9, p85: 90.0, p97: 92.9 },
  { month: 24, p3: 81.7, p15: 84.1, p50: 87.8, p85: 90.9, p97: 93.9 },
];

const HEIGHT_GIRLS: GrowthDataSet = [
  { month: 0, p3: 45.4, p15: 47.3, p50: 49.1, p85: 51.0, p97: 52.9 },
  { month: 1, p3: 49.8, p15: 51.5, p50: 53.7, p85: 55.6, p97: 57.6 },
  { month: 2, p3: 53.0, p15: 54.8, p50: 57.1, p85: 59.1, p97: 59.2 },
  { month: 3, p3: 55.6, p15: 57.4, p50: 59.8, p85: 62.0, p97: 64.0 },
  { month: 4, p3: 57.8, p15: 59.6, p50: 62.1, p85: 64.3, p97: 66.4 },
  { month: 5, p3: 59.6, p15: 61.5, p50: 64.0, p85: 66.3, p97: 68.5 },
  { month: 6, p3: 61.2, p15: 63.2, p50: 65.7, p85: 68.0, p97: 70.3 },
  { month: 7, p3: 62.7, p15: 64.6, p50: 67.3, p85: 69.6, p97: 71.9 },
  { month: 8, p3: 64.0, p15: 66.0, p50: 68.7, p85: 71.1, p97: 73.5 },
  { month: 9, p3: 65.3, p15: 67.3, p50: 70.1, p85: 72.6, p97: 75.0 },
  { month: 10, p3: 66.5, p15: 68.5, p50: 71.5, p85: 74.0, p97: 76.4 },
  { month: 11, p3: 67.7, p15: 69.7, p50: 72.8, p85: 75.3, p97: 77.8 },
  { month: 12, p3: 68.9, p15: 70.9, p50: 74.0, p85: 76.6, p97: 79.2 },
  { month: 13, p3: 70.0, p15: 72.0, p50: 75.2, p85: 77.8, p97: 80.5 },
  { month: 14, p3: 71.0, p15: 73.1, p50: 76.4, p85: 79.1, p97: 81.7 },
  { month: 15, p3: 72.0, p15: 74.2, p50: 77.5, p85: 80.2, p97: 83.0 },
  { month: 16, p3: 73.0, p15: 75.2, p50: 78.6, p85: 81.4, p97: 84.2 },
  { month: 17, p3: 74.0, p15: 76.2, p50: 79.7, p85: 82.5, p97: 85.4 },
  { month: 18, p3: 74.9, p15: 77.2, p50: 80.7, p85: 83.6, p97: 86.5 },
  { month: 19, p3: 75.8, p15: 78.1, p50: 81.7, p85: 84.7, p97: 87.6 },
  { month: 20, p3: 76.7, p15: 79.1, p50: 82.7, p85: 85.7, p97: 88.7 },
  { month: 21, p3: 77.5, p15: 80.0, p50: 83.7, p85: 86.7, p97: 89.8 },
  { month: 22, p3: 78.4, p15: 80.9, p50: 84.6, p85: 87.7, p97: 90.8 },
  { month: 23, p3: 79.2, p15: 81.7, p50: 85.5, p85: 88.7, p97: 91.9 },
  { month: 24, p3: 80.0, p15: 82.5, p50: 86.4, p85: 89.6, p97: 92.9 },
];

// ─── HEAD CIRCUMFERENCE (cm) ───

const HEAD_BOYS: GrowthDataSet = [
  { month: 0, p3: 32.1, p15: 33.1, p50: 34.5, p85: 35.8, p97: 36.9 },
  { month: 1, p3: 34.9, p15: 35.8, p50: 37.3, p85: 38.6, p97: 39.6 },
  { month: 2, p3: 36.8, p15: 37.8, p50: 39.1, p85: 40.5, p97: 41.5 },
  { month: 3, p3: 38.1, p15: 39.1, p50: 40.5, p85: 41.9, p97: 42.9 },
  { month: 4, p3: 39.2, p15: 40.2, p50: 41.6, p85: 43.0, p97: 44.0 },
  { month: 5, p3: 40.1, p15: 41.0, p50: 42.6, p85: 43.9, p97: 44.9 },
  { month: 6, p3: 40.9, p15: 41.8, p50: 43.3, p85: 44.7, p97: 45.8 },
  { month: 7, p3: 41.5, p15: 42.4, p50: 44.0, p85: 45.4, p97: 46.4 },
  { month: 8, p3: 42.0, p15: 42.9, p50: 44.5, p85: 46.0, p97: 47.0 },
  { month: 9, p3: 42.5, p15: 43.4, p50: 45.0, p85: 46.4, p97: 47.4 },
  { month: 10, p3: 42.9, p15: 43.8, p50: 45.4, p85: 46.8, p97: 47.8 },
  { month: 11, p3: 43.2, p15: 44.1, p50: 45.8, p85: 47.2, p97: 48.2 },
  { month: 12, p3: 43.5, p15: 44.4, p50: 46.1, p85: 47.5, p97: 48.5 },
  { month: 15, p3: 44.2, p15: 45.1, p50: 46.8, p85: 48.3, p97: 49.3 },
  { month: 18, p3: 44.7, p15: 45.7, p50: 47.4, p85: 48.8, p97: 49.9 },
  { month: 21, p3: 45.2, p15: 46.1, p50: 47.8, p85: 49.3, p97: 50.3 },
  { month: 24, p3: 45.5, p15: 46.5, p50: 48.2, p85: 49.7, p97: 50.7 },
];

const HEAD_GIRLS: GrowthDataSet = [
  { month: 0, p3: 31.5, p15: 32.4, p50: 33.9, p85: 35.1, p97: 36.2 },
  { month: 1, p3: 34.2, p15: 35.1, p50: 36.5, p85: 37.9, p97: 38.9 },
  { month: 2, p3: 35.8, p15: 36.8, p50: 38.3, p85: 39.6, p97: 40.7 },
  { month: 3, p3: 37.1, p15: 38.0, p50: 39.5, p85: 40.9, p97: 42.0 },
  { month: 4, p3: 38.1, p15: 39.0, p50: 40.6, p85: 41.9, p97: 43.0 },
  { month: 5, p3: 38.9, p15: 39.9, p50: 41.5, p85: 42.7, p97: 43.8 },
  { month: 6, p3: 39.6, p15: 40.6, p50: 42.2, p85: 43.5, p97: 44.6 },
  { month: 7, p3: 40.2, p15: 41.2, p50: 42.8, p85: 44.1, p97: 45.2 },
  { month: 8, p3: 40.7, p15: 41.7, p50: 43.4, p85: 44.7, p97: 45.8 },
  { month: 9, p3: 41.2, p15: 42.2, p50: 43.8, p85: 45.2, p97: 46.3 },
  { month: 10, p3: 41.5, p15: 42.6, p50: 44.2, p85: 45.6, p97: 46.7 },
  { month: 11, p3: 41.9, p15: 42.9, p50: 44.6, p85: 46.0, p97: 47.1 },
  { month: 12, p3: 42.2, p15: 43.2, p50: 44.9, p85: 46.3, p97: 47.4 },
  { month: 15, p3: 42.9, p15: 43.9, p50: 45.6, p85: 47.1, p97: 48.2 },
  { month: 18, p3: 43.5, p15: 44.5, p50: 46.2, p85: 47.7, p97: 48.8 },
  { month: 21, p3: 43.9, p15: 44.9, p50: 46.7, p85: 48.1, p97: 49.3 },
  { month: 24, p3: 44.3, p15: 45.3, p50: 47.0, p85: 48.5, p97: 49.7 },
];

// ─── PUBLIC API ───

export type GrowthMetric = 'weight' | 'height' | 'head';

const DATA_MAP: Record<GrowthMetric, Record<BabySex, GrowthDataSet>> = {
  weight: { male: WEIGHT_BOYS, female: WEIGHT_GIRLS },
  height: { male: HEIGHT_BOYS, female: HEIGHT_GIRLS },
  head: { male: HEAD_BOYS, female: HEAD_GIRLS },
};

export function getGrowthData(metric: GrowthMetric, sex: BabySex): GrowthDataSet {
  return DATA_MAP[metric][sex];
}

export const METRIC_LABELS: Record<GrowthMetric, string> = {
  weight: 'Weight',
  height: 'Height',
  head: 'Head Circ.',
};

export const METRIC_UNITS: Record<GrowthMetric, string> = {
  weight: 'kg',
  height: 'cm',
  head: 'cm',
};

export const PERCENTILE_LABELS: Record<string, string> = {
  p3: '3rd',
  p15: '15th',
  p50: '50th',
  p85: '85th',
  p97: '97th',
};

/**
 * Estimate which percentile range a value falls in, at a given age.
 * Returns a human-readable string like "between 50th and 85th percentile".
 */
export function estimatePercentileRange(
  metric: GrowthMetric,
  sex: BabySex,
  ageMonths: number,
  value: number,
): string {
  const data = getGrowthData(metric, sex);

  // Find the two bracketing rows for interpolation
  let row: PercentileRow | undefined;
  for (let i = 0; i < data.length; i++) {
    if (data[i].month >= ageMonths) {
      if (data[i].month === ageMonths || i === 0) {
        row = data[i];
      } else {
        // Linear interpolation between data[i-1] and data[i]
        const prev = data[i - 1];
        const next = data[i];
        const t = (ageMonths - prev.month) / (next.month - prev.month);
        row = {
          month: ageMonths,
          p3: prev.p3 + t * (next.p3 - prev.p3),
          p15: prev.p15 + t * (next.p15 - prev.p15),
          p50: prev.p50 + t * (next.p50 - prev.p50),
          p85: prev.p85 + t * (next.p85 - prev.p85),
          p97: prev.p97 + t * (next.p97 - prev.p97),
        };
      }
      break;
    }
  }

  if (!row) row = data[data.length - 1];

  if (value < row.p3) return 'below 3rd percentile';
  if (value < row.p15) return 'between 3rd and 15th percentile';
  if (value < row.p50) return 'between 15th and 50th percentile';
  if (value < row.p85) return 'between 50th and 85th percentile';
  if (value < row.p97) return 'between 85th and 97th percentile';
  return 'above 97th percentile';
}
