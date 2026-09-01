import { useState, useEffect, useMemo, useRef } from 'react';
import { Check, AlertCircle, Trash2, X } from 'lucide-react';
import { Timestamp, deleteField } from 'firebase/firestore';
import { addEvent, updateEvent, deleteEvent } from '../services/events';
import { upsertFood, updateFood, foodFromSeed } from '../services/food-catalog';
import { useFoods } from '../hooks/useFoods';
import { FOOD_SEED } from '../data/food-seed';
import { applyReaction, withdrawReaction } from '../utils/food-status';
import { EVENT_CONFIG, EVENT_TYPES } from '../utils/event-config';
import { getStoolColorWarning, type StoolColorId } from '../utils/stool-color';
import { FeedingFields } from './EventModal/FeedingFields';
import { PoopFields } from './EventModal/PoopFields';
import { MedicationFields } from './EventModal/MedicationFields';
import { MealFields } from './EventModal/MealFields';
import { buildReactionPayload, markFirstTry, DEFAULT_GRAMS_PER_TSP } from '../utils/meal-nutrition';
import { MAX_MEAL_ITEMS } from '../types/food';
import type { Food, MealEvent, MealItem, MealSlot, Reaction } from '../types/food';
import type { EventType, FeedingType, BabyEvent, FeedingEvent, PoopEvent, MedicationEvent } from '../types/events';
import { getTimeString, addMinutesToTime, computeDurationMinutes } from '../utils/time';
import styles from './EventModal.module.css';

const MAX_TEXT_LENGTH = 200;
const MAX_NOTES_LENGTH = 500;
const MAX_DURATION_MINUTES = 300;
/** firestore.rules caps a food name at 100 characters. */
const MAX_FOOD_NAME_LENGTH = 100;

type EventModalProps = {
  familyId: string;
  babyId: string;
  userId: string;
  onClose: () => void;
  babyBirthDate?: Date;
} & (
  | { mode: 'edit'; event: BabyEvent }
  /**
   * `initialType` and `initialItems` let a caller open straight into a
   * pre-filled form — the food page logs a suggestion without making the
   * parent re-pick the type and re-type the food.
   */
  | { mode: 'add'; date: Date; initialType?: EventType; initialItems?: MealItem[] }
);

function sanitizeText(text: string, maxLength: number): string {
  return text.trim().slice(0, maxLength);
}

/** A free-text food, with every field set to a value firestore.rules accepts. */
function minimalFood(foodId: string, name: string): Food {
  return {
    id: foodId,
    name: sanitizeText(name, MAX_FOOD_NAME_LENGTH) || foodId,
    group: 'other',
    allergens: [],
    gramsPerTsp: DEFAULT_GRAMS_PER_TSP,
    minStage: 1,
    status: 'untried',
    usageCount: 0,
    exposureCount: 0,
    reactionEventIds: [],
    nutrientSource: 'manual',
  };
}

export function EventModal(props: EventModalProps) {
  const { familyId, babyId, userId, onClose, mode, babyBirthDate } = props;

  const editEvent = mode === 'edit' ? props.event : null;
  const targetDate = mode === 'add' ? props.date : editEvent!.timestamp.toDate();

  const [selectedType, setSelectedType] = useState<EventType | null>(
    editEvent?.type ?? (mode === 'add' ? props.initialType ?? null : null),
  );
  const [time, setTime] = useState(getTimeString(targetDate));
  const [feedingType, setFeedingType] = useState<FeedingType>(
    editEvent?.type === 'feeding' ? (editEvent as FeedingEvent).feedingType : 'breast',
  );
  const [leftCount, setLeftCount] = useState(
    editEvent?.type === 'feeding' ? (editEvent as FeedingEvent).leftCount : 1,
  );
  const [rightCount, setRightCount] = useState(
    editEvent?.type === 'feeding' ? (editEvent as FeedingEvent).rightCount : 0,
  );
  const [endTime, setEndTime] = useState(() => {
    if (editEvent?.type === 'feeding' && (editEvent as FeedingEvent).durationMinutes) {
      return addMinutesToTime(getTimeString(targetDate), (editEvent as FeedingEvent).durationMinutes!);
    }
    return '';
  });
  const [infection, setInfection] = useState(
    editEvent?.type === 'feeding' ? (editEvent as FeedingEvent).infection ?? false : false,
  );
  const [engorgement, setEngorgement] = useState(
    editEvent?.type === 'feeding' ? (editEvent as FeedingEvent).engorgement ?? false : false,
  );
  const [medicationName, setMedicationName] = useState(
    editEvent?.type === 'medication' ? (editEvent as MedicationEvent).medicationName : '',
  );
  const [dose, setDose] = useState(
    editEvent?.type === 'medication' ? (editEvent as MedicationEvent).dose : '',
  );
  const [stoolColor, setStoolColor] = useState<StoolColorId | undefined>(
    editEvent?.type === 'poop' ? ((editEvent as PoopEvent).color as StoolColorId | undefined) : undefined,
  );
  const [mealSlot, setMealSlot] = useState<MealSlot>(
    editEvent?.type === 'meal' ? (editEvent as MealEvent).mealSlot : 'lunch',
  );
  const [mealItems, setMealItems] = useState<MealItem[]>(
    editEvent?.type === 'meal'
      ? (editEvent as MealEvent).items
      : mode === 'add' ? props.initialItems ?? [] : [],
  );
  const [reaction, setReaction] = useState<Reaction | undefined>(
    editEvent?.type === 'meal' ? (editEvent as MealEvent).reaction : undefined,
  );
  const [notes, setNotes] = useState(editEvent?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const saveInFlight = useRef(false);

  // Only meals need the catalog; passing undefined keeps the listener closed
  // for every other event type.
  const { foods, loading: foodsLoading } = useFoods(
    selectedType === 'meal' ? familyId : undefined,
  );
  const foodById = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods]);

  /**
   * On edit the stored flag is a historical fact — "her first taste of natto"
   * — and step 4 has since written firstTriedAt, so re-deriving would erase it.
   * Read from the saved event, never from `mealItems`: the form hands the
   * *derived* items back on every edit, so a value round-tripped through state
   * is no longer evidence of what was saved.
   */
  const storedFirstTry = useMemo(
    () => new Map(
      editEvent?.type === 'meal'
        ? (editEvent as MealEvent).items.map((i) => [i.foodId, i.firstTry])
        : [],
    ),
    [editEvent],
  );

  // `firstTry` is derived from the catalog as items are added, so the "new
  // food" hint is live and the saved value needs no second computation.
  // Always recomputed rather than trusted from a stored item: the catalog
  // arrives asynchronously, and losing a `firstTry` only ever widens the
  // suspected set (novelFoodIds falls back to every item), never narrows it.
  const itemsWithFirstTry = useMemo<MealItem[]>(() => {
    const derived = markFirstTry(mealItems, foodById);
    if (!editEvent) return derived;
    // A falsy firstTry is omitted from the payload, so an absent key means
    // "not recorded" and falls through to the derivation. Items added during
    // this edit are absent from the map for the same reason.
    return derived.map((item) => ({
      ...item,
      firstTry: storedFirstTry.get(item.foodId) ?? item.firstTry,
    }));
  }, [editEvent, mealItems, foodById, storedFirstTry]);

  const babyAgeDays = babyBirthDate
    ? Math.floor((Date.now() - babyBirthDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const stoolColorWarning = stoolColor && babyAgeDays !== null
    ? getStoolColorWarning(stoolColor, babyAgeDays)
    : null;

  useEffect(() => {
    document.body.classList.add('modal-open');
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  function handleFeedingTypeChange(ft: FeedingType) {
    setFeedingType(ft);
    if (ft === 'bottle') {
      setLeftCount(0);
      setRightCount(0);
    } else if (leftCount === 0 && rightCount === 0) {
      setLeftCount(1);
    }
  }

  function buildEventDate(): Date | null {
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;

    const eventDate = new Date(targetDate);
    eventDate.setHours(hours, minutes, 0, 0);
    return eventDate;
  }

  /**
   * Steps 1 and 2 of the meal save: make sure every food in the meal has a
   * catalog document, then freeze the items into a Firestore-safe payload.
   * `firstTry` is read from the food's *pre-existing* `firstTriedAt`, so this
   * has to run before any `firstTriedAt` is written.
   */
  async function prepareMeal(eventDate: Date) {
    const items = itemsWithFirstTry.slice(0, MAX_MEAL_ITEMS);
    if (items.length === 0) {
      setError('Add at least one food');
      return null;
    }
    // One stray tap on "Log a reaction" would otherwise persist a symptomless
    // reaction and suspect every novel food in the meal.
    if (reaction && reaction.symptoms.length === 0) {
      setError('Select at least one symptom, or remove the reaction');
      return null;
    }
    // Without the catalog, every food looks new and the merge below would reset
    // a known food's status and reaction history to a blank one.
    if (foodsLoading) {
      setError('Still loading foods. Try again in a moment.');
      return null;
    }

    const catalog = new Map(foodById);
    const uniqueIds = [...new Set(items.map((i) => i.foodId))];

    for (const id of uniqueIds) {
      if (catalog.has(id)) continue;
      const seed = FOOD_SEED.find((s) => s.id === id);
      const name = items.find((i) => i.foodId === id)!.name;
      const food: Food = seed ? foodFromSeed(seed) : minimalFood(id, name);
      await upsertFood(familyId, food);
      catalog.set(id, food);
    }

    const payloadItems: MealItem[] = items.map((i) => ({
      foodId: i.foodId,
      name: sanitizeText(i.name, MAX_FOOD_NAME_LENGTH) || i.foodId,
      quantity: i.quantity,
      unit: i.unit,
      ...(i.acceptance ? { acceptance: i.acceptance } : {}),
      ...(i.firstTry ? { firstTry: true } : {}),
    }));

    return {
      catalog,
      uniqueIds,
      items: payloadItems,
      reactionPayload: reaction ? buildReactionPayload(reaction, payloadItems) : undefined,
      stamp: Timestamp.fromDate(eventDate),
    };
  }

  /**
   * Step 3: count this meal against each given food, stamping `firstTriedAt`
   * the first time. The stored counters are read from `prepared.catalog`, the
   * snapshot taken before any of this ran.
   */
  async function countExposures(
    prepared: NonNullable<Awaited<ReturnType<typeof prepareMeal>>>,
    ids: string[],
  ) {
    for (const id of ids) {
      const food = prepared.catalog.get(id)!;
      await updateFood(familyId, id, {
        usageCount: food.usageCount + 1,
        exposureCount: food.exposureCount + 1,
        lastTriedAt: prepared.stamp,
        ...(food.firstTriedAt ? {} : { firstTriedAt: prepared.stamp }),
      });
    }
  }

  /**
   * Writes back only the foods whose status actually moved. Both applyReaction
   * and withdrawReaction return the same object for an untouched food, so
   * identity is the change check.
   */
  async function persistFoodChanges(
    foodList: Food[],
    stamp: Timestamp,
    catalog: Map<string, Food>,
  ) {
    for (const food of foodList) {
      if (food === catalog.get(food.id)) continue;
      await updateFood(familyId, food.id, {
        status: food.status,
        reactionEventIds: food.reactionEventIds,
        statusUpdatedAt: stamp,
      });
    }
  }

  /**
   * Step 5: re-attribute this meal from scratch over the whole catalog.
   *
   * Withdraw first, always. `applyReaction` only ever adds, so without this a
   * food dropped from a narrowed suspected set — a widened food deselected, or
   * a food removed from the meal — would keep this mealId and stay `suspected`
   * for good. Foods that are still suspected are withdrawn and re-added in the
   * same pass: a redundant write with identical values.
   */
  async function persistAttribution(
    prepared: NonNullable<Awaited<ReturnType<typeof prepareMeal>>>,
    mealId: string,
  ) {
    const { catalog, items, reactionPayload, stamp } = prepared;
    const cleared = withdrawReaction([...catalog.values()], mealId);
    if (!reactionPayload) {
      await persistFoodChanges(cleared, stamp, catalog);
      return;
    }
    const meal: MealEvent = {
      id: mealId,
      babyId,
      type: 'meal',
      mealSlot,
      timestamp: stamp,
      createdBy: userId,
      createdAt: stamp,
      items,
      reaction: reactionPayload,
    };
    await persistFoodChanges(applyReaction(cleared, meal, mealId), stamp, catalog);
  }

  async function handleSave() {
    if (!selectedType || saveInFlight.current) return;
    saveInFlight.current = true;
    setError('');

    const eventDate = buildEventDate();
    if (!eventDate) {
      setError('Invalid time');
      saveInFlight.current = false;
      return;
    }

    if (eventDate.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      setError('Time cannot be more than 24 hours in the future');
      saveInFlight.current = false;
      return;
    }

    const sanitizedNotes = notes ? sanitizeText(notes, MAX_NOTES_LENGTH) : undefined;

    setSaving(true);

    try {
      if (mode === 'edit' && editEvent) {
        const updates: Record<string, unknown> = {
          timestamp: Timestamp.fromDate(eventDate),
        };
        if (sanitizedNotes !== undefined) {
          updates.notes = sanitizedNotes;
        } else {
          updates.notes = '';
        }

        if (selectedType === 'feeding') {
          if (feedingType === 'breast' && leftCount === 0 && rightCount === 0) {
            setError('Select at least one side');
            setSaving(false);
            saveInFlight.current = false;
            return;
          }
          updates.feedingType = feedingType;
          updates.leftCount = leftCount;
          updates.rightCount = rightCount;
          updates.infection = infection;
          updates.engorgement = engorgement;
          const dur = computeDurationMinutes(time, endTime, MAX_DURATION_MINUTES);
          if (dur !== undefined) updates.durationMinutes = dur;
        } else if (selectedType === 'poop') {
          updates.color = stoolColor ?? '';
        } else if (selectedType === 'medication') {
          const name = sanitizeText(medicationName, MAX_TEXT_LENGTH);
          const d = sanitizeText(dose, MAX_TEXT_LENGTH);
          if (!name || !d) {
            setError('Medication name and dose are required');
            setSaving(false);
            return;
          }
          updates.medicationName = name;
          updates.dose = d;
        } else if (selectedType === 'meal') {
          const prepared = await prepareMeal(eventDate);
          if (!prepared) return;
          updates.mealSlot = mealSlot;
          updates.items = prepared.items;
          // Absent, never null: firestore.rules only accepts a map or nothing.
          updates.reaction = prepared.reactionPayload ?? deleteField();
          await updateEvent(familyId, editEvent.id, updates);
          // Attribution first: it only needs prepared.catalog and the meal id,
          // has no dependency on the counters below, and applyReaction is
          // idempotent on mealId. If a counter write below throws (the
          // monotonicity clause rejects a concurrent increment from another
          // device), the meal and its reaction are already saved either way —
          // this ordering makes the failure mode over-suspicion, not a meal
          // with a real reaction leaving no food flagged.
          await persistAttribution(prepared, editEvent.id);
          // Count every food not already in the meal's previously-saved items,
          // whether or not it exists in the catalog. A food already in the
          // catalog but newly added to *this* meal (e.g. Rice, eaten before at
          // breakfast, added to today's lunch on edit) was never counted for
          // this exposure — createdIds alone missed it, since Rice didn't need
          // creating. A food already in the meal is left alone so it isn't
          // double-counted.
          const previousFoodIds = new Set((editEvent as MealEvent).items.map((i) => i.foodId));
          const idsToCount = prepared.uniqueIds.filter((id) => !previousFoodIds.has(id));
          await countExposures(prepared, idsToCount);
          setSaved(true);
          setTimeout(onClose, 1000);
          return;
        }

        await updateEvent(familyId, editEvent.id, updates);
      } else {
        const base: Record<string, unknown> = {
          babyId,
          type: selectedType,
          timestamp: Timestamp.fromDate(eventDate),
          createdBy: userId,
        };
        if (sanitizedNotes) base.notes = sanitizedNotes;

        if (selectedType === 'feeding') {
          if (feedingType === 'breast' && leftCount === 0 && rightCount === 0) {
            setError('Select at least one side');
            setSaving(false);
            saveInFlight.current = false;
            return;
          }
          const feedingData: Record<string, unknown> = {
            ...base,
            feedingType,
            leftCount,
            rightCount,
            infection,
            engorgement,
          };
          const dur = computeDurationMinutes(time, endTime, MAX_DURATION_MINUTES);
          if (dur !== undefined) feedingData.durationMinutes = dur;
          await addEvent(familyId, feedingData as Parameters<typeof addEvent>[1]);
        } else if (selectedType === 'medication') {
          const name = sanitizeText(medicationName, MAX_TEXT_LENGTH);
          const d = sanitizeText(dose, MAX_TEXT_LENGTH);
          if (!name || !d) {
            setError('Medication name and dose are required');
            setSaving(false);
            return;
          }
          await addEvent(familyId, {
            ...base,
            medicationName: name,
            dose: d,
          } as Parameters<typeof addEvent>[1]);
        } else if (selectedType === 'meal') {
          const prepared = await prepareMeal(eventDate);
          if (!prepared) return;
          const ref = await addEvent(familyId, {
            ...base,
            mealSlot,
            items: prepared.items,
            // Omitted entirely when there is no reaction: the SDK throws on
            // `undefined` and firestore.rules rejects `null`.
            ...(prepared.reactionPayload ? { reaction: prepared.reactionPayload } : {}),
          } as Parameters<typeof addEvent>[1]);

          // Attribution first, before the counter loop below can throw — see
          // the matching comment on the edit path for why.
          await persistAttribution(prepared, ref.id);

          for (const id of prepared.uniqueIds) {
            const food = prepared.catalog.get(id)!;
            await updateFood(familyId, id, {
              usageCount: food.usageCount + 1,
              exposureCount: food.exposureCount + 1,
              lastTriedAt: prepared.stamp,
              ...(food.firstTriedAt ? {} : { firstTriedAt: prepared.stamp }),
            });
          }
        } else if (selectedType === 'poop' && stoolColor) {
          await addEvent(familyId, {
            ...base,
            color: stoolColor,
          } as Parameters<typeof addEvent>[1]);
        } else {
          await addEvent(familyId, base as Parameters<typeof addEvent>[1]);
        }
      }

      setSaved(true);
      setTimeout(onClose, 1000);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
      saveInFlight.current = false;
    }
  }

  async function handleDelete() {
    if (!editEvent) return;
    setDeleting(true);
    try {
      await deleteEvent(familyId, editEvent.id);
      onClose();
    } catch {
      setError('Failed to delete. Please try again.');
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (saved) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.success}>
            <div className={styles.successIcon}>
              <Check size={28} />
            </div>
            <p>{mode === 'edit' ? 'Updated!' : 'Saved!'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {mode === 'edit' ? 'Edit Event' : 'Add Event'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {mode === 'add' && !selectedType && (
          <div className={styles.typeGrid}>
            {EVENT_TYPES.map((type) => {
              const config = EVENT_CONFIG[type];
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  className={styles.typeBtn}
                  style={{
                    '--btn-color': config.color,
                    '--btn-bg': config.bg,
                  } as React.CSSProperties}
                  onClick={() => setSelectedType(type)}
                >
                  <Icon size={24} />
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {selectedType && (
          <div className={styles.form}>
            {mode === 'edit' && (
              <div className={styles.eventTypeBadge}>
                {(() => {
                  const config = EVENT_CONFIG[selectedType];
                  const Icon = config.icon;
                  return (
                    <>
                      <Icon size={16} />
                      <span>{config.label}</span>
                    </>
                  );
                })()}
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="event-time">Time</label>
              <input
                id="event-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>

            {selectedType === 'feeding' && (
              <FeedingFields
                feedingType={feedingType}
                onFeedingTypeChange={handleFeedingTypeChange}
                leftCount={leftCount}
                onLeftCountChange={setLeftCount}
                rightCount={rightCount}
                onRightCountChange={setRightCount}
                endTime={endTime}
                onEndTimeChange={setEndTime}
                infection={infection}
                onInfectionChange={setInfection}
                engorgement={engorgement}
                onEngorgementChange={setEngorgement}
              />
            )}

            {selectedType === 'poop' && (
              <div className={styles.field}>
                <label className={styles.label}>Color (optional)</label>
                <PoopFields
                  color={stoolColor}
                  onColorChange={setStoolColor}
                  warning={stoolColorWarning}
                />
              </div>
            )}

            {selectedType === 'meal' && (
              <MealFields
                mealSlot={mealSlot}
                onMealSlotChange={setMealSlot}
                items={itemsWithFirstTry}
                onItemsChange={setMealItems}
                foods={foods}
                reaction={reaction}
                onReactionChange={setReaction}
              />
            )}

            {selectedType === 'medication' && (
              <MedicationFields
                medicationName={medicationName}
                onMedicationNameChange={setMedicationName}
                dose={dose}
                onDoseChange={setDose}
                maxLength={MAX_TEXT_LENGTH}
              />
            )}

            <div className={styles.field}>
              <label className={styles.label}>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES_LENGTH))}
                placeholder="Any additional notes..."
                rows={2}
                maxLength={MAX_NOTES_LENGTH}
              />
              {notes.length > MAX_NOTES_LENGTH - 50 && (
                <span className={styles.charCount}>
                  {notes.length}/{MAX_NOTES_LENGTH}
                </span>
              )}
            </div>

            {error && (
              <div className={styles.error}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className={`${styles.actions} ${styles.stickyActions}`}>
              <button
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={
                  saving
                  || (selectedType === 'medication' && (!medicationName.trim() || !dose.trim()))
                  || (selectedType === 'meal' && foodsLoading)
                }
              >
                {saving ? 'Saving...' : mode === 'edit' ? 'Update' : 'Save'}
              </button>

              {mode === 'edit' && (
                confirmDelete ? (
                  <div className={styles.deleteConfirm}>
                    <span>Delete this event?</span>
                    <button
                      className={styles.deleteConfirmBtn}
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Yes, delete'}
                    </button>
                    <button
                      className={styles.cancelBtn}
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className={styles.deleteBtn}
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
