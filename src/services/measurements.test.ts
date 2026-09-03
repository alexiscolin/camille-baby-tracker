import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { addMeasurement, updateMeasurement } from './measurements';

const addDoc = vi.fn();
const updateDoc = vi.fn();

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    collection: vi.fn(() => ({})),
    doc: vi.fn(() => ({})),
    addDoc: (...args: unknown[]) => addDoc(...args),
    updateDoc: (...args: unknown[]) => updateDoc(...args),
  };
});

vi.mock('./firebase', () => ({ db: {} }));

const base = {
  babyId: 'baby-1',
  type: 'weight' as const,
  value: 6.2,
  date: Timestamp.fromDate(new Date(2026, 8, 3)),
  createdBy: 'user-1',
};

describe('addMeasurement', () => {
  beforeEach(() => addDoc.mockReset());

  /**
   * The Firestore instance does not set ignoreUndefinedProperties, so a key
   * present with an undefined value makes the whole write throw. GrowthPage
   * sent `notes: undefined` whenever the field was blank, which is every
   * ordinary weigh-in — so adding a measurement worked only when a note
   * happened to be typed.
   */
  it('should omit a note that was left blank rather than send undefined', async () => {
    await addMeasurement('fam-1', { ...base, notes: undefined });

    const written = addDoc.mock.calls[0][1] as Record<string, unknown>;
    expect('notes' in written).toBe(false);
    expect(Object.values(written)).not.toContain(undefined);
  });

  it('should keep a note that was written', async () => {
    await addMeasurement('fam-1', { ...base, notes: 'clinic visit' });

    const written = addDoc.mock.calls[0][1] as Record<string, unknown>;
    expect(written.notes).toBe('clinic visit');
  });
});

describe('updateMeasurement', () => {
  beforeEach(() => updateDoc.mockReset());

  it('should not send undefined on an update either', async () => {
    await updateMeasurement('fam-1', 'm-1', { value: 6.5, notes: undefined });

    const written = updateDoc.mock.calls[0][1] as Record<string, unknown>;
    expect('notes' in written).toBe(false);
    expect(written.value).toBe(6.5);
  });
});
