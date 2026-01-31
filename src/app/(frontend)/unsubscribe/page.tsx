'use client'

import React, { useEffect, useState } from 'react'
import { Container } from '@/design-system/Container'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [alreadyUnsubscribed, setAlreadyUnsubscribed] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid unsubscribe link. No token provided.')
      setLoading(false)
      return
    }

    const unsubscribe = async () => {
      try {
        const response = await fetch(`/api/mailing-list/unsubscribe?token=${token}`, {
          method: 'POST',
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to unsubscribe')
        }

        setSuccess(true)
        setEmail(data.email || '')
        setAlreadyUnsubscribed(data.alreadyUnsubscribed || false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    unsubscribe()
  }, [token])

  if (loading) {
    return (
      <Container className="py-12 md:py-16">
        <div className="max-w-md mx-auto text-center">
          <p className="text-muted-foreground">Processing your request...</p>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-12 md:py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Unable to Unsubscribe</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="space-y-2">
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </div>
      </Container>
    )
  }

  if (success) {
    return (
      <Container className="py-12 md:py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4">
            {alreadyUnsubscribed ? 'Already Unsubscribed' : 'Successfully Unsubscribed'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {alreadyUnsubscribed
              ? "You've already been unsubscribed from our newsletter."
              : "You've been successfully removed from our mailing list. We're sorry to see you go!"}
          </p>
          {email && (
            <p className="text-sm text-muted-foreground mb-6">
              Email: <span className="font-medium">{email}</span>
            </p>
          )}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Changed your mind? You can always{' '}
              <Link href="/mailSignup" className="text-primary hover:underline">
                re-subscribe
              </Link>
              .
            </p>
            <Button asChild variant="outline">
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </div>
      </Container>
    )
  }

  return null
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <Container className="py-12 md:py-16">
          <div className="max-w-md mx-auto text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </Container>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  )
}
