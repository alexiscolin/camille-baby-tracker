import { AlertCircle } from 'lucide-react';
import { STOOL_COLORS, type StoolColorId, type StoolColorWarning } from '../utils/stool-color';
import styles from './ColorSelector.module.css';

interface ColorSelectorProps {
  value: StoolColorId | undefined;
  onChange: (value: StoolColorId | undefined) => void;
  warning?: StoolColorWarning | null;
}

export function ColorSelector({ value, onChange, warning }: ColorSelectorProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.grid}>
        {STOOL_COLORS.map((color) => {
          const isSelected = value === color.id;
          return (
            <button
              key={color.id}
              type="button"
              className={`${styles.swatch} ${isSelected ? styles.swatchSelected : ''}`}
              style={{ '--swatch-color': color.hex } as React.CSSProperties}
              aria-label={color.label}
              aria-pressed={isSelected}
              onClick={() => onChange(isSelected ? undefined : color.id)}
            >
              <span className={styles.dot} />
              <span className={styles.label}>{color.label}</span>
            </button>
          );
        })}
      </div>
      {warning && (
        <div className={`${styles.warning} ${styles[warning.level]}`} role="alert">
          <AlertCircle size={14} />
          <span>{warning.message}</span>
        </div>
      )}
    </div>
  );
}
