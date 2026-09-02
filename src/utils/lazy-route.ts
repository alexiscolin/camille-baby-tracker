const RELOAD_FLAG = 'chunk-reload-attempted';
/** How long to let `location.reload()` tear the page down before giving up. */
const RELOAD_GRACE_MS = 10_000;

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
        /*
         * Normally this never settles, because the document is already being
         * torn down. It has to reject eventually all the same: if the reload
         * cannot take effect — a cached index.html pointing at chunks that no
         * longer exist, say — a promise that hangs leaves Suspense showing its
         * fallback for ever, which reads as an app that never finishes
         * loading. Failing lands on the error boundary, which at least offers
         * a way out.
         */
        return new Promise<T>((_resolve, reject) => {
          setTimeout(() => reject(error), RELOAD_GRACE_MS);
        });
      },
    );
}
