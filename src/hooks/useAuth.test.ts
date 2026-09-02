import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';

const mockOnAuthChanged = vi.fn();
const mockSignOut = vi.fn();
const mockIsEmailAllowed = vi.fn();

vi.mock('../services/auth', () => ({
  onAuthChanged: (...args: unknown[]) => mockOnAuthChanged(...args),
  signOut: () => mockSignOut(),
}));

vi.mock('../services/allowed-users', () => ({
  isEmailAllowed: (...args: unknown[]) => mockIsEmailAllowed(...args),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthChanged.mockImplementation(() => vi.fn());
  });

  it('should return null user and loading false when not authenticated', async () => {
    mockOnAuthChanged.mockImplementation((cb: (u: null) => void) => {
      cb(null);
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.allowed).toBe(true);
  });

  it('should return user when authenticated and email is allowed', async () => {
    const fakeUser = { uid: '123', email: 'parent@example.com' };
    mockOnAuthChanged.mockImplementation((cb: (u: typeof fakeUser) => void) => {
      cb(fakeUser);
      return vi.fn();
    });
    mockIsEmailAllowed.mockResolvedValue(true);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.allowed).toBe(true);
  });

  it('should sign out and flag not allowed when email is not in whitelist', async () => {
    const fakeUser = { uid: '456', email: 'stranger@example.com' };
    mockOnAuthChanged.mockImplementation((cb: (u: typeof fakeUser | null) => void) => {
      cb(fakeUser);
      return vi.fn();
    });
    mockIsEmailAllowed.mockResolvedValue(false);
    mockSignOut.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.allowed).toBe(false));
    expect(mockSignOut).toHaveBeenCalled();
  });

  /**
   * The allowlist check is a Firestore read, and it throws when the network or
   * the rules refuse it. That rejection used to escape the auth callback, so
   * `loading` never cleared and the app sat on its loading screen for ever —
   * no login form, no message, nothing to retry.
   */
  it('should stop loading and explain itself when the allowlist check fails', async () => {
    const fakeUser = { uid: '789', email: 'parent@example.com' };
    mockOnAuthChanged.mockImplementation((cb: (u: typeof fakeUser) => void) => {
      cb(fakeUser);
      return vi.fn();
    });
    mockIsEmailAllowed.mockRejectedValue(
      new Error('Failed to get document because the client is offline.'),
    );

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));
    // Fails closed — an unverifiable account is not an admitted one.
    expect(result.current.user).toBeNull();
    expect(result.current.error).toContain('client is offline');
  });
});
