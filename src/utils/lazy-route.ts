const RELOAD_FLAG = 'chunk-reload-attempted';

function reloadAlreadyTried(): boolean {
  // Storage throws in some privacy modes; treat that as "no second chance".
  try {
    return sessionStorage.getItem(RELOAD_FLAG) !== null;
  } catch {
    return true;
  }
}

function markReloadTried(): void {
  try {
    sessionStorage.setItem(RELOAD_FLAG, '1');
  } catch {
    /* The reload still happens, it just cannot be guarded against looping. */
  }
}

function clearReloadFlag(): void {
  try {
    sessionStorage.removeItem(RELOAD_FLAG);
  } catch {
    /* Nothing was stored in the first place. */
  }
}

/**
 * Wraps a `React.lazy` factory so it survives a deploy under this app's
 * service worker.
 *
 * `registerType: 'autoUpdate'` with `skipWaiting`/`clientsClaim` activates a
 * new worker mid-session and drops the previous precache, so a tab left open
 * across a deploy asks for chunk hashes that no longer exist. Firebase Hosting
 * rewrites every unmatched path to `/index.html`, so the request answers 200
 * with HTML and the dynamic import rejects on a MIME error rather than a 404 —
 * which would otherwise unmount the whole app into the top-level error
 * boundary and lose the current route.
 *
 * One reload picks up the new asset names. The flag is per-session so a chunk
 * that is genuinely unreachable (offline, truly missing) fails through to the
 * error boundary on the second attempt instead of reload-looping.
 */
export function withChunkReload<T>(load: () => Promise<T>): () => Promise<T> {
  return () =>
    load().then(
      (module) => {
        clearReloadFlag();
        return module;
      },
      (error: unknown) => {
        if (reloadAlreadyTried()) throw error;
        markReloadTried();
        window.location.reload();
        // Never settles: the document is already being torn down.
        return new Promise<T>(() => {});
      },
    );
}
