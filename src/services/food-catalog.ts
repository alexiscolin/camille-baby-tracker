import {
  collection,
  setDoc,
  updateDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { FOOD_GROUPS, FOOD_STATUSES } from '../types/food';
import type { Food, SeedFood, FoodGroup, FoodStatus } from '../types/food';

const VALID_GROUPS = new Set<FoodGroup>(FOOD_GROUPS);
const VALID_STATUSES = new Set<FoodStatus>(FOOD_STATUSES);
const VALID_NUTRIENT_SOURCES = new Set<Food['nutrientSource']>(['seed', 'manual']);

/** firestore.rules caps a food's sourceRef at 200 characters. */
const MAX_SOURCE_REF_LENGTH = 200;

/**
 * The seed file's sourceRef is a full citation for a human reading the
 * committed table; only a provenance breadcrumb needs to reach Firestore.
 * Keeps the head — the table entry a row is named after — and drops the
 * explanation tail, which is what's expendable.
 */
function truncateSourceRef(sourceRef: string): string {
  if (sourceRef.length <= MAX_SOURCE_REF_LENGTH) return sourceRef;
  return `${sourceRef.slice(0, MAX_SOURCE_REF_LENGTH - 3)}...`;
}

function foodsCollection(familyId: string) {
  return collection(db, 'families', familyId, 'foods');
}

/**
 * Judgment call on which punctuation is meaningful (kept distinct) versus
 * decorative (folded into the same separator as everything else):
 * '%' changes what the food *is* — "5% yoghurt" and "5 yoghurt" are
 * different products — so it's kept as a literal token rather than
 * collapsed away like the rest of the punctuation. Bracket/quote-style
 * punctuation ("(Organic)" vs "[Organic]") is typed inconsistently around
 * the same food and is treated as equivalent on purpose: those still
 * collide into one slug, same as before this fix.
 */
export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/%/g, '-pct-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (base) return base;
  // Non-latin input: stable FNV-1a hash so the same name always maps to the
  // same document id.
  let hash = 2166136261;
  for (let i = 0; i < name.length; i += 1) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `food-${(hash >>> 0).toString(36)}`;
}

export function foodFromSeed(
  seed: SeedFood,
): Omit<Food, 'firstTriedAt' | 'lastTriedAt' | 'statusUpdatedAt'> {
  return {
    id: seed.id,
    name: seed.name,
    group: seed.group,
    allergens: seed.allergens,
    gramsPerTsp: seed.gramsPerTsp,
    minStage: seed.minStage,
    status: 'untried',
    usageCount: 0,
    exposureCount: 0,
    reactionEventIds: [],
    nutrients: seed.nutrients,
    nutrientSource: 'seed',
    sourceRef: truncateSourceRef(seed.sourceRef),
  };
}

export function isValidFoodData(data: Record<string, unknown>): boolean {
  return (
    typeof data.name === 'string' &&
    data.name.length > 0 &&
    typeof data.group === 'string' &&
    VALID_GROUPS.has(data.group as FoodGroup) &&
    typeof data.gramsPerTsp === 'number' &&
    typeof data.minStage === 'number' &&
    data.minStage >= 1 &&
    data.minStage <= 4 &&
    typeof data.status === 'string' &&
    VALID_STATUSES.has(data.status as FoodStatus) &&
    typeof data.usageCount === 'number' &&
    typeof data.exposureCount === 'number' &&
    Array.isArray(data.allergens) &&
    Array.isArray(data.reactionEventIds) &&
    typeof data.nutrientSource === 'string' &&
    VALID_NUTRIENT_SOURCES.has(data.nutrientSource as Food['nutrientSource'])
  );
}

export function upsertFood(familyId: string, food: Food) {
  const { id, ...data } = food;
  return setDoc(doc(foodsCollection(familyId), id), data, { merge: true });
}

export function updateFood(
  familyId: string,
  foodId: string,
  data: Partial<Food>,
) {
  return updateDoc(doc(foodsCollection(familyId), foodId), data);
}

export interface FoodSubscriptionResult {
  foods: Food[];
  fromCache: boolean;
  hasPendingWrites: boolean;
}

export function subscribeToFoods(
  familyId: string,
  callback: (result: FoodSubscriptionResult) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    foodsCollection(familyId),
    { includeMetadataChanges: true },
    (snapshot) => {
      const foods: Food[] = [];
      for (const d of snapshot.docs) {
        const raw = d.data();
        if (!isValidFoodData(raw)) continue;
        foods.push({ id: d.id, ...raw } as Food);
      }
      callback({
        foods,
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
      });
    },
    (error) => {
      if (onError) {
        onError(error);
      } else if (import.meta.env.DEV) {
        console.error('Foods subscription error:', error);
      }
    },
  );
}
