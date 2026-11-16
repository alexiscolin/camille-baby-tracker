/**
 * Runs every task to completion, then rejects with the first failure. A meal's
 * exposure counters are independent writes: one rejected by firestore.rules
 * must not leave the foods after it never marked as tried.
 */
export async function runAll(tasks: (() => Promise<unknown>)[]): Promise<void> {
  const results = await Promise.allSettled(tasks.map((task) => task()));
  const failure = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failure) throw failure.reason;
}
