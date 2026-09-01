# Data Model (Firestore)

## Collections

### `families/{familyId}`

Groups data for a household. Enables sharing between co-parents.

```typescript
interface Family {
  id: string;
  name: string;               // e.g. "Colin Family"
  members: string[];           // Authorized Firebase Auth UIDs
  babies: string[];            // References to baby documents
  createdAt: Timestamp;
}
```

### `families/{familyId}/babies/{babyId}`

```typescript
type BabySex = 'male' | 'female';

interface Baby {
  id: string;
  firstName: string;
  birthDate: Timestamp;
  sex?: BabySex;
  createdAt: Timestamp;
}
```

### `families/{familyId}/events/{eventId}`

Single collection for all event types, discriminated by `type`.

```typescript
type EventType = 'feeding' | 'pee' | 'poop' | 'medication' | 'bath' | 'meal';

interface BaseEvent {
  id: string;
  babyId: string;
  type: EventType;
  timestamp: Timestamp;        // When the event happened
  createdBy: string;           // UID of the user who logged it
  createdAt: Timestamp;        // When the record was created
  notes?: string;
}

type FeedingType = 'breast' | 'bottle';

interface FeedingEvent extends BaseEvent {
  type: 'feeding';
  feedingType: FeedingType;
  leftCount: number;
  rightCount: number;
  durationMinutes?: number;
  infection?: boolean;
  engorgement?: boolean;
}

interface PeeEvent extends BaseEvent {
  type: 'pee';
}

interface PoopEvent extends BaseEvent {
  type: 'poop';
  color?: string;
  consistency?: string;
}

interface MedicationEvent extends BaseEvent {
  type: 'medication';
  medicationName: string;
  dose: string;
}

interface BathEvent extends BaseEvent {
  type: 'bath';
}

type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type FoodUnit = 'tsp' | 'g' | 'ml' | 'piece';
type Acceptance = 'all' | 'most' | 'half' | 'taste' | 'refused';
type ReactionSymptom =
  | 'rash_local' | 'hives' | 'swelling' | 'vomiting'
  | 'diarrhea' | 'cough' | 'wheezing' | 'lethargy' | 'other';
type ReactionSeverity = 'mild' | 'moderate' | 'severe';

interface MealItem {
  foodId: string;
  name: string;               // Denormalised label at logging time, so history survives a rename
  quantity: number;
  unit: FoodUnit;
  acceptance?: Acceptance;
  firstTry?: boolean;
}

interface Reaction {
  symptoms: ReactionSymptom[];
  severity: ReactionSeverity;
  onsetMinutes?: number;
  resolvedMinutes?: number;
  suspectedFoodIds: string[];
  note?: string;
}

interface MealEvent extends BaseEvent {
  type: 'meal';
  mealSlot: MealSlot;
  items: MealItem[];           // 1..12 items; per-item fields validated client-side only
  reaction?: Reaction;
}

type BabyEvent =
  | FeedingEvent | PeeEvent | PoopEvent | MedicationEvent | BathEvent | MealEvent;
```

### `families/{familyId}/foods/{foodId}`

Per-family food catalog entry, tracking usage and reaction history for a food
the family has actually introduced. Reference/nutrient seed data lives
client-side in `src/data/food-seed.ts`, not in Firestore.

```typescript
type FoodGroup = 'grain' | 'vegetable' | 'fruit' | 'protein' | 'dairy' | 'fat' | 'other';

/** 1: 初期 5-6mo, 2: 中期 7-8mo, 3: 後期 9-11mo, 4: 完了期 12-18mo. */
type WeaningStage = 1 | 2 | 3 | 4;

type FoodStatus = 'untried' | 'safe' | 'watch' | 'suspected' | 'confirmed_allergy' | 'avoid';

interface Food {
  id: string;
  name: string;
  group: FoodGroup;
  allergens: Allergen[];
  gramsPerTsp: number;         // (0, 15]
  minStage: WeaningStage;
  status: FoodStatus;
  statusUpdatedAt?: Timestamp;
  usageCount: number;
  exposureCount: number;
  firstTriedAt?: Timestamp;
  lastTriedAt?: Timestamp;
  reactionEventIds: string[];
  nutrients?: Nutrients;       // per 100 g
  nutrientSource: 'seed' | 'manual';
  sourceRef?: string;
}
```

Deletion is only allowed when `exposureCount == 0`: a food the baby has
actually eaten is history and must not vanish.

## Firestore Indexes

Composite indexes required for queries:

| Collection | Fields                              | Usage                          |
| ---------- | ----------------------------------- | ------------------------------ |
| events     | babyId ASC, timestamp DESC          | Baby timeline                  |
| events     | type ASC, timestamp DESC            | Filter by type                 |
| events     | babyId ASC, type ASC, timestamp DESC| Stats per baby and type        |

## Key Queries

- **Daily dashboard**: events where `timestamp` between start and end of day, ordered by `timestamp DESC`
- **Weekly stats**: events where `timestamp` between D-7 and now, grouped by day client-side
- **Monthly stats**: events where `timestamp` between D-30 and now, grouped by day client-side
- **Last event per type**: events filtered by `type`, `limit(1)`, ordered by `timestamp DESC`
