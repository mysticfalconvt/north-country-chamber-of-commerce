'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { AlertCircle } from 'lucide-react'

export default function BenefitForm({ benefit }: { benefit?: any }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: benefit
      ? typeof benefit.title === 'string'
        ? benefit.title
        : benefit.title?.en || ''
      : '',
    description: benefit
      ? typeof benefit.description === 'string'
        ? benefit.description
        : benefit.description?.root?.children?.[0]?.children?.[0]?.text || ''
      : '',
    discountValue: benefit?.discountValue || '',
    externalUrl: benefit?.externalUrl || '',
    linkText: benefit?.linkText || '',
    code: benefit?.code || '',
  })

  const [startDate, setStartDate] = useState<Date | undefined>(
    benefit?.startDate ? new Date(benefit.startDate) : undefined,
  )
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(
    benefit?.expirationDate ? new Date(benefit.expirationDate) : undefined,
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Title is required')
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required')
      }

      // Convert to Lexical format
      const description = {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', text: formData.description }],
            },
          ],
        },
      }

      const benefitData: any = {
        ...(benefit && { id: benefit.id }),
        title: formData.title,
        description,
        discountValue: formData.discountValue || null,
        externalUrl: formData.externalUrl || null,
        linkText: formData.linkText || null,
        code: formData.code || null,
        startDate: startDate ? startDate.toISOString() : null,
        expirationDate: expirationDate ? expirationDate.toISOString() : null,
        _status: 'published',
      }

      const response = await fetch('/api/portal/benefits', {
        method: benefit ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(benefitData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save benefit')
      }

      router.push('/portal/benefits')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-900 dark:text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div>
          <Label htmlFor="title">Benefit Title *</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="mt-1"
            placeholder="e.g., 10% Off Your First Purchase"
          />
        </div>

        <div>
          <Label htmlFor="discountValue">Discount Value</Label>
          <Input
            id="discountValue"
            name="discountValue"
            value={formData.discountValue}
            onChange={handleChange}
            className="mt-1"
            placeholder="e.g., 10% off, $5 off, Buy 1 Get 1 Free"
          />
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="mt-1"
            placeholder="Full description of the offer including any terms and conditions..."
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Start Date (optional)</Label>
            <DatePicker
              date={startDate}
              onDateChange={setStartDate}
              placeholder="When offer starts"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Leave blank if offer is already active
            </p>
          </div>

          <div>
            <Label>Expiration Date (optional)</Label>
            <DatePicker
              date={expirationDate}
              onDateChange={setExpirationDate}
              placeholder="When offer expires"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Leave blank if offer has no expiration
            </p>
          </div>
        </div>

        {/* Promo Code */}
        <div>
          <Label htmlFor="code">Promo Code (optional)</Label>
          <Input
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            className="mt-1"
            placeholder="e.g., SAVE10"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Discount or promo code if applicable
          </p>
        </div>

        {/* External Link */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="externalUrl">External URL (optional)</Label>
            <Input
              id="externalUrl"
              name="externalUrl"
              type="url"
              value={formData.externalUrl}
              onChange={handleChange}
              className="mt-1"
              placeholder="https://..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Link to redeem online or more info
            </p>
          </div>

          <div>
            <Label htmlFor="linkText">Link Text (optional)</Label>
            <Input
              id="linkText"
              name="linkText"
              value={formData.linkText}
              onChange={handleChange}
              className="mt-1"
              placeholder="e.g., Redeem Online, Learn More"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Text to display for the link button
            </p>
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : benefit ? 'Update Benefit' : 'Create Benefit'}
          </Button>
        </div>
      </form>
    </div>
  )
}
