import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from './LoginPage';

const mockSignInWithGoogle = vi.fn();

vi.mock('../services/auth', () => ({
  signInWithGoogle: () => mockSignInWithGoogle(),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the Google sign-in button', () => {
    render(<LoginPage />);

    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
  });

  it('should not render email/password form fields', () => {
    render(<LoginPage />);

    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
  });

  it('should call signInWithGoogle when button is clicked', async () => {
    mockSignInWithGoogle.mockResolvedValue({});
    const user = userEvent.setup();

    render(<LoginPage />);
    await user.click(screen.getByRole('button', { name: /google/i }));

    expect(mockSignInWithGoogle).toHaveBeenCalledOnce();
  });

  it('should display error on sign-in failure', async () => {
    mockSignInWithGoogle.mockRejectedValue({ code: 'auth/network-request-failed' });
    const user = userEvent.setup();

    render(<LoginPage />);
    await user.click(screen.getByRole('button', { name: /google/i }));

    expect(screen.getByText(/network error/i)).toBeInTheDocument();
  });

  it('should not display error when popup is closed by user', async () => {
    mockSignInWithGoogle.mockRejectedValue({ code: 'auth/popup-closed-by-user' });
    const user = userEvent.setup();

    render(<LoginPage />);
    await user.click(screen.getByRole('button', { name: /google/i }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should show unauthorized message when allowed is false', () => {
    render(<LoginPage allowed={false} />);

    expect(screen.getByText(/not authorized/i)).toBeInTheDocument();
  });
});
