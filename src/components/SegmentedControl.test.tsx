import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedControl } from './SegmentedControl';

describe('SegmentedControl', () => {
  const options = ['a', 'b', 'c'] as const;

  it('should render all options', () => {
    render(<SegmentedControl options={options} value="a" onChange={vi.fn()} />);
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
    expect(screen.getByText('c')).toBeInTheDocument();
  });

  it('should use custom labels when provided', () => {
    render(
      <SegmentedControl
        options={options}
        value="a"
        onChange={vi.fn()}
        labels={{ a: 'Alpha', b: 'Beta', c: 'Charlie' }}
      />,
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('should call onChange when an option is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SegmentedControl options={options} value="a" onChange={onChange} />);

    await user.click(screen.getByText('b'));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('should apply active style to selected option', () => {
    render(<SegmentedControl options={options} value="b" onChange={vi.fn()} />);
    const activeBtn = screen.getByText('b');
    expect(activeBtn.className).toContain('segmentActive');
  });

  it('should not apply active style to unselected options', () => {
    render(<SegmentedControl options={options} value="b" onChange={vi.fn()} />);
    const inactiveBtn = screen.getByText('a');
    expect(inactiveBtn.className).not.toContain('segmentActive');
  });
});
