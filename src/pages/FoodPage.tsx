import { useState, useMemo, lazy, Suspense } from 'react';
import { subDays, startOfDay, endOfDay, eachDayOfInterval, format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { ShieldAlert, History, ChevronDown, Salad } from 'lucide-react';
import { useToday } from '../hooks/useToday';
import { FOOD_SEED } from '../data/food-seed';
import { useFoods } from '../hooks/useFoods';
import { useRangeEvents } from '../hooks/useRangeEvents';
import { CacheIndicator } from '../components/CacheIndicator';
import { SegmentedControl } from '../components/SegmentedControl';
import { getRangeDays } from '../utils/chart-helpers';
import type { RangeType } from '../utils/chart-helpers';
import { AllergenGrid, AllergenSheet } from '../components/AllergenGrid';
import { EventModal } from '../components/EventModal';
import { formatBabyAge } from '../utils/date';
import { getWeaningStage, STAGE_LABELS } from '../utils/weaning-stage';
import { rankNextFoods, getIntroductionWindow, getAllergenStatus } from '../utils/next-foods';
import { statusLabel, deriveStatus } from '../utils/food-status';
import { mealNutrients } from '../utils/meal-nutrition';
import { ALLERGEN_LABELS } from '../utils/allergens';
import { updateFood } from '../services/food-catalog';
import type { Allergen } from '../utils/allergens';
import type { AllergenStatus, NextFoodCandidate } from '../utils/next-foods';
import type { Baby } from '../types/events';
import type { Food, FoodStatus, MealEvent, SeedFood } from '../types/food';
import styles from './FoodPage.module.css';

const FoodCharts = lazy(() =>
  import('./FoodCharts').then((m) => ({ default: m.FoodCharts })),
);

interface FoodPageProps {
  familyId: string;
  babyId: string;
  userId: string;
  baby: Baby | null;
}

/** Trailing window used both for the nutrient gap and the "recent" strip. */
const RECENT_DAYS = 7;
/** How many rows the disclosure shows per group before it summarises the rest. */
const OPTION_LIMIT = 8;
const RECENT_CHIP_LIMIT = 12;

const RANGE_OPTIONS = ['7d', '14d', '30d'] as const;
const RANGE_LABELS: Record<RangeType, string> = { '7d': '7 days', '14d': '14 days', '30d': '30 days' };

export function FoodPage({ familyId, babyId, userId, baby }: FoodPageProps) {
  const today = useToday();
  const [range, setRange] = useState<RangeType>('7d');
  const [showOptions, setShowOptions] = useState(false);
  const [logTarget, setLogTarget] = useState<SeedFood | null>(null);
  const [openAllergen, setOpenAllergen] = useState<AllergenStatus | null>(null);

  const { foods, loading, fromCache, hasPendingWrites } = useFoods(familyId);

  /**
   * One listener, sized to the chart range. The range is never below
   * RECENT_DAYS, so the 7-day nutrient gap can be filtered out of the same
   * events rather than opening a second query.
   */
  const rangeDays = getRangeDays(range);
  const startDate = useMemo(() => startOfDay(subDays(today, rangeDays - 1)), [today, rangeDays]);
  const endDate = useMemo(() => endOfDay(today), [today]);
  const { events } = useRangeEvents(familyId, babyId, startDate, endDate);

  const recentStart = useMemo(() => startOfDay(subDays(today, RECENT_DAYS - 1)), [today]);

  const days = useMemo(
    () => eachDayOfInterval({ start: startDate, end: endDate })
      .map((date) => ({ date, label: format(date, 'MMM d') })),
    [startDate, endDate],
  );

  const foodById = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods]);

  /**
   * A 7-day *intake total*, not per-100 g reference values: every logged meal
   * item is converted to grams and scaled, then summed. `rankNextFoods` compares
   * this against a 7-day reference intake, so passing a food's per-100 g
   * nutrients here would be meaningless.
   */
  const recentNutrients = useMemo(() => {
    const items = events
      .filter((e): e is MealEvent => e.type === 'meal' && e.timestamp.toDate() >= recentStart)
      .flatMap((e) => e.items);
    return items.length > 0 ? mealNutrients(items, foodById) : null;
  }, [events, foodById, recentStart]);

  const stage = baby ? getWeaningStage(baby.birthDate.toDate(), today) : null;
  const introWindow = useMemo(() => getIntroductionWindow(foods, today), [foods, today]);

  const candidates = useMemo(
    () => (stage ? rankNextFoods({ seed: FOOD_SEED, foods, stage, now: today, recentNutrients }) : []),
    [foods, stage, today, recentNutrients],
  );

  const hero = candidates.find((c) => !c.heldBy) ?? null;
  const rest = candidates.filter((c) => c !== hero);
  const openOptions = rest.filter((c) => !c.heldBy).slice(0, OPTION_LIMIT);
  const heldOptions = rest.filter((c) => c.heldBy);
  const heldShown = heldOptions.slice(0, OPTION_LIMIT);

  const allergenStatuses = useMemo(() => getAllergenStatus(foods, today), [foods, today]);
  const introducedCount = allergenStatuses.filter((s) => s.introduced).length;

  const recentFoods = useMemo(
    () => foods
      .filter((f): f is Food & { firstTriedAt: Timestamp } => Boolean(f.firstTriedAt))
      .sort((a, b) => b.firstTriedAt.toMillis() - a.firstTriedAt.toMillis())
      .slice(0, RECENT_CHIP_LIMIT),
    [foods],
  );

  /**
   * A manual status set on an allergen applies to every catalog food carrying
   * it. `null` clears it back to whatever the log alone supports.
   *
   * Every manual write drops `reactionEventIds`, whichever direction it goes.
   * Nothing counts clean re-exposures, so a food carrying a past reaction
   * re-derives straight back to `suspected`/`watch` off a stale reaction
   * link — a one-way door with no exit otherwise. The reaction *events* are
   * untouched in the `events` collection; `reactionEventIds` is a derived
   * index, and a parent overriding the status by hand is saying "I have
   * re-assessed this". This also keeps every manual write in the shape
   * firestore.rules requires to change a locked (`confirmed_allergy`/`avoid`)
   * status: empty incoming `reactionEventIds`.
   */
  function setAllergenStatus(allergen: Allergen, next: FoodStatus | null) {
    const stamp = Timestamp.now();
    for (const food of foods.filter((f) => f.allergens.includes(allergen))) {
      const update: Partial<Food> = next
        ? { status: next, reactionEventIds: [], statusUpdatedAt: stamp }
        : {
            status: deriveStatus({ ...food, status: 'untried', reactionEventIds: [] }, 0),
            reactionEventIds: [],
            statusUpdatedAt: stamp,
          };
      updateFood(familyId, food.id, update)
        .catch(() => { /* The snapshot listener stays the source of truth */ });
    }
    setOpenAllergen(null);
  }

  if (loading) {
    return <div className={styles.loading}>Loading foods...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Food</h1>
          {baby && (
            <p className={styles.subtitle}>
              {formatBabyAge(baby.birthDate.toDate())}
              {stage ? ` — ${STAGE_LABELS[stage]}` : ''}
            </p>
          )}
        </div>
        <CacheIndicator fromCache={fromCache} hasPendingWrites={hasPendingWrites} />
      </div>

      {/* ─── Hero: one answer ─── */}
      <section className={styles.hero}>
        {!introWindow.open ? (
          <>
            <span className={styles.kicker}>Hold</span>
            <p className={styles.heroName}>
              No new food until {format(introWindow.nextDate, 'EEE d MMM')}
            </p>
            <p className={styles.heroNote}>
              Three days between new foods, so a reaction can be traced to one of them.
              Foods already introduced are fine to serve meanwhile.
            </p>
          </>
        ) : !stage ? (
          <>
            <span className={styles.kicker}>Not yet</span>
            <p className={styles.heroName}>Weaning normally starts around 5 months</p>
            <p className={styles.heroNote}>Suggestions appear once the first stage begins.</p>
          </>
        ) : hero ? (
          <>
            <span className={styles.kicker}>Try next</span>
            <div className={styles.heroRow}>
              <p className={styles.heroName}>{hero.seed.name}</p>
              <button type="button" className={styles.logBtn} onClick={() => setLogTarget(hero.seed)}>
                Log it
              </button>
            </div>
            <ul className={styles.reasons}>
              {hero.reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          </>
        ) : (
          <>
            <span className={styles.kicker}>Nothing clear</span>
            <p className={styles.heroName}>Every option shares a flagged allergen</p>
            <p className={styles.heroNote}>They are all listed below with the reason.</p>
          </>
        )}

        {introWindow.open && stage && rest.length > 0 && (
          <>
            <button
              type="button"
              className={styles.disclosure}
              aria-expanded={showOptions}
              onClick={() => setShowOptions((v) => !v)}
            >
              Other options
              <ChevronDown size={16} className={showOptions ? styles.chevronOpen : ''} />
            </button>

            {showOptions && (
              <ul className={styles.options}>
                {openOptions.map((c) => (
                  <OptionRow key={c.seed.id} candidate={c} onSelect={setLogTarget} />
                ))}
                {heldShown.map((c) => (
                  <OptionRow key={c.seed.id} candidate={c} onSelect={setLogTarget} />
                ))}
                {heldOptions.length > heldShown.length && (
                  <li className={styles.moreHeld}>
                    +{heldOptions.length - heldShown.length} more held back for the same reason
                  </li>
                )}
              </ul>
            )}
          </>
        )}
      </section>

      {/* ─── Allergens ─── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <ShieldAlert size={20} className={styles.sectionIcon} />
          <h2 className={styles.sectionTitle}>Allergens</h2>
          <span className={styles.sectionHint}>{introducedCount}/{allergenStatuses.length} introduced</span>
        </div>
        <AllergenGrid statuses={allergenStatuses} onSelect={setOpenAllergen} />
      </section>

      {/* ─── Nutrition charts ─── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Salad size={20} className={styles.sectionIcon} />
          <h2 className={styles.sectionTitle}>What went in</h2>
          <span className={styles.sectionHint}>Last {rangeDays} days</span>
        </div>
        <div className={styles.controls}>
          <SegmentedControl options={RANGE_OPTIONS} value={range} onChange={setRange} labels={RANGE_LABELS} />
        </div>
        <Suspense fallback={<p className={styles.hint}>Loading charts...</p>}>
          <FoodCharts events={events} byId={foodById} days={days} rangeDays={rangeDays} />
        </Suspense>
      </section>

      {/* ─── Recently introduced ─── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <History size={20} className={styles.sectionIcon} />
          <h2 className={styles.sectionTitle}>Recently introduced</h2>
        </div>
        {recentFoods.length === 0 ? (
          <p className={styles.hint}>Nothing logged yet.</p>
        ) : (
          <div className={styles.strip}>
            {recentFoods.map((f) => (
              <span key={f.id} className={styles.chip}>
                <span className={styles.chipName}>{f.name}</span>
                <span className={styles.chipMeta}>{statusLabel(f)}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      <p className={styles.hint}>
        Built from the Japanese weaning stages and what you logged. A checklist, not
        medical advice — your paediatrician decides.
      </p>

      {openAllergen && (
        <AllergenSheet
          status={openAllergen}
          foodCount={foods.filter((f) => f.allergens.includes(openAllergen.allergen)).length}
          onClose={() => setOpenAllergen(null)}
          onSetStatus={setAllergenStatus}
        />
      )}

      {logTarget && (
        <EventModal
          mode="add"
          date={today}
          familyId={familyId}
          babyId={babyId}
          userId={userId}
          babyBirthDate={baby?.birthDate.toDate()}
          initialType="meal"
          initialItems={[{ foodId: logTarget.id, name: logTarget.name, quantity: 1, unit: 'tsp' }]}
          onClose={() => setLogTarget(null)}
        />
      )}
    </div>
  );
}

interface OptionRowProps {
  candidate: NextFoodCandidate;
  onSelect: (seed: SeedFood) => void;
}

/** Held-back rows stay tappable: the reasoning is shown so it can be overridden. */
function OptionRow({ candidate, onSelect }: OptionRowProps) {
  const { seed, reasons, heldBy } = candidate;
  return (
    <li>
      <button
        type="button"
        className={`${styles.option} ${heldBy ? styles.held : ''}`}
        onClick={() => onSelect(seed)}
      >
        <span className={styles.optionName}>{seed.name}</span>
        <span className={styles.optionReason}>
          {heldBy
            ? `Held back — shares ${ALLERGEN_LABELS[heldBy.allergen]} with ${heldBy.foodName}, which is flagged.`
            : reasons[0] ?? 'Allowed at the current stage.'}
        </span>
      </button>
    </li>
  );
}
