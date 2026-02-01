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
    logo: null as File | null,
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData({
      ...formData,
      logo: file,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create FormData for file upload
      const submitFormData = new FormData()
      submitFormData.append('businessName', formData.businessName)
      submitFormData.append('contactName', formData.contactName)
      submitFormData.append('email', formData.email)
      submitFormData.append('phone', formData.phone)
      submitFormData.append('address', formData.address)
      submitFormData.append('city', formData.city)
      submitFormData.append('state', formData.state)
      submitFormData.append('zipCode', formData.zipCode)
      submitFormData.append('website', formData.website)
      submitFormData.append('description', formData.description)
      submitFormData.append('tier', formData.tier)
      submitFormData.append('categories', formData.categories.join(','))

      if (formData.logo) {
        submitFormData.append('logo', formData.logo)
      }

      // Submit application
      const response = await fetch('/api/apply-membership', {
        method: 'POST',
        body: submitFormData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit application')
      }

      const result = await response.json()

      // Redirect to success page with tier info
      window.location.href = `/join/apply/success?tier=${encodeURIComponent(result.tier)}&price=${result.tierPrice}`
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

                  <div>
                    <Label htmlFor="logo">Business Logo</Label>
                    <Input
                      id="logo"
                      name="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional: Upload your business logo (PNG, JPG, or SVG)
                    </p>
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
                    {loading ? 'Submitting Application...' : 'Submit Application'}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Your application will be reviewed by chamber staff. You&apos;ll receive payment instructions via email once approved.
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
