'use client'

import * as Sentry from '@sentry/nextjs'
import { useState } from 'react'

export default function BugsinkTestButtons() {
  const [sent, setSent] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-3 items-start">
      <button
        type="button"
        className="rounded-md bg-gray-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-gray-900"
        onClick={() => {
          Sentry.captureException(new Error('Bugsink test: captured browser exception'))
          setSent('Captured a handled browser exception.')
        }}
      >
        Send handled browser error
      </button>

      <button
        type="button"
        className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white"
        onClick={() => {
          throw new Error('Bugsink test: uncaught browser exception')
        }}
      >
        Throw uncaught browser error
      </button>

      <button
        type="button"
        className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white"
        onClick={async () => {
          const res = await fetch('/api/bugsink-test', { method: 'POST' })
          setSent(
            res.ok
              ? 'Server route responded OK -- unexpected, it should have thrown.'
              : `Server threw as expected (HTTP ${res.status}).`,
          )
        }}
      >
        Throw server-side error
      </button>

      {sent && <p className="text-sm text-gray-600 dark:text-gray-400">{sent}</p>}
    </div>
  )
}
