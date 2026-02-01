'use client'

import React, { useState } from 'react'
import { Container } from '@/design-system/Container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2 } from 'lucide-react'

export default function MailSignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!agreed) {
      setError('You must agree to receive emails to subscribe')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/mailing-list/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Container className="py-12 md:py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Successfully Subscribed!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for subscribing to the North Country Chamber newsletter. You'll receive a
            confirmation email shortly.
          </p>
          <Button asChild variant="outline">
            <a href="/">Return to Home</a>
          </Button>
        </div>
      </Container>
    )
  }

  return (
    <Container className="py-12 md:py-16">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Subscribe to Our Newsletter</h1>
          <p className="text-muted-foreground">
            Stay informed about chamber news, events, and member spotlights.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
            />
          </div>

          <div>
            <Label htmlFor="name">Name (Optional)</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="consent"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1"
              required
            />
            <label htmlFor="consent" className="text-sm text-muted-foreground">
              I agree to receive emails from North Country Chamber of Commerce. I can unsubscribe
              at any time.
            </label>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Subscribing...' : 'Subscribe'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            We respect your privacy. Your information will never be shared with third parties.
          </p>
        </form>
      </div>
    </Container>
  )
}
