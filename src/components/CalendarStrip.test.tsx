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
    // 3 day buttons + 2 action buttons (load more + date picker)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(5);
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
});
