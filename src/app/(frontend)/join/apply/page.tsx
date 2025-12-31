'use client'

import React, { useState, useEffect } from 'react'
import { Suspense } from 'react'
import { Container } from '@/design-system/Container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function MembershipApplicationForm() {
  const searchParams = useSearchParams()
  const tierFromUrl = searchParams.get('tier')
  const canceled = searchParams.get('canceled')

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [tiers, setTiers] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'VT',
    zipCode: '',
    website: '',
    description: '',
    tier: tierFromUrl || '',
    categories: [] as string[],
  })

  // Fetch tiers and categories on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch membership tiers
        const tiersResponse = await fetch('/api/globals/membershipTiers')
        const tiersData = await tiersResponse.json()
        const activeTiers = tiersData?.tiers?.filter((t: any) => t.active) || []
        setTiers(activeTiers)

        // Set default tier if not from URL
        if (!tierFromUrl && activeTiers.length > 0) {
          setFormData((prev) => ({ ...prev, tier: activeTiers[0].slug }))
        }

        // Fetch categories
        const categoriesResponse = await fetch('/api/categories?limit=100')
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData?.docs || [])
      } catch (err) {
        console.error('Failed to fetch form data:', err)
      } finally {
        setLoadingData(false)
      }
    }

    fetchData()
  }, [tierFromUrl])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // First, create the business in Payload
      const createBusinessResponse = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.businessName,
          description: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [{ type: 'text', text: formData.description }],
                },
              ],
            },
          },
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          membershipStatus: 'inactive', // Will be activated after payment
          category: formData.categories.map((id) => parseInt(id)),
        }),
      })

      if (!createBusinessResponse.ok) {
        throw new Error('Failed to create business profile')
      }

      const { doc: business } = await createBusinessResponse.json()

      // Create Stripe checkout session
      const checkoutResponse = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: business.id,
          tier: formData.tier,
        }),
      })

      if (!checkoutResponse.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await checkoutResponse.json()

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-16">
      <Container>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/join" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to membership tiers
            </Link>
            <h1 className="text-4xl font-bold mt-4 mb-2">Membership Application</h1>
            <p className="text-muted-foreground">
              Complete the form below to join the North Country Chamber of Commerce.
            </p>
          </div>

          {canceled && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Payment was canceled. You can try again when you&apos;re ready.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {loadingData ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading form...</p>
              </div>
            ) : (
              <>
                {/* Membership Tier */}
                <div>
                  <Label htmlFor="tier">Membership Tier *</Label>
                  <Select
                    value={formData.tier}
                    onValueChange={(value) => handleSelectChange('tier', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiers.map((tier) => (
                        <SelectItem key={tier.slug} value={tier.slug}>
                          {tier.name} - ${tier.annualPrice}/year
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Business Information */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Business Information</h2>

                  <div>
                    <Label htmlFor="category">Business Category *</Label>
                    <Select
                      value={formData.categories[0] || ''}
                      onValueChange={(value) => setFormData({ ...formData, categories: [value] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      You can add more categories after signup
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Business Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Tell us about your business..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Contact Information</h2>

                  <div>
                    <Label htmlFor="contactName">Contact Name *</Label>
                    <Input
                      id="contactName"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Business Address</h2>

                  <div>
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2 md:col-span-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="zipCode">ZIP Code *</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? 'Processing...' : 'Proceed to Payment'}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    You&apos;ll be redirected to Stripe to complete your payment securely.
                  </p>
                </div>
              </>
            )}
          </form>
        </div>
      </Container>
    </div>
  )
}

export default function MembershipApplicationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-16">
          <Container>
            <div className="max-w-2xl mx-auto text-center py-8">
              <p className="text-muted-foreground">Loading application form...</p>
            </div>
          </Container>
        </div>
      }
    >
      <MembershipApplicationForm />
    </Suspense>
  )
}
