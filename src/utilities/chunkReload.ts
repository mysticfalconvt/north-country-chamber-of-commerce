import * as Sentry from '@sentry/nextjs'

// A ChunkLoadError means the browser asked for a JS chunk the server no longer
// serves. In this app that happens during a deploy: docker-entrypoint.sh rebuilds
// .next on container start and only then starts the server, so a page that was
// already open can lazy-load a chunk while the origin is still unavailable.
//
// Reloading picks up freshly generated HTML with correct chunk hashes, which fixes
// it. We reload at most once per window so a chunk that is genuinely gone can never
// put the tab in a reload loop -- the second failure is left to surface normally.

const RELOAD_KEY = 'chunkReload:lastAttempt'
const RELOAD_WINDOW_MS = 30_000

const CHUNK_ERROR_PATTERN =
  /Loading chunk \S+ failed|Loading CSS chunk \S+ failed|Failed to fetch dynamically imported module|error loading dynamically imported module/i

export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false

  const { name, message } = error as { name?: unknown; message?: unknown }

  if (name === 'ChunkLoadError') return true

  return typeof message === 'string' && CHUNK_ERROR_PATTERN.test(message)
}

// sessionStorage throws in some privacy modes, so never let it break recovery.
function readLastAttempt(): number {
  try {
    return Number(window.sessionStorage.getItem(RELOAD_KEY)) || 0
  } catch {
    return 0
  }
}

function markAttempt(at: number): boolean {
  try {
    window.sessionStorage.setItem(RELOAD_KEY, String(at))
    return true
  } catch {
    // Without storage we can't guard against a loop, so don't reload at all.
    return false
  }
}

/**
 * Reloads once to recover from a failed chunk load. Returns false if we already
 * tried recently, or if we can't track attempts and therefore can't rule out a loop.
 */
export function recoverFromChunkLoadError(): boolean {
  const now = Date.now()

  if (now - readLastAttempt() < RELOAD_WINDOW_MS) return false
  if (!markAttempt(now)) return false

  // The error is already captured by the SDK's global handlers; flush before the
  // reload tears down the page, otherwise the event never leaves the browser.
  void Sentry.flush(2000)
    .catch(() => {})
    .finally(() => window.location.reload())

  return true
}

export function installChunkReloadHandler(): void {
  window.addEventListener('error', (event) => {
    if (isChunkLoadError(event.error)) recoverFromChunkLoadError()
  })

  window.addEventListener('unhandledrejection', (event) => {
    if (isChunkLoadError(event.reason)) recoverFromChunkLoadError()
  })
}
