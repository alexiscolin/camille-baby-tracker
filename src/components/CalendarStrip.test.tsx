import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarStrip } from './CalendarStrip';

describe('CalendarStrip', () => {
  it('should render the correct number of day buttons', () => {
    render(
      <CalendarStrip
        days={3}
        selectedDate={null}
        onSelectDate={vi.fn()}
        onLoadMore={vi.fn()}
      />,
    );
    // The days themselves, not every button on the strip: counting the whole
    // row made this assert its own fixture, and it broke when the date picker
    // stopped being a button.
    expect(screen.getAllByRole('button', { name: /\w{3}\s?\d+/ })).toHaveLength(3);
  });

  it('should call onSelectDate when a day is clicked', async () => {
    const user = userEvent.setup();
    const onSelectDate = vi.fn();
    render(
      <CalendarStrip
        days={3}
        selectedDate={null}
        onSelectDate={onSelectDate}
        onLoadMore={vi.fn()}
      />,
    );
    // Click the first day button (today)
    const dayButtons = screen.getAllByRole('button');
    await user.click(dayButtons[0]);
    expect(onSelectDate).toHaveBeenCalledOnce();
  });

  it('should call onLoadMore when load more button is clicked', async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    render(
      <CalendarStrip
        days={3}
        selectedDate={null}
        onSelectDate={vi.fn()}
        onLoadMore={onLoadMore}
      />,
    );
    const loadMoreBtn = screen.getByTitle('Load more days');
    await user.click(loadMoreBtn);
    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it('should highlight today', () => {
    render(
      <CalendarStrip
        days={3}
        selectedDate={null}
        onSelectDate={vi.fn()}
        onLoadMore={vi.fn()}
      />,
    );
    // Today's button should have the 'today' class
    const dayButtons = screen.getAllByRole('button');
    // First button is today
    expect(dayButtons[0].className).toContain('today');
  });

  it('should highlight selected date', () => {
    const today = new Date();
    render(
      <CalendarStrip
        days={3}
        selectedDate={today}
        onSelectDate={vi.fn()}
        onLoadMore={vi.fn()}
      />,
    );
    const dayButtons = screen.getAllByRole('button');
    expect(dayButtons[0].className).toContain('selected');
  });

  /**
   * The picker is opened by tapping the date field itself, not by a script
   * calling showPicker() on a hidden one — that API declined silently here.
   * So the field has to be present, enabled and inside the control.
   */
  it('should put a usable date field in the calendar button', () => {
    render(
      <CalendarStrip
        days={3}
        selectedDate={new Date(2026, 8, 2)}
        onSelectDate={vi.fn()}
        onLoadMore={vi.fn()}
      />,
    );

    const field = screen.getByLabelText(/pick a date/i);
    expect(field).toBeEnabled();
    expect(field).toHaveAttribute('type', 'date');
  });

  it('should select the date the field is set to', async () => {
    const user = userEvent.setup();
    const onSelectDate = vi.fn();
    render(
      <CalendarStrip
        days={3}
        selectedDate={new Date(2026, 8, 2)}
        onSelectDate={onSelectDate}
        onLoadMore={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/pick a date/i), '2026-08-30');
    expect(onSelectDate).toHaveBeenCalled();
  });
});
