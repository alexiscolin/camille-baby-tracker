import type { BabySex } from '../types/events';
import type { NutrientKey } from '../types/food';
import type { NutrientKind, ReferenceValue } from '../utils/nutrient-weather';

/**
 * Daily intakes from 日本人の食事摂取基準（2025年版）, 厚生労働省, as posted after the
 * 令和7年3月25日 正誤表. Tables 表3 (p.375) for 乳児, 表5 (p.376) for 1〜2歳, in
 * 『Ⅱ 各論 2-2 乳児・小児』; 基準哺乳量 from p.367.
 * Evidence: docs/superpowers/specs/2026-09-16-nutrient-weather-design.md.
 *
 * Three things about this table are easy to get wrong, and all three were wrong
 * in the first draft of this feature:
 *
 * 1. **6〜11か月 is not one band.** Energy and protein are published as 6〜8 and
 *    9〜11 with no merged figure; everything else is merged. So the bands here
 *    are 6〜8, 9〜11 and 1〜2歳, and the merged values simply repeat.
 * 2. **Iron no longer splits by sex.** 2020 had 5.0 男 / 4.5 女; 2025 puts the
 *    split in the 推定平均必要量 (3.5 / 3.0) and gives one 推奨量 of 4.5 to both.
 *    The 2020 numbers are still all over the web — do not "correct" this back.
 * 3. **Iron has no 耐容上限量 at any age** (2025, p.298): the 2020 ceiling for
 *    1〜2歳 was withdrawn. Never reinstate one.
 *
 * Re-check when the next edition lands (2030年版).
 */

/** Display names, shared by the charts and the suggestion reasons. */
export const NUTRIENT_LABEL: Record<NutrientKey, string> = {
  energyKcal: 'Energy',
  proteinG: 'Protein',
  fatG: 'Fat',
  carbsG: 'Carbs',
  fiberG: 'Fibre',
  sugarsG: 'Sugars',
  ironMg: 'Iron',
  calciumMg: 'Calcium',
  zincMg: 'Zinc',
  sodiumMg: 'Sodium',
  potassiumMg: 'Potassium',
  vitaminAUgRae: 'Vitamin A',
  vitaminCMg: 'Vitamin C',
  vitaminDUg: 'Vitamin D',
  vitaminB12Ug: 'Vitamin B12',
  folateUg: 'Folate',
};

/** The unit each key is stored in, for rows that show a number instead of a verdict. */
export const NUTRIENT_UNIT: Record<NutrientKey, string> = {
  energyKcal: 'kcal',
  proteinG: 'g', fatG: 'g', carbsG: 'g', fiberG: 'g', sugarsG: 'g',
  ironMg: 'mg', calciumMg: 'mg', zincMg: 'mg', sodiumMg: 'mg', potassiumMg: 'mg',
  vitaminCMg: 'mg',
  vitaminAUgRae: 'µg', vitaminDUg: 'µg', vitaminB12Ug: 'µg', folateUg: 'µg',
};

interface Row {
  key: NutrientKey;
  kind: NutrientKind;
  male: number;
  /** Omitted when the guide gives one figure to both. */
  female?: number;
  /** 耐容上限量, only where the guide sets one at this age. */
  ceiling?: number;
  /** Why this row is shown as an amount rather than graded. */
  note?: string;
}

/**
 * 食塩相当量 (g) = ナトリウム (mg) x 2.54 / 1000, the guide's own conversion. The
 * app stores sodium, the guide sets the toddler ceiling as salt, so one of them
 * has to be converted and it is this one.
 */
const SALT_G_TO_SODIUM_MG = 1000 / 2.54;

/**
 * No published figure at this age, so they are shown and never graded. Sugars
 * and "slow carbs" (carbs less sugars) live here too: the guide sets no infant
 * value, and a threshold invented locally would discredit the rows that have one.
 */
const UNGRADED: Row[] = ['fatG', 'carbsG', 'fiberG', 'sugarsG']
  .map((key) => ({ key: key as NutrientKey, kind: 'context' as const, male: 0 }));

/**
 * Merged 6〜11か月 values, identical in both infant bands.
 *
 * Sodium is `context`, not a ceiling: at this age the guide publishes 600 mg as
 * a 目安量 (an adequacy figure) with no 目標量 and no 耐容上限量. Drawing it as a
 * limit would be this app inventing a rule; drawing it as a floor would nudge a
 * parent to salt a baby's food. So it shows the number and says nothing.
 */
const INFANT_SHARED: Row[] = [
  { key: 'ironMg', kind: 'target', male: 4.5 },
  { key: 'calciumMg', kind: 'target', male: 250 },
  { key: 'zincMg', kind: 'target', male: 2.0 },
  { key: 'potassiumMg', kind: 'target', male: 700 },
  { key: 'vitaminAUgRae', kind: 'target', male: 400, ceiling: 600 },
  { key: 'vitaminCMg', kind: 'target', male: 40 },
  { key: 'vitaminDUg', kind: 'target', male: 5.0, ceiling: 25 },
  { key: 'vitaminB12Ug', kind: 'target', male: 0.9 },
  { key: 'folateUg', kind: 'target', male: 70 },
  { key: 'sodiumMg', kind: 'context', male: 600, note: 'an adequacy figure, not a limit' },
  ...UNGRADED,
];

interface Band {
  fromMonths: number;
  /** 基準哺乳量, p.367 — the volume the guide derived this band's values from. */
  milkMl: number;
  rows: Row[];
}

const BANDS: Band[] = [
  {
    /**
     * 0〜5か月. Every value here except energy is a 目安量 derived as
     * 母乳中濃度 × 0.78 L/日 (p.367-368), so the whole band describes what milk
     * alone supplies. The app shows it from 5 months because 初期 may start
     * then (授乳・離乳の支援ガイド: 離乳の開始は生後5〜6か月頃) and the app's own
     * stages do.
     *
     * Iron is deliberately NOT graded here. The guide takes
     * 0.35 mg/L × 0.78 L/日 = 0.273 mg/日 and rounds it to 0.5 (p.293), while
     * taking the identical 0.273 mg/日 for copper and rounding it to 0.3
     * (p.306). Same arithmetic, same document, two answers — so 0.5 is a
     * deliberate safety margin above what breast milk provides, not a
     * measurement of it. Dividing milk by that margin would mark every
     * exclusively breastfed baby as short of iron, at an age when the only
     * remedy the guide offers does not start until about 6 months.
     *
     * Sodium is ungraded for the same reason as the later bands: 目安量, with
     * no 目標量 and no 耐容上限量 at this age.
     */
    fromMonths: 5,
    milkMl: 780,
    rows: [
      { key: 'energyKcal', kind: 'target', male: 550, female: 500 },
      { key: 'proteinG', kind: 'target', male: 10 },
      {
        key: 'ironMg', kind: 'context', male: 0.5,
        note: 'set above what milk supplies, so a share of it would mislead',
      },
      { key: 'calciumMg', kind: 'target', male: 200 },
      { key: 'zincMg', kind: 'target', male: 1.5 },
      { key: 'potassiumMg', kind: 'target', male: 400 },
      { key: 'vitaminAUgRae', kind: 'target', male: 300, ceiling: 600 },
      { key: 'vitaminCMg', kind: 'target', male: 40 },
      { key: 'vitaminDUg', kind: 'target', male: 5.0, ceiling: 25 },
      { key: 'vitaminB12Ug', kind: 'target', male: 0.4 },
      { key: 'folateUg', kind: 'target', male: 40 },
      { key: 'sodiumMg', kind: 'context', male: 100, note: 'an adequacy figure, not a limit' },
      ...UNGRADED,
    ],
  },
  {
    fromMonths: 6,
    milkMl: 600,
    rows: [
      { key: 'energyKcal', kind: 'target', male: 650, female: 600 },
      { key: 'proteinG', kind: 'target', male: 15 },
      ...INFANT_SHARED,
    ],
  },
  {
    fromMonths: 9,
    milkMl: 450,
    rows: [
      { key: 'energyKcal', kind: 'target', male: 700, female: 650 },
      { key: 'proteinG', kind: 'target', male: 25 },
      ...INFANT_SHARED,
    ],
  },
  {
    fromMonths: 12,
    // ponytail: heuristic. The guide gives no 基準哺乳量 past 11 months, so the
    // last published volume is carried forward; the parent edits it in Settings,
    // which is the real answer at an age when milk intake varies enormously.
    milkMl: 450,
    rows: [
      { key: 'energyKcal', kind: 'target', male: 950, female: 900 },
      { key: 'proteinG', kind: 'target', male: 20 },
      { key: 'ironMg', kind: 'target', male: 4.0 },
      { key: 'calciumMg', kind: 'target', male: 450, female: 400 },
      { key: 'zincMg', kind: 'target', male: 3.5, female: 3.0 },
      { key: 'potassiumMg', kind: 'target', male: 900, female: 800 },
      { key: 'vitaminAUgRae', kind: 'target', male: 400, female: 350, ceiling: 600 },
      { key: 'vitaminCMg', kind: 'target', male: 35 },
      { key: 'vitaminDUg', kind: 'target', male: 3.5, ceiling: 25 },
      { key: 'vitaminB12Ug', kind: 'target', male: 1.5 },
      { key: 'folateUg', kind: 'target', male: 90, ceiling: 200 },
      // Now a real 目標量 ceiling: 食塩相当量 3.0 g 未満 / 2.5 g 未満.
      {
        key: 'sodiumMg',
        kind: 'limit',
        male: 3.0 * SALT_G_TO_SODIUM_MG,
        female: 2.5 * SALT_G_TO_SODIUM_MG,
      },
      ...UNGRADED,
    ],
  },
];

/** The band covering this age, or null before weaning food is meant to nourish. */
function bandFor(ageMonths: number): Band | null {
  return [...BANDS].reverse().find((b) => ageMonths >= b.fromMonths) ?? null;
}

/**
 * The volume of milk this age's reference values were derived against, used as
 * the default when a family has not set their own.
 */
export function ASSUMED_MILK_ML(ageMonths: number): number {
  return bandFor(ageMonths)?.milkMl ?? 0;
}

/**
 * Published daily intakes for this age and sex, before milk is taken off them.
 * Empty under six months: milk is still the whole diet, and grading a taste of
 * porridge against a daily requirement would be both wrong and frightening.
 */
export function referenceFor(ageMonths: number, sex?: BabySex): ReferenceValue[] {
  const band = bandFor(ageMonths);
  if (!band) return [];

  return band.rows.map(({ key, kind, male, female, ceiling, note }) => {
    const alt = female ?? male;
    return {
      key,
      kind,
      ...(note === undefined ? {} : { note }),
      // Sex is optional on a baby. With none recorded, take the side that asks
      // more of the food: the higher figure for a floor, the lower for a
      // ceiling. Erring the other way would quietly mark a gap as covered.
      amount: sex === undefined
        ? (kind === 'limit' ? Math.min(male, alt) : Math.max(male, alt))
        : (sex === 'female' ? alt : male),
      ...(ceiling === undefined ? {} : { ceiling }),
    };
  });
}
