import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MealFields } from './MealFields';
import type { Food, MealItem } from '../../types/food';

const foods = [{ id: 'kabocha', name: 'Kabocha', group: 'vegetable', usageCount: 1 }] as Food[];
const base = {
  mealSlot: 'lunch' as const,
  onMealSlotChange: vi.fn(),
  items: [] as MealItem[],
  onItemsChange: vi.fn(),
  foods,
  reaction: undefined,
  onReactionChange: vi.fn(),
};

describe('MealFields', () => {
  it('should offer the four meal slots', () => {
    render(<MealFields {...base} />);
    for (const slot of ['Breakfast', 'Lunch', 'Dinner', 'Snack']) {
      expect(screen.getByRole('button', { name: slot })).toBeInTheDocument();
    }
  });

  it('should keep the reaction block collapsed by default', () => {
    render(<MealFields {...base} />);
    expect(screen.queryByRole('group', { name: /reaction/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log a reaction/i })).toBeInTheDocument();
  });

  it('should expand the reaction block on demand', async () => {
    const user = userEvent.setup();
    render(<MealFields {...base} />);
    await user.click(screen.getByRole('button', { name: /log a reaction/i }));
    expect(await screen.findByRole('group', { name: /reaction/i })).toBeInTheDocument();
  });

  it('should warn when a systemic symptom is selected', async () => {
    const user = userEvent.setup();
    render(<MealFields {...base} />);
    await user.click(screen.getByRole('button', { name: /log a reaction/i }));
    await user.click(await screen.findByRole('button', { name: /wheezing/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/emergency/i);
  });

  it('should not warn for a local rash alone', async () => {
    const user = userEvent.setup();
    render(<MealFields {...base} />);
    await user.click(screen.getByRole('button', { name: /log a reaction/i }));
    await user.click(await screen.findByRole('button', { name: /local rash/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should hint when a food has never been eaten', async () => {
    const items = [
      { foodId: 'natto', name: 'Natto', quantity: 1, unit: 'tsp', firstTry: true },
    ] as MealItem[];
    render(<MealFields {...base} items={items} />);
    expect(screen.getByText(/new food/i)).toBeInTheDocument();
    expect(screen.getByText(/3 days/i)).toBeInTheDocument();
  });

  it('should close the detail panel when an earlier item is removed', async () => {
    const user = userEvent.setup();
    const items = [
      { foodId: 'rice', name: 'Rice', quantity: 1, unit: 'tsp' },
      { foodId: 'kabocha', name: 'Kabocha', quantity: 2, unit: 'tsp' },
      { foodId: 'natto', name: 'Natto', quantity: 3, unit: 'tsp' },
    ] as MealItem[];
    const onItemsChange = vi.fn();
    const props = { ...base, onItemsChange };
    const { rerender } = render(<MealFields {...props} items={items} />);

    await user.click(screen.getByRole('button', { name: /edit kabocha/i }));
    expect(await screen.findByLabelText(/acceptance/i)).toBeInTheDocument();

    // Removing Rice reindexes the list: slot 1 was Kabocha and is now Natto.
    // A panel left open would write Kabocha's quantity onto Natto.
    await user.click(screen.getByRole('button', { name: /remove Rice/i }));
    rerender(<MealFields {...props} items={onItemsChange.mock.calls[0][0]} />);

    expect(screen.queryByLabelText(/acceptance/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/quantity/i)).not.toBeInTheDocument();
  });

  it('should keep per-item detail collapsed until the chip is tapped', async () => {
    const user = userEvent.setup();
    const items = [
      { foodId: 'kabocha', name: 'Kabocha', quantity: 2, unit: 'tsp' },
    ] as MealItem[];
    render(<MealFields {...base} items={items} />);
    expect(screen.queryByLabelText(/acceptance/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /edit kabocha/i }));
    expect(await screen.findByLabelText(/acceptance/i)).toBeInTheDocument();
  });
});
