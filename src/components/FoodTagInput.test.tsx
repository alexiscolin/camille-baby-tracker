import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FoodTagInput } from './FoodTagInput';
import type { Food, MealItem } from '../types/food';

const foods = [
  { id: 'kabocha', name: 'Kabocha', group: 'vegetable', usageCount: 5 },
  { id: 'shirasu', name: 'Shirasu', group: 'protein', usageCount: 3 },
] as Food[];

describe('FoodTagInput', () => {
  it('should render a chip per selected item', () => {
    const items = [
      { foodId: 'kabocha', name: 'Kabocha', quantity: 2, unit: 'tsp' },
    ] as MealItem[];
    render(<FoodTagInput items={items} onChange={vi.fn()} foods={foods} />);
    expect(screen.getByText(/Kabocha/)).toBeInTheDocument();
  });

  it('should show suggestions when typing', async () => {
    const user = userEvent.setup();
    render(<FoodTagInput items={[]} onChange={vi.fn()} foods={foods} />);
    await user.type(screen.getByRole('combobox'), 'kab');
    expect(await screen.findByRole('option', { name: /Kabocha/ })).toBeInTheDocument();
  });

  it('should add an item when a suggestion is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FoodTagInput items={[]} onChange={onChange} foods={foods} />);
    await user.type(screen.getByRole('combobox'), 'kab');
    await user.click(await screen.findByRole('option', { name: /Kabocha/ }));
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ foodId: 'kabocha', quantity: 1, unit: 'tsp' }),
    ]);
  });

  it('should add the highlighted suggestion on Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FoodTagInput items={[]} onChange={onChange} foods={foods} />);
    // 'a' substring-matches both catalog foods (neither is a prefix match), so
    // they tie-break on usageCount desc: Kabocha (5) first, Shirasu (3) second.
    // ArrowDown moves off the default top highlight (Kabocha) onto Shirasu, so
    // this assertion fails if Enter ignored the highlight and used the default.
    await user.type(screen.getByRole('combobox'), 'a');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ foodId: 'shirasu' }),
    ]);
  });

  it('should close the suggestion list on Escape', async () => {
    const user = userEvent.setup();
    render(<FoodTagInput items={[]} onChange={vi.fn()} foods={foods} />);
    await user.type(screen.getByRole('combobox'), 'kab');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('should remove an item when its chip remove button is pressed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const items = [
      { foodId: 'kabocha', name: 'Kabocha', quantity: 2, unit: 'tsp' },
    ] as MealItem[];
    render(<FoodTagInput items={items} onChange={onChange} foods={foods} />);
    await user.click(screen.getByRole('button', { name: /remove kabocha/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('should stop accepting items at the maximum', async () => {
    const items = Array.from({ length: 12 }, (_, i) => ({
      foodId: `f${i}`, name: `F${i}`, quantity: 1, unit: 'tsp',
    })) as MealItem[];
    render(<FoodTagInput items={items} onChange={vi.fn()} foods={foods} maxItems={12} />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
