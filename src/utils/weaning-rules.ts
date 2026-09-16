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
 * With eczema the guide puts the whole start of weaning under a doctor
 * (授乳・離乳の支援ガイド p.33: 必ず医師の指示に基づいて) and asks for the eczema
 * to be treated first; the food page says so. Only egg is singled out by a
 * source (鶏卵アレルギー発症予防に関する提言 2017). Adding milk and wheat is this
 * app's conservative choice: with egg they are 95.6 % of reactions at age 0
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

/**
 * Japanese guidance says not to delay any food (guide p.33); egg is the one
 * with a specific early-start recommendation (手引き2023 表7, JGFA2026 draft
 * 表6-2), so it gets the ranking nudge.
 */
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
 * introduced. Guide p.32: 「魚は白身魚から赤身魚、青皮魚へ、卵は卵黄から全卵へ」.
 * Yolk after tofu or white fish is this app's choice: the guide lists
 * 豆腐・白身魚・卵黄 as one step, and the wait costs days, not weeks. Meat order:
 * Osaka city table (practice).
 */
export const LADDERS: Record<string, readonly Rung[]> = {
  firstProteins: [
    { label: 'silken tofu or white fish', ids: ['silken-tofu', 'cod', 'flounder-boiled', 'sea-bream-boiled', 'shirasu', 'shirasuboshi'] },
    { label: 'egg yolk', ids: ['egg-yolk'] },
  ],
  fish: [
    // Sawara is cooked as a white fish in Japan; it waits on its own stage (3).
    // Swordfish and shishamo have no agreed group and are left out.
    { label: 'white fish', ids: ['cod', 'flounder-boiled', 'sea-bream-boiled', 'shirasu', 'shirasuboshi', 'sawara-boiled'] },
    { label: 'red fish', ids: ['salmon-boiled', 'salmon-canned', 'tuna-boiled', 'tuna-canned-water', 'katsuo-boiled'] },
    { label: 'blue-backed fish', ids: ['aji-boiled', 'mackerel-boiled', 'mackerel-canned', 'sardine-boiled', 'saury-grilled', 'yellowtail-boiled'] },
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
  'oral-rehydration-solution', 'formula-powder', 'formula-prepared', 'human-milk',
]);

/** Groups open in each 初期 phase. Guide p.32 order. */
export const PHASE_GROUPS: Record<WeaningPhase, readonly FoodGroup[]> = {
  porridge: ['grain'],
  vegetables: ['grain', 'vegetable', 'fruit', 'other'],
  proteins: FOOD_GROUPS,
};

/**
 * Practice, not in the official guide, which gives no days: 那覇市 adds
 * vegetables about a week after porridge starts and protein 「野菜を始めてから
 * 約1週間」; 港区 weeks 2 and 3; 豊見城市 is slower (protein around day 19–21).
 * Protein counts from the first vegetable, not from the start of weaning.
 */
export const PHASE_DAYS = { vegetables: 7, proteinsAfterVegetables: 7 } as const;

/**
 * Heuristic stand-in for the guide's 「慣れてきたら」 (once the baby is used to
 * it): a food eaten at this many meals opens the next group. The log records
 * meals, not how much was eaten, so this cannot see a baby still refusing.
 */
export const USED_TO_EXPOSURES = 3;

/**
 * Heuristic, used only when progress lags age. Leaving stage 1 needs about a
 * month and protein foods in place (2007 guide and 那覇市: two meals after
 * about a month; 2019 guide: protein established by then). Later stages: at
 * least a month each — no source gives a value.
 */
export const PROGRESSION_STAGE_DAYS = { 2: 30, 3: 60, 4: 90 } as const;

/**
 * Heuristic: no Japanese source sets days between allergens. A few calendar
 * days keep a reaction attributable (counted from the start of the day, so
 * about two and a half days in practice).
 */
export const NEW_ALLERGEN_SPACING_DAYS = 3;

/**
 * At least weekly once a major allergen is introduced. Japanese sources say
 * "regular and continued" without a number (JGFA2026 draft p.54); weekly is
 * CSACI 2023 as quoted by Sakihara 2024 (アレルギー 73:264).
 */
export const MAINTENANCE_GAP_DAYS = 7;

/**
 * A first serving, in grams. Practice: the city calendars start a new food at
 * 小さじ1 and work up over a few days. Used both to shop for a first taste and
 * to ask whether that taste would pass an upper intake limit.
 */
export const FIRST_TASTE_GRAMS = 15;

/** Guide p.32: iron and vitamin D sources from about 6 months, especially if breastfed. */
export const NUTRIENT_NUDGE_FROM_MONTHS = 6;
export const IRON_RICH_MG = 1.5;
export const VITAMIN_D_SOURCE_UG = 1;
