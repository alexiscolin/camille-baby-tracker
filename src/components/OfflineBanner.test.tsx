import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock useOnlineStatus before importing OfflineBanner
const mockUseOnlineStatus = vi.fn();
vi.mock('../hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => mockUseOnlineStatus(),
}));

import { OfflineBanner } from './OfflineBanner';

describe('OfflineBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing when online', () => {
    mockUseOnlineStatus.mockReturnValue(true);
    const { container } = render(<OfflineBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('should show offline message when offline', () => {
    mockUseOnlineStatus.mockReturnValue(false);
    render(<OfflineBanner />);
    expect(screen.getByText(/Offline/)).toBeInTheDocument();
    expect(screen.getByText(/changes will sync/)).toBeInTheDocument();
  });

  it('should have role status for accessibility', () => {
    mockUseOnlineStatus.mockReturnValue(false);
    render(<OfflineBanner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
