'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ApproveButtonProps {
  businessId: number
  businessName: string
}

export function ApproveButton({ businessId, businessName }: ApproveButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleApprove = async () => {
    const confirmed = confirm(
      `Are you sure you want to approve ${businessName}?\n\nThis will:\n- Set approval status to "Approved"\n- Set membership status to "Active"\n- Set payment status to "Paid"\n- Set membership for 1 year\n- Send a welcome email to the business owner`
    )

    if (!confirmed) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/approve-business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          businessId,
          action: 'approve',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to approve business')
      }

      setSuccess(true)

      // Refresh the page data after a short delay
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Approved Successfully!
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <button
        onClick={handleApprove}
        disabled={loading}
        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Approving...
          </>
        ) : (
          <>
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Approve Business
          </>
        )}
      </button>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-2 text-center">{error}</p>
      )}
    </div>
  )
}
