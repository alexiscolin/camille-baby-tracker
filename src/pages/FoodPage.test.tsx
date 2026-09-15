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

const daysAgo = (n: number) => Timestamp.fromDate(new Date(Date.now() - n * 86_400_000));

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

  it('should keep suggesting on a day a new food was already tried', async () => {
    withFoods([
      makeFood({ id: 'okayu-10x', name: 'Okayu', group: 'grain', firstTriedAt: daysAgo(9) }),
      makeFood({ id: 'carrot', name: 'Carrot', group: 'vegetable', firstTriedAt: Timestamp.fromDate(new Date()) }),
    ]);
    render(<FoodPage {...props} />);
    expect(await screen.findByText(/already tried something new today/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log it/i })).toBeInTheDocument();
  });

  it('should keep a first-week baby on porridge and say when vegetables come', async () => {
    withFoods([makeFood({ id: 'okayu-10x', name: 'Okayu', group: 'grain', firstTriedAt: daysAgo(2) })]);
    render(<FoodPage {...props} />);
    expect(await screen.findByText(/keep going with porridge/i)).toBeInTheDocument();
    expect(screen.getByText(/vegetables come in around day 7/i)).toBeInTheDocument();
  });

  it('should start a baby who has not started on rice porridge', async () => {
    withFoods([]);
    render(<FoodPage {...props} />);
    expect(await screen.findByTestId('hero-food')).toHaveTextContent(/Okayu, 10:1/);
    expect(screen.getByTestId('hero-food-ja')).toHaveTextContent('10倍がゆ');
  });

  it('should not put egg, wheat or dairy first one week into weaning', async () => {
    withFoods([
      makeFood({ id: 'okayu-10x', name: 'Okayu', group: 'grain', firstTriedAt: daysAgo(7) }),
      makeFood({ id: 'carrot', name: 'Carrot', group: 'vegetable', firstTriedAt: daysAgo(2) }),
    ]);
    render(<FoodPage {...props} />);
    const hero = await screen.findByTestId('hero-food');
    expect(hero.textContent).not.toMatch(/egg|udon|yoghurt|peanut|bread|milk|tofu/i);
  });

  it('should list foods for the paediatrician separately, with their Japanese names', async () => {
    const user = userEvent.setup();
    withFoods([]);
    render(<FoodPage {...props} />);
    await user.click(await screen.findByRole('button', { name: /other options/i }));
    expect(screen.getByRole('heading', { name: /with your paediatrician/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Peanut butter.*ピーナッツペースト/ })).toBeInTheDocument();
  });

  it('should say which stage and day of solids the baby is on', async () => {
    withFoods([makeFood({ id: 'okayu-10x', name: 'Okayu', group: 'grain', firstTriedAt: daysAgo(7) })]);
    render(<FoodPage {...props} />);
    expect(await screen.findByText(/Stage 1 · 初期 .*day 8 of solids/)).toBeInTheDocument();
  });

  it('should open next week\'s shopping list', async () => {
    const user = userEvent.setup();
    withFoods([]);
    render(<FoodPage {...props} />);
    const toggle = await screen.findByRole('button', { name: /next week's shopping/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/this week's 宅配/)).toBeInTheDocument();
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

  it('should render 29 allergen tokens', async () => {
    withFoods([]);
    render(<FoodPage {...props} />);
    expect(await screen.findAllByTestId('allergen-token')).toHaveLength(29);
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
    const held = await screen.findAllByText(/held back —/i);
    expect(held.length).toBeGreaterThan(0);
    expect(held[0].textContent).toMatch(/Yoghurt/);
  });
});
