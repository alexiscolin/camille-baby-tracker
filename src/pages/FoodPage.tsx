import { useState, useMemo, lazy, Suspense } from 'react';
import { addDays, subDays, startOfDay, endOfDay, eachDayOfInterval, format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { ShieldAlert, History, ChevronDown, Salad, ShoppingCart } from 'lucide-react';
import { useToday } from '../hooks/useToday';
import { FOOD_SEED } from '../data/food-seed';
import { useFoods } from '../hooks/useFoods';
import { useRangeEvents } from '../hooks/useRangeEvents';
import { CacheIndicator } from '../components/CacheIndicator';
import { SegmentedControl } from '../components/SegmentedControl';
import { getRangeDays } from '../utils/chart-helpers';
import type { RangeType } from '../utils/chart-helpers';
import { AllergenGrid, AllergenSheet } from '../components/AllergenGrid';
import { ShoppingList } from '../components/ShoppingList';
import { ModalFallback } from '../components/ModalFallback';
import { withChunkReload } from '../utils/lazy-route';
import { formatBabyAge } from '../utils/date';
import { STAGE_LABELS } from '../utils/weaning-stage';
import { getWeaningProgress } from '../utils/weaning-progress';
import { rankNextFoods, getPace, getAllergenStatus } from '../utils/next-foods';
import { statusLabel, deriveStatus } from '../utils/food-status';
import { updateFood } from '../services/food-catalog';
import { buildShoppingList } from '../utils/shopping-list';
import type { Allergen } from '../utils/allergens';
import type { AllergenStatus, NextFoodCandidate, Readiness } from '../utils/next-foods';
import type { Baby } from '../types/events';
import type { Food, FoodStatus, SeedFood } from '../types/food';
import styles from './FoodPage.module.css';

const FoodCharts = lazy(() =>
  import('./FoodCharts').then((m) => ({ default: m.FoodCharts })),
);

/**
 * Deferred for the modal's own weight, not the seed: this page reads FOOD_SEED
 * directly above, so anyone landing on /food downloads it either way.
 */
const EventModal = lazy(
  withChunkReload(() =>
    import('../components/EventModal').then((m) => ({ default: m.EventModal })),
  ),
);

interface FoodPageProps {
  familyId: string;
  babyId: string;
  userId: string;
  baby: Baby | null;
}

/** How many rows the disclosure shows per group before it summarises the rest. */
const OPTION_LIMIT = 8;
const RECENT_CHIP_LIMIT = 12;

const OPTION_GROUPS: { readiness: Readiness; title: string; limit: number }[] = [
  { readiness: 'now', title: 'Also fine now', limit: OPTION_LIMIT },
  { readiness: 'later', title: 'Later', limit: OPTION_LIMIT },
  { readiness: 'doctor', title: 'With your paediatrician', limit: Infinity },
  { readiness: 'held', title: 'Held back', limit: OPTION_LIMIT },
];

const RANGE_OPTIONS = ['7d', '14d', '30d'] as const;
const RANGE_LABELS: Record<RangeType, string> = { '7d': '7 days', '14d': '14 days', '30d': '30 days' };

export function FoodPage({ familyId, babyId, userId, baby }: FoodPageProps) {
  const today = useToday();
  const [range, setRange] = useState<RangeType>('7d');
  const [showOptions, setShowOptions] = useState(false);
  const [showShopping, setShowShopping] = useState(false);
  const [logTarget, setLogTarget] = useState<SeedFood | null>(null);
  const [openAllergen, setOpenAllergen] = useState<AllergenStatus | null>(null);

  const { foods, loading, fromCache, hasPendingWrites } = useFoods(familyId);

  /** One listener, sized to the chart range. */
  const rangeDays = getRangeDays(range);
  const startDate = useMemo(() => startOfDay(subDays(today, rangeDays - 1)), [today, rangeDays]);
  const endDate = useMemo(() => endOfDay(today), [today]);
  const { events } = useRangeEvents(familyId, babyId, startDate, endDate);

  const days = useMemo(
    () => eachDayOfInterval({ start: startDate, end: endDate })
      .map((date) => ({ date, label: format(date, 'MMM d') })),
    [startDate, endDate],
  );

  const foodById = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods]);

  /** Where the baby is: age, and what has been introduced since the first spoon. */
  const progress = useMemo(
    () => (baby
      ? getWeaningProgress({
          birthDate: baby.birthDate.toDate(),
          weaningStartedAt: baby.weaningStartedAt?.toDate(),
          eczema: baby.eczema,
          foods,
          now: today,
        })
      : null),
    [baby, foods, today],
  );
  const stage = progress?.stage ?? null;
  const pace = useMemo(() => getPace(foods, today), [foods, today]);

  const candidates = useMemo(
    () => (progress ? rankNextFoods({ seed: FOOD_SEED, foods, progress, now: today }) : []),
    [foods, progress, today],
  );

  const hero = candidates.find((c) => c.readiness === 'now') ?? null;
  const rest = candidates.filter((c) => c !== hero);
  const optionGroups = OPTION_GROUPS
    .map((g) => ({ ...g, items: rest.filter((c) => c.readiness === g.readiness) }))
    .filter((g) => g.items.length > 0);

  /**
   * Built for where the baby will be in a week, so a phase that opens mid-week
   * is on the list. Only computed once the section is opened.
   */
  const shoppingList = useMemo(() => {
    if (!baby || !showShopping) return null;
    const nextWeek = getWeaningProgress({
      birthDate: baby.birthDate.toDate(),
      weaningStartedAt: baby.weaningStartedAt?.toDate(),
      eczema: baby.eczema,
      foods,
      now: addDays(today, 7),
    });
    return buildShoppingList({ progress: nextWeek, foods, seed: FOOD_SEED, now: today });
  }, [baby, foods, today, showShopping]);

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
              {stage && progress?.daysSinceStart != null ? ` · day ${progress.daysSinceStart + 1} of solids` : ''}
            </p>
          )}
        </div>
        <CacheIndicator fromCache={fromCache} hasPendingWrites={hasPendingWrites} />
      </div>

      {/* ─── Hero: one answer ─── */}
      <section className={styles.hero}>
        {progress?.eczema && (
          <p className={styles.caution}>
            Eczema: Japanese guidance asks you to see your doctor before starting solids, and to
            get the eczema treated first.
          </p>
        )}
        {!stage ? (
          <>
            <span className={styles.kicker}>Not yet</span>
            <p className={styles.heroName}>Weaning normally starts around 5 months</p>
            <p className={styles.heroNote}>Suggestions appear once the first stage begins.</p>
          </>
        ) : hero ? (
          <>
            <span className={styles.kicker}>{pace.newToday ? 'Tomorrow' : 'Try next'}</span>
            {pace.newToday && (
              <p className={styles.heroNote}>
                Already tried something new today ({pace.newToday.name}). City weaning guides
                suggest at most one new food a day, often the same one for 2–3 days.
              </p>
            )}
            {!progress?.startedAt && (
              <p className={styles.heroNote}>
                Start when the baby sits with support and shows interest in food: one spoon a day.
              </p>
            )}
            <div className={styles.heroRow}>
              <div className={styles.heroNames}>
                <p className={styles.heroName} data-testid="hero-food">{hero.seed.name}</p>
                <p className={styles.heroNameJa} data-testid="hero-food-ja" lang="ja">{hero.seed.nameJa}</p>
              </div>
              <button type="button" className={styles.logBtn} onClick={() => setLogTarget(hero.seed)}>
                Log it
              </button>
            </div>
            <ul className={styles.reasons}>
              {hero.reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
            {hero.seed.note && <p className={styles.caution}>{hero.seed.note}</p>}
            <p className={styles.hint}>
              First tastes: one spoon, well cooked, on a weekday daytime, when a clinic is open.
            </p>
          </>
        ) : progress?.phase === 'porridge' ? (
          <>
            <span className={styles.kicker}>This week</span>
            <p className={styles.heroName}>Keep going with porridge</p>
            <p className={styles.heroNote}>
              Add a spoon every couple of days as the baby takes it. Vegetables come in after
              about a week, once porridge is a habit; tofu, white fish and egg yolk about a week
              after the first vegetable.
            </p>
          </>
        ) : (
          <>
            <span className={styles.kicker}>Nothing clear</span>
            <p className={styles.heroName}>Nothing to suggest right now</p>
            <p className={styles.heroNote}>Every option is listed below with its reason.</p>
          </>
        )}

        {stage && rest.length > 0 && (
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

            {showOptions && optionGroups.map((g) => (
              <div key={g.readiness} className={styles.optionGroup}>
                <h3 className={styles.optionsHeading}>{g.title}</h3>
                <ul className={styles.options}>
                  {g.items.slice(0, g.limit).map((c) => (
                    <OptionRow key={c.seed.id} candidate={c} onSelect={setLogTarget} />
                  ))}
                  {g.items.length > g.limit && (
                    <li className={styles.moreHeld}>+{g.items.length - g.limit} more</li>
                  )}
                </ul>
              </div>
            ))}
          </>
        )}
      </section>

      {/* ─── Next week's shopping ─── */}
      {stage && (
        <section className={styles.hero}>
          <button
            type="button"
            className={styles.shoppingToggle}
            aria-expanded={showShopping}
            onClick={() => setShowShopping((v) => !v)}
          >
            <ShoppingCart size={18} className={styles.sectionIcon} />
            Next week's shopping
            <ChevronDown size={16} className={`${styles.shoppingChevron} ${showShopping ? styles.chevronOpen : ''}`} />
          </button>
          {showShopping && shoppingList && <ShoppingList list={shoppingList} />}
        </section>
      )}

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

      <Suspense fallback={<ModalFallback />}>
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
      </Suspense>
    </div>
  );
}

interface OptionRowProps {
  candidate: NextFoodCandidate;
  onSelect: (seed: SeedFood) => void;
}

const READINESS_CLASS: Record<Readiness, string> = {
  now: '',
  later: styles.later,
  doctor: styles.doctor,
  held: styles.held,
};

/** Every row stays tappable: the reason is shown so the parent can decide anyway. */
function OptionRow({ candidate, onSelect }: OptionRowProps) {
  const { seed, reasons, heldBy, readiness } = candidate;
  return (
    <li>
      <button
        type="button"
        className={`${styles.option} ${READINESS_CLASS[readiness]}`}
        onClick={() => onSelect(seed)}
      >
        <span className={styles.optionName}>
          {seed.name} <span className={styles.optionNameJa} lang="ja">{seed.nameJa}</span>
        </span>
        <span className={styles.optionReason}>
          {heldBy ? `Held back — ${reasons[0]}` : reasons[0] ?? 'Allowed at the current stage.'}
        </span>
        {seed.note && <span className={styles.optionNote}>{seed.note}</span>}
      </button>
    </li>
  );
}
