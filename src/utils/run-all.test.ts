import { describe, it, expect, vi } from 'vitest';
import { runAll } from './run-all';

describe('runAll', () => {
  it('should run every task even when an earlier one fails, then reject with the first error', async () => {
    const second = vi.fn().mockResolvedValue(undefined);
    await expect(runAll([
      () => Promise.reject(new Error('rules rejected')),
      second,
    ])).rejects.toThrow('rules rejected');
    expect(second).toHaveBeenCalled();
  });

  it('should resolve when every task succeeds', async () => {
    await expect(runAll([() => Promise.resolve()])).resolves.toBeUndefined();
  });
});
