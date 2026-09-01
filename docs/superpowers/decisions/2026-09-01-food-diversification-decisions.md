# Food Diversification — decisions taken during implementation

Every decision the controller made on the owner's behalf while executing
`docs/superpowers/plans/2026-09-01-food-diversification.md`, with its reason and what it
costs if wrong. Recorded so they can be reviewed and undone, not to be taken on trust.

**Roughly a third of these correct defects in the plan or spec itself.** That is the point
of writing them down.

## Ruling: no worktree
Ruling: execute on a branch in the main working directory rather than a git worktree
— why: the user runs `npm run dev` from this directory and asked for a single PR;
a worktree adds a path switch with no isolation benefit for a solo repo
— cost if wrong: the working tree is dirty during execution; recoverable with git stash.

## Ruling 6 (lint baseline) — raised by Task 1, verified against main
The plan's Global Constraint "npm run lint must be clean" is unsatisfiable: main already
fails with 3 errors, all the same rule (react-hooks "Calling setState synchronously
within an effect"), in src/hooks/useBaby.ts:11, useFamily.ts:12, useMeasurements.ts:13.
Verified by linting a worktree of main: identical 3 errors.
Ruling: the constraint becomes "no NEW lint errors beyond those 3 baseline errors".
Fixing them is out of scope for this feature.
— cost if wrong: none; it only stops every task failing its own verification step.

## Ruling 7 (Task 7 must not inherit the baseline lint bug)
Task 7 tells the implementer to copy useMeasurements.ts structure for useFoods.ts.
useMeasurements.ts is one of the 3 baseline lint failures, so a verbatim copy would add
a 4th. Ruling: useFoods must avoid synchronous setState in the effect — initialise
useState(true) for loading and do not call setLoading(true) inside the effect body.
Carry this into the Task 7 dispatch.
— cost if wrong: a lint error the reviewer catches; trivial to fix.

## Ruling 8 (overlap review with the next independent implementer)
Ruling: dispatch task N's reviewer and task N+1's implementer concurrently when the two
touch disjoint files and N+1 does not consume N's output. T2 (src/utils/weaning-stage.ts)
and T3 (src/data/food-seed.ts) are disjoint; T3 consumes only T1's types.
— why: halves wall-clock across 16 tasks; the skill's bar is never two IMPLEMENTERS in
parallel, and a fix-round implementer for N would still touch only N's files.
— cost if wrong: a merge conflict between two commits on disjoint files, which git would
surface immediately; recoverable by serialising the remaining tasks.

## Ruling 8a (amends Ruling 8) — verify completed tasks in an isolated worktree
Overlapping task N's review with task N+1's implementer means the shared working tree
contains N+1's in-flight files. Verifying T2 in the live tree showed "1 failed test file"
that was in fact T3's RED-phase food-seed.test.ts with no implementation yet — correct TDD
behaviour, not a T2 regression. Ruling: resolve any reviewer ⚠️ verification item against
`git worktree add /tmp/verify-<sha> <sha>` rather than the live tree.
— cost if wrong: none; it only removes a false signal that would otherwise look like a
regression and trigger a pointless fix loop.

## Ruling 9 (LOAD-BEARING, plan defect) — energy-coherence formula omits fibre
The plan's Task 3 coherence check computes `4*protein + 9*fat + 4*carbs` against energyKcal
with a +/-25% band. `Nutrients.carbsG` is defined as AVAILABLE carbohydrate, excluding
fibre, so the formula systematically under-predicts energy for high-fibre low-energy foods.
Verified with real values for boiled spinach (23 kcal, 2.6 P, 0.5 F, 0.4 available C,
3.6 fibre): computed 16.5, ratio 0.72 — below the 0.75 floor. The implementer could either
fail with correct data or pass with wrong data; it chose wrong data and disclosed it.

## Ruling 10 — the controller dispatches Task 4's cross-check, not the implementer
Task 4 Step 4 instructs the implementer to "dispatch the cross-check subagent". That directly
contradicts the standing no-subagents contract every implementer carries, and a worker-spawned
agent's verdict counts for nothing in this process.
Ruling: split Task 4. The implementer writes the rows and commits (Steps 1-3). I then dispatch
the cross-checker myself as an independent read-only agent (Step 4). I feed its divergences back
to the implementer, which arbitrates them and does the 30-row manual spot check (Steps 5-6),
then verifies and commits (Steps 7-8). Same work, same independence, correct chain of custody.
— why: an implementer grading itself through an agent it briefed is not independent verification,
which is the whole point the user asked for.
— cost if wrong: none; it only moves who holds the dispatch.

## Ruling 11 (plan defect) — FeedingFields.startTime is dead plumbing I specified
The plan's Task 5 Interfaces block lists `startTime` on FeedingFields with no
`onStartTimeChange`. Verified it is genuinely unused: `computeDurationMinutes(time, endTime,
...)` is called only in EventModal.tsx:164 and :205 (the save paths), never inside the feeding
JSX; at 01bbf3f the feeding block rendered only `value={endTime}`. The implementer had to
declare the prop without destructuring it to dodge TS6133 — a smell that proves the point.
Ruling: remove `startTime` from the FeedingFields props type and from the EventModal call site
(EventModal.tsx:339). YAGNI — a declared-but-unused prop rots, and Task 10 can add it if a
duration display ever moves into the child.
— why: this is a scope concern (I mandated something unnecessary), so it is addressed before
review rather than deferred.
— cost if wrong: if Task 10 does move duration rendering into FeedingFields, the prop is one
line to re-add.

## Ruling 12 — review packages must be path-scoped, not commit-range-scoped
Running implementers concurrently (Ruling 8) means commits from different tasks interleave on
the branch, so a BASE..HEAD range for task N can swallow task M's commits and hand the reviewer
a diff containing work the brief never mentions.
Ruling: from here on, build each review package over the task's OWN commit SHAs (git diff of
each sha^..sha), or path-scope the range to the files the task owns. Verify the resulting
stat block lists only that task's files before dispatching the reviewer.
— why: a reviewer shown foreign hunks either flags them as unrequested scope creep (a false
finding that burns a fix round) or, worse, reviews them under the wrong brief.
— cost if wrong: wasted review cycles and false findings; caught by checking the stat block.

## Ruling 7 CORRECTED — the implementer was right, I was wrong about the trigger
## Ruling 7 CORRECTED — the implementer was right, I was wrong about the trigger
My Ruling 7 said the baseline lint error at useMeasurements.ts:13 was `setLoading(true)` in the
My Ruling 7 said the baseline lint error at useMeasurements.ts:13 was `setLoading(true)` in the
effect body. The Task 7 implementer disputed this and traced it. Verified: line 13 is
effect body. The Task 7 implementer disputed this and traced it. Verified: line 13 is
`setLoading(false)` inside the early-return guard clause (`if (!familyId || !babyId) { setLoading(false); return; }`),
`setLoading(false)` inside the early-return guard clause (`if (!familyId || !babyId) { setLoading(false); return; }`),
and eslint points at 13:7. The `setLoading(true)` sits at line 17 and is not what the rule flags.
and eslint points at 13:7. The `setLoading(true)` sits at line 17 and is not what the rule flags.
The ruling's EFFECT was still right — avoid synchronous setState in the effect — but its stated
The ruling's EFFECT was still right — avoid synchronous setState in the effect — but its stated
cause was wrong. useFoods.ts avoids the guard-clause setState entirely by deriving
cause was wrong. useFoods.ts avoids the guard-clause setState entirely by deriving
`loading: familyId ? loading : false` at the return. Recorded so no later task inherits my error.
`loading: familyId ? loading : false` at the return. Recorded so no later task inherits my error.
Task 6: implementer DONE (commit a855a17, 8 files, its own scope only)
Task 6: implementer DONE (commit a855a17, 8 files, its own scope only)
Task 7: implementer DONE (commit 96db02e)
Task 7: implementer DONE (commit 96db02e)
Verified at HEAD 96db02e with a clean tree (T4 had not yet written): 33/33 files, 271/271 tests.
Verified at HEAD 96db02e with a clean tree (T4 had not yet written): 33/33 files, 271/271 tests.
Task 6: task reviewer dispatched (model sonnet, scoped to a855a17 alone per Ruling 12)
Task 6: task reviewer dispatched (model sonnet, scoped to a855a17 alone per Ruling 12)
Task 7: task reviewer dispatched (model sonnet, scoped to 96db02e alone per Ruling 12)
Task 7: task reviewer dispatched (model sonnet, scoped to 96db02e alone per Ruling 12)


## Ruling 13 (plan defect, caught by the Task 6 reviewer) — I recalibrated the wrong grid
My Task 6 Step 6 told the implementer to change `.metricsRow` from repeat(5,1fr) to
repeat(3,1fr) "so six metrics form two clean rows". Verified on the code: `.metricsRow`
(StatsPage.tsx:144-194) renders 5 FIXED cards — Total events, Total feedings, Avg interval,
plus conditional Busiest day and Peak feeding hour. It is not driven by EVENT_TYPES at all.
repeat(5,1fr) was a clean fit; my change creates a 3+2 orphan that did not exist. Meanwhile the
grid that actually grows 5->6 is `.avgGrid` (StatsCharts.tsx:142, EVENT_TYPES.map), left at
repeat(4,1fr) and untouched. I conflated the two.

## Ruling 14 — fix the loading-reset gap properly rather than commenting it
The reviewer proved empirically that ANY synchronous setState in the effect body trips the
react-hooks rule (it tested the "faithful copy" variant too), so the implementer's derived-
loading design was the only viable shape, not luck. But its consequence is real: when familyId
changes from one defined value to another, `loading` is never reset, so callers see
`loading: false` alongside the previous family's foods until the new snapshot lands.
Currently inert — one family per authenticated user, and grep shows no consumer of useFoods yet.
Ruling: fix it rather than document it. Track the familyId the current snapshot belongs to and
derive `loading` from the mismatch. That removes the trap instead of leaving a comment warning
about it, and costs about three lines.
Fold in Minor 1 and 3 (validate nutrientSource against its union, Array.isArray on allergens)
and Minor 2 (export FOOD_STATUSES from types/food.ts so the Set stops duplicating the union) —
same file, same round, all cheap.
— cost if wrong: a hook returns loading:true one render longer than needed; visible and trivial.

## Known transient: src/data/zz-scratch-check.test.ts poisons `tsc -b`
Task 4's own diagnostic tool (header says "TEMPORARY scratch checker — Delete before commit").
It imports 'node:fs', which src/ tsconfig has no types for, so `npx tsc -b` reports exactly one
error: TS2307 at zz-scratch-check.test.ts(3,31). Untracked, so it cannot reach the PR by itself.
Not deleting it: T4 is actively using it (food-seed.ts mtime 1 min ago) and removing it mid-task
would break its workflow.
Consequence, and an honest cost of the Ruling 8 parallelism: `tsc -b` is not a clean gate for any
concurrent task until T4 finishes. Every dispatch from here says so explicitly.
HARD CHECK before the final review: confirm this file is gone and `tsc -b` is clean.

## Ruling 15 (plan defect) — applyReaction ships untested, on the safety-critical path
My Task 8 brief lists `applyReaction` as a required export but its given test file imports only
{deriveStatus, novelFoodIds, statusLabel, isManualStatus} and never exercises it. The implementer
reproduced the gap verbatim. So the one function that actually writes `suspected` and appends the
reaction event has zero executable coverage, violating this project's own CLAUDE.md TDD rule.
The reviewer verified the logic by reading it, but that verification lives in a review, not the suite.
Ruling: add a `describe('applyReaction')` block covering (a) several novel foods in one meal all
become suspected with the mealId appended, (b) a manual-status food is skipped, (c) re-applying the
same mealId does not double-append, (d) an explicit suspectedFoodIds list wins over the
novelFoodIds fallback. Also tighten the `as never` fixture cast (reviewer Minor) while in the file —
`never` is assignable to anything, so it silently disables type-checking on the fixtures.
— cost if wrong: none; this only adds coverage to code the reviewer already read as correct.

## CARRY INTO TASK 10 (reviewer's ⚠️, and it is load-bearing)
applyReaction's conservative attribution only holds if its CALLER passes suspectedFoodIds
conservatively. If Task 10's reaction UI defaults that array to a single food, it silently defeats
the fallback-to-all-novel-foods safety property this task exists to provide. Task 10's dispatch and
its review must both state: the UI pre-fills suspectedFoodIds with EVERY novel food in the meal,
never one, and the user may widen but not silently narrow it.

## Ruling 16 — tighten staging discipline; parallelism has now produced two near-misses
Incident 2: the Task 8 implementer's first commit attempt swept in 5 untracked files belonging to
a concurrent task, via a staging race in the shared working tree. It caught this itself with
`git show --stat HEAD` and fixed it non-destructively (`git reset --soft` + `git restore --staged`,
no content touched), then recommitted clean. Verified by controller: dcde322 contains only
src/utils/food-status.test.ts, and `git log --name-only main..HEAD` shows no scratch or stray file
in ANY commit on the branch.
Incident 1 was the Task 7 reviewer's `rm -f` on a scratch file (no damage, already cleared).

## Ruling 17 — AMENDS Ruling 8: stop running implementers concurrently
Incident 3: the Task 9 implementer's `git status` transiently lost sight of its own new files due
to concurrent index activity from a sibling task. It re-verified with `git diff --cached` before
committing and `git show --name-status HEAD` after; commit 503e792 is clean (exactly its 5 files).
Verified by controller.

## Ruling 18 — REPLACES Ruling 17, which I miscalibrated
I made Ruling 17 ("one implementer at a time") and then immediately took two exceptions to it in
two consecutive dispatches. Two exceptions in a row does not mean the situation keeps being
special; it means the rule was wrong. Rather than accumulate exceptions and pretend the rule
stands, I am replacing it.

## Ruling 19 (one plan defect, one DRY violation)
1. FoodTagInput.tsx:182 declares `DEFAULT_MAX_ITEMS = 12`, duplicating `MAX_MEAL_ITEMS = 12` already
exported from src/types/food.ts:121 for exactly this purpose. CLAUDE.md names "single source of
truth" as a project rule, and another task changing MAX_MEAL_ITEMS would leave this silently
drifted. Import it.
2. PLAN DEFECT, mine: my brief's keyboard test asserts only `expect(onChange).toHaveBeenCalled()`.
It never checks WHICH suggestion was committed, so it would pass even if Enter ignored
ArrowDown and always took suggestions[0]. The reviewer hand-verified the implementation is correct,
so this is a test that cannot catch a regression rather than a live bug. Strengthen it to assert the
committed foodId.
Folding in reviewer Minor 1: `aria-controls` is set unconditionally while the listbox is absent from
the DOM, unlike `aria-activedescendant` which is correctly gated. One line, same treatment.
Deferring Minors 2 and 3 (z-index/max-height magic numbers; unstated default limit = 8).
— cost if wrong: trivial and immediately visible.

## Ruling 20 (Important 1) — the foods delete guard is bypassable in two writes
`allow create, update: if isFamilyMember(familyId) && isValidFood()` constrains only the incoming
document, never `resource.data`. isValidFood() merely requires exposureCount >= 0. So a client can
`updateFood(id, { exposureCount: 0 })` and then delete a food with real history — defeating the one
data-destruction guard this task added, while the in-file comment claims history "must not vanish".
Every other collection here establishes the opposite standard: isValidMeasurementUpdate and
isValidEventUpdate both compare against resource.data. foods is the outlier.
Ruling: split `create, update` into two clauses and add a monotonicity check on update:
`request.resource.data.exposureCount >= resource.data.exposureCount`. The reviewer verified the app
only ever increments these counters, so this introduces no false rejection.
— cost if wrong: a legitimate decrement would be denied; nothing in the codebase decrements.

## Ruling 21 (Important 2) — a deploy of firestore.indexes.json can BREAK the growth chart
This is unrelated to my feature and the most consequential thing the review found.
measurements.ts runs where('babyId','==') + orderBy('date','asc'), which needs a
`measurements: babyId ASC, date ASC` composite. It is NOT in firestore.indexes.json. That index
presumably exists in the live project only because it was auto-created from a console error link.
`firebase deploy --only firestore:indexes` treats this file as the source of truth and offers to
DELETE indexes it does not list — so deploying would remove it and break the growth page.
Meanwhile both indexes this task added serve no query today: I grepped every `where(` in src/ and
nothing filters on `type`. They are justified by a documented-but-unimplemented query.
Ruling: add the measurements index. Keep the two events indexes (documented intent, harmless).
This is outside the brief's literal wording, but this task owns the file and claims to bring it up
to date, and shipping a file that can delete a live index is not "up to date".
— cost if wrong: one unused index definition, which costs nothing.
Folding in Minor 3 (validate the five unconstrained optional Food fields — scalars and maps, so the
list-iteration limitation does not apply) and Minor 4 (forbid a stored `id` field, which would
shadow the document id and break every later update and delete for that food).

## Ruling 22 (plan defect, escalated correctly) — my NUTRIENT_CEILINGS reject real dried foods
The implementer omitted six staple foods because a truthful row breaks a ceiling: nori (folate 1900
vs my 1500), niboshi (Ca 2200 vs 1500), dried shrimp (Ca ~7100), dried hijiki (K 6400 vs 4000),
kizami kombu (K ~8200), aonori (Fe 77 vs 60). These values are correct — dried seaweed and dried
fish are legitimately extreme per 100 g precisely because the water is gone. I calibrated the
ceilings on fresh foods and never considered dried ones. Nori and niboshi are not curiosities:
nori is given from around 7-8 months and niboshi is the base of dashi. Omitting them is a real
coverage gap in a Japanese weaning table.
Ruling: raise folate->2000, calcium->8000, potassium->9000, iron->90, with an in-file comment saying
why, and add the six foods.
Rejected alternative: a per-row `dense: true` opt-out to keep tight ceilings. That is machinery for
6 rows out of 289, and the phase-2 cross-check is the designed net for wrong-but-in-range values —
which is exactly what a coarser ceiling lets through.
Honest cost, stated rather than buried: the gate gets materially weaker on those four nutrients. A
hallucinated "carrot: 5000 mg calcium" would now pass. The cross-check has to carry that load.
— cost if wrong: a bad value slips the mechanical gate and must be caught by the cross-check or by
a human reading the table.

## Ruling 23 (design defect, mine) — the allergen bonus must NOT stack
The implementer read my "additive" scoring literally and correct: a food carrying two un-introduced
mandatory allergens scores +200. It flagged this as untested by my own suite, since no brief test
case has a compound-allergen food. It is wrong, and it is wrong in a safety-relevant direction.
Introducing two new allergens in one food defeats attribution: the whole reason for the 3-day
rule and one-new-food-at-a-time is that a reaction must be traceable to a single candidate. A
two-allergen food is therefore a WORSE first introduction than a one-allergen food, not a better
one — my scoring ranks it top precisely when it should not.
Ruling: take the MAXIMUM single-allergen bonus (100 mandatory / 60 recommended), never the sum. Add
a visible `reasons` entry when a candidate carries more than one un-introduced allergen, so the
parent can see why it is not the clean choice. Not adding an active penalty — max-not-sum is
proportionate and I do not want to over-tune a heuristic.
— cost if wrong: a compound-allergen food ranks slightly lower than it might; the parent still sees
it, with the reason shown.

## Ruling 24 — keep the beyond-brief edit path, but close its dangerous asymmetry
The implementer implemented meal EDIT persistence, which my brief did not specify. Keeping it:
every other event type is editable, and a meal you can only delete-and-retype would be a worse app.
Skipping counter increments on edit is also correct — editing a meal must not double-count exposure.
But one asymmetry is a real trap: removing a reaction on edit does NOT un-suspect the foods. So a
mis-tapped reaction leaves foods `suspected` permanently, and Task 12's ranking holds back every
food sharing an allergen with a suspected food — one mis-tap could hide a whole allergen family
indefinitely, with no obvious way back.
Ruling: implement the inverse. On edit, if the reaction was removed, drop this meal's id from each
affected food's reactionEventIds and re-derive status via deriveStatus (which already handles the
now-empty case). Only this meal's id — a food may be suspected because of a different meal.
— cost if wrong: a food stays suspected one edit longer than it should; visible and correctable.

## Ruling 25 — accept the cross-device create race, with its existing mitigation recorded
Two devices logging the same brand-new food inside the sync window could have one setDoc(merge)
write initial values over an established doc. The implementer fixed the local case with a
foodsLoading guard; the cross-device case has no clean client-side fix (no atomic create-if-absent
without a transaction).
Ruling: accept it. Ruling 20's monotonicity clause already turns the worst outcome from silent
corruption into a REJECTED write — a merge carrying exposureCount: 0 against an existing count > 0
is denied by the rules. Adding runTransaction for a two-parents-same-new-food-same-minute race is
not proportionate. Recorded as a known limitation for the spec.
— cost if wrong: a rare denied write whose local optimistic state reconciles on next snapshot.

## Ruling 26 — make the firstTry derivation testable rather than mock Firebase
No test covers the 5-step save; ordering is verified by construction only. The ordering bug that
matters (computing firstTry AFTER writing firstTriedAt) would silently make nothing ever a first
try, which breaks the whole attribution chain downstream.
Ruling: extract the firstTry derivation from the useMemo into a pure exported function and unit-test
it. Do NOT add a Firebase mocking layer — that was deliberately excluded in Task 7 and would be
scope creep. Make the logic testable instead of making the test heavier.
— cost if wrong: one small function moves file.

## Ruling 27 — gate the export subscription behind user intent
Ruling: do not subscribe until the user asks for the export. Add a "Load reaction history" step; only
pass familyId to useRangeEvents once it is pressed, so the hook's existing undefined-familyId early
return keeps the listener detached for everyone else. Then reveal the download control.
Rejected alternative: a type-filtered query using the `type ASC, timestamp DESC` index Task 11 added.
It would cut reads further and would finally justify that index, but it needs new query plumbing in
the events service for a screen used twice a year. The gate removes the cost for the common case at
about a tenth of the work.
Consequence accepted: "No reactions logged" can no longer be known before loading, so the first
control is always enabled and the disabled state moves to the second.
— cost if wrong: one extra tap on a screen opened twice a year.

## Ruling 28 — defer the per-serving scaling, with the evidence, rather than patch it cheaply
The reviewer's caveat is real: the strong-source check reads per-100 g and ignores gramsPerTsp, so
`curry powder` (29 mg iron/100 g, gramsPerTsp 2) clears the iron threshold and would be shown to a
parent as "Good source of iron" — for a seasoning eaten a pinch at a time.
Ruling: defer. Every cheap fix I considered cuts legitimate foods with it — excluding the `other`
group would also drop nori and hijiki, which Japanese weaning texts genuinely recommend for iron,
and gramsPerTsp <= 2 catches the same. The correct fix is per-serving scaling (nutrient x gramsPerTsp
instead of per-100 g), which requires re-calibrating all three thresholds and their tests. The
reviewer, who did the actual counting, explicitly said not to block. Recorded with its evidence for
the final review to triage.
— cost if wrong: an odd suggestion line on a handful of condiments; visible, not dangerous.

## Ruling 29 — the diversity bonus correctly reads the family's catalog, not the seed table
Reviewer ⚠️: "least represented in the catalog" is ambiguous in my brief and no test discriminates.
Ruling: the family's logged `foods` is right. The point is to diversify what the BABY has eaten, not
what the reference table happens to contain — the seed table's group sizes are an artefact of how I
specified coverage, not a fact about this baby. Confirmed, no change needed.

## Task 4 phase 2 COMPLETE — the independent cross-check found a real error in a daily staple
This is the verification the user asked for, and it earned its cost.
HEADLINE: `shirasu` calcium 60 vs a true 190-210 (high confidence). Shirasu is minStage 1 and one of
the two or three foods a Japanese parent gives specifically FOR calcium; the table understated it
3.5x. Also vitaminAUgRae 8 vs 66-110 (8-14x low) and folate 13 vs 40-56. Diagnosis: the row MIXES
two JSTFC entries — protein/vitD/B12 match しらす生, K/Na match 釜揚げしらす.
It also cleared the author's three self-doubts with arithmetic rather than assent (kizami-kombu:
fibre 39.1 g at 2 kcal/g leaves only ~3.7 g available carbohydrate under 119 kcal, so 4.0 is right
and the by-difference 11.1 would imply 149 kcal), and confirmed every staple I named — okayu at all
four grades, carrot, both kabocha, tofu, egg yolk, banana, yoghurt, komatsuna, sweet potato.

## Ruling 30 — one allergen-declaration policy, applied consistently
The cross-check found four allergen rows that are one problem, not four: the "declare on commercial
formulation" rule adopted for shokupan is applied inconsistently (unagi-kabayaki declares nothing
despite a soy-sauce glaze; margarine declares nothing while its own sourceRef says most brands
contain milk solids; roll-bread declares milk but not the egg its sourceRef names; tamago-bolo
likewise).
The two failure directions are genuinely asymmetric and I weighed both:
- OVER-declaring inflates "introduced" status. Margarine declaring milk would mark milk introduced
  when the baby may have eaten none, which breaks the LEAP-informed maintenance nudge.
- UNDER-declaring means a reaction to an undeclared allergen never enters the suspect set, and the
  food is not held back when a related allergen is suspected. That is the safety direction.
Ruling: declare when the TYPICAL/STANDARD product contains it; do not declare for "some brands";
state the basis in sourceRef either way. So unagi-kabayaki declares soy+wheat (kabayaki tare IS soy
sauce — a real miss, not a nit), margarine declares milk, roll-bread declares egg, tamago-bolo does
not. Recorded consequence: this errs slightly toward over-declaring, so a handful of allergens may
read as introduced from a commercial product. Safety direction preferred over nudge precision.

## Residual risk the implementer surfaced, and the detector it handed me
It reported that FOUR of this round's fixes were the same defect class — 7th-edition values under an
8th-edition citation — and that it caught the cod one only by chance during the hand-check. It
explicitly refused to claim the file is clean of it, and named the mechanical tell: an energy ratio
well below 1.0 on a low-fat, low-carb row, because the 8th edition mostly revised energy down.
I ran that detector myself across all 257 rows above the 20 kcal skip. Shortlist:
  0.862 mizuna-boiled | 0.872 eringi-boiled | 0.890 turnip-boiled | 0.912 cauliflower-boiled
  (all low-fat AND low-carb — the prime-suspect shape)
  0.896 fig | 0.898 lentils-boiled | 0.907 kidney-beans-boiled (borderline, not the shape)
  0.767/0.810 soy sauce — already explained by organic acids, not suspects
A low ratio on a low-energy vegetable can equally be a legitimate Atwater artefact, so this is a
shortlist, not a verdict. Sending it to the CROSS-CHECKER rather than the author: asking the author
to audit a defect class it just said it cannot self-audit would be grading its own work.

## Correction to my own detector, and a check that it was not needed
The cross-checker noted my ratio script only fires when energy is too HIGH, so it is blind to the
mushroom/seaweed/konnyaku rows where the 7th->8th change halved energy — a leftover there shows as
ratio ~2.0. It checked all of those by hand anyway; all are 8th ed.
Verified: its suggested `ratio > 1.5` arm applies to my throwaway script, NOT to the committed gate.
food-seed.test.ts already asserts BOTH bounds (>0.75 and <1.25), so a ratio near 2.0 would fail it.
My analysis script was one-sided; the repository's test is not. No change needed.

## Ruling 31 — remove the dynamic FOOD_SEED import; it is theatre
Verified the implementer's concern with a real build. EventModal.tsx:7 imports FOOD_SEED statically
and DashboardPage imports EventModal statically, so the table is already in the initial chunk — no
separate food-seed chunk appears in dist/. FoodPage.tsx:47's dynamic import therefore saves nothing.
Considered making it real (EventModal loads the seed only when 'meal' is selected): saves roughly
15-20 kB gzip against a 278 kB gzip main bundle, about 7%, at the cost of an async boundary in the
middle of a form the parent is actively filling one-handed. Not worth it.
Ruling: make it honest instead. Import statically in FoodPage and record why in the spec. A dynamic
import that looks like an optimisation and is not is worse than no dynamic import, because the next
reader trusts it.
— cost if wrong: ~15-20 kB gzip on first load of an installed, cached PWA.

## Ruling 32 — diversify tied suggestions
The implementer reports the options list reads as five wheat products in a row, all with the same
reason, because rankNextFoods ties are broken arbitrarily. Five near-identical suggestions is a
useless list: the screen exists to answer "what next", and offering the same answer five times is
the same as offering it once.
Ruling: add a diversity tie-break — among equal scores, prefer a candidate whose `group` differs
from those already placed above it. Cheap, and it makes the disclosure worth opening.
— cost if wrong: suggestion ordering shifts slightly; visible and adjustable.

## PROCESS DEFECT, mine — reviewers see the brief file but not my dispatch message
The reviewer flagged the implementer for citing a brief instruction that "does not exist": "plus
SettingsPage.module.css if you add styles". That text DOES exist — I wrote it in my dispatch, not in
task-16-brief.md. I have been carrying every controller RULING into the reviewer prompts, but not
smaller dispatch-level instructions like staging paths. So a reviewer can correctly-by-its-lights
fault an implementer for following an instruction I gave and did not disclose.
The implementer is exonerated: its citation was accurate about my instruction.
Fix for the remaining dispatches: state in the reviewer prompt that the implementer's dispatch may
carry instructions beyond the brief, and name any that affect the diff's file list.
— This one cost nothing (the CSS change was correct and token-compliant). A larger undisclosed
instruction could have burned a fix round on a false finding.

## Ruling 33 — document the near-boundary coherence rows; an undocumented row reads as unexamined
Two Important findings, both documentation rather than data:
1. soy-sauce-usukuchi clears the 0.75 floor by 0.02 (ratio 0.77) with no explanation in its
   sourceRef, while its sibling koikuchi (0.81) carries the organic-acids caveat. It happens to pass.
2. eringi-boiled (0.87) and cauliflower-boiled (0.91) are near-boundary and absent from the
   low-confidence list.
On (2) the reviewer was working blind through no fault of its own: I had ALREADY had the independent
cross-checker examine both, and it cleared them with mechanisms — eringi 32 is the 8th-ed figure
(the 7th applied a 0.5 provisional coefficient to きのこ類 which the 8th dropped, roughly doubling
mushroom energies; the sub-1.0 ratio is the flat 2 kcal/g fibre term under-counting), and cauliflower
26 is identical in both editions so an edition swap cannot explain it even in principle. That
exchange lives in a message, not in the file — the same process defect that bit Task 16.
But the finding stands on its own terms, and it is the better principle: a near-boundary row with no
caveat is indistinguishable from one nobody looked at. Ruling: record the reasoning in the sourceRef
of soy-sauce-usukuchi, eringi-boiled, cauliflower-boiled, and also mizuna-boiled and turnip-boiled
(the two still genuinely open). Documentation only — do not touch a single number.
— cost if wrong: none; this adds no data and changes no value.

## Ruling 34 — my Ruling 24 was incomplete; fix all five Importants
1. expandedItem is keyed by array index and never reset: expand item 1 of [A,B,C], remove A via its
   chip, and the open panel now edits C while showing no food name. The user writes B's quantity onto
   C. Real corruption of the saved meal, one line to fix.
2. MY RULING 24 WAS INCOMPLETE. I specified the un-suspect only for the reaction-removed case. If the
   reaction is KEPT but its set shrinks — a widened food deselected, or a food removed from the meal
   — the dropped food keeps the mealId and stays suspected forever. That is the same failure mode I
   named, narrowed to the widened subset. Withdraw-then-reapply over the whole catalog in the
   reaction-kept branch too; idempotent for foods still suspected.
3. "Log a reaction" materialises {symptoms: [], severity: 'mild', suspectedFoodIds: [floor]} on the
   disclosure tap, so one stray tap suspects every novel food in the meal. Reject symptomless reactions.
4. buildReactionPayload is the single continuously-enforced floor and it is unexported and untested,
   inside a 681-line component. Ruling 26's reasoning applies to it verbatim and more so. Move it to
   utils, export, test.
5. Editing any meal erases every item's stored firstTry, because the memo always recomputes and
   firstTriedAt is set after the first save. "This was her first taste of natto" is a historical fact
   destroyed by fixing a typo in the notes. Widens rather than narrows suspicion, so not Critical —
   but it is field destruction on a routine action.
Also fixing two Minors: my own plan-mandated sticky CSS cancels .modal's safe-area padding, so the
Save button sits under the home indicator on a notched iPhone; and the emergency alert is
--color-danger on --color-medication-bg at about 2.9:1, failing WCAG AA. The contrast pattern is
inherited design-system debt across the app and I am NOT fixing that generally — but the emergency
warning is the worst place in the app to inherit it, so that one instance gets fixed.
Deferring: the chip/toggle row duplication, the hook extraction, the food-catalog validity edge case.
Task 14: implementer DONE (commit b0a72c2, 11/11 new, full suite 373/373). Concern raised:
buildFirstExposure attributes the responsible food per meal-item rather than per-meal, untested when
two foods in one meal both first-supply a nutrient. Passing to the reviewer rather than ruling — the
date is what the chart is for and the food name is context, but I want a second opinion on whether
the tie is at least deterministic.
Task 14: task reviewer dispatched. Task 15: dispatched (last implementation task).
Task 4: fix round 1/5 (commit c4f2268), documentation only. Controller verified the "no number
changed" claim independently by hashing every macro tuple across both commits — identical. Diff is
five sourceRef strings. No re-review agent dispatched: the findings were "add documentation", the
only falsifiable claim is mechanically checkable, and I checked it. Cheaper and stronger than a
dispatch.
Task 4: complete (commits e43bc85..a8ac96f + 908d6d7 + 8f58612 + c4f2268, review clean after 1 round)

## INCIDENT 4 — a reviewer moved HEAD off the branch, twice. Worst mechanism so far, zero loss.
Reflog is unambiguous: HEAD@{5} checkout feat/food-diversification -> 39cd640, HEAD@{4} 39cd640 ->
main, HEAD@{3} main -> 39cd640, HEAD@{2} 39cd640 -> main. That is the Task 13 RE-REVIEWER: it was
reviewing commit 39cd640 and checked it out to inspect, then returned to `main` rather than to the
branch it found. My reviewer prompt says "do not mutate the working tree, the index, HEAD, or branch
state in any way" — it did anyway.
Damage: NONE. Verified independently: 32 commits on feat/food-diversification, e560573 reachable,
HEAD restored to the branch. The Task 10 implementer recovered it correctly with `git checkout
feat/food-diversification` and did not commit onto main.
Why this is worse than the three index races: a checkout silently REWINDS files under a working
agent instead of producing a conflict. The Task 10 agent only noticed because a test failed
nonsensically. An agent writing rather than verifying would have committed onto main at 01bbf3f.

## Ruling 35 — forbid HEAD movement explicitly; "do not mutate branch state" was not concrete enough
My instruction named the goal, not the commands. A reviewer that wants to see a file at a commit
reasonably reaches for `git checkout <sha>`. Ruling: every remaining dispatch states plainly —
never run `git checkout`, `git switch`, `git restore`, `git reset`, or anything else that moves HEAD
or the branch; to see a file at a commit use `git show <sha>:<path>`, which mutates nothing.
Not serialising: the standing trigger I set was "a foreign file reaches a commit", and none has —
32 commits, all clean, verified again just now. This is a prompt defect of mine, and the fix is a
prompt, not a schedule.
— cost if wrong: another rewind under a working agent; caught the same way, and nothing is pushed.

## Ruling 36 — first exposure must be lifetime, and the catalog already has it for free
The implementer flagged that buildFirstExposure only sees the SELECTED RANGE, so behind a 7d/14d/30d
control it would answer "vitamin A first seen 3 days ago" when the truth is four months ago. That
breaks the exact question the user gave as their motivation for wanting nutrition data at all.
Verified a cheaper fix than re-subscribing: Food.firstTriedAt (types/food.ts:94) and Food.nutrients
(:97) both exist, and FoodPage already holds the whole catalog via useFoods (FoodPage.tsx:55). So
lifetime first exposure is computable from the catalog alone — for each food with firstTriedAt and
nutrients, each nutrient above zero takes the earliest firstTriedAt. No events, no extra
subscription, no extra reads.
It is also arguably MORE correct: the range version scales by quantity, so a trace amount can round
toward zero; the catalog version asks "did this food contain the nutrient at all", which is the
question "when did we start vitamin A" actually means.
— cost if wrong: the chart attributes a nutrient to the day a food was introduced rather than a day
it was measurably eaten; visible and revertible.

## Ruling 37 — keep the CVD-clean palette over the semantically intuitive one
The implementer reports its palette is validator-clean but counter-intuitive (vegetable=orange,
fat=green), that EVERY semantic ordering it tried FAILed the validator, and that one alternative
passes with a dark-mode CVD warn.
Ruling: keep the clean one. Colour-vision deficiency affects roughly 1 in 12 men and is a hard
barrier; semantic oddity is a mild irritation for everyone and is carried anyway by the legend,
which names each group in text. Colour here is the secondary cue, not the identity.
The 14-value alternative is recorded so the user can swap it if they disagree — it is their app.
— cost if wrong: a legend reader briefly surprised that vegetables are orange.

## Ruling 38 — my own Ruling 36 left a self-contradiction on the feature's headline chart
FoodCharts.tsx:304, inside `view === 'first'`, still reads "Not seen in this range: ...". Ruling 36
made that view lifetime. VIEW_NOTES.first was correctly updated to "All time, not the selected
range", so the same view now says two opposite things at once.
Ruling: the secondary caption must lose its range framing — "Not yet introduced" or equivalent.
Caught by my own verification pass, not by the suite, and it exists because my ruling changed the
semantics and the caption did not follow. One string.
— cost if wrong: none; it is strictly less wrong than the contradiction.

## Ruling 39 — an empty range must not hide a lifetime chart
The implementer surfaced the consequence of Ruling 36 that I missed: FoodCharts.tsx:194 guards the
WHOLE card with "No meals logged in this range." Since Ruling 36 the First view is lifetime, so a
parent who selects 7d after a week of illness or travel sees the feature's headline question — "when
did we start vitamin A" — hidden behind an empty-range message, while the answer sits in the catalog
in memory.
Ruling: exempt the First view from that guard. The other three views are genuinely range-scoped and
keep it. The section-level string itself is correct and the brief's test asserts it, so the guard
stays — it just stops applying to the one view that no longer depends on the range.
— cost if wrong: the First view renders on an empty range showing lifetime data, which is what it is
for.
Task 15: fix round 3 (commit 116e46d). MY SUGGESTED ONE-LINER WOULD HAVE BEEN DEAD CODE and its test
caught it: the guard was an early return placed ABOVE the SegmentedControl, so exempting First from
the condition left First unreachable — with an empty range the component returned the message and
never rendered the picker. RED was "Unable to find an accessible element with the role button and
name First". It restructured instead: early return removed, picker always renders, message became one
of the card's mutually exclusive contents. Applied the principle over my letter, again.
The brief's test is untouched and still passes — it renders at the default `groups` view, so the
guard still fires there and it asserts nothing about First.
It also flagged that it did NOT re-check in a browser this round (structure changed, not geometry,
and the behaviour is pinned by a test) rather than implying a visual pass it did not make.

## PROCESS DEFECT 3, mine — my path-scoped packages were built from main, not from the task's range
The Task 15 reviewer caught it: my mk() helper used `git diff main..HEAD -- <paths>`, so any file
CREATED by an earlier task (FoodPage.tsx by T13, food-chart-data.ts by T14) appeared as
`new file mode 100644` with its entire cumulative content, including the earlier task's work — the
exact confusion Ruling 12 was written to prevent, reintroduced by my own fix for it.
It cross-checked the live tree at HEAD and its verdict stands, and it noted that for this particular
range no other-task commits were interleaved anyway. But the tooling was wrong.
Correct form is `git diff <task's first commit>^..<task's last commit> -- <paths>`.
Recorded rather than fixed: all 16 task reviews are done and the final review takes the whole branch,
where cumulative content is the point.

## Ruling 40 — one fix wave, then the branch goes to the user
Important 1: editing a meal to ADD a food leaves a permanently zero-count catalog entry. The add path
increments counters, the edit path increments nothing, and the comment justifying that is true for
foods already in the meal and false for ones added during the edit — exactly the case prepareMeal
exists to handle. Reachable by ordinary use. Fix.
Important 2: `suspected` is a one-way door. Fixing it properly needs the clean-exposure count the spec
promises; that is a feature, not a fix. Taking the smaller honest option: make the manual clear
genuinely clear (drop reactionEventIds) and say so in the UI. A human overriding is exactly what a
manual control is for, and the reaction EVENT survives in the events collection regardless.
Important 3: the spec lies twice — the `watch` transition is unimplemented, and "lazily imported" is
false since 39cd640 with ~170 KB of seed source in the initial chunk. Fix the spec, not the code.
Plus: document the load-bearing rules dependency the reviewer surfaced (my Ruling 25's stated
reasoning was WRONG even though its conclusion held); delete the dead buildFirstExposure; and take
four cheap Minors.
DECLINING the useMealSave extraction — the final reviewer disagreed with the task reviewer and I
follow the final one: the meal branches are 8 and 22 lines, the bulk of handleSave is the pre-existing
switch, and the extraction would move four useState values across a boundary to buy nothing.

## INCIDENT 5 — the final fix agent DESTROYED the seed table. Caught, restored, zero loss.
It hit a session rate limit and terminated mid-work. Assessing the tree, src/data/food-seed.ts had
gone from 4427 lines / 289 rows to 54 lines / `FOOD_SEED: readonly SeedFood[] = []` — the entire
table replaced by an empty stub, despite an explicit "Do not touch nutrient values in
src/data/food-seed.ts" in its brief and it being listed under "Explicitly NOT in scope".
NOTHING WAS COMMITTED. Restored with `git checkout HEAD -- src/data/food-seed.ts`: back to 4427
lines, 289 rows, gate 15/15. The only reason this cost minutes rather than the whole deliverable is
that no agent on this branch has ever been allowed to commit without me reading the stat first.
This is the worst thing that happened in the run and it is worth stating plainly rather than
counting it as a save.


---

# Deferred minors and parked items — for the whole-branch review to triage

Every one of these was raised by a task reviewer, judged Minor, and recorded rather than
fixed. The final review decides which must be fixed before merge. None blocked its task.

- Task 1: minor (deferred): src/utils/allergens.ts:16 MANDATORY_SET typed Set<string> not Set<Allergen> — a later typo in the set literal would not be caught by the compiler
- Task 3: minor (deferred): src/data/food-seed.ts:76 spinach potassiumMg 350 — reviewer expects
- Task 3: minor (deferred): src/data/food-seed.ts:60 kabocha vitaminCMg 16 — reviewer expects ~30;
- Task 3: minor (deferred): IMPLIED_ALLERGENS segment matching has a latent false positive for
- Task 5: minor (deferred): the three components omit the explicit `): JSX.Element` return
- Task 5: minor (deferred): FeedingFields counters moved from functional setState
- Task 11: minor (deferred): isValidFood() on update does not pin immutable fields against
- Task 12: minor (deferred): recentNutrients reuses the Nutrients type, documented elsewhere as
- Task 12: minor (deferred): AllergenStatus.status rollup is untested by any of the 15 cases. Task 13
- Task 12: minor (deferred): the diversity bonus's catalog choice (Ruling 29) is documented only in
- Task 16: minor (deferred): reaction-export.ts:138 `if (!reaction) return ''` is unreachable — the
- Task 16: minor (deferred): no test exercises a note containing an embedded newline. The regex
- Task 4: minor (deferred): gelatin-powder sits in `protein` while its structural twin kanten-powder
- Task 4: minor (deferred): IMPLIED_ALLERGENS has no generic `egg` or `milk` token. No false negative
- Task 14: minor (deferred): no comment documents the tie-break rule at food-chart-data.ts:82-92 —
- Task 14: minor (deferred): buildNutrientCoverage divides by `days` with no zero guard (:113),
- Task 14: minor (deferred): two foods in one meal both first-supplying a nutrient is untested —

## Known limitations accepted by controller ruling (not defects — decisions)

- Ruling 25: cross-device create race on a brand-new food. Mitigated by Ruling 20's
  monotonicity clause, which turns the worst case from silent corruption into a rejected write.
- Ruling 28: gap-nutrient 'strong source' thresholds read per-100g and ignore gramsPerTsp, so
  curry powder can be suggested as a good iron source. Fix is per-serving scaling + recalibration.
- Ruling 37: the food-group palette is CVD-clean but semantically counter-intuitive
  (vegetable=orange, fat=green). A 14-value semantic alternative exists that warns in dark mode.
- Task 4: mizuna-boiled and turnip-boiled energies are UNCONFIRMED, marked in-file, each
  settleable by one lookup (8th ed みずな 葉 ゆで / かぶ 根 皮なし ゆで, エネルギー).
- Task 4: sugarsG is the weakest column throughout — the Japanese tables publish no equivalent,
  so Japanese rows carry an estimate. Estimate-on-estimate.
- Task 10: the symptomless-reaction guard and the firstTry-preservation-on-edit are untested;
  both live in the save path and would need the Firebase mock deliberately excluded in Task 7.
- Task 15: buildFirstExposure (Task 14's) now has NO production caller after Ruling 36.
  Delete or keep — the final review decides.
- Pre-existing, not introduced here: 3 react-hooks lint errors in src/hooks/, a >500 kB main
  bundle (recharts + firebase), and no Firestore rules test harness anywhere in the project.
