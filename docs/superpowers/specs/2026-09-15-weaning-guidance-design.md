# Weaning Guidance Compliance and Weekly Shopping List — Design

Date: 2026-09-15
Status: Implemented on branch feat/weaning-guidance (not committed)
Supersedes: §8 "Try next" of `2026-09-01-food-diversification-design.md`
Evidence: `2026-09-15-weaning-guidance-research/` (four sourced reports, every
rule below cites one of them)

## 1. Purpose

The food page suggests what to introduce next. An audit against official
Japanese guidance showed the suggestions are wrong in ways that matter: a baby
one week into solids is offered egg, wheat, dairy and peanut paste, because the
ranking rewards any untried labelling allergen and knows nothing about when
weaning started.

This work makes the suggestions follow Japanese guidance, and adds a weekly
shopping list for a family buying at Coop Okinawa.

One PR, both parts (§12).

### Governing constraint — advisory, never blocking

Recommendations guide; they never stop a parent. Every food stays visible,
tappable and loggable. A stricter rule changes a food's ranking, label and
explanation — it never hides the food behind a wall or disables logging.

### Success criteria

- A baby 7 days into weaning is never suggested egg, milk, wheat, soy, peanut,
  tree nuts, shellfish or buckwheat (regression test, §11).
- Every "not now" food says why, in one line, with the reason drawn from a
  rule that names its source.
- The page answers "what next" even on a day a new food was already given.
- The shopping list gives next week's quantities from the guide's portion table
  and says where each item comes from (Coop frozen, or local and in season).

### Non-goals

- Medical advice. The eczema setting changes wording and ranking; it never
  concludes anything.
- Warnings at logging time (e.g. honey under 12 months in `MealFields`). Worth
  doing; not in this PR (§13).
- Corrected age for preterm babies — dropped from the 2019 guide, not built.
- Sharing or ticking off the shopping list — declined by the family.
- Catalogue numbers or prices — the Coop range rotates weekly.

## 2. Sources and what they say

| Source | Status (checked 2026-09-15) | Used for |
| --- | --- | --- |
| 授乳・離乳の支援ガイド 2019 (MHLW, now hosted by こども家庭庁) | Current; no revision announced | Order of introduction, stages, portions, honey, cow's milk |
| 食物アレルギー診療ガイドライン 2021 (JSPACI) + 2026 draft (publication planned 2026-11-28) | 2021 current; 2026 draft read in full | Egg early, peanut/tree nuts not pushed, eczema |
| 食物アレルギーの診療の手引き 2023 (re-issued 2026-04) | Current | Heated egg from 5–6 months, milk |
| 鶏卵アレルギー発症予防に関する提言 2017 (JSPACI) | Current | Eczema + egg under a doctor |
| 消費者庁 allergen labelling, 令和8年4月 | Current | 9 mandatory + 20 recommended allergens |
| 消費者庁 choking warning 2021; こども家庭庁 誤嚥 food table 2026 | Current | Nuts ≤5 y, quartering, cooked apple/pear |
| 日本人の食事摂取基準 2025 | Current (FY2025–2029) | Nutrient reference values |
| 那覇市, 港区 weaning leaflets; 沖縄県小児保健協会 leaflet (2020) | Current | Days before vegetables and protein; Okinawan foods |
| すくすくスマイル 2026年6月号 (Coop Okinawa edition), あっぷる 611 | June 2026 | Coop frozen products, delivery cycle |

Where the official guide is silent and practice fills the gap, the rule is
marked **practice** in code and here. Where nothing sources a value, it is
marked **heuristic**.

### Findings against the current implementation

1. Stage is derived from age alone (`getWeaningStage`). The guide: 「月齢は
   あくまでも目安」, and introduction follows an order — つぶしがゆ → 野菜・果物 →
   豆腐・白身魚・固ゆでした卵黄 (p.32).
2. `rankNextFoods` adds +100 to any untried mandatory allergen, citing LEAP/PETIT.
   PETIT concerns egg only; JSPACI states no benefit is established for milk or
   wheat, and that early peanut is not recommended in Japan on current evidence.
   Tree nuts, shellfish, buckwheat and fish roe have no early-introduction advice.
3. No prerequisites: 「魚は白身魚から赤身魚、青皮魚へ、卵は卵黄から全卵へ」 is not
   modelled.
4. A flat 3-day gap after every new food (US AAP lower bound, contested). Japan:
   one spoonful, one new food a day, daytime on a weekday (practice).
5. Allergen maintenance flagged after 14 days. Sources support at least weekly.
6. Eczema — the risk modifier in every Japanese source — is not captured.
7. Nutrient gap compares solids alone against reference intakes that include
   0.45–0.6 L/day of milk, so "running low" fires almost always. Iron 5.0 and
   zinc 3.0 are 2020 values (2025: 4.5 and 2.0).
8. Allergen list is pre-2024: matsutake removed (2024-03-28), macadamia added
   (2024), cashew mandatory and pistachio recommended (2026-04-01).
9. Seed table: ~15 rows unsuitable during weaning, ~30 too early, 5 internally
   inconsistent, ~25 missing a safety note, a few Okinawan staples missing
   (full list §7).

## 3. Weaning progress — where the baby is

New pure module `src/utils/weaning-progress.ts`. It replaces age-only staging
wherever suggestions are made. `getWeaningStage` stays as the age input.

```ts
export type WeaningPhase = 'porridge' | 'vegetables' | 'proteins';

export interface WeaningProgress {
  ageMonths: number;
  /** Age-only stage, as today. Null under 5 months. */
  ageStage: WeaningStage | null;
  startedAt: Date | null;
  daysSinceStart: number | null;
  /** Only meaningful at stage 1; stage 2+ is always 'proteins'. */
  phase: WeaningPhase;
  /** min(ageStage, progressionStage). Null under 5 months. */
  stage: WeaningStage | null;
  mealsPerDay: 1 | 2 | 3;
  eczema: boolean;
}

export function getWeaningProgress(input: {
  birthDate: Date;
  weaningStartedAt?: Date;
  eczema?: boolean;
  foods: Food[];
  now: Date;
}): WeaningProgress;
```

### Start date

`baby.weaningStartedAt` when set in Settings; otherwise the earliest
`firstTriedAt` among the family's foods, ignoring drinks (`NON_SOLID_IDS`:
water, teas, formula, rehydration solution). Null when neither exists.

### Phase (first month) — practice

| Phase | Reached when | Source |
| --- | --- | --- |
| `porridge` | Weaning started (or not yet started) | Guide p.32 |
| `vegetables` | (a grain is introduced **and** day ≥ 7) **or** a vegetable/fruit is already introduced | 那覇市 (day 7–10), 港区 (week 2) |
| `proteins` | phase ≥ vegetables **and** ((a vegetable/fruit is introduced **and** day ≥ 14) **or** a protein/dairy food is already introduced) | 那覇市 (day 11–15), 港区 (week 3) |

The "already introduced" branches mean the app follows the family when they went
faster; it never demotes them.

### Stage

- `ageStage` — unchanged (`<5` null, `<7` 1, `<9` 2, `<12` 3, else 4).
- `progressionStage` — **heuristic**, labelled as such in code:
  - 1 until day ≥ 30 **and** a protein food is introduced (2007 guide and 那覇市:
    two meals after about a month; 2019 guide: protein established by then).
  - 2 from there; 3 from day ≥ 60; 4 from day ≥ 90.
- `stage = min(ageStage, progressionStage)`; before the start date,
  `progressionStage = 1`.
- `mealsPerDay`: stage 1 → 1, stage 2 → 2, stages 3–4 → 3 (guide p.34).

### Baby fields

| Field | Type | Written from | Rules |
| --- | --- | --- | --- |
| `weaningStartedAt` | `Timestamp`, optional | Settings date field; clearing it deletes the field | `!('weaningStartedAt' in data) \|\| data.weaningStartedAt is timestamp` |
| `eczema` | `boolean`, optional | Settings checkbox, written straight through like `hiddenEventTypes` | `!('eczema' in data) \|\| data.eczema is bool` |

No migration: absent means "derive" and `false`.

## 4. Rules — one module, every value sourced

New `src/utils/weaning-rules.ts`: data and small predicates only, each constant
with a comment naming its source. When the JSPACI 2026 guideline is published
(2026-11-28) or the guide is revised after the 令和7年乳幼児栄養調査, this is the
one file to change.

```ts
/** Never auto-suggested; shown as "ask your paediatrician". */
export const ASK_DOCTOR_ALLERGENS: readonly Allergen[] = [
  'peanut', 'walnut', 'cashew', 'almond', 'macadamia', 'pistachio',
  'shrimp', 'crab', 'buckwheat', 'salmon_roe',
];
/** Added to the list above when the baby has eczema. */
export const ECZEMA_DOCTOR_ALLERGENS: readonly Allergen[] = ['egg', 'milk', 'wheat'];

/** The one allergen Japanese guidance asks not to delay. */
export const PUSHED_ALLERGEN: Allergen = 'egg';

/** Foods carrying these allergens wait until one of the entry foods is in. */
export const ALLERGEN_ENTRY_FOODS: Partial<Record<Allergen, readonly string[]>> = {
  egg: ['egg-yolk'],
  milk: ['plain-yoghurt', 'cottage-cheese', 'formula-powder', 'formula-prepared'],
  wheat: ['udon-boiled', 'udon-dried', 'somen-boiled', 'shokupan'],
  soy: ['silken-tofu'],
  sesame: ['sesame-ground', 'sesame-paste'],
};

/** Each rung waits until any food of the previous rung is introduced. */
export const LADDERS: Record<string, readonly (readonly string[])[]> = {
  firstProteins: [
    ['silken-tofu', 'cod', 'flounder-boiled', 'sea-bream-boiled', 'shirasu', 'shirasuboshi'],
    ['egg-yolk'],
  ],
  fish: [
    ['cod', 'flounder-boiled', 'sea-bream-boiled', 'shirasu', 'shirasuboshi'],
    ['salmon-boiled', 'salmon-canned', 'tuna-boiled', 'tuna-canned-water', 'katsuo-boiled', 'swordfish-boiled'],
    ['aji-boiled', 'sawara-boiled', 'mackerel-boiled', 'mackerel-canned', 'sardine-boiled',
     'saury-grilled', 'yellowtail-boiled', 'shishamo-grilled'],
  ],
  egg: [
    ['egg-yolk'],
    ['egg-whole-boiled', 'egg-white-boiled'],
    ['quail-egg-boiled', 'mayonnaise', 'tamago-bolo'],
  ],
  meat: [
    ['chicken-sasami-boiled'],
    ['chicken-breast-boiled', 'chicken-mince-cooked', 'chicken-liver-boiled'],
    ['chicken-thigh-boiled', 'pork-fillet-boiled', 'pork-loin-boiled', 'pork-mince-cooked',
     'beef-thigh-lean-boiled', 'beef-mince-cooked', 'beef-liver-boiled', 'pork-liver-boiled'],
    ['ham-roast', 'wiener-sausage'],
  ],
};

/** Spacing and the clinic-hours hint apply to these only: fruit and fish on the recommended list follow the normal order. */
export const PACED_ALLERGENS: readonly Allergen[] = MANDATORY_ALLERGENS;

export const NEW_FOODS_PER_DAY = 1;            // practice: 那覇市「１日１種類」
export const NEW_ALLERGEN_SPACING_DAYS = 3;    // practice: 1–2 days observed before the next step
export const MAINTENANCE_GAP_DAYS = 7;         // Sakihara 2024 / CSACI / ASCIA: at least weekly
export const IRON_NUDGE_FROM_MONTHS = 6;       // guide p.32
```

Sources: `ASK_DOCTOR_ALLERGENS` — JGFA2026 draft p.54, Sakihara 2024 p.265,
消費者庁 2021; `ECZEMA_DOCTOR_ALLERGENS` — guide p.33, 提言 2017, 即時型調査
2024 (egg/milk/wheat = 95.6 % at age 0); ladders — guide p.32, 港区, Osaka city
table, たまひよ; entry foods — guide p.32 and the seed audit's prerequisite
chains.

A test asserts every id in `ALLERGEN_ENTRY_FOODS` and `LADDERS` exists in
`FOOD_SEED`.

## 5. Suggestions — `rankNextFoods` rewritten

### Readiness

Every seed food the family has not introduced gets exactly one readiness, taken
from the first rule that applies:

| # | Rule | Readiness | Reason shown |
| --- | --- | --- | --- |
| 1 | `suggest === false` | excluded | — |
| 2 | Shares an allergen with a `suspected` / manual-status food (existing) | `held` | "Shares Egg with Egg yolk, which is flagged." |
| 3 | Carries an allergen from `ASK_DOCTOR_ALLERGENS` (or the eczema list when `eczema`) **not yet introduced** | `doctor` | "Japanese guidance gives no early-introduction advice for Peanut — decide with your paediatrician." / eczema: "With eczema, introduce Egg with your doctor." |
| 4 | `minAgeMonths > ageMonths` | `later` | "From 12 months." / >18: "Not during weaning (from ~36 months)." |
| 5 | Stage 1 and the food's group is not open in the current phase | `later` | "Once vegetables are in (around day 7)." / "Once protein foods start (around day 14)." |
| 6 | `minStage > stage` | `later` | "At stage 2 — tongue-mashable foods, around 7–8 months." |
| 7 | A ladder rung or allergen entry food is not yet introduced | `later` | "After white fish." / "After egg yolk." / "After silken tofu." |
| 8 | Carries an untried **paced** (mandatory-list) allergen and another paced allergen was first introduced less than `NEW_ALLERGEN_SPACING_DAYS` ago | `later` | "From Thu — a few days between new allergens (last: Egg yolk)." |
| 9 | otherwise | `now` | scored reasons below |

Groups open per phase: `porridge` → grain; `vegetables` → + vegetable, fruit,
other; `proteins` → all.

Rule 7 never blocks a food on its own entry list: `egg-yolk` is not waiting for
`egg-yolk`. A food is "introduced" when the family's catalog holds it with a
`firstTriedAt`; an allergen is introduced when any such food carries it.

### Score (`now` only)

| Bonus | Condition | Reason |
| --- | --- | --- |
| +40 | Food is egg-bearing and egg is not introduced | "Egg is the one allergen Japanese guidance says not to delay — well cooked, a tiny amount first." |
| +30 | Food sits in a ladder rung none of whose foods is introduced yet; for a food in no ladder, no food of its group is introduced yet | "Next step in the guide's order: red fish after white fish." / "First vegetable." |
| +20 | `ageMonths ≥ 6` and `ironMg ≥ 1.5` per 100 g | "Rich in iron — the guide asks for iron-rich foods from about 6 months." |
| +10 | `ageMonths ≥ 6` and `vitaminDUg ≥ 1` per 100 g | "A source of vitamin D, which breastfed babies can run short of." |
| +20 | Group is the least represented so far (existing) | "Adds variety — fruit is the least-represented group so far." |
| +5 | `minStage === stage` (existing) | "Made for this stage." |

The +30 step bonus and the +20 variety bonus count only the core groups
(grain, vegetable, fruit, protein, dairy). Fats, seaweed and seasonings never
earn them — found in a scenario run where sesame paste, wakame and nori topped
an 8-month-old's list ahead of red fish and whole egg.

The deficit-based nutrient gap (`recentNutrients`, `GAP_NUTRIENT_REFERENCE_7DAY`)
is removed: solids cannot be judged against intakes that include milk. The
nudges above are static and say only what the guide says.

`spreadGroups` stays. Output order: `now` by score, then `later`, `doctor`,
`held`. Every candidate carries `note` from the seed when present.

For any `now` food carrying a paced allergen, one more reason is appended:
"Give it on a weekday morning, when a clinic is open."

### Pace — replaces `getIntroductionWindow`

```ts
export function getPace(foods: Food[], now: Date): {
  newToday: Food | null;          // a food first tried today
  lastAllergen: { food: Food; at: Date } | null;
  allergensOpenFrom: Date | null; // null when a new allergen is fine today
};
```

It informs; it never hides suggestions.

### Food page

- Subtitle: `7 months — Stage 1 · 初期 · day 8 of solids`.
- Hero:
  - Under 5 months: unchanged "Not yet".
  - Not started, 5 months or more: suggests `okayu-10x` — "Start with 10:1 rice
    porridge, one spoon a day, when the baby sits with support and shows
    interest in food."
  - Stage 1, `porridge` phase, nothing `now` (porridge already in): kicker "This
    week", "Keep going with porridge", and when vegetables (day 7) and protein
    foods (day 14) come in.
  - `newToday`: kicker "Tomorrow", line "Already tried something new today
    (Carrot) — one new food a day." followed by the top `now` food.
  - Otherwise kicker "Try next", the top `now` food, its reasons, its `note`.
- "Other options ▾" shows, in order: "Also fine now" (8), "Later" (8 + count),
  "With your paediatrician" (all), "Held back" (8 + count). Every row stays
  tappable and opens the meal modal (current behaviour).
- Allergen grid: 29 tokens; `needsMaintenance` uses `MAINTENANCE_GAP_DAYS = 7`.

## 6. Settings

Baby Profile section gains:

- **Solids started** — date field, placeholder shows the derived date ("From the
  first logged food: 8 Sep"), a clear button returns to derived.
- **Eczema or atopic dermatitis** — checkbox, written straight through. Help
  text: "Japanese guidance: get eczema under control first, and introduce egg,
  milk and wheat with your doctor."

## 7. Data changes

### `SeedFood` gains three optional fields

```ts
/** Hard age floor, independent of stage and progress (e.g. honey: 12). */
minAgeMonths?: number;
/** One-line preparation or safety caveat, shown with the suggestion and in the shopping list. ≤ 120 chars. */
note?: string;
/** false = loggable, never suggested (drinks, seasonings, oils, texture variants). */
suggest?: false;
```

`Food` (Firestore) is unchanged: readiness reads the seed.

Every seed row also carries `nameJa: string` — the name on a Japanese label or
shelf (にんじん, 10倍がゆ, 島豆腐). The UI stays in English; the Japanese name is
shown in smaller type under the English one in the hero, the options list, the
shopping list and the meal autocomplete, and the autocomplete matches it too.
A catalog food gets the Japanese name of its seed row; manual foods have none.

### Allergens (消費者庁, 令和8年4月)

- Mandatory (9): egg, milk, wheat, shrimp, crab, buckwheat, peanut, walnut, **cashew**.
- Recommended (20): almond, abalone, squid, salmon_roe, orange, kiwi, beef,
  sesame, salmon, mackerel, soy, chicken, banana, pork, **macadamia**, peach, yam,
  apple, gelatin, **pistachio**. **matsutake removed.**

Existing Firestore food documents carrying `matsutake` keep it; readers ignore
allergens not in `ALLERGENS`, and `ALLERGEN_LABELS` lookups fall back to the raw
key.

### Row changes

Stage changes (`minStage` old → new):

| Rows | Change | Source (research/seed-audit.md) |
| --- | --- | --- |
| chicken-sasami-boiled, firm-tofu, katsuobushi | 1 → 2 | Guide p.32 (初期 proteins = tofu, white fish, yolk); たまひよ; Okinawa leaflet |
| aji-boiled, sawara-boiled, beef-liver-boiled, pork-liver-boiled, cream-cheese, kanten-powder, avocado, blueberry, prune-dried, mikan-canned, peach-canned | 2 → 3 | Guide fish order; たまひよ, ベビーカレンダー, 小牧市 |
| apple-juice, orange-juice, peanut-paste | 2 → 4 | Guide p.30 (juice); peanut also `doctor` |
| cooked-white-rice, dashi-granules, mango, papaya, barley-boiled, millet-cooked, quinoa-cooked, button-mushroom-boiled, shiitake-dried, atsuage, okara, vegetable-juice, almond-ground, cashew-ground, walnut-ground | 3 → 4 | Guide p.34 (rice); たまひよ, 小牧市; nuts also `doctor` |
| egg-white-boiled, katsuo-boiled, chicken-mince-cooked | 3 → 2 | Consistency: whole egg and tuna are already 2; guide 中期 全卵1/3 |
| saury-grilled | 4 → 3 | たまひよ, ベビーカレンダー, 所沢市 (青皮魚 at 後期) |
| soy-sauce-koikuchi, soy-sauce-usukuchi, miso-red, miso-white-sweet, salt | → 3 | Okinawa leaflet: salt + soy sauce from 後期; resolves soy sauce 2 vs salt 4 |
| sugar-white | 4 → 2 | たまひよ (7 months); consistency |

`minAgeMonths` (all also stay loggable):

| Rows | Value | Source |
| --- | --- | --- |
| honey | 12 | Guide p.30 |
| sencha, eringi-boiled, tarako, unagi-kabayaki | 19 | こども家庭庁 (caffeine); たまひよ, 小牧市, ベビーカレンダー |
| shrimp-boiled, crab-boiled, oyster-cooked, scallop-boiled | 24 | 日本小児科学会 2025 (エビ・貝類 from 2 years); こども家庭庁 誤嚥 table |
| squid-boiled, octopus-boiled, ikura, konnyaku | 36 | こども家庭庁 誤嚥 table; たまひよ |
| abalone-boiled | 72 | たまひよ (小学生ぐらいから) |

`suggest: false`:

water, barley-tea, rooibos-tea, hojicha, sencha, oral-rehydration-solution,
formula-powder, formula-prepared, omoyu, okayu-8x, okayu-7x, rice-flour,
cornstarch, katakuriko, kombu-dashi, katsuo-dashi, awase-dashi, niboshi-dashi,
shiitake-dashi, dashi-granules, all `fat` rows (oils, butter, margarine,
sesame-oil) except sesame-paste, salt, sugar-white, soy-sauce-*, miso-*,
ketchup, curry-powder, lemon-juice, yuzu-juice, honey, kizami-kombu, matsutake.

`note` (text final in code, ≤ 120 chars; sources in research/seed-audit.md §2):

| Rows | Note |
| --- | --- |
| apple, pear-western, nashi | Cook until soft until 18 months — never raw or only grated (choking). |
| shokupan, roll-bread, french-bread | Serve as bread porridge (パン粥) in small moist pieces — bread is a top choking food. |
| cherry-tomato, grape, cherry, blueberry | Never whole: peel and cut into quarters. |
| quail-egg-boiled | Cut up, never whole (choking). |
| processed-cheese, mozzarella | Grate or chop finely. |
| wiener-sausage, ham-roast, kamaboko, chikuwa, hanpen | Blanch to cut salt; cut lengthwise then small. |
| chickpeas-boiled, lentils-boiled, soybeans-boiled, edamame-boiled, azuki-boiled, kidney-beans-boiled, soramame-boiled, green-peas-boiled, sweetcorn-boiled | Soft-cooked, skins off, mashed. No whole hard beans before age 6. |
| peanut-paste, almond-ground, cashew-ground, walnut-ground | Smooth paste or powder only, never pieces. |
| kombu-dashi, awase-dashi | High in iodine: a few spoons a day, alternate with katsuo dashi. |
| hijiki-dried, hijiki-boiled | Soak, boil and discard the water (removes most arsenic); small amounts. |
| shirasu, shirasuboshi | Desalt: pour boiling water over and drain. |
| milk-whole, skim-milk-powder | Cooking only before 12 months; as a drink from 12 months. |
| egg-yolk | Hard-boiled yolk only; start with a tiny amount. |
| natto, hikiwari-natto | Chop; warm it at first. |
| kinako | Mix into moist food — dry powder makes babies choke. |
| nagaimo-boiled | Always cooked. |
| udon-dried, somen-boiled | Boil and rinse off the salt. |
| wakame-dried-cut, wakame-desalted, yaki-nori, aonori-dried | Chop or crumble finely; no whole nori sheets. |
| tamago-bolo | Still egg despite baking; snacks aren't needed before 1 year. |
| mayonnaise | Raw-egg based: only once whole egg is tolerated. |
| senbei-shoyu | Adult rice crackers are hard and salty — prefer baby rice crackers. |
| pomegranate | Seeds are a choking risk. |
| cucumber-raw | Grate or cook until 18 months. |

New rows (nutrients from 日本食品標準成分表 8th ed., `sourceRef` = MEXT item no.):

| id | Name | Group | Stage | Allergens | Note |
| --- | --- | --- | --- | --- | --- |
| shima-dofu | Shima-dofu (Okinawan tofu) | protein | 2 | soy | Salty (0.4 g/100 g): blanch before use. |
| yushi-dofu | Yushi-dofu (soft Okinawan tofu) | protein | 2 | soy | Drain off the salty liquid. |
| beni-imo | Beni-imo (Okinawan purple sweet potato), steamed | vegetable | 1 | — | Not ヤマン (a yam). |
| ta-imo | Ta-imo (Okinawan taro), boiled | vegetable | 2 | — | Can itch the mouth; avoid sweetened dishes. |
| mozuku-desalted | Mozuku, salted then desalted | other | 3 | — | Unseasoned only; desalt and chop finely. |

If a MEXT entry cannot be found for a row, the row is not added and the gap is
reported in the PR description.

## 8. Weekly shopping list

### Placement

A disclosure on `/food`, below the hero: **"Next week's shopping ▾"**, same
pattern as "Other options ▾" (`aria-expanded`, local `useState`).

Header note, always shown when open:

> 🧊 Frozen: order in this week's 宅配 — it arrives next week (other brands in
> すくすくスマイル take two weeks). 🥬 Fresh and local: in store. The Coop range
> changes; check the catalogue.

### Model — `src/utils/shopping-list.ts`

```ts
export type BuyHint =
  | { kind: 'coop'; product: string; packGrams?: number; leadWeeks: 1 | 2 }
  | { kind: 'local'; name: string; months: readonly number[] }
  | { kind: 'store' };

export interface ShoppingLine {
  foodId: string;
  name: string;
  reason: 'staple' | 'new' | 'maintenance';
  grams?: number;          // for the week, rounded up to 10 g
  eggs?: number;
  packs?: number;          // when the hint has packGrams
  buy: BuyHint;
  note?: string;
}

export interface ShoppingList {
  from: Date; to: Date;    // tomorrow → +7 days
  stage: WeaningStage;
  mealsPerDay: 1 | 2 | 3;
  grain: ShoppingLine[];
  vegFruit: ShoppingLine[];
  protein: ShoppingLine[];
}

export function buildShoppingList(input: {
  progress: WeaningProgress;      // computed for now + 7 days
  foods: Food[];
  seed: readonly SeedFood[];
  now: Date;
}): ShoppingList | null;          // null before 5 months
```

### Portions per meal (upper bound of each range, labelled "up to")

| Slot | Stage 1 (那覇市, end of month 1) | Stage 2 | Stage 3 | Stage 4 |
| --- | --- | --- | --- | --- |
| Grain (cooked) | 30 g | 80 g | 90 g | 90 g |
| Vegetables + fruit | 15 g | 30 g | 40 g | 50 g |
| Fish **or** meat | 10 g | 15 g | 15 g | 20 g |
| **or** tofu / soy / legumes | 10 g | 40 g | 45 g | 55 g |
| **or** egg | 1 egg for the week (yolk only) | ⅓ egg | ½ egg | ⅔ egg |
| **or** dairy | — | 70 g | 80 g | 100 g |

Source: guide p.34 (stages 2–4); 那覇市 ごっくん期 schedule (stage 1: porridge
~30 g, vegetables ~15 g, protein 5–10 g of any kind).

Weekly meals = `mealsPerDay × 7`. Slots follow the phase: no vegetables before
`vegetables`, no protein before `proteins`.

Slot of a food: `grain` → grain; `vegetable`, `fruit`, `other` → vegFruit;
`protein`, `dairy` → protein. Protein kind, first match: `dairy` group → dairy;
carries `egg` → egg; in `LADDERS.meat` or carries chicken/beef/pork → meat;
carries `soy` or is a legume → tofu/soy/legumes; otherwise → fish/meat portion.

### Choosing lines

1. **New this week** — simulate 7 days over the readiness rules of §5 for next
   week's progress: at most one new food per day, paced allergens spaced by
   `NEW_ALLERGEN_SPACING_DAYS`, and at most 1 new grain, 3 new vegetables/fruit
   and 3 new protein foods (otherwise a week can be five leafy greens). Each new food gets a first-taste amount
   (15 g, or 1 egg). No unlock simulation within the week: a rung unlocked by
   Monday's food is next week's list.
2. **Staples** — the introduced foods with the highest `usageCount` per slot:
   1 grain, up to 4 vegetables/fruit, up to 3 protein kinds (one food per kind).
   Grain and vegFruit: the slot's weekly total, minus new-food amounts, is split
   evenly across staples. Protein: the week's meals are split evenly across the
   kinds, and each kind's grams = its meals × that kind's per-meal portion
   (portions are alternatives, never summed per meal). Egg becomes a count,
   rounded up.
3. **Maintenance** — every introduced allergen not eaten in the last
   `MAINTENANCE_GAP_DAYS` that isn't already on the list gets one portion.

### Buy hints — `src/data/coop-okinawa.ts`

`Record<seedId, BuyHint[]>`; the first hint whose `months` include next week's
month wins; no match → `{ kind: 'store' }`.

| Seed id | Hints, in order | Source |
| --- | --- | --- |
| okayu-10x, okayu-8x | CO-OP きらきらステップ 白かゆ (8倍がゆ), 260 g | すくすくスマイル 6623 |
| carrot | local 島にんじん (Oct–Mar) → CO-OP 北海道のうらごしにんじん, 310 g | kuwachii; SS 6617 |
| kabocha | local 島かぼちゃ (Oct–Jun) → CO-OP 北海道のうらごしかぼちゃ, 280 g | kuwachii; SS 6615 |
| spinach | CO-OP 九州のうらごしほうれん草, 120 g | SS 6614 |
| broccoli-boiled | CO-OP 北海道のうらごしブロッコリー, 150 g | SS 6619 |
| edamame-boiled | CO-OP 北海道のうらごし枝豆, 120 g | SS 6620 |
| sweet-potato | ジーピーフーズ さつまいものうらごし, 240 g (2 weeks) | SS 6616 |
| potato-boiled | パイオニアフーズ うらごしポテト, 400 g (2 weeks) | SS 6621 |
| sweetcorn-boiled | ノースイ うらごしコーン, 200 g (2 weeks) | SS 6603 |
| komatsuna-boiled | JAフーズみやざき こまつな 小さめカット, 180 g (2 weeks) | SS 6607 |
| udon-boiled | CO-OP きらきらステップ やわらかいミニうどん, 480 g | SS 6610 |
| natto, hikiwari-natto | CO-OP 国産大豆で作った納豆ペースト, 120 g | SS 6624 |
| cod | CO-OP 北海道産白身魚のほぐし身, 60 g | SS 6609 |
| shirasu, shirasuboshi | CO-OP 食塩不使用ふっくらしらす干し, 60 g | SS 6992 |
| silken-tofu | CO-OP 国産大豆カット絹とうふ, 360 g | SS 6608 |
| salmon-boiled | 松岡水産 小さめダイスカット秋鮭, 80 g (2 weeks) | SS 6636 |
| chicken-sasami-boiled | いなば とりささみフレーク 食塩無添加, 210 g (2 weeks) | SS 6658 |
| tuna-canned-water | いなば ライトツナフレーク 食塩・オイル無添加, 210 g (2 weeks) | SS 6659 |
| beni-imo | local 紅いも (Aug–Jan) | kuwachii |
| togan-boiled | local シブイ (all year) | kuwachii |
| banana | local 島バナナ (Jun–Oct) → store | kuwachii |
| ta-imo | local 田芋 (Dec–Apr) | kuwachii |
| shima-dofu, yushi-dofu, mozuku-desalted | local (all year) | 沖縄県小児保健協会 leaflet |
| tuna-boiled, katsuo-boiled | local マグロ / カツオ, very fresh (all year) | kuwachii |

A test asserts every key exists in `FOOD_SEED` and every `months` value is 1–12.

### UI

Three short groups (Grain · Vegetables & fruit · Protein). Each line:
`🧊 きらきらステップ 白かゆ — up to 210 g · 1 pack` or
`🥬 島にんじん (local, in season) — up to 60 g`, a "new" / "keep up" tag, and the
`note` underneath when present. Empty groups are omitted.

## 9. Files

| File | Change |
| --- | --- |
| `src/utils/weaning-progress.ts` (+test) | New |
| `src/utils/weaning-rules.ts` (+test) | New — constants, ladders, entry foods |
| `src/utils/next-foods.ts` (+test) | Readiness, new scoring, `getPace`; gap-nutrient code removed |
| `src/utils/shopping-list.ts` (+test) | New |
| `src/data/coop-okinawa.ts` (+test) | New |
| `src/data/food-seed.ts` (+test) | Row changes, new rows, new fields |
| `src/types/food.ts` | `SeedFood` fields |
| `src/types/events.ts` | `Baby.weaningStartedAt`, `Baby.eczema` |
| `src/utils/allergens.ts` (+test) | 2026 lists |
| `src/utils/weaning-stage.ts` | Labels gain 初期/中期/後期/完了期 |
| `src/pages/FoodPage.tsx` (+test, css) | Progress subtitle, hero, grouped options, shopping disclosure |
| `src/pages/SettingsPage.tsx` (+test) | Solids-started date, eczema checkbox |
| `src/components/AllergenGrid.tsx` (+css) | 29 tokens |
| `firestore.rules` | Two optional baby fields |
| `specs/data-model.md` | Baby fields |
| `2026-09-01-food-diversification-design.md` | §8 marked superseded |

## 10. Error handling and edge cases

- Foods logged that are not in the seed (manual): count as introduced for their
  group and allergens; never suggested.
- `weaningStartedAt` in the future: treated as not started.
- Clock at midnight: "today" uses `startOfDay` as elsewhere (`useToday`).
- A food carrying an allergen already introduced by the family (e.g. peanut
  under a doctor's supervision) is no longer `doctor`: normal rules apply.
- Seed rows removed from suggestion keep their ids, so logged history and
  Firestore food documents are untouched.

## 11. Testing (TDD, red first)

Pure units:

- `getWeaningProgress`: derived vs explicit start; phases at days 0/6/7/13/14;
  "went faster" branches; stage = min(age, progression) including a late starter
  (8 months, day 3 → stage 1); meals per day; before 5 months.
- Readiness rules 1–9, each in isolation, and the precedence order.
- **Regression:** 7-month-old, weaning started 7 days ago, okayu-10x and carrot
  introduced → no `now` candidate carries egg, milk, wheat, soy, peanut,
  tree nuts, shrimp, crab or buckwheat; the top candidate is a vegetable or fruit.
- Day 14 with vegetables → silken tofu / white fish `now`, egg yolk `later` "After
  silken tofu" wording; once tofu is in → egg yolk `now` with the egg bonus.
- Eczema → egg, milk, wheat foods `doctor`.
- Honey never suggested; squid `later` with "Not during weaning".
- `getPace`: new food today; allergen spacing date.
- `MAINTENANCE_GAP_DAYS = 7` in `getAllergenStatus`.
- Rules data: every ladder/entry id exists; no id sits in two rungs of the same
  ladder.
- Seed: new fields valid (`note` ≤ 120 chars, `minAgeMonths` 1–72); allergen
  lists are exactly 9 + 20; stage-change rows pinned by a table-driven test.
- `buildShoppingList`: stage 2 grain total = 80 g × 14; before `vegetables` only
  grain; new allergens ≤ 1 per `NEW_ALLERGEN_SPACING_DAYS`; out-of-season local
  falls back to Coop; packs = ceil(grams / packGrams).
- Coop hints: keys exist in seed; months valid.

Components: FoodPage hero on a new-food day, grouped options, shopping
disclosure toggle; SettingsPage date field clear/set and eczema checkbox write
through.

Existing suites stay green. Dark mode and 375 px are acceptance criteria.

## 12. Delivery

One branch, one PR, merged at once (family's choice). Commits are made only when
asked (project rule). Suggested commit order for a readable history:

1. Allergen lists 2026
2. Seed fields and row changes
3. Weaning rules + progress
4. `rankNextFoods` readiness and pace
5. Settings fields and rules
6. Food page
7. Shopping list + Coop hints

## 13. Open items

- JSPACI guideline 2026 final text (planned 2026-11-28): re-check egg wording
  ("加熱卵" recommended) and peanut section; update `weaning-rules.ts`.
- 令和7年乳幼児栄養調査 results due end of September 2026 may lead to a guide
  revision.
- Logging-time warnings (honey under 12 months, whole grapes) — follow-up.
- Coop catalogue data is from June 2026; refresh `coop-okinawa.ts` when products
  change.
- Okinawa has higher peanut-allergy prevalence than Japan overall; Japanese
  experts suggest early peanut *might* be considered there for eczema babies,
  under a doctor. The app keeps peanut in `doctor`; the family decides with its
  paediatrician.
