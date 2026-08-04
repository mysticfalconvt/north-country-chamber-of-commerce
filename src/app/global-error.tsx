'use client'

import * as Sentry from '@sentry/nextjs'
import NextError from 'next/error'
import { useEffect } from 'react'

import { isChunkLoadError, recoverFromChunkLoadError } from '@/utilities/chunkReload'

// Catches render errors that escape the route-level error boundaries. Client-side
// React render errors are not seen by window.onerror, so they need this hook to
// reach Bugsink.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error)

    // A chunk that failed while rendering is caught by React, so the window-level
    // listeners never see it. Recover here instead.
    if (isChunkLoadError(error)) recoverFromChunkLoadError()
  }, [error])

  return (
    <html lang="en">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
