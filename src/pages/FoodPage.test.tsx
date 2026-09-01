import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Timestamp } from 'firebase/firestore';
import { FoodPage } from './FoodPage';
import type { Food } from '../types/food';

vi.mock('../hooks/useFoods', () => ({ useFoods: vi.fn() }));
vi.mock('../hooks/useRangeEvents', () => ({ useRangeEvents: vi.fn() }));

const { useFoods } = await import('../hooks/useFoods');
const { useRangeEvents } = await import('../hooks/useRangeEvents');

const baby = { id: 'b1', firstName: 'Mei',
               birthDate: Timestamp.fromDate(new Date('2026-02-01')) } as never;

const props = { familyId: 'f1', babyId: 'b1', userId: 'u1', baby };

beforeEach(() => {
  vi.mocked(useRangeEvents).mockReturnValue({
    events: [], loading: false, fromCache: false, hasPendingWrites: false } as never);
});

const withFoods = (foods: Food[]) =>
  vi.mocked(useFoods).mockReturnValue({
    foods, loading: false, fromCache: false, hasPendingWrites: false } as never);

/** A catalog food with every required field, overridable per test. */
function makeFood(overrides: Partial<Food> & Pick<Food, 'id' | 'name'>): Food {
  return {
    group: 'other',
    allergens: [],
    gramsPerTsp: 5,
    minStage: 1,
    status: 'untried',
    usageCount: 1,
    exposureCount: 1,
    reactionEventIds: [],
    nutrientSource: 'seed',
    ...overrides,
  };
}

describe('FoodPage', () => {
  it('should suggest a food when the introduction window is open', async () => {
    withFoods([]);
    render(<FoodPage {...props} />);
    expect(await screen.findByText(/try next/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log it/i })).toBeInTheDocument();
  });

  it('should show a hold card with a date inside the 3-day window', async () => {
    withFoods([{ id: 'kabocha', name: 'Kabocha', group: 'vegetable', allergens: [],
      gramsPerTsp: 5, minStage: 1, status: 'untried', usageCount: 1, exposureCount: 1,
      reactionEventIds: [], nutrientSource: 'seed',
      firstTriedAt: Timestamp.fromDate(new Date()) } as Food]);
    render(<FoodPage {...props} />);
    expect(await screen.findByText(/hold/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /log it/i })).not.toBeInTheDocument();
  });

  it('should collapse the ranked list behind a disclosure', async () => {
    const user = userEvent.setup();
    withFoods([]);
    render(<FoodPage {...props} />);
    const toggle = await screen.findByRole('button', { name: /other options/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('should render 28 allergen tokens', async () => {
    withFoods([]);
    render(<FoodPage {...props} />);
    expect(await screen.findAllByTestId('allergen-token')).toHaveLength(28);
  });

  it('should never use the word safe', async () => {
    withFoods([]);
    const { container } = render(<FoodPage {...props} />);
    await screen.findByText(/allergens/i);
    expect(container.textContent).not.toMatch(/\bsafe\b/i);
  });

  it('should roll a confirmed allergy and a suspicion up to their allergen tokens', async () => {
    withFoods([
      makeFood({ id: 'egg-yolk', name: 'Egg yolk', allergens: ['egg'], status: 'confirmed_allergy' }),
      makeFood({ id: 'plain-yoghurt', name: 'Yoghurt', allergens: ['milk'], status: 'suspected' }),
      makeFood({ id: 'carrot', name: 'Carrot', allergens: [], status: 'safe', exposureCount: 5 }),
    ]);
    render(<FoodPage {...props} />);
    expect(await screen.findByRole('button', { name: /^Egg — Allergy/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Milk — Suspected/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Crab — Not introduced/ })).toBeInTheDocument();
  });

  it('should show a no-reaction count rather than a verdict on the allergen token', async () => {
    withFoods([
      makeFood({ id: 'shirasu', name: 'Shirasu', allergens: ['salmon'], status: 'safe', exposureCount: 4 }),
    ]);
    render(<FoodPage {...props} />);
    expect(await screen.findByRole('button', { name: /^Salmon — No reaction ×4/ })).toBeInTheDocument();
  });

  it('should render held-back candidates with their reason instead of hiding them', async () => {
    const user = userEvent.setup();
    withFoods([
      makeFood({ id: 'plain-yoghurt', name: 'Yoghurt', allergens: ['milk'], status: 'suspected' }),
    ]);
    render(<FoodPage {...props} />);
    await user.click(await screen.findByRole('button', { name: /other options/i }));
    const held = await screen.findAllByText(/held back/i);
    expect(held.length).toBeGreaterThan(0);
    expect(held[0].textContent).toMatch(/Yoghurt/);
  });
});
