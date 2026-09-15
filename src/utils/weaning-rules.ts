import type { FoodGroup, WeaningPhase } from '../types/food';
import { FOOD_GROUPS } from '../types/food';
import type { Allergen } from './allergens';
import { MANDATORY_ALLERGENS } from './allergens';

/**
 * Every constant here is a rule the food suggestions follow, with its source.
 * Evidence: docs/superpowers/specs/2026-09-15-weaning-guidance-research/.
 * "practice" = municipal leaflets fill a gap the official guide leaves;
 * "heuristic" = no source gives a value, chosen here.
 * Re-check when JSPACI's 食物アレルギー診療ガイドライン2026 is published
 * (planned 2026-11-28) or 授乳・離乳の支援ガイド is revised.
 */

/**
 * No Japanese early-introduction advice: JGFA2026 draft p.54, Sakihara 2024
 * (アレルギー 73:265), 消費者庁 2021 on nuts for under-6s. Fish roe, shellfish and
 * buckwheat have no weaning age in the guide.
 */
export const ASK_DOCTOR_ALLERGENS: readonly Allergen[] = [
  'peanut', 'walnut', 'cashew', 'almond', 'macadamia', 'pistachio',
  'shrimp', 'crab', 'buckwheat', 'salmon_roe',
];

/**
 * With eczema: 授乳・離乳の支援ガイド p.33 (必ず医師の指示に基づいて), 鶏卵アレルギー
 * 発症予防に関する提言 2017. Egg, milk and wheat are 95.6 % of reactions at age 0
 * (消費者庁 即時型調査, 2024).
 */
export const ECZEMA_DOCTOR_ALLERGENS: readonly Allergen[] = ['egg', 'milk', 'wheat'];

/**
 * Allergens whose first taste is paced and timed for clinic hours: the
 * mandatory labelling list, which tracks frequency and severity (消費者庁).
 * Fruit and fish on the recommended list are introduced in the guide's normal
 * order without spacing (栄養食事指導の手引き2022: rice and vegetables rarely
 * cause allergy; no Japanese source spaces fruit).
 */
export const PACED_ALLERGENS: readonly Allergen[] = MANDATORY_ALLERGENS;

/** The one allergen Japanese guidance asks not to delay (手引き2023 表7, JGFA2026 draft 表6-2). */
export const PUSHED_ALLERGEN: Allergen = 'egg';

export interface Rung {
  label: string;
  ids: readonly string[];
}

/**
 * A food carrying one of these allergens waits until the allergen has been
 * introduced, unless it is one of the entry foods itself. Guide p.32 order;
 * seed audit §4 prerequisite chains.
 */
export const ALLERGEN_ENTRY: Partial<Record<Allergen, Rung>> = {
  egg: { label: 'egg yolk', ids: ['egg-yolk'] },
  milk: { label: 'yoghurt', ids: ['plain-yoghurt', 'cottage-cheese', 'formula-powder', 'formula-prepared'] },
  wheat: { label: 'udon or somen', ids: ['udon-boiled', 'udon-dried', 'somen-boiled', 'shokupan'] },
  soy: { label: 'silken tofu', ids: ['silken-tofu'] },
  sesame: { label: 'ground sesame', ids: ['sesame-ground', 'sesame-paste'] },
};

/**
 * Each rung waits until a food from the previous rung — or any later one — is
 * introduced. Guide p.32: 「魚は白身魚から赤身魚、青皮魚へ、卵は卵黄から全卵へ」;
 * 初期 proteins 豆腐・白身魚・卵黄 in that order (港区). Meat order: Osaka city
 * table, たまひよ (practice).
 */
export const LADDERS: Record<string, readonly Rung[]> = {
  firstProteins: [
    { label: 'silken tofu or white fish', ids: ['silken-tofu', 'cod', 'flounder-boiled', 'sea-bream-boiled', 'shirasu', 'shirasuboshi'] },
    { label: 'egg yolk', ids: ['egg-yolk'] },
  ],
  fish: [
    { label: 'white fish', ids: ['cod', 'flounder-boiled', 'sea-bream-boiled', 'shirasu', 'shirasuboshi'] },
    { label: 'red fish', ids: ['salmon-boiled', 'salmon-canned', 'tuna-boiled', 'tuna-canned-water', 'katsuo-boiled', 'swordfish-boiled'] },
    { label: 'blue-backed fish', ids: ['aji-boiled', 'sawara-boiled', 'mackerel-boiled', 'mackerel-canned', 'sardine-boiled', 'saury-grilled', 'yellowtail-boiled', 'shishamo-grilled'] },
  ],
  egg: [
    { label: 'egg yolk', ids: ['egg-yolk'] },
    { label: 'whole egg', ids: ['egg-whole-boiled', 'egg-white-boiled'] },
    { label: 'other egg foods', ids: ['quail-egg-boiled', 'mayonnaise', 'tamago-bolo'] },
  ],
  meat: [
    { label: 'chicken sasami', ids: ['chicken-sasami-boiled'] },
    { label: 'lean chicken', ids: ['chicken-breast-boiled', 'chicken-mince-cooked', 'chicken-liver-boiled'] },
    { label: 'pork and beef', ids: ['chicken-thigh-boiled', 'pork-fillet-boiled', 'pork-loin-boiled', 'pork-mince-cooked', 'beef-thigh-lean-boiled', 'beef-mince-cooked', 'beef-liver-boiled', 'pork-liver-boiled'] },
    { label: 'processed meat', ids: ['ham-roast', 'wiener-sausage'] },
  ],
};

/** Drinks: never the start of weaning, never a staple to shop for. */
export const NON_SOLID_IDS: ReadonlySet<string> = new Set([
  'water', 'barley-tea', 'rooibos-tea', 'hojicha', 'sencha',
  'oral-rehydration-solution', 'formula-powder', 'formula-prepared',
]);

/** Groups open in each 初期 phase. Guide p.32 order. */
export const PHASE_GROUPS: Record<WeaningPhase, readonly FoodGroup[]> = {
  porridge: ['grain'],
  vegetables: ['grain', 'vegetable', 'fruit', 'other'],
  proteins: FOOD_GROUPS,
};

/** Practice: 那覇市 (vegetables day 7–10, protein day 11–15), 港区 (weeks 2 and 3). */
export const PHASE_DAYS = { vegetables: 7, proteins: 14 } as const;

/**
 * Heuristic, used only when progress lags age. Leaving stage 1 needs about a
 * month and protein foods in place (2007 guide and 那覇市: two meals after
 * about a month; 2019 guide: protein established by then). Later stages: at
 * least a month each — no source gives a value.
 */
export const PROGRESSION_STAGE_DAYS = { 2: 30, 3: 60, 4: 90 } as const;

/** Practice: a few days watched before the next allergen step (知花 clinic; PETIT stepped far slower). */
export const NEW_ALLERGEN_SPACING_DAYS = 3;

/** At least weekly once introduced (Sakihara 2024 citing CSACI 2023; ASCIA 2026). */
export const MAINTENANCE_GAP_DAYS = 7;

/** Guide p.32: iron and vitamin D sources from about 6 months, especially if breastfed. */
export const NUTRIENT_NUDGE_FROM_MONTHS = 6;
export const IRON_RICH_MG = 1.5;
export const VITAMIN_D_SOURCE_UG = 1;
