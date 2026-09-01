import { format } from 'date-fns';
import { ALLERGEN_LABELS } from './allergens';
import type { BabyEvent } from '../types/events';
import type { Food, MealEvent } from '../types/food';

const HEADER = [
  'date', 'time', 'meal', 'severity', 'symptoms',
  'onset_minutes', 'suspected_foods', 'allergens', 'note',
];

function escapeCsv(value: string): string {
  // A leading = + - @ makes Excel treat the cell as a formula, and this file is
  // built to be opened at a doctor's visit. A note starting with "-" is a
  // plausible accident, so prefix it out of formula position.
  const safe = /^[=+\-@]/.test(value) ? "'" + value : value;
  if (!/["\n,]/.test(safe)) return safe;
  return '"' + safe.replace(/"/g, '""') + '"';
}

export function buildReactionCsv(events: BabyEvent[], byId: Map<string, Food>): string {
  const meals = events
    .filter((e): e is MealEvent => e.type === 'meal' && Boolean(e.reaction))
    .sort((a, b) => a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime());

  const rows = meals.map((meal) => {
    const reaction = meal.reaction;
    if (!reaction) return '';
    const suspects = reaction.suspectedFoodIds.length
      ? reaction.suspectedFoodIds
      : meal.items.map((i) => i.foodId);
    const names = suspects.map((id) => byId.get(id)?.name ?? id);
    const allergens = [
      ...new Set(suspects.flatMap((id) => byId.get(id)?.allergens ?? [])),
    ].map((a) => ALLERGEN_LABELS[a]);
    const at = meal.timestamp.toDate();

    return [
      format(at, 'yyyy-MM-dd'),
      format(at, 'HH:mm'),
      meal.mealSlot,
      reaction.severity,
      reaction.symptoms.join(';'),
      reaction.onsetMinutes != null ? String(reaction.onsetMinutes) : '',
      names.join(';'),
      allergens.join(';'),
      reaction.note ?? '',
    ].map(escapeCsv).join(',');
  });

  return [HEADER.join(','), ...rows].join('\n');
}
