'use client'

import * as Sentry from '@sentry/nextjs'
import NextError from 'next/error'
import { useEffect } from 'react'

// Catches render errors that escape the route-level error boundaries. Client-side
// React render errors are not seen by window.onerror, so they need this hook to
// reach Bugsink.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
