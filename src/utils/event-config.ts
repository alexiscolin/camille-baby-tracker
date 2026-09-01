import { Baby, Droplets, CircleDot, Pill, Bath, Salad } from 'lucide-react';
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
} as const;

export const EVENT_TYPES = Object.keys(EVENT_CONFIG) as EventType[];
