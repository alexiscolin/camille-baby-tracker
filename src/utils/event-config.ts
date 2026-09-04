import { Baby, Droplets, CircleDot, Pill, Bath, Salad, Star } from 'lucide-react';
import type { EventType } from '../types/events';

export interface EventTypeConfig {
  icon: typeof Baby;
  label: string;
  color: string;
  bg: string;
}

export const EVENT_CONFIG: Record<EventType, EventTypeConfig> = {
  feeding: { icon: Baby, label: 'Feedings', color: 'var(--color-feeding)', bg: 'var(--color-feeding-bg)' },
  pee: { icon: Droplets, label: 'Pees', color: 'var(--color-pee)', bg: 'var(--color-pee-bg)' },
  poop: { icon: CircleDot, label: 'Poops', color: 'var(--color-poop)', bg: 'var(--color-poop-bg)' },
  medication: { icon: Pill, label: 'Meds', color: 'var(--color-medication)', bg: 'var(--color-medication-bg)' },
  bath: { icon: Bath, label: 'Baths', color: 'var(--color-bath)', bg: 'var(--color-bath-bg)' },
  meal: { icon: Salad, label: 'Meals', color: 'var(--color-meal)', bg: 'var(--color-meal-bg)' },
  milestone: { icon: Star, label: 'Milestones', color: 'var(--color-milestone)', bg: 'var(--color-milestone-bg)' },
} as const;

export const EVENT_TYPES = Object.keys(EVENT_CONFIG) as EventType[];

/**
 * The event types that have a rate — things that happen repeatedly and are
 * worth counting per day. Every tile, average, chart series and radar axis
 * reads this rather than EVENT_TYPES, because a milestone happens once: "0.1
 * milestones/day" is noise, and a milestone series is a flat line with one
 * spike on it. The timeline, the day badges, the add picker and the tracked-
 * types setting still work from the full list — a milestone belongs in the
 * chronology, just not in the statistics.
 */
export const RATE_EVENT_TYPES: EventType[] = EVENT_TYPES.filter((type) => type !== 'milestone');

/**
 * The event types a family has chosen to keep tracking.
 *
 * Stored as what is *hidden* rather than what is kept: absence of the field
 * means the current behaviour, so no baby document needs migrating, and a type
 * added in a later version shows up without anyone having to opt in.
 *
 * Hiding every type is refused rather than honoured — it would leave the add
 * button with nothing to offer and every chart with no series, and the value
 * comes from a shared document that this build does not exclusively write.
 */
export function visibleEventTypes(hidden: readonly EventType[] | undefined): EventType[] {
  if (!hidden || hidden.length === 0) return EVENT_TYPES;
  const hide = new Set<string>(hidden);
  const visible = EVENT_TYPES.filter((type) => !hide.has(type));
  return visible.length > 0 ? visible : EVENT_TYPES;
}

/**
 * A radar needs three axes to enclose an area; with two it is a line and with
 * one a dot. Below this many tracked types the activity radar is not drawn.
 */
export const MIN_RADAR_AXES = 3;
