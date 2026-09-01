import { useId, useMemo, useState } from 'react';
import { FoodTagInput } from '../FoodTagInput';
import { SegmentedControl } from '../SegmentedControl';
import { novelFoodIds } from '../../utils/food-status';
import { SYSTEMIC_SYMPTOMS } from '../../types/food';
import type {
  Acceptance,
  Food,
  FoodUnit,
  MealItem,
  MealSlot,
  Reaction,
  ReactionSeverity,
  ReactionSymptom,
} from '../../types/food';
import styles from '../EventModal.module.css';

const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const satisfies readonly MealSlot[];
const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const UNITS = ['tsp', 'g', 'ml', 'piece'] as const satisfies readonly FoodUnit[];
const UNIT_LABELS: Record<FoodUnit, string> = {
  tsp: 'tsp (小さじ)',
  g: 'g',
  ml: 'ml',
  piece: 'piece',
};

const ACCEPTANCE_LABELS: Record<Acceptance, string> = {
  all: 'Ate it all',
  most: 'Most of it',
  half: 'About half',
  taste: 'Just a taste',
  refused: 'Refused',
};

const SEVERITIES = ['mild', 'moderate', 'severe'] as const satisfies readonly ReactionSeverity[];
const SEVERITY_LABELS: Record<ReactionSeverity, string> = {
  mild: 'Mild',
  moderate: 'Moderate',
  severe: 'Severe',
};

/** Key order drives the rendering order of the symptom chips. */
const SYMPTOM_LABELS: Record<ReactionSymptom, string> = {
  rash_local: 'Local rash',
  hives: 'Hives',
  swelling: 'Swelling',
  vomiting: 'Vomiting',
  diarrhea: 'Diarrhea',
  cough: 'Cough',
  wheezing: 'Wheezing',
  lethargy: 'Lethargy',
  other: 'Other',
};
const SYMPTOMS = Object.keys(SYMPTOM_LABELS) as ReactionSymptom[];

/**
 * Fixed reminder. It never assesses the situation, estimates severity, or
 * recommends a course of action — it only says where to get real help.
 */
const EMERGENCY_REMINDER =
  'Some of these symptoms can be systemic. If you are worried about your baby, '
  + 'contact emergency services (119 in Japan) or your pediatrician now.';

const NEW_FOOD_HINT = 'New food. Best in the morning, alone, then wait 3 days.';

interface MealFieldsProps {
  mealSlot: MealSlot;
  onMealSlotChange: (slot: MealSlot) => void;
  items: MealItem[];
  onItemsChange: (items: MealItem[]) => void;
  foods: Food[];
  reaction: Reaction | undefined;
  onReactionChange: (reaction: Reaction | undefined) => void;
}

export function MealFields({
  mealSlot,
  onMealSlotChange,
  items,
  onItemsChange,
  foods,
  reaction,
  onReactionChange,
}: MealFieldsProps) {
  const baseId = useId();
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  // The reaction is drafted locally and mirrored up on every change, so the
  // block stays interactive regardless of when the parent re-renders.
  const [draft, setDraft] = useState<Reaction | undefined>(reaction);

  // A reaction after a multi-food meal does not identify the culprit, so every
  // novel food in the meal is always suspected. The user can widen this set,
  // never narrow it.
  const mandatorySuspects = useMemo(() => novelFoodIds(items), [items]);
  const suspectedFoodIds = useMemo(
    () => [...new Set([...mandatorySuspects, ...(draft?.suspectedFoodIds ?? [])])],
    [mandatorySuspects, draft],
  );

  const hasNewFood = items.some((item) => item.firstTry);
  const isSystemic = (draft?.symptoms ?? []).some((s) => SYSTEMIC_SYMPTOMS.includes(s));
  const widenable = items.filter((item) => !mandatorySuspects.includes(item.foodId));

  function patchItem(index: number, patch: Partial<MealItem>) {
    onItemsChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function setReaction(next: Reaction | undefined) {
    setDraft(next);
    onReactionChange(next);
  }

  function patchReaction(patch: Partial<Reaction>) {
    setReaction({
      symptoms: [],
      severity: 'mild',
      ...draft,
      ...patch,
      suspectedFoodIds: [
        ...new Set([...mandatorySuspects, ...(patch.suspectedFoodIds ?? suspectedFoodIds)]),
      ],
    });
  }

  function toggleSymptom(symptom: ReactionSymptom) {
    const current = draft?.symptoms ?? [];
    patchReaction({
      symptoms: current.includes(symptom)
        ? current.filter((s) => s !== symptom)
        : [...current, symptom],
    });
  }

  return (
    <>
      <div className={styles.field}>
        <label className={styles.label}>Meal</label>
        <SegmentedControl
          options={MEAL_SLOTS}
          value={mealSlot}
          onChange={onMealSlotChange}
          labels={SLOT_LABELS}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Foods</label>
        <FoodTagInput
          items={items}
          onChange={(next) => {
            // The open panel is keyed by array index. Removing a chip reindexes
            // the list, so leaving it open would silently edit a different food.
            setExpandedItem(null);
            onItemsChange(next);
          }}
          foods={foods}
        />
      </div>

      {hasNewFood && <p className={styles.newFoodHint}>{NEW_FOOD_HINT}</p>}

      {items.length > 0 && (
        <div className={styles.itemList}>
          {items.map((item, index) => (
            <div key={`${item.foodId}-${index}`}>
              <button
                type="button"
                className={styles.itemToggle}
                aria-label={`Edit ${item.name}`}
                aria-expanded={expandedItem === index}
                onClick={() => setExpandedItem(expandedItem === index ? null : index)}
              >
                <span>{item.name}</span>
                <span className={styles.itemAmount}>
                  {item.quantity} {item.unit}
                  {item.acceptance ? ` · ${ACCEPTANCE_LABELS[item.acceptance]}` : ''}
                </span>
              </button>

              {expandedItem === index && (
                <div className={styles.itemPanel}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`${baseId}-qty-${index}`}>
                      Quantity
                    </label>
                    <input
                      id={`${baseId}-qty-${index}`}
                      type="number"
                      min="0"
                      step="0.5"
                      value={item.quantity}
                      onChange={(e) => patchItem(index, { quantity: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`${baseId}-unit-${index}`}>
                      Unit
                    </label>
                    <select
                      id={`${baseId}-unit-${index}`}
                      value={item.unit}
                      onChange={(e) => patchItem(index, { unit: e.target.value as FoodUnit })}
                    >
                      {UNITS.map((unit) => (
                        <option key={unit} value={unit}>{UNIT_LABELS[unit]}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`${baseId}-acc-${index}`}>
                      Acceptance
                    </label>
                    <select
                      id={`${baseId}-acc-${index}`}
                      value={item.acceptance ?? ''}
                      onChange={(e) =>
                        patchItem(index, {
                          acceptance: e.target.value
                            ? (e.target.value as Acceptance)
                            : undefined,
                        })
                      }
                    >
                      <option value="">Not recorded</option>
                      {(Object.keys(ACCEPTANCE_LABELS) as Acceptance[]).map((value) => (
                        <option key={value} value={value}>{ACCEPTANCE_LABELS[value]}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!draft ? (
        <button
          type="button"
          className={styles.disclosureBtn}
          onClick={() => patchReaction({})}
        >
          Log a reaction
        </button>
      ) : (
        <fieldset className={styles.reactionBlock}>
          <legend className={styles.label}>Reaction</legend>

          <div className={styles.chipGrid}>
            {SYMPTOMS.map((symptom) => {
              const active = (draft.symptoms ?? []).includes(symptom);
              return (
                <button
                  key={symptom}
                  type="button"
                  className={`${styles.chipBtn} ${active ? styles.chipBtnActive : ''}`}
                  aria-pressed={active}
                  onClick={() => toggleSymptom(symptom)}
                >
                  {SYMPTOM_LABELS[symptom]}
                </button>
              );
            })}
          </div>

          {isSystemic && (
            <p role="alert" className={styles.emergencyNote}>{EMERGENCY_REMINDER}</p>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Severity</label>
            <SegmentedControl
              options={SEVERITIES}
              value={draft.severity}
              onChange={(severity) => patchReaction({ severity })}
              labels={SEVERITY_LABELS}
            />
          </div>

          {suspectedFoodIds.length > 0 && (
            <p className={styles.suspectNote}>
              Every new food in this meal stays suspected — a reaction cannot tell them apart.
            </p>
          )}

          {widenable.length > 0 && (
            <div className={styles.field}>
              <label className={styles.label}>Also suspect</label>
              <div className={styles.chipGrid}>
                {widenable.map((item) => {
                  const active = suspectedFoodIds.includes(item.foodId);
                  return (
                    <button
                      key={item.foodId}
                      type="button"
                      className={`${styles.chipBtn} ${active ? styles.chipBtnActive : ''}`}
                      aria-pressed={active}
                      onClick={() =>
                        patchReaction({
                          suspectedFoodIds: active
                            ? suspectedFoodIds.filter((id) => id !== item.foodId)
                            : [...suspectedFoodIds, item.foodId],
                        })
                      }
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            className={styles.disclosureBtn}
            onClick={() => setReaction(undefined)}
          >
            No reaction after all
          </button>
        </fieldset>
      )}
    </>
  );
}
