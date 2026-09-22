import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { DevelopmentTimeline } from './DevelopmentTimeline';

/** Camille's case: born 22 March, read on 22 September — six months to the day. */
const BIRTH = new Date(2026, 2, 22);
const AT_SIX_MONTHS = new Date(2026, 8, 22);

describe('DevelopmentTimeline', () => {
  it('should say the nights are calm when no band is running', () => {
    render(<DevelopmentTimeline birthDate={BIRTH} now={AT_SIX_MONTHS} />);
    expect(screen.getByText(/rien de connu/i)).toBeInTheDocument();
  });

  it('should lead with the band she is inside when there is one', () => {
    // Ten months: separation protest.
    render(<DevelopmentTimeline birthDate={BIRTH} now={new Date(2027, 0, 22)} />);
    expect(screen.getByText('Angoisse de séparation')).toBeInTheDocument();
    expect(screen.queryByText(/rien de connu/i)).not.toBeInTheDocument();
  });

  it('should announce the next rough patch with a delay', () => {
    render(<DevelopmentTimeline birthDate={BIRTH} now={AT_SIX_MONTHS} />);
    // Scoped to the band: the eight-month checkpoint is the same distance away
    // and carries the same delay, so an unscoped query matches both.
    const band = screen.getByText('Angoisse de séparation').closest('div');
    expect(band).not.toBeNull();
    expect(within(band as HTMLElement).getByText(/dans ~2 mois/)).toBeInTheDocument();
  });

  /**
   * The caveat is the honest half of the feature: roughly one baby in eight
   * never shows this phase. It must never be possible to render the band
   * without it.
   */
  it('should carry the caveat alongside the band', () => {
    render(<DevelopmentTimeline birthDate={BIRTH} now={AT_SIX_MONTHS} />);
    expect(screen.getByText(/1 bébé sur 8/)).toBeInTheDocument();
  });

  it('should show the next health-record checkpoint and quote it verbatim', () => {
    render(<DevelopmentTimeline birthDate={BIRTH} now={AT_SIX_MONTHS} />);
    expect(screen.getByText(/8 mois/)).toBeInTheDocument();
    expect(screen.getByText('tient bien assis')).toBeInTheDocument();
  });

  it('should show the motor windows with their real spread', () => {
    render(<DevelopmentTimeline birthDate={BIRTH} now={AT_SIX_MONTHS} />);
    expect(screen.getByText('Marche autonome')).toBeInTheDocument();
    expect(screen.getByText('8,2 – 17,6 mois')).toBeInTheDocument();
  });

  it('should note that some children skip crawling entirely', () => {
    render(<DevelopmentTimeline birthDate={BIRTH} now={AT_SIX_MONTHS} />);
    expect(screen.getByText(/4,3 %/)).toBeInTheDocument();
  });

  it('should cite its sources on screen', () => {
    render(<DevelopmentTimeline birthDate={BIRTH} now={AT_SIX_MONTHS} />);
    expect(screen.getByText(/carnet de santé 2025/i)).toBeInTheDocument();
    expect(screen.getByText(/Kearsley/)).toBeInTheDocument();
  });

  it('should render nothing at all past the last window', () => {
    const { container } = render(
      <DevelopmentTimeline birthDate={BIRTH} now={new Date(2029, 2, 22)} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
