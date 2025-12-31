import React from 'react'
import { Container } from '@/design-system/Container'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function MembershipSuccessPage() {
  return (
    <div className="min-h-screen py-16">
      <Container>
        <div className="max-w-2xl mx-auto text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />

          <h1 className="text-4xl font-bold mb-4">Welcome to the Chamber!</h1>

          <p className="text-lg text-muted-foreground mb-8">
            Your membership application has been successfully submitted and your payment has been
            processed. You&apos;ll receive a confirmation email shortly with next steps.
          </p>

          <div className="bg-muted/50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">What&apos;s Next?</h2>
            <ul className="text-left space-y-3 max-w-md mx-auto">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>Check your email for your login credentials to access the member portal</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                <span>Complete your business profile and upload your logo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>Explore member benefits and start networking with other businesses</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/businesses">View Business Directory</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">Return Home</Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-8">
            Questions?{' '}
            <Link href="/contact" className="underline hover:text-foreground">
              Contact us
            </Link>{' '}
            anytime.
          </p>
        </div>
      </Container>
    </div>
  )
}
