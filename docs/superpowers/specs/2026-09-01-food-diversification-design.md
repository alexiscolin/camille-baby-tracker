# Food Diversification — Design

Date: 2026-09-01
Status: Awaiting review

## 1. Purpose

Track solid food introduction (離乳食) for a baby being weaned in Japan: what was
eaten, how much, whether it was accepted, whether it caused a reaction, and what
to introduce next.

The primary daily question the feature must answer in under 30 seconds is
**"what new food do I give today, and is it safe to?"** Everything else —
charts, nutrient roll-ups, history — is secondary.

### Success criteria

- A meal with 4 foods can be logged in under 15 seconds, one-handed.
- The app answers "what next" without the user reading a ranked list.
- An allergic reaction and its suspected causes are recorded in one place and
  survive as a per-food status, not as a buried event.
- Nothing about the existing app's look, flow, or data model is duplicated.

### Non-goals

- Medical advice, diagnosis, or triage. The app records and suggests; it never
  concludes. `confirmed_allergy` and `avoid` are set by a human only.
- Meal photos. Firebase Storage requires the Blaze plan on recent projects.
- Runtime LLM enrichment. See §5.
- Recipes, shopping lists, meal planning beyond "what to try next".

## 2. Extend, do not duplicate

Every new piece has an existing twin in the codebase. This table is the
governing constraint for implementation.

| New | Existing twin | Delta |
| --- | --- | --- |
| `MealEvent` | `FeedingEvent`, `MedicationEvent` | One branch in the `BabyEvent` union |
| "Meal" tile | The 5 tiles in `EventModal` | One entry in `EVENT_CONFIG` |
| `MealFields` | `ColorSelector` (poop) | Same role: the type-specific field block |
| `FoodTagInput` | `ColorSelector` | Same `value` / `onChange` contract |
| `families/{id}/foods` | `families/{id}/measurements` | Sibling subcollection, same rules shape |
| `services/food-catalog.ts` | `services/measurements.ts` | Same structure: collection ref, `isValidXData`, add/update/subscribe |
| `useFoods` | `useMeasurements` | Same return shape |
| `/food` page | `/growth` page | A page reading a sibling subcollection |

`measurements` is the precedent that legitimises `foods`: the codebase already
has a non-event subcollection with its own service, hook and page. `foods` is
the second instance of that pattern, not a new one.

### Unchanged

`services/events.ts` (only `MealEvent` joins the `NewEvent` union), `useEvents`,
`useRangeEvents`, `EventTimeline`, `DaySection`, `computeSummary`,
`chart-helpers`, `ActivityRadar`, `DashboardChart`, `StatsCharts`, offline
persistence, `CacheIndicator`. All of these iterate `EVENT_TYPES` and inherit
meal support for free.

### Where it genuinely diverges

1. `items` is a nested array. No other event type has one. Firestore rules
   cannot iterate lists, so per-item validation is client-side only. This is not
   fixable without Cloud Functions (Blaze plan). Rules validate the array's
   presence and size only.
2. `computeSummary` counts a meal as one event regardless of item count,
   consistent with every other type. Per-food detail lives on `/food`.
   `computeSummary` is not modified.

## 3. Data model

### Meal event — `families/{familyId}/events/{eventId}`

```ts
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Acceptance = 'all' | 'most' | 'half' | 'taste' | 'refused';
export type FoodUnit = 'tsp' | 'g' | 'ml' | 'piece'; // tsp = 小さじ = 5 ml

export interface MealItem {
  foodId: string;        // slug, references the foods subcollection
  name: string;          // denormalised label at logging time
  quantity: number;
  unit: FoodUnit;
  acceptance?: Acceptance;
  firstTry?: boolean;    // computed at write time
}

export interface MealEvent extends BaseEvent {
  type: 'meal';
  mealSlot: MealSlot;
  items: MealItem[];     // 1..12
  reaction?: Reaction;
}
```

`tsp` is the default unit: 小さじ is the unit Japanese weaning guidance and
recipes are written in. Nutrient maths converts via the food's `gramsPerTsp`.

### Reaction — embedded in the meal event

```ts
export type ReactionSymptom =
  | 'rash_local' | 'hives' | 'swelling' | 'vomiting'
  | 'diarrhea' | 'cough' | 'wheezing' | 'lethargy' | 'other';

export interface Reaction {
  symptoms: ReactionSymptom[];
  severity: 'mild' | 'moderate' | 'severe';
  onsetMinutes?: number;      // delay after the meal; immediate vs delayed matters
  resolvedMinutes?: number;
  suspectedFoodIds: string[]; // pre-filled with the meal's novel foods
  note?: string;
}
```

Selecting a systemic symptom (`hives`, `swelling`, `wheezing`, `lethargy`)
displays a fixed, non-personalised warning to contact emergency services. It is
a static reminder, not an assessment of the situation.

### Food catalog — `families/{familyId}/foods/{foodId}`

Holds only foods the family has actually used. The 300-entry seed table is
bundled reference data, not Firestore documents.

```ts
export type FoodGroup =
  | 'grain' | 'vegetable' | 'fruit' | 'protein' | 'dairy' | 'fat' | 'other';

export type FoodStatus =
  | 'untried' | 'safe' | 'watch' | 'suspected' | 'confirmed_allergy' | 'avoid';

export interface Food {
  id: string;              // slug, e.g. 'okayu-10x'
  name: string;
  group: FoodGroup;
  allergens: Allergen[];
  gramsPerTsp: number;     // default 5
  minStage: 1 | 2 | 3 | 4;
  status: FoodStatus;
  statusUpdatedAt?: Timestamp;
  usageCount: number;      // drives autocomplete ranking
  exposureCount: number;   // meals containing this food
  firstTriedAt?: Timestamp;
  lastTriedAt?: Timestamp;
  reactionEventIds: string[];
  nutrients?: Nutrients;   // per 100 g
  nutrientSource: 'seed' | 'manual';
  sourceRef?: string;      // seed provenance
}
```

### Nutrients — bounded to 16

`energyKcal`, `proteinG`, `fatG`, `carbsG`, `fiberG`, `sugarsG`, `ironMg`,
`calciumMg`, `zincMg`, `sodiumMg`, `potassiumMg`, `vitaminAUgRae`, `vitaminCMg`,
`vitaminDUg`, `vitaminB12Ug`, `folateUg`.

Bounded deliberately: an unbounded set makes the charts unreadable and the seed
data unverifiable.

### Weaning stages

| Stage | Japanese | Age | Expected meals/day |
| --- | --- | --- | --- |
| 1 | 初期 (ごっくん期) | 5–6 months | 1 |
| 2 | 中期 (もぐもぐ期) | 7–8 months | 2 |
| 3 | 後期 (かみかみ期) | 9–11 months | 3 |
| 4 | 完了期 (ぱくぱく期) | 12–18 months | 3 + snacks |

Stage is derived from the baby's birth date, never stored.

### Allergens — the 28 Japanese labelling allergens

8 mandatory (特定原材料): egg, milk, wheat, shrimp, crab, buckwheat, peanut,
walnut.

20 recommended (推奨): almond, abalone, squid, salmon roe, orange, cashew, kiwi,
beef, sesame, salmon, mackerel, soy, chicken, banana, pork, matsutake, peach,
yam, apple, gelatin.

## 4. Seed database — 300 entries

A committed TypeScript module, lazily imported. Covers what a baby in Japan
actually eats during weaning: grains and starches (粥 at every dilution, udon,
somen, bread), vegetables, fruits, fish (shirasu, cod, salmon), meats, egg, soy
in all its forms (tofu, natto, kinako, koya-dofu), dairy, seaweed, seasonings.

Each entry carries: slug, English name, group, allergens, `gramsPerTsp`,
`minStage`, the 16 nutrients per 100 g, and `sourceRef` naming the composition
entry it maps to.

### Honesty about the values

The values are indicative, not laboratory grade. What is guaranteed is that they
are stable, versioned, reviewable and correctable — not re-invented per install.

### Verification, two independent layers

1. **Mechanical test suite**, run on every commit:
   - energy coherence: `kcal ≈ 4·protein + 9·fat + 4·carbs`, ±25%
   - `protein + fat + carbs + fiber ≤ 100 g`
   - per-nutrient plausibility ceilings
   - no negative values, no duplicate slugs
   - allergen coherence (anything tofu/natto/kinako carries `soy`, etc.)
   - every `minStage` and `group` is a valid enum member
2. **Independent cross-check by a subagent**, which re-derives the entries and
   flags divergences from known composition values. Disagreements are arbitrated
   and recorded, never silently accepted.

Plus a manual spot check of roughly 30 well-known entries.

### Bundle cost

~300 entries × 16 nutrients ≈ 150–250 KB of JSON. Lazily imported, loaded only
when the meal form or `/food` opens, cached by the service worker. Measure
before compressing.

## 5. No runtime LLM

Deliberately dropped. With 300 curated entries the coverage of real Japanese
weaning is high enough that a runtime call would rarely fire, and it would cost:
a CORS dependency on a third party, an API key in `localStorage`, a per-device
key problem, an uncapped spend surface, and a retry-loop risk.

The residual tail — branded baby food, home preparations, typos — degrades
gracefully: **the food is still logged**. It counts for variety, first-try,
allergens and acceptance; it simply does not enter the nutrient charts. The user
can fill nutrients manually (`nutrientSource: 'manual'`).

If real usage shows the tail hurts, an optional enrichment escape hatch can be
added later. It is not built now. Should it ever be, it must carry: the
`nutrients`-present short circuit, an in-flight `Set`, a daily hard cap, and
`enrichAttempts` / `enrichFailedAt` **in Firestore** so a permanently failing
food is not retried forever by every device.

## 6. Catalog and autocomplete

Subscribe once to the whole `foods` collection (`useFoods`) and filter in
memory. It is tens to low hundreds of documents; a search index would be
over-engineering, and Firestore persistence makes it work offline for free.

Suggestion ranking: `usageCount` desc → exact prefix → substring → unused seed
entries. `FoodTagInput` is a native `<input>` plus an `aria-autocomplete` list
with ↑ ↓ / Enter / Escape handling. No combobox library.

Picking a seed food that has no Firestore document yet creates it from the seed
entry. No network call to anything but Firestore, ever.

## 7. Allergy status derivation

A reaction is an event property; a status is a food property. The status is what
the family reads six months later and shows a paediatrician.

Pure function in `utils/food-status.ts`, fully testable without Firebase:

- `untried` → `safe` after 3 exposures with no reaction
- any logged reaction → **every novel food in that meal** becomes `suspected`
- `suspected` → `watch` after one solo re-exposure with no reaction, then `safe`
  after 2 more
- `confirmed_allergy` and `avoid` are **manual only, never derived**

UI wording: never "safe". The label is `No reaction ×5`. Three uneventful meals
mean "no reaction observed", not "harmless", and the distinction matters most
precisely on the major allergens.

## 8. Try next

A pure function over the seed table and the family's `foods` collection. No new
state, no new writes.

Ranking of never-tried, stage-appropriate foods:

1. **Un-introduced major allergens rank first, not last.** Current paediatric
   guidance (LEAP, and the Japanese PETIT trial) is to introduce allergens early
   and repeatedly; delaying raises risk. Most parents do the opposite. This
   ordering is the single most useful thing the screen does.
2. **Nutritional gap.** Iron is the critical nutrient from 6 months as infant
   stores deplete. If the last 7 days are iron-poor, iron-rich stage-appropriate
   foods rank up. Same for zinc and vitamin D.
3. **Group diversity** — under-represented groups next.
4. **Held back, with the reason shown**: anything sharing an allergen with a
   `suspected` or `confirmed_allergy` food. Visibly held, never hidden, and
   overridable with a confirmation.

**The 3-day rule drives the whole screen.** If a new food was introduced less
than 3 days ago, nothing is suggested and the card shows the date the next
introduction becomes appropriate. Two days out of three, the screen answers in
one line.

Also surfaced: allergen maintenance. Tolerance is sustained by regular exposure,
so an allergen introduced and then not eaten for more than two weeks is flagged.

## 9. UI integration — measured, not asserted

Measured in a 375 px iframe (iPhone SE viewport) against the real `index.css`
and `Layout.module.css`.

### Bottom navigation — this breaks, and the fix is one line

| Variant | Width needed | Available | Result |
| --- | --- | --- | --- |
| Current, 4 items | 356 px | 373 px | fits, 17 px slack |
| 5 items, padding unchanged | **432 px** | 373 px | **59 px overflow, "Settings" clipped** |
| 5 items, `--space-md` | 373 px | 373 px | fits exactly, min tap 60×50 px |
| 5 items, `--space-sm` | 272 px | 373 px | fits, 101 px slack, min tap 44×50 px |

**Decision:** change `.navItem` horizontal padding from `--space-lg` to
`--space-md` in `Layout.module.css:84`. One line. Tap targets stay at 60×50 px,
well above the 44 px minimum, and it is the smallest deviation from the current
appearance. `--space-sm` gives more room but changes the existing four tabs more
than necessary.

### Event modal — fits, with two disclosure rules

`.typeGrid` is `repeat(2, 1fr)`. Five types leave an orphan cell; six fill three
complete rows. **The Meal tile costs no extra row.**

The modal already scrolls (`max-height: 85vh; overflow-y: auto`), and the type
grid unmounts once a type is chosen (`EventModal.tsx:269`), so the meal form
gets the whole sheet — about 480 px on an iPhone SE. That is not enough for the
full form, so:

- the reaction block is **collapsed by default** behind a "Log a reaction" link
- per-item quantity / unit / acceptance is **collapsed until the chip is tapped**
- the Save button is sticky at the bottom

### `/food` page — 936 px tall at 375 px

Sections: hero 142 · allergens 226 · chart 275 · strip 80.

Against real content height (viewport minus header and nav): 1.7 screens on
iPhone SE (541 px), 1.3 on iPhone 15 (726 px). One scroll gesture, no tabs.

The page is one scroll ordered by usage frequency, each section reduced to its
smallest honest form:

1. **Hero — an answer, not a list.** One suggestion, `[Log it]`, and the reason.
   The ranked list is folded behind an `Other options ▾` disclosure that expands
   in place (`aria-expanded`, local `useState`, re-tap collapses). Tapping a row
   opens `EventModal` in `type=meal` with the food already chipped. Within the
   3-day window the hero shrinks to a date.
2. **Allergen token grid, 7×4.** 226 px including its header, against ~1400 px
   for a 28-row table. Colour carries status; tap opens a detail sheet using the
   existing `EventModal` overlay pattern (✕ / outside click / Escape).
3. **One chart slot** with a `SegmentedControl` picker, not four stacked cards.
   This section is the only part of the page deferred to P2; P1 ships the page
   without it.
4. **Recently introduced** — a horizontal chip strip.

Reaction history is **not** on this page. It is a paediatrician-visit artefact:
it lives behind an allergen token and as an export from Settings.

### Chart list reduced from 7 to 4

Once `meal` is in `EVENT_CONFIG`, meals appear for free in the daily overview,
the radar and the averages on `StatsPage`. Meal rhythm and acceptance no longer
need their own charts here. Remaining, genuinely food-specific: group intake,
variety curve, nutrient first-exposure, nutrient coverage.

### Tokens and theming

New pair in `index.css`, defined in `:root` **and** in the
`prefers-color-scheme: dark` block, following the five existing pairs:

```css
--color-meal: #22c55e;  --color-meal-bg: #dcfce7;             /* light */
--color-meal-bg: rgba(34, 197, 94, 0.15);                      /* dark */
```

Green is the only free hue in the palette and is semantically right for food.
Icon: `Salad` from lucide-react, already a dependency. All chart colours go
through `var(--color-*)`; no hard-coded hex anywhere.

Status badge colours reuse existing tokens: `--color-success` for no-reaction,
`--color-feeding` for watch and suspected, `--color-medication` for confirmed.

### Known side effect of a sixth event type

`EVENT_CONFIG` propagates to eight files. Grids calibrated for five need a pass:
`StatsPage.module.css` `.metricsRow` (`repeat(5, 1fr)` on desktop) and
`.avgGrid`; `ActivityRadar` goes from 5 to 6 spokes; Recharts legends gain a
series. Minor CSS, but it touches existing pages — covered by their existing
tests.

## 10. Firestore rules and indexes

Rules, extending the existing `isValidEvent()` switch:

```
data.type == 'meal'
  && data.mealSlot in ['breakfast','lunch','dinner','snack']
  && data.items is list
  && data.items.size() >= 1 && data.items.size() <= 12
```

Per-item validation is client-side (see §2). The `foods` subcollection mirrors
the `measurements` rules: family membership, field validation, no delete of
foods with exposures.

Indexes: add the two composite indexes the data model documents but
`firestore.indexes.json` is missing (`type ASC, timestamp DESC` and
`babyId ASC, type ASC, timestamp DESC`).

Also in scope: `specs/data-model.md` is stale (missing `bath`, missing `sex`,
wrong `feedingType`). Update it.

## 11. Testing

TDD throughout — red first.

Pure units: slug normalisation, autocomplete ranking, tsp→g conversion, group
aggregation, nutrient roll-up, first-exposure computation, status derivation
(every transition and the multi-food attribution case), try-next ranking, 3-day
window, allergen maintenance flag, seed table integrity (§4).

Components: `FoodTagInput` (keyboard navigation, chip add and remove),
`MealFields` (collapsed reaction, per-item disclosure), `EventModal` with
`type=meal`, the hero disclosure toggle.

Existing suites must stay green — in particular the 534-line
`EventModal.test.tsx`, which is the safety net for the modal refactor.

Dark mode and 375 px responsive behaviour are acceptance criteria for every
phase, not a final pass.

## 12. Phasing

| Phase | Contents |
| --- | --- |
| **P0** | Seed database of 300 entries, `minStage`, mechanical test suite, subagent cross-check |
| **P1** | `EventModal` split into per-type field components; types; `foods` subcollection, rules, indexes; `services/food-catalog.ts`; `useFoods`; `FoodTagInput`; `MealFields`; reaction and status; `--color-meal`; nav fix and fifth entry; timeline integration; `/food` page **without its chart section** — hero (Try next), allergen grid, recently-introduced strip |
| **P2** | The chart section of `/food`: `SegmentedControl` picker and the 4 charts |

The `/food` page ships in P1 minus one section, so the fifth nav entry added in
P1 never points at a missing page. Try next comes before the charts on purpose:
it costs a pure function and one list UI, and it is worth more per line than any
graph. At the end of P1 the app can already answer what to give tomorrow; P2
drops the chart section into the slot left for it.

## 13. Prerequisite refactor

`EventModal.tsx` is 530 lines with one `useState` per field of every type.
Adding a multi-food form takes it to roughly 900. It is split first —
`FeedingFields`, `PoopFields`, `MedicationFields`, `MealFields` — leaving the
modal with time, type, notes and save/delete only. Existing tests are the net.

## 14. Open items

- Meal photos deferred (Firebase Storage needs Blaze).
- Firestore rules unit tests (`@firebase/rules-unit-testing`) are absent from the
  whole project. Recommended, out of scope here.
- Multi-baby: `family.babies[0]` remains hard-coded, unchanged by this work.
