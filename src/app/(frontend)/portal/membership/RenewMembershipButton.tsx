'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function RenewMembershipButton({
  businessId,
  tier,
}: {
  businessId: number
  tier: string
}) {
  const [loading, setLoading] = useState(false)

  const handleRenew = async () => {
    setLoading(true)

    try {
      // Create checkout session for renewal
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: businessId.toString(),
          tier,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Failed to renew membership:', error)
      alert('Failed to start renewal process. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleRenew} disabled={loading} className="w-full" size="lg">
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        'Renew Membership'
      )}
    </Button>
  )
}
