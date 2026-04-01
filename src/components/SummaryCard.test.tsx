import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryCard } from './SummaryCard';

describe('SummaryCard', () => {
  it('should render the count and label', () => {
    render(
      <SummaryCard
        icon={<span data-testid="icon">IC</span>}
        label="Feedings"
        count={8}
        colorVar="var(--color-feeding)"
        bgVar="var(--color-feeding-bg)"
      />,
    );
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('Feedings')).toBeInTheDocument();
  });

  it('should render the icon', () => {
    render(
      <SummaryCard
        icon={<span data-testid="icon">IC</span>}
        label="Pees"
        count={3}
        colorVar="var(--color-pee)"
        bgVar="var(--color-pee-bg)"
      />,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('should display zero count', () => {
    render(
      <SummaryCard
        icon={<span>IC</span>}
        label="Meds"
        count={0}
        colorVar="var(--color-medication)"
        bgVar="var(--color-medication-bg)"
      />,
    );
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
