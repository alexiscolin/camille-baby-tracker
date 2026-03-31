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
interface Baby {
  id: string;
  firstName: string;
  birthDate: Timestamp;
  createdAt: Timestamp;
}
```

### `families/{familyId}/events/{eventId}`

Single collection for all event types, discriminated by `type`.

```typescript
type EventType = 'feeding' | 'pee' | 'poop' | 'medication';

interface BaseEvent {
  id: string;
  babyId: string;
  type: EventType;
  timestamp: Timestamp;        // When the event happened
  createdBy: string;           // UID of the user who logged it
  createdAt: Timestamp;        // When the record was created
  notes?: string;
}

interface FeedingEvent extends BaseEvent {
  type: 'feeding';
  feedingType: 'left' | 'right' | 'bottle';
  durationMinutes?: number;
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

type BabyEvent = FeedingEvent | PeeEvent | PoopEvent | MedicationEvent;
```

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
