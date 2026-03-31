import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isEmailAllowed } from './allowed-users';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, _collection, id) => ({ path: `allowedEmails/${id}` })),
  getDoc: vi.fn(),
}));

vi.mock('./firebase', () => ({
  db: {},
}));

import { getDoc } from 'firebase/firestore';

const mockGetDoc = vi.mocked(getDoc);

describe('isEmailAllowed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when the email document exists', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
    } as Awaited<ReturnType<typeof getDoc>>);

    const result = await isEmailAllowed('parent@example.com');

    expect(result).toBe(true);
  });

  it('should return false when the email document does not exist', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    } as Awaited<ReturnType<typeof getDoc>>);

    const result = await isEmailAllowed('stranger@example.com');

    expect(result).toBe(false);
  });

  it('should return false when email is null or undefined', async () => {
    expect(await isEmailAllowed(null as unknown as string)).toBe(false);
    expect(await isEmailAllowed(undefined as unknown as string)).toBe(false);
    expect(mockGetDoc).not.toHaveBeenCalled();
  });
});
