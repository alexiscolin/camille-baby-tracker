import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorSelector } from './ColorSelector';
import { STOOL_COLORS } from '../utils/stool-color';

describe('ColorSelector', () => {
  it('should render all stool color options', () => {
    render(
      <ColorSelector value={undefined} onChange={vi.fn()} />,
    );

    for (const color of STOOL_COLORS) {
      expect(screen.getByRole('button', { name: color.label })).toBeInTheDocument();
    }
  });

  it('should highlight the selected color', () => {
    render(
      <ColorSelector value="yellow" onChange={vi.fn()} />,
    );

    const yellowBtn = screen.getByRole('button', { name: 'Yellow' });
    expect(yellowBtn).toHaveAttribute('aria-pressed', 'true');

    const brownBtn = screen.getByRole('button', { name: 'Brown' });
    expect(brownBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('should call onChange when a color is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ColorSelector value={undefined} onChange={onChange} />,
    );

    await user.click(screen.getByRole('button', { name: 'Brown' }));
    expect(onChange).toHaveBeenCalledWith('brown');
  });

  it('should deselect when clicking the already selected color', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ColorSelector value="brown" onChange={onChange} />,
    );

    await user.click(screen.getByRole('button', { name: 'Brown' }));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('should display warning when provided', () => {
    render(
      <ColorSelector
        value="red"
        onChange={vi.fn()}
        warning={{ level: 'alert', message: 'Red stool may indicate blood.' }}
      />,
    );

    expect(screen.getByText('Red stool may indicate blood.')).toBeInTheDocument();
  });

  it('should not display warning when not provided', () => {
    render(
      <ColorSelector value="yellow" onChange={vi.fn()} />,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
