# Nutrient weather — design

Status: built and shipped. Model revised 2026-09-16 after use — see "Revision: the whole diet".
Date: 2026-09-16

## Problem

The food page already sums what the baby ate. `mealNutrients()` scales each
food's per-100 g `Nutrients` by the quantity logged, and the **Coverage** chart
plots the average per day for all sixteen nutrients.

It plots them without a target. A parent reads "0.8 mg of iron" and learns
nothing, because the question is not how much iron went in — it is whether that
is enough. The guide singles out iron and vitamin D for breastfed babies from
about six months (授乳・離乳の支援ガイド p.32), and the app repeats that advice
when ranking foods, but never checks whether the advice was followed.

This feature answers the question Coverage raises and drops: **for each
nutrient, is the baby short, and what should we buy next week to fix it.**

## The milk problem

The baby is breastfed, and milk is not quantified anywhere in the app.
`FeedingEvent` records `leftCount`, `rightCount` and an optional
`durationMinutes` — no volume, and none for bottles either.

Comparing solid food alone against a daily reference intake would therefore be
wrong for most nutrients. At 6–11 months milk still supplies a large share of
energy, calcium and vitamin C; a raw comparison would show 4 % of calcium every
day. That is not a deficit, it is a missing input, and a wall of false red makes
the whole view worthless.

Iron is the exception that makes the feature viable, though not for the reason
first assumed. The 2025 guide does not derive the 6–11 month iron figure as
milk plus weaning food at all: it computes it from iron losses and growth
divided by a 16 % absorption rate (p.293), the same way it does for a child.
There is no milk term in it. The app still subtracts the iron the milk actually
carries, because the question it answers is "how much must the meals bring" and
milk iron is real dietary iron — but that subtraction is the app's arithmetic,
not the guide's, and the reference file says so.

**Resolution (superseded — see "Revision: the whole diet" below).** The first
model subtracted milk from the reference intake and graded food against the
remainder:

```
targetFromFood(nutrient) = max(0, referenceIntake(nutrient) − milkContribution(nutrient))
```

Both sides are published figures — the reference intakes from 食事摂取基準, the
milk compositions from 成分表 — so the model rests on sourced data, with exactly
one estimate left exposed: the daily milk volume, which the parent sets.

### Switching to formula, and stopping milk

The milk baseline is a setting, not a constant, because it changes twice in a
baby's first two years: breast → mixed → formula → none.

This matters most for iron. Infant formula is iron-fortified at roughly twenty
times the level of human milk, so a family moving to formula genuinely stops
having an iron problem. A hard-coded breastfeeding assumption would keep showing
an iron deficit that no longer exists, and the parent would buy liver for a
baby who does not need it.

Setting the source to `none` drops the milk contribution to zero and the target
becomes the full reference intake — which is the correct reading once the child
is off milk entirely. No special case in the code.

## Scope of the verdict

Not every nutrient can carry a verdict, and pretending otherwise is how a
dashboard starts lying. Each nutrient gets one of three kinds:

| Kind | Meaning | Nutrients |
| --- | --- | --- |
| `target` | A floor. Green when reached. | energy, protein, iron, calcium, zinc, potassium, vitamin A, C, D, B12, folate |
| `limit` | A ceiling. Green when *under*. Bands invert. | sodium, **from 12 months only** |
| `context` | No gradable value at this age. Shown as a number, never coloured, never in the advice. | fat, carbohydrate, fibre, sugars, slow carbs; **sodium under 12 months** |

**Sodium is not a ceiling before 12 months.** The guide publishes 600 mg at
6–11 months as a 目安量 — an adequacy figure — with no 目標量 and no 耐容上限量.
Drawing it as a limit would be the app inventing a rule; drawing it as a floor
would nudge a parent to salt a baby's food. It shows the number and says
nothing. From 12 months a real 目標量 exists (食塩相当量 under 3.0 g / 2.5 g) and
the row becomes a limit.

### Upper limits are a separate axis

Some nutrients carry a 耐容上限量 alongside their target, and one of them is a
live hazard **this app already creates**: `rankNextFoods` suggests chicken liver
for its iron, and chicken liver is 14 000 µgRAE of vitamin A per 100 g against a
600 µgRAE daily limit. **Four grams of liver reaches the limit for the day.** A
normal 15 g serving is three and a half times over it.

So `ReferenceValue` carries an optional `ceiling`, and every cell and row
carries `overCeiling` independently of its band — a nutrient can be short of its
target across the week and still blow the limit on one day, and both facts
matter. Vitamin A (600 µgRAE), vitamin D (25 µg) and, from 12 months, folate
(200 µg) have ceilings.

**Iron has no upper limit at any age.** The 2025 edition withdrew the one 2020
set for 1–2 year olds (p.298). The old figure is still widely republished; it
must not be reinstated.

**Slow carbs** are a `context` row, computed `carbsG − sugarsG`. There is no
reference intake for complex carbohydrate at this age, so the app shows the
value and refuses to grade it. Inventing a threshold here would be the easiest
way to make the rest of the table untrustworthy.

Any nutrient whose research turns up no 6–11 month value becomes `context`
rather than being dropped — the number is still worth seeing.

## Reading: daily cells, weekly verdict

A single day of weaning food is extremely noisy. One meal of chicken liver
covers several days of iron; a day without a protein food is a zero. A red dot
on Tuesday would report that Tuesday's vegetable was squash, not that the baby
is short of iron.

So the grid shows **days**, and the verdict is computed over a **rolling seven
days**:

```
            Mon Tue Wed Thu Fri Sat Sun    7 days
Iron         ●   ○   ●   ◐   ○   ○   ◐     62 %  ↓
Zinc         ◐   ◐   ●   ●   ◐   ○   ●     88 %
Vitamin D    ○   ○   ○   ○   ○   ○   ○     11 %  ↓
Calcium      ●   ●   ◐   ●   ●   ◐   ●     96 %
Protein      ●   ◐   ●   ●   ●   ●   ●    104 %
Sodium       ○   ○   ○   ◐   ○   ○   ○     22 %  (limit)

● met   ◐ partial   ○ low
→ To catch up: vitamin D, iron
```

Bands are `met ≥ 80 %`, `partial 40–80 %`, `low < 40 %`. **Heuristic** — no
source gives cut-offs for a daily infant intake, and the file says so, following
the existing `source` / `practice` / `heuristic` convention in
`weaning-rules.ts`. On a `limit` nutrient the bands invert: under 80 % of the
ceiling is `met`.

## Architecture

### `src/data/nutrient-reference.ts` (new)

The committed reference table, from 日本人の食事摂取基準（2025年版）.

**Three bands, not two.** Energy and protein are published as 6–8 and 9–11
months with no merged figure, so the bands are 6–8, 9–11 and 1–2 years; the
nutrients that *are* merged simply repeat across the two infant bands.

**Iron no longer splits by sex.** 2020 gave 5.0 mg to boys and 4.5 to girls;
2025 moves the split into the 推定平均必要量 (3.5 / 3.0) and gives a single
推奨量 of 4.5 to both. Sex still matters for energy, and from 12 months for
calcium, zinc, potassium, vitamin A and salt — so the lookup still takes
`Baby.sex`, which already exists.

`ASSUMED_MILK_ML(ageMonths)` returns the 基準哺乳量 each band was derived
against — 600 ml at 6–8 months, 450 ml at 9–11 (p.367) — used as the setting's
default. Past 11 months the guide gives none, so the last value is carried
forward as a labelled heuristic; the parent edits it.

### `src/data/food-seed.ts` (one row added)

A 人乳 (human milk) row, per 100 g, from 成分表. The formula rows
(`formula-powder`, `formula-prepared`) already exist and already carry full
nutrients, so formula needs nothing new.

Both are `suggest: false` already or will be — milk is never a food suggestion.

### `src/types/events.ts` — two fields on `Baby`

```ts
/** Milk still being drunk. Absent means breast, the app's starting assumption. */
milkSource?: 'breast' | 'formula' | 'mixed' | 'none';
/** Estimated daily milk volume in millilitres. Absent means the reference default. */
milkMlPerDay?: number;
```

Optional, like `eczema` and `weaningStartedAt`, so nothing needs migrating.
`firestore.rules` extends `hasValidWeaningFields()` to validate both, rejecting
an out-of-range volume.

`mixed` uses the human-milk composition — the conservative choice, since
assuming the fortified formula would understate a real iron gap.

### `src/utils/nutrient-weather.ts` (new)

```ts
milkNutrients(source, mlPerDay, byId): Nutrients
dailyTargets(ageMonths, sex, milk): NutrientTarget[]   // { key, kind, fromFood }
buildNutrientWeather(events, byId, days, targets): WeatherRow[]
nutrientGaps(rows): NutrientKey[]                      // worst `target` rows, worst first
```

`buildNutrientWeather` follows `buildGroupIntake`'s existing shape exactly:
bucket meal events by `yyyy-MM-dd`, seed every requested day so days without
meals produce a zero row rather than a hole.

Milk composition is per 100 g while the setting is in millilitres; the
conversion uses milk density and is applied in one place, in `milkNutrients`.

### Advice: reuse, do not rebuild

`nutrientGaps()` returns the worst nutrients. Those keys pass as a new optional
argument to `rankNextFoods()`, which adds a bonus to foods rich in a nutrient
that is **measurably** short — alongside, not replacing, the existing static
iron and vitamin D bonuses, which still cover the case of a baby with no logged
meals yet.

`shopping-list.ts` draws its new foods from `rankNextFoods()`, so the weekly
shopping list follows the measured gaps **with no change to that file.** This is
the main reason the design routes advice through the existing ranker instead of
building a parallel recommender.

### UI

A new `weather` view in `FoodCharts`' existing `SegmentedControl`, and
**`coverage` is deleted.** Coverage is this view without the target — once the
target exists, keeping both means keeping the one that cannot answer the
question. Its builder `buildNutrientCoverage` goes with it if nothing else uses
it.

The grid is plain CSS grid, not recharts: it is a table of coloured dots, and a
chart library adds nothing to it.

Under the grid: the gap list and the foods suggested for it, each tappable to
open the existing log modal via `FoodPage`'s `logTarget` state.

Settings gains the milk source and volume controls, next to the eczema
checkbox, in the weaning section that already exists.

## Honesty guards

These are requirements, not polish. The feature's only value is being trusted,
and each of these is a way it could quietly stop deserving that.

1. **The assumption is always on screen.** "Targets assume 530 ml of milk a day.
   Indicative, not medical advice." The volume shown is the one actually in use.
2. **No weather before 6 months.** 初期 is about taste and texture, not
   nutrition, and milk is still the whole diet. Under six months the view shows
   a note instead of a grid. The threshold reuses `NUTRIENT_NUDGE_FROM_MONTHS`,
   which already encodes exactly this boundary.
3. **`context` rows are never coloured** and never appear in the advice.
4. **Advice never blocks.** Consistent with the rest of the food page: a gap
   suggests foods, it never prevents logging or flags a meal as bad.
5. **Heuristics are labelled** in the source, with their upgrade path.

## Testing

TDD, per CLAUDE.md. Unit tests first, colocated:

- `nutrient-reference.test.ts` — lookup by age band and sex; every nutrient in
  `NUTRIENT_KEYS` resolves to a kind; no `target` row has a zero value.
- `nutrient-weather.test.ts` —
  - `milkNutrients`: breast vs formula differ on iron by the expected order of
    magnitude; `none` returns zeros; volume scales linearly; ml→g conversion.
  - `dailyTargets`: subtraction floors at zero, never negative; `none` yields
    the full reference intake; iron differs by sex.
  - banding at the 40 % and 80 % boundaries, and inverted for `limit`.
  - `buildNutrientWeather`: days with no meals are zero rows, not missing;
    events outside the range are ignored; a food with no `nutrients` is skipped.
  - `nutrientGaps`: ordered worst first; excludes `context` and `limit` rows.
- `next-foods.test.ts` — an existing-behaviour test that the gap bonus does not
  change ranking when no gaps are passed, plus one that it does when they are.
- A component test for the grid: a `limit` row renders its inverted verdict, and
  under six months the note replaces the grid.

## Out of scope

- **Logging bottle volumes.** The honest upgrade to this feature: once a bottle
  carries millilitres, formula intake is measured rather than estimated. It
  touches `FeedingEvent`, the event modal and `firestore.rules`, and it is a
  separate feature. The setting is the interface it would replace.
- Per-meal nutrient breakdown. The question is about days and weeks.
- Any supplement tracking, including vitamin D drops — which will make the
  vitamin D row read low for a baby who is in fact supplemented. Noted as a
  known limitation of the row, not solved here.

## Data corrections the research forced

The seed audit turned up three errors in **already-committed** data, found by
checking the prepared formula row against the powder row it is made from:

| Row | Field | Was | Is | Why |
| --- | --- | --- | --- | --- |
| `formula-prepared` | `ironMg` | 0.9 | **0.8** | 6.5 x 0.13 = 0.845. A 6 % overstatement, on iron. |
| `formula-prepared` | `energyKcal` | 67 | **66** | 510 x 0.13 = 66.3. 67 is the tin's figure at a different dilution. |
| both formula rows | `carbsG`, `sugarsG` | 55.9 / 7.3 | **51.3 / 6.7** | Used 炭水化物 by difference — a residual term — where the type documents available carbohydrate. |

`food-seed.test.ts` now ties the prepared row to the powder row at the stated
dilution, held to the precision each value is written with, so they cannot drift
apart again.

### Human milk, and the vitamin D trap

The new 人乳 row (成分表 no. 13051) is stored **per 100 mL**, converted with the
table's own 100 mL = 101.7 g, so both milk rows share a basis and no density
factor is needed at any call site.

Two published values were not copied straight across:

- **Iron 0.04 mg** is formally `Tr`; the table prints two decimals "for
  practical convenience", and that is the figure to calculate with. Kept.
- **Vitamin D is stored as 0, not the printed 0.3.** The table's own 備考 says
  0.3 *includes vitamin D active metabolites*, and gives `Tr` without them.
  Supplementation guidance counts the metabolite-free form. Crediting 0.3 would
  subtract about a third of the daily vitamin D target on the strength of a form
  that guidance does not count — and quietly reassure a parent about the one
  nutrient Japanese guidance singles out for breastfed babies. The
  metabolite-free reading is also published, and it is the safe one.

## Still to build

- `firestore.rules`: validate `milkSource` and `milkMlPerDay`.
- Settings: the milk source and volume controls.
- `FoodCharts`: the grid view, and delete `coverage`.
- `rankNextFoods`: the measured-gap bonus, and a guard so a food cannot be
  suggested into an upper limit it would blow — the liver problem above.


## Revision: the whole diet

Shipped, used, and changed on the same day. The parent's question, in their own
words, was «pour savoir où on en est» — where are we. The first model did not
answer it.

Grading food against *what food owes* answers a question about cooking. It is
the actionable framing, and it is the wrong one to lead with: a parent wants to
know whether their baby is getting what she needs, and milk is most of that
answer for the whole first year.

**The model is now the whole diet against the published intake:**

```
ratio(nutrient) = (foodPerDay(nutrient) + milkPerDay(nutrient)) / referenceIntake(nutrient)
```

`dailyTargets` no longer takes milk; `buildNutrientWeather` does, and adds it to
every day including days with no meal.

### What this buys

- It reads correctly at every age. At five months it shows roughly 100 %, which
  is the truth: milk covers it. At nine months iron and vitamin D fall away on
  their own, because milk genuinely stops covering them — which is the signal
  the feature exists to give, arrived at honestly rather than by construction.
- `nutrientGaps` now measures what the **baby** is short of rather than what the
  cooking is short of, which is a better input to the food suggestions it feeds.

### What it costs, stated plainly

- A nutrient milk already covers reads as fine even when the meals bring none of
  it. The grid no longer tells a parent whether their cooking is pulling its
  weight.
- Every percentage moves with the milk volume the family estimated. At five
  months, when food contributes almost nothing, the percentages are very nearly
  a readout of that one setting. The note under the grid says so.

### The 0–5 month band, and the iron artefact

Grading from five months needs the 0〜5か月 band, which is published as
milk-only: each 目安量 is 母乳中濃度 × 0.78 L/日 (pp.367–368).

**Iron is deliberately left ungraded there.** The guide takes
0.35 mg/L × 0.78 L/日 = 0.273 mg/日 and rounds it to **0.5** (p.293). It takes
the identical 0.273 mg/日 for copper and rounds it to **0.3** (p.306). Same
arithmetic, same document, two answers — so 0.5 is a deliberate safety margin
above what breast milk provides, not a measurement of it. Dividing milk by that
margin would put every exclusively breastfed baby at about 62 % of iron: a
single amber row, on the one nutrient a parent is watching, at an age when the
only remedy the guide offers does not start for another month.

Sodium stays ungraded at every age under twelve months for the reason it always
was: a 目安量, with no 目標量 and no 耐容上限量.

Both rows carry the reason on screen, next to the nutrient's name. A row that
declines to grade itself has to say why, or it reads as a bug.
