import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IronOutlookCard } from './IronOutlookCard';
import type { IronOutlook } from '../utils/iron-outlook';
import type { SeedFood } from '../types/food';

const seed = (id: string, ironMg: number): SeedFood =>
  ({ id, name: id, nameJa: id, group: 'protein', allergens: [], gramsPerTsp: 5,
     minStage: 1, sourceRef: 'x', nutrients: { ironMg } } as unknown as SeedFood);

const outlook = (over: Partial<IronOutlook> = {}): IronOutlook => ({
  need: 4.5, fromMilk: 0.24, needFromFood: 4.26, shortBy: 3.86,
  startsAtSixMonths: false, suggestions: [seed('liver', 9)], caution: null, ...over,
});

const props = {
  outlook: outlook(),
  source: 'breast' as const,
  mlPerDay: 600,
  sixMonthsOn: new Date(2026, 9, 12),
  onPick: vi.fn(),
};

describe('IronOutlookCard', () => {
  it('should say what the meals have to bring', () => {
    render(<IronOutlookCard {...props} />);
    expect(screen.getByText(/4\.3 mg/)).toBeInTheDocument();
  });

  it('should say milk brings almost none of it when breastfeeding', () => {
    render(<IronOutlookCard {...props} />);
    expect(screen.getByText(/breast milk brings/i)).toBeInTheDocument();
  });

  it('should name the date the job starts while still under six months', () => {
    render(<IronOutlookCard {...props} outlook={outlook({ startsAtSixMonths: true })} />);
    expect(screen.getByText(/12 Oct/i)).toBeInTheDocument();
  });

  it('should say the figure stays flat, so it does not read as a ramp', () => {
    render(<IronOutlookCard {...props} outlook={outlook({ startsAtSixMonths: true })} />);
    expect(screen.getByText(/does not rise after that|stays there/i)).toBeInTheDocument();
  });

  it('should say formula already covers it rather than pushing food', () => {
    render(<IronOutlookCard
      {...props}
      source="formula"
      outlook={outlook({ fromMilk: 4.8, needFromFood: 0, shortBy: 0, suggestions: [] })}
    />);
    expect(screen.getByText(/covers/i)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should still ask for food when a bottle-fed baby drinks less', () => {
    render(<IronOutlookCard
      {...props}
      source="formula"
      mlPerDay={450}
      outlook={outlook({ fromMilk: 3.6, needFromFood: 0.9, shortBy: 0.5 })}
    />);
    expect(screen.getByText(/0\.9 mg/)).toBeInTheDocument();
  });

  it('should offer each suggested food to log', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(<IronOutlookCard {...props} onPick={onPick} />);
    await user.click(screen.getByRole('button', { name: /liver/i }));
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: 'liver' }));
  });

  it('should carry a serving caution next to the food it belongs to', () => {
    render(<IronOutlookCard {...props} outlook={outlook({ caution: 'a 15 g serving is past the daily vitamin A limit' })} />);
    expect(screen.getByText(/vitamin a limit/i)).toBeInTheDocument();
  });
});
