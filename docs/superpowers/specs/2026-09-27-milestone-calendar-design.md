# Milestone calendar — design

Date: 2026-09-27. Replaces the "Ce qui vient" card on the Milestones page (#30).

## Why

The card shipped in #30 answered the right questions but read like a report:
three stacked sections (nights, next exam, WHO bars) with six motor items.
The ask: one calendar-like view, much more complete (belly crawling, hands,
language, social, teeth, sleep), every figure sourced, and a button that turns
an expected step into a recorded milestone.

Decisions taken with the user:

- The button means **"it happened"**: it records a milestone dated now,
  editable afterwards. The step then shows as done in the calendar.
- Domains: motor, hands, language, social, play, teeth, sleep — everything,
  under the existing evidence rules (no leaps, no "regressions", no growth
  spurts; the French word « régression » stays banned).
- The nights bands and the carnet de santé checkpoints merge into the
  calendar; no separate blocks.
- UX left to Claude.

## What it shows

One card, "Calendrier", on the Milestones page above the recorded list.

- **Month rows** from birth to 24 months. Each row is headed with the baby's
  age and the calendar month it falls in ("7 mois · octobre 2026") — that is
  the calendar part: an age window becomes something you can put on a fridge.
- Each expected step sits in the row of its **typical month** — or, when no
  source gives one, of its upper bound — and shows its normal window in words
  ("entre 5 et 13 mois", "dès 3 mois", "la plupart avant 18 mois"). No exact
  dates are ever derived: the windows are months wide. The note and source sit
  behind that line (a native `<details>`), so a row reads as label + window.
- Rows before the current month collapse into one "Mois passés" disclosure
  (done count, and what is not ticked yet, in neutral wording). The current
  row is marked "maintenant". Future rows are listed in full.
- A step whose window contains today gets a filled dot; ahead of its window,
  a hollow one. Past its window and not ticked: no alarm colour, no "late"
  label — the window is printed, and the card ends with one line pointing to
  the doctor for anything that worries them. The app must not become a list
  of things to feel behind on.
- Each step carries a short domain tag in text (Moteur, Mains, Langage,
  Social, Dents, Sommeil) — not colour alone.
- **Rough-night bands** show in the row where they start, with their caveat
  and source, and an "en cours" line at the top of the card while one runs.
- **Carnet checkpoints** show in their month as "Examen des N mois" with the
  parent boxes quoted verbatim, as before.

## The button

"C'est fait" (neutral, short) on every step not yet done, whatever the age —
babies are early too. It writes a `milestone` event: `title` = the step's
label, `milestoneKey` = the step's key, `timestamp` = now. Once written the
step shows "✓ fait le 3 septembre"; tapping it opens the existing edit modal
(change date, add a note, delete). Deleting the event un-ticks the step.

Matching a step to a recorded milestone: `milestoneKey` first; otherwise the
title, case- and accent-insensitive, so milestones typed by hand before this
feature ("Première dent") still tick their step.

## Data

`src/utils/development-timeline.ts` keeps `ROUGH_NIGHT_BANDS` and
`CARNET_CHECKPOINTS` unchanged, replaces `WHO_MOTOR_WINDOWS` with
`EXPECTED_MILESTONES` — `{ key, label, domain, early, typical, late, note?,
source }` in months, each bound `null` when no source gives it (never guessed;
at least one of typical/late is set) — and `getDevelopmentOutlook` with a pure
`buildMilestoneCalendar(birthDate, now, recorded, catalog)` in
`src/utils/milestone-calendar.ts`. A step with no lower bound counts as ahead
until its row comes round.

Evidence quality is uneven and the UI says so: WHO, MHLW and JSPD rows have
real distributions; most language, social and fine-motor rows only have the
CDC 2022 75th percentile ("la plupart avant X mois"), which the card footer
explains means 3 children in 4. Belly crawling rests on one study of 28 babies.

Every row's figures come from a source opened during research on 2026-09-27;
the header of the file names each source and what its numbers mean
(WHO MGRS 1st–99th percentile, JSPD 2019 mean ± 1 SD, CDC 2022 75th
percentile, Henderson 2010 first occurrence, …). The research notes live in
`docs/superpowers/specs/2026-09-27-milestone-calendar-research/`.

## Schema

`MilestoneEvent` gains optional `milestoneKey?: string`. `firestore.rules`
validates it when present (string, ≤ 64 chars). The current rules already
accept unknown fields, so the app works before the rules are redeployed; the
rules deploy is manual (CI deploys hosting only).

## Testing

- `buildMilestoneCalendar`: row placement by typical month, status (done /
  in window / ahead / past), key and title matching, collapsing of past
  rows, bands and checkpoints placed in their month.
- Data integrity: unique keys, early ≤ typical ≤ late, every row sourced,
  no « régression » anywhere.
- Component: renders rows, "C'est fait" calls back with the step, done step
  shows its date and opens the event.
- Page: tapping "C'est fait" writes the event with `milestoneKey`.
