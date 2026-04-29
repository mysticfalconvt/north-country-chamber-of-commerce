'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
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
import { LocationPicker } from '@/components/LocationPicker'
import { AlertCircle, CheckCircle, Upload, X } from 'lucide-react'

type Tier = { slug: string; name: string; annualPrice: number }
type Category = { id: number; name: string }

const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export default function CreateBusinessForm({
  tiers,
  categories,
}: {
  tiers: Tier[]
  categories: Category[]
}) {
  const [formData, setFormData] = useState({
    contactName: '',
    email: '',
    businessName: '',
    tier: tiers[0]?.slug || '',
    description: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: 'VT',
    zipCode: '',
    latitude: '',
    longitude: '',
    hoursOfOperation: '',
  })
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverImageInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ businessId: number; businessSlug?: string } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
    setError('')
  }

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
    setError('')
  }

  const handleImageChange =
    (
      setFile: (f: File | null) => void,
      setPreview: (url: string | null) => void,
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      if (!VALID_IMAGE_TYPES.includes(file.type)) {
        setError('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.')
        return
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setError('File too large. Maximum size is 5MB.')
        return
      }
      setFile(file)
      setPreview(URL.createObjectURL(file))
      setError('')
    }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  const removeCoverImage = () => {
    setCoverImageFile(null)
    setCoverImagePreview(null)
    if (coverImageInputRef.current) coverImageInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (selectedCategories.length === 0) {
      setError('Please select at least one category.')
      return
    }

    setLoading(true)

    try {
      const submit = new FormData()
      submit.append('contactName', formData.contactName)
      submit.append('email', formData.email)
      submit.append('businessName', formData.businessName)
      submit.append('tier', formData.tier)
      submit.append('description', formData.description)
      submit.append('phone', formData.phone)
      submit.append('website', formData.website)
      submit.append('address', formData.address)
      submit.append('city', formData.city)
      submit.append('state', formData.state)
      submit.append('zipCode', formData.zipCode)
      submit.append('hoursOfOperation', formData.hoursOfOperation)
      submit.append('categories', selectedCategories.join(','))

      const hasCoords = formData.latitude && formData.longitude
      submit.append(
        'coordinates',
        JSON.stringify(
          hasCoords
            ? {
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
              }
            : { latitude: null, longitude: null },
        ),
      )

      if (logoFile) submit.append('logo', logoFile)
      if (coverImageFile) submit.append('coverImage', coverImageFile)

      const response = await fetch('/api/admin/create-business', {
        method: 'POST',
        body: submit,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create business')
      }

      setResult({ businessId: data.businessId, businessSlug: data.businessSlug })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Business Created</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The new member has been emailed login credentials and can now access their portal.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {result.businessSlug && (
            <Link
              href={`/businesses/${result.businessSlug}`}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              View public page
            </Link>
          )}
          <Link
            href={`/admin/collections/businesses/${result.businessId}`}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Open in CMS
          </Link>
          <button
            type="button"
            onClick={() => {
              setResult(null)
              setFormData({
                contactName: '',
                email: '',
                businessName: '',
                tier: tiers[0]?.slug || '',
                description: '',
                phone: '',
                website: '',
                address: '',
                city: '',
                state: 'VT',
                zipCode: '',
                latitude: '',
                longitude: '',
                hoursOfOperation: '',
              })
              setSelectedCategories([])
              removeLogo()
              removeCoverImage()
            }}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Create another
          </button>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6"
    >
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Account / Contact */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Member Account
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contactName">Contact Name *</Label>
            <Input
              id="contactName"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Login email for the new member; also used as the business&apos;s public contact
              email.
            </p>
          </div>
        </div>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* Business Basics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Business</h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="tier">Membership Tier *</Label>
            <Select
              value={formData.tier}
              onValueChange={(value) => handleSelectChange('tier', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a tier" />
              </SelectTrigger>
              <SelectContent>
                {tiers.map((t) => (
                  <SelectItem key={t.slug} value={t.slug}>
                    {t.name} - ${t.annualPrice}/year
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Categories *</Label>
            <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-md max-h-60 overflow-y-auto">
              {categories.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(c.id)}
                    onChange={() => toggleCategory(c.id)}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Business Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="mt-1"
              placeholder="Tell customers about this business..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Business Phone *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
                className="mt-1"
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
                className="mt-1"
                placeholder="https://"
              />
            </div>
          </div>
        </div>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* Images */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Business Images
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Business Logo</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Square image works best (e.g., 200x200px)
            </p>
            <div className="mt-1">
              {logoPreview ? (
                <div className="relative inline-block">
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    width={120}
                    height={120}
                    className="rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-500 mt-1">Upload</span>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageChange(setLogoFile, setLogoPreview)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <Label>Cover Image</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Wide image for page header (e.g., 1200x400px)
            </p>
            <div className="mt-1">
              {coverImagePreview ? (
                <div className="relative inline-block">
                  <Image
                    src={coverImagePreview}
                    alt="Cover image preview"
                    width={200}
                    height={100}
                    className="rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={removeCoverImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-48 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-500 mt-1">Upload</span>
                  <input
                    ref={coverImageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageChange(setCoverImageFile, setCoverImagePreview)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* Address */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Address</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                className="mt-1"
                placeholder="VT"
              />
            </div>
            <div>
              <Label htmlFor="zipCode">ZIP *</Label>
              <Input
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                required
                className="mt-1"
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Map Location
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Use &quot;Lookup Address&quot; to find this location, or click &quot;Edit
              Location&quot; to drop the pin manually. If you skip this, the location will be
              geocoded automatically from the address above on save.
            </p>
            <LocationPicker
              latitude={formData.latitude ? parseFloat(formData.latitude) : null}
              longitude={formData.longitude ? parseFloat(formData.longitude) : null}
              onCoordinatesChange={(lat, lng) => {
                setFormData((prev) => ({
                  ...prev,
                  latitude: lat.toString(),
                  longitude: lng.toString(),
                }))
                setError('')
              }}
              address={formData.address}
              city={formData.city}
              state={formData.state}
              zipCode={formData.zipCode}
            />
          </div>
        </div>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

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

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading} size="lg">
          {loading ? 'Creating...' : 'Create Business & Send Login Email'}
        </Button>
      </div>
    </form>
  )
}
