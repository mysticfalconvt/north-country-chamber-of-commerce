'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'

export default function BusinessEditForm({ business }: { business: any }) {
  const [formData, setFormData] = useState({
    description: business.description?.root?.children?.[0]?.children?.[0]?.text || '',
    phone: business.phone || '',
    email: business.email || '',
    website: business.website || '',
    hoursOfOperation: business.hoursOfOperation?.root?.children?.[0]?.children?.[0]?.text || '',
    address: business.address || '',
    city: business.city || '',
    state: business.state || '',
    zipCode: business.zipCode || '',
    latitude: business.coordinates?.latitude?.toString() || '',
    longitude: business.coordinates?.longitude?.toString() || '',
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setSuccess(false)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError('')

    try {
      // Convert plain text to Lexical format
      const description = formData.description
        ? {
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
        : business.description

      const hoursOfOperation = formData.hoursOfOperation
        ? {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [{ type: 'text', text: formData.hoursOfOperation }],
                },
              ],
            },
          }
        : business.hoursOfOperation

      // Build coordinates object
      // If both are empty, send nulls to clear them (triggers auto-geocoding from address)
      // If values exist, send them
      const hadCoordinatesBefore =
        business.coordinates?.latitude || business.coordinates?.longitude
      const hasCoordinatesNow = formData.latitude || formData.longitude

      let coordinates: { latitude: number | null; longitude: number | null } | undefined
      if (hasCoordinatesNow) {
        // User provided coordinates
        coordinates = {
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        }
      } else if (hadCoordinatesBefore) {
        // User cleared coordinates - send nulls to trigger re-geocoding
        coordinates = { latitude: null, longitude: null }
      }
      // If there were no coordinates before and none now, don't send the field

      const response = await fetch('/api/portal/business', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          hoursOfOperation,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          coordinates,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update business')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Read-only Info */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 dark:text-blue-200">
              Some fields like business name and membership tier can only be updated by chamber
              staff. Contact us if you need to change these fields.
            </p>
          </div>
        </div>
      </div>

      {/* Read-only fields display */}
      <div className="mb-6 space-y-4">
        <div>
          <Label>Business Name</Label>
          <Input value={business.name} disabled className="mt-1" />
        </div>

        <div>
          <Label>Membership Status</Label>
          <div className="mt-1">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                business.membershipStatus === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {business.membershipStatus}
            </span>
          </div>
        </div>
      </div>

      <hr className="my-6 border-gray-200 dark:border-gray-700" />

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-green-900 dark:text-green-200">
                Business information updated successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
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

      {/* Editable Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="description">Business Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="mt-1"
            placeholder="Tell customers about your business..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            name="website"
            type="url"
            value={formData.website}
            onChange={handleChange}
            className="mt-1"
            placeholder="https://"
          />
        </div>

        <hr className="my-6 border-gray-200 dark:border-gray-700" />

        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Address</h3>

        <div>
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="mt-1"
            placeholder="123 Main St"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="mt-1"
              placeholder="VT"
            />
          </div>
          <div>
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Map Coordinates
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Leave blank to auto-detect from address, or enter manually for precise map placement.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={handleChange}
                className="mt-1"
                placeholder="e.g., 44.9369"
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={handleChange}
                className="mt-1"
                placeholder="e.g., -72.2052"
              />
            </div>
          </div>
        </div>

        <hr className="my-6 border-gray-200 dark:border-gray-700" />

        <div>
          <Label htmlFor="hoursOfOperation">Hours of Operation</Label>
          <Textarea
            id="hoursOfOperation"
            name="hoursOfOperation"
            value={formData.hoursOfOperation}
            onChange={handleChange}
            rows={3}
            className="mt-1"
            placeholder="Mon-Fri: 9am-5pm&#10;Sat: 10am-2pm&#10;Sun: Closed"
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
