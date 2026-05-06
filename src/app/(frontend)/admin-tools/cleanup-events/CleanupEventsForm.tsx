'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CleanupEventsForm({ count }: { count: number }) {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState<{ deleted: number; failed: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setRunning(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/admin/cleanup-events', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Cleanup failed')
      }
      const data = await res.json()
      setResult({ deleted: data.deleted ?? 0, failed: data.failed ?? 0 })
      setConfirming(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cleanup failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <p className="text-gray-900 dark:text-white">
        <span className="font-semibold">{count}</span> empty event
        {count === 1 ? '' : 's'} found.
      </p>

      {result && (
        <div className="mt-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 text-sm text-green-900 dark:text-green-200">
          Deleted {result.deleted} event{result.deleted === 1 ? '' : 's'}.
          {result.failed > 0 && ` ${result.failed} could not be deleted (see server logs).`}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-900 dark:text-red-200">
          {error}
        </div>
      )}

      {count > 0 && !result && (
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={running}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              Delete {count} empty event{count === 1 ? '' : 's'}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleDelete}
                disabled={running}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {running ? 'Deleting...' : 'Yes, delete them'}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={running}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
