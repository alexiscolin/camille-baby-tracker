import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Timestamp } from 'firebase/firestore';
import { FoodCharts } from './FoodCharts';
import type { BabyEvent } from '../types/events';
import type { Food } from '../types/food';

const kabocha = { id: 'kabocha', name: 'Kabocha', group: 'vegetable', gramsPerTsp: 5,
  nutrients: { energyKcal: 60, proteinG: 1.6, fatG: 0.3, carbsG: 12.2, fiberG: 3.6,
    sugarsG: 4.1, ironMg: 0.5, calciumMg: 14, zincMg: 0.3, sodiumMg: 1,
    potassiumMg: 430, vitaminAUgRae: 330, vitaminCMg: 32, vitaminDUg: 0,
    vitaminB12Ug: 0, folateUg: 38 } } as Food;

const D1 = new Date('2026-08-30T12:00:00Z');
const days = [{ date: D1, label: '30' }];
const meal = {
  id: 'm1', babyId: 'b1', type: 'meal', mealSlot: 'lunch',
  timestamp: Timestamp.fromDate(D1), createdBy: 'u1',
  createdAt: Timestamp.fromDate(D1),
  items: [{ foodId: 'kabocha', name: 'Kabocha', quantity: 4, unit: 'tsp' }],
} as unknown as BabyEvent;

const props = {
  events: [meal],
  byId: new Map([['kabocha', kabocha]]),
  days,
  rangeDays: 7,
};

describe('FoodCharts', () => {
  it('should offer the four chart views', () => {
    render(<FoodCharts {...props} />);
    for (const label of ['Groups', 'Variety', 'First', 'Coverage']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('should start on the group intake view', () => {
    render(<FoodCharts {...props} />);
    expect(screen.getByTestId('chart-groups')).toBeInTheDocument();
  });

  it('should swap the chart when the picker changes', async () => {
    const user = userEvent.setup();
    render(<FoodCharts {...props} />);
    await user.click(screen.getByRole('button', { name: 'Variety' }));
    expect(screen.getByTestId('chart-variety')).toBeInTheDocument();
    expect(screen.queryByTestId('chart-groups')).not.toBeInTheDocument();
  });

  it('should still answer the lifetime question when the range is empty', async () => {
    const user = userEvent.setup();
    const tried = { ...kabocha, firstTriedAt: Timestamp.fromDate(D1) } as Food;
    render(<FoodCharts {...props} events={[]} byId={new Map([['kabocha', tried]])} />);
    await user.click(screen.getByRole('button', { name: 'First' }));
    expect(screen.getByTestId('chart-first')).toBeInTheDocument();
    expect(screen.queryByText(/no meals logged/i)).not.toBeInTheDocument();
  });

  it('should show the no-data message instead of an empty chart frame', () => {
    render(<FoodCharts {...props} events={[]} />);
    expect(screen.getByText(/no meals logged/i)).toBeInTheDocument();
    expect(screen.queryByTestId('chart-groups')).not.toBeInTheDocument();
  });
});
