import { useId, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { FOOD_SEED } from '../data/food-seed';
import { slugify } from '../services/food-catalog';
import { rankSuggestions } from '../utils/food-search';
import type { FoodSuggestion } from '../utils/food-search';
import type { Food, MealItem } from '../types/food';
import styles from './FoodTagInput.module.css';

interface FoodTagInputProps {
  items: MealItem[];
  onChange: (items: MealItem[]) => void;
  foods: Food[];
  maxItems?: number;
}

const DEFAULT_MAX_ITEMS = 12;

export function FoodTagInput({ items, onChange, foods, maxItems = DEFAULT_MAX_ITEMS }: FoodTagInputProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;

  const suggestions = useMemo(() => rankSuggestions(query, foods, FOOD_SEED), [query, foods]);
  const showList = open && suggestions.length > 0;
  const atMax = items.length >= maxItems;

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const commitItem = (newItem: MealItem) => {
    onChange([...items, newItem]);
    setQuery('');
    setOpen(false);
    setHighlightIndex(0);
  };

  const selectSuggestion = (suggestion: FoodSuggestion) => {
    commitItem({ foodId: suggestion.id, name: suggestion.name, quantity: 1, unit: 'tsp' });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (suggestions.length > 0) {
        selectSuggestion(suggestions[Math.min(highlightIndex, suggestions.length - 1)]);
        return;
      }
      const trimmed = query.trim();
      if (!trimmed) return;
      commitItem({ foodId: slugify(trimmed), name: trimmed, quantity: 1, unit: 'tsp' });
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.chips}>
        {items.map((item, index) => (
          <span key={`${item.foodId}-${index}`} className={styles.chip}>
            {item.name}
            <button
              type="button"
              className={styles.removeButton}
              aria-label={`remove ${item.name}`}
              onClick={() => removeItem(index)}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      {!atMax && (
        <input
          type="text"
          role="combobox"
          aria-label="Add food"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-activedescendant={showList ? `${baseId}-option-${highlightIndex}` : undefined}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setHighlightIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
      )}
      {showList && (
        <ul id={listboxId} role="listbox" className={styles.listbox}>
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              id={`${baseId}-option-${index}`}
              role="option"
              aria-selected={index === highlightIndex}
              className={`${styles.option} ${index === highlightIndex ? styles.optionHighlighted : ''}`}
              onMouseEnter={() => setHighlightIndex(index)}
              onClick={() => selectSuggestion(suggestion)}
            >
              {suggestion.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
