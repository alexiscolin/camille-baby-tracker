import {
  collection,
  setDoc,
  updateDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { FOOD_GROUPS } from '../types/food';
import type { Food, SeedFood, FoodGroup, FoodStatus } from '../types/food';

const VALID_GROUPS = new Set<FoodGroup>(FOOD_GROUPS);
const VALID_STATUSES = new Set<FoodStatus>([
  'untried', 'safe', 'watch', 'suspected', 'confirmed_allergy', 'avoid',
]);

function foodsCollection(familyId: string) {
  return collection(db, 'families', familyId, 'foods');
}

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
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
    sourceRef: seed.sourceRef,
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
    Array.isArray(data.reactionEventIds) &&
    typeof data.nutrientSource === 'string'
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
