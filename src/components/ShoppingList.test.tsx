import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShoppingList } from './ShoppingList';
import type { ShoppingList as List } from '../utils/shopping-list';

const list: List = {
  from: new Date('2026-09-16'), to: new Date('2026-09-22'), stage: 2, mealsPerDay: 2,
  grain: [{ foodId: 'okayu-10x', name: 'Okayu', nameJa: '10倍がゆ', reason: 'staple', grams: 1120, packs: 5,
    buy: { kind: 'coop', product: 'CO-OP きらきらステップ 白かゆ (8倍がゆ)', packGrams: 260, leadWeeks: 1 } }],
  vegFruit: [{ foodId: 'beni-imo', name: 'Beni-imo', reason: 'new', grams: 20,
    buy: { kind: 'local', name: '紅いも', months: [9] } }],
  protein: [{ foodId: 'shirasu', name: 'Shirasu', reason: 'maintenance', grams: 30, note: 'Desalt: pour boiling water over and drain.',
    buy: { kind: 'coop', product: 'Salmon dice', packGrams: 80, leadWeeks: 2 } }],
};

describe('ShoppingList', () => {
  it('should show amounts, packs and where to buy', () => {
    render(<ShoppingList list={list} />);
    expect(screen.getByText('10倍がゆ')).toBeInTheDocument();
    expect(screen.getByText(/白かゆ/)).toBeInTheDocument();
    expect(screen.getByText(/up to 1120 g · 5 packs/)).toBeInTheDocument();
    expect(screen.getByText(/紅いも \(local, in season\)/)).toBeInTheDocument();
  });

  it('should tag new and keep-up lines and show the note', () => {
    render(<ShoppingList list={list} />);
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Keep up')).toBeInTheDocument();
    expect(screen.getByText(/desalt/i)).toBeInTheDocument();
    expect(screen.getByText(/2 weeks/)).toBeInTheDocument();
  });

  it('should explain the delivery cycle', () => {
    render(<ShoppingList list={list} />);
    expect(screen.getByText(/this week's 宅配/)).toBeInTheDocument();
  });
});
