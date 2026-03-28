'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, string | number>) => void
    }
  }
}

function trackError(message: string, source?: string, pathname?: string) {
  if (!window.umami) return

  window.umami.track('error', {
    message: message.slice(0, 400),
    source: source?.slice(0, 100) || 'unknown',
    url: pathname || window.location.pathname,
  })
}

export function UmamiErrorTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      trackError(
        event.message,
        event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : undefined,
        pathname,
      )
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message =
        event.reason instanceof Error ? event.reason.message : String(event.reason)
      trackError(message, 'unhandled-promise', pathname)
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [pathname])

  return null
}
