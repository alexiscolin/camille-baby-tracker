import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CacheIndicator } from './CacheIndicator';

describe('CacheIndicator', () => {
  it('should render nothing when not from cache and no pending writes', () => {
    const { container } = render(
      <CacheIndicator fromCache={false} hasPendingWrites={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should show cached data message when fromCache is true', () => {
    render(<CacheIndicator fromCache={true} />);
    expect(screen.getByText('Showing cached data')).toBeInTheDocument();
  });

  it('should show syncing message when hasPendingWrites is true', () => {
    render(<CacheIndicator fromCache={false} hasPendingWrites={true} />);
    expect(screen.getByText('Syncing...')).toBeInTheDocument();
  });

  it('should prioritize syncing over cached', () => {
    render(<CacheIndicator fromCache={true} hasPendingWrites={true} />);
    expect(screen.getByText('Syncing...')).toBeInTheDocument();
  });

  it('should have role status for accessibility', () => {
    render(<CacheIndicator fromCache={true} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
