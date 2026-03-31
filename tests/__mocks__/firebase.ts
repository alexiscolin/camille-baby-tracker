import { vi } from 'vitest';

vi.mock('../../src/services/firebase', () => ({
  auth: {},
  db: {},
}));
