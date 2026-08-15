import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  isChunkLoadError,
  recoverFromChunkLoadError,
  shouldReportChunkLoadError,
} from '@/utilities/chunkReload'

vi.mock('@sentry/nextjs', () => ({
  flush: vi.fn(() => Promise.resolve(true)),
}))

const reload = vi.fn()

// jsdom's location.reload is not writable, so swap the whole object.
Object.defineProperty(window, 'location', {
  configurable: true,
  value: { ...window.location, reload },
})

// Waits for the flush().finally() microtask chain to run.
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('isChunkLoadError', () => {
  it('matches errors named ChunkLoadError', () => {
    const error = new Error('Loading chunk 5189 failed.')
    error.name = 'ChunkLoadError'
    expect(isChunkLoadError(error)).toBe(true)
  })

  it('matches by message when the name has been lost', () => {
    expect(isChunkLoadError(new Error('Loading chunk 5189 failed.'))).toBe(true)
    expect(isChunkLoadError(new Error('Loading CSS chunk 42 failed.'))).toBe(true)
    expect(isChunkLoadError(new Error('Failed to fetch dynamically imported module: /a.js'))).toBe(
      true,
    )
  })

  it('ignores unrelated errors and non-errors', () => {
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false)
    expect(isChunkLoadError(new TypeError('fetch failed'))).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
    expect(isChunkLoadError(undefined)).toBe(false)
    expect(isChunkLoadError('Loading chunk 1 failed.')).toBe(false)
  })
})

describe('recoverFromChunkLoadError', () => {
  let now = 1_000_000

  beforeEach(() => {
    reload.mockClear()
    window.sessionStorage.clear()
    now = 1_000_000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reloads on the first failure', async () => {
    expect(recoverFromChunkLoadError()).toBe(true)
    await settle()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('does not reload again within the guard window', async () => {
    expect(recoverFromChunkLoadError()).toBe(true)
    await settle()

    now += 5_000
    expect(recoverFromChunkLoadError()).toBe(false)
    await settle()

    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('reloads again once the guard window has passed', async () => {
    recoverFromChunkLoadError()
    await settle()

    now += 30_001
    expect(recoverFromChunkLoadError()).toBe(true)
    await settle()

    expect(reload).toHaveBeenCalledTimes(2)
  })

  it('does not reload when sessionStorage reads are denied', async () => {
    const real = window.sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error('denied')
        },
        setItem: () => {},
      },
    })

    try {
      expect(recoverFromChunkLoadError()).toBe(false)
      await settle()
      expect(reload).not.toHaveBeenCalled()
    } finally {
      Object.defineProperty(window, 'sessionStorage', { configurable: true, value: real })
    }
  })

  it('refuses to reload when sessionStorage is unavailable', async () => {
    // jsdom's Storage is a proxy that ignores vi.spyOn, so swap the whole object
    // to simulate a browser that denies storage access (e.g. strict privacy mode).
    const real = window.sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: {
        getItem: () => null,
        setItem: () => {
          throw new Error('denied')
        },
      },
    })

    try {
      expect(recoverFromChunkLoadError()).toBe(false)
      await settle()
      expect(reload).not.toHaveBeenCalled()
    } finally {
      Object.defineProperty(window, 'sessionStorage', { configurable: true, value: real })
    }
  })
})

describe('shouldReportChunkLoadError', () => {
  let now = 1_000_000

  beforeEach(() => {
    reload.mockClear()
    window.sessionStorage.clear()
    now = 1_000_000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('stays silent on the first failure, which the reload will fix', () => {
    expect(shouldReportChunkLoadError()).toBe(false)
  })

  it('reports a failure that survived a reload', async () => {
    // beforeSend runs before our handler reloads, so the first event is dropped.
    expect(shouldReportChunkLoadError()).toBe(false)
    recoverFromChunkLoadError()
    await settle()

    // Same chunk fails again after the reload: a genuinely missing chunk.
    now += 5_000
    expect(shouldReportChunkLoadError()).toBe(true)
  })

  it('stays silent again once the guard window has passed', async () => {
    recoverFromChunkLoadError()
    await settle()

    now += 30_001
    expect(shouldReportChunkLoadError()).toBe(false)
  })

  it('reports when sessionStorage is unavailable, since nothing can auto-recover', () => {
    const real = window.sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error('denied')
        },
        setItem: () => {},
      },
    })

    try {
      expect(shouldReportChunkLoadError()).toBe(true)
    } finally {
      Object.defineProperty(window, 'sessionStorage', { configurable: true, value: real })
    }
  })
})
