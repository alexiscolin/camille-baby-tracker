export type StoolColorId =
  | 'black'
  | 'dark-green'
  | 'green'
  | 'yellow'
  | 'mustard'
  | 'brown'
  | 'orange'
  | 'red'
  | 'white';

export interface StoolColor {
  id: StoolColorId;
  hex: string;
  label: string;
}

export const STOOL_COLORS: readonly StoolColor[] = [
  { id: 'black', hex: '#1a1a1a', label: 'Black' },
  { id: 'dark-green', hex: '#2d5a27', label: 'Dark green' },
  { id: 'green', hex: '#5a8a2f', label: 'Green' },
  { id: 'yellow', hex: '#f5d04e', label: 'Yellow' },
  { id: 'mustard', hex: '#c8a520', label: 'Mustard' },
  { id: 'brown', hex: '#7a5230', label: 'Brown' },
  { id: 'orange', hex: '#e08530', label: 'Orange' },
  { id: 'red', hex: '#c0392b', label: 'Red' },
  { id: 'white', hex: '#e8e0d0', label: 'White / pale' },
] as const;

export type WarningLevel = 'warning' | 'alert';

export interface StoolColorWarning {
  level: WarningLevel;
  message: string;
}

export function getStoolColorWarning(
  colorId: StoolColorId,
  ageDays: number,
): StoolColorWarning | null {
  switch (colorId) {
    case 'red':
      return {
        level: 'alert',
        message: 'Red stool may indicate blood. Contact your pediatrician.',
      };

    case 'white':
      return {
        level: 'alert',
        message: 'White or pale stool may indicate a liver issue. Contact your pediatrician.',
      };

    case 'black':
      if (ageDays <= 2) return null; // Meconium is normal in first 3 days
      return {
        level: 'alert',
        message: 'Black stool after the first few days may indicate bleeding. Contact your pediatrician.',
      };

    case 'dark-green':
      if (ageDays <= 4) return null; // Transitional stool is normal in first 5 days
      return {
        level: 'warning',
        message: 'Dark green stool after the first week may indicate a foremilk/hindmilk imbalance or sensitivity.',
      };

    case 'green':
    case 'yellow':
    case 'mustard':
    case 'brown':
    case 'orange':
      return null;

    default:
      return null;
  }
}

export function getStoolColorById(colorId: string): StoolColor | undefined {
  return STOOL_COLORS.find((c) => c.id === colorId);
}
