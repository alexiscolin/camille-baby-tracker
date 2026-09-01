import { ColorSelector } from '../ColorSelector';
import type { StoolColorId, StoolColorWarning } from '../../utils/stool-color';

interface PoopFieldsProps {
  color: StoolColorId | undefined;
  onColorChange: (value: StoolColorId | undefined) => void;
  warning: StoolColorWarning | null;
}

export function PoopFields({ color, onColorChange, warning }: PoopFieldsProps) {
  return <ColorSelector value={color} onChange={onColorChange} warning={warning} />;
}
