'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Container } from '@/design-system/Container'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const tier = searchParams.get('tier') || 'membership'
  const price = searchParams.get('price') || '0'

  return (
    <div className="min-h-screen py-16">
      <Container>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Application Submitted!</h1>
            <p className="text-lg text-muted-foreground">
              Thank you for your interest in joining the North Country Chamber of Commerce.
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">What Happens Next?</h2>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Our chamber staff will review your application</li>
                <li>You&apos;ll receive an email notification once your application is approved</li>
                <li>The email will include your login credentials for the member portal</li>
                <li>After approval, send your payment via check to complete your membership</li>
              </ol>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
              <div className="bg-muted p-4 rounded-md space-y-2">
                <p>
                  <strong>Membership Tier:</strong> {tier}
                </p>
                <p>
                  <strong>Annual Dues:</strong> ${price}
                </p>
                <p className="pt-2 border-t">
                  <strong>Mail Check To:</strong>
                  <br />
                  Vermont&apos;s North Country Chamber of Commerce
                  <br />
                  246 Causeway
                  <br />
                  Causeway, Newport, VT 05855
                </p>
                <p className="text-sm text-muted-foreground pt-2">
                  Please include your business name in the memo line of the check.
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-2">Questions?</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about your application or membership, please don&apos;t
                hesitate to contact us.
              </p>
              <div className="flex gap-4">
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Back to Home
                  </Button>
                </Link>
                <Link href="/businesses" className="flex-1">
                  <Button variant="outline" className="w-full">
                    View Member Directory
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Application Reference: You&apos;ll receive a confirmation email with your application
              details.
            </p>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-16">
          <Container>
            <div className="max-w-2xl mx-auto text-center py-8">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </Container>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
