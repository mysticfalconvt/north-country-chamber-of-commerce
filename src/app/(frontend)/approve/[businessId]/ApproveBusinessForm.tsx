'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
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

// Extract plain text from a Lexical richText document
function extractTextFromLexical(richText: any): string {
  if (!richText || !richText.root || !richText.root.children) return ''
  const extractText = (node: any): string => {
    if (node.type === 'text') return node.text || ''
    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractText).join('')
    }
    return ''
  }
  return richText.root.children.map(extractText).join('\n').trim()
}

export default function ApproveBusinessForm({
  business,
  owner,
  tiers,
  categories,
}: {
  business: any
  owner: { id: number; name: string; email: string } | null
  tiers: Tier[]
  categories: Category[]
}) {
  const router = useRouter()

  const isAlreadyApproved = business.approvalStatus === 'approved'

  const existingLogoUrl =
    business.logo && typeof business.logo === 'object' && business.logo.url
      ? business.logo.url
      : null
  const existingCoverUrl =
    business.coverImage && typeof business.coverImage === 'object' && business.coverImage.url
      ? business.coverImage.url
      : null

  const [formData, setFormData] = useState({
    ownerName: owner?.name || '',
    ownerEmail: owner?.email || '',
    name: business.name || '',
    tier: business.membershipTier || tiers[0]?.slug || '',
    description: extractTextFromLexical(business.description),
    phone: business.phone || '',
    email: business.email || '',
    website: business.website || '',
    address: business.address || '',
    city: business.city || '',
    state: business.state || 'VT',
    zipCode: business.zipCode || '',
    latitude:
      business.coordinates?.latitude != null ? String(business.coordinates.latitude) : '',
    longitude:
      business.coordinates?.longitude != null ? String(business.coordinates.longitude) : '',
    hoursOfOperation: extractTextFromLexical(business.hoursOfOperation),
  })

  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    Array.isArray(business.category)
      ? business.category
          .map((c: any) => (typeof c === 'object' ? c.id : c))
          .filter((id: any) => typeof id === 'number')
      : [],
  )

  // Logo state: preview shows existing image until changed/removed
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(existingLogoUrl)
  const [removeLogo, setRemoveLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(existingCoverUrl)
  const [removeCoverImage, setRemoveCoverImage] = useState(false)
  const coverImageInputRef = useRef<HTMLInputElement>(null)

  const [error, setError] = useState('')
  const [savingAction, setSavingAction] = useState<'save' | 'approve' | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSelectChange = (nameKey: string, value: string) => {
    setFormData({ ...formData, [nameKey]: value })
    setError('')
  }

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
    setError('')
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setRemoveLogo(false)
    setError('')
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setCoverImageFile(file)
    setCoverImagePreview(URL.createObjectURL(file))
    setRemoveCoverImage(false)
    setError('')
  }

  const clearLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setRemoveLogo(true)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  const clearCoverImage = () => {
    setCoverImageFile(null)
    setCoverImagePreview(null)
    setRemoveCoverImage(true)
    if (coverImageInputRef.current) coverImageInputRef.current.value = ''
  }

  const submit = async (action: 'save' | 'approve') => {
    setError('')
    setSuccessMessage('')

    if (!formData.name.trim()) {
      setError('Business name is required.')
      return
    }
    if (selectedCategories.length === 0) {
      setError('Please select at least one category.')
      return
    }

    if (action === 'approve') {
      const confirmed = confirm(
        `Are you sure you want to approve ${formData.name}?\n\nThis will:\n- Save your edits\n- Set approval status to "Approved"\n- Set membership status to "Active"\n- Set payment status to "Paid"\n- Set membership for 1 year\n- Email login credentials only if a new owner account is being created`,
      )
      if (!confirmed) return
    }

    setSavingAction(action)

    try {
      const body = new FormData()
      body.append('businessId', String(business.id))
      body.append('action', action)
      body.append('ownerName', formData.ownerName)
      body.append('ownerEmail', formData.ownerEmail)
      body.append('name', formData.name)
      body.append('tier', formData.tier)
      body.append('description', formData.description)
      body.append('phone', formData.phone)
      body.append('email', formData.email)
      body.append('website', formData.website)
      body.append('address', formData.address)
      body.append('city', formData.city)
      body.append('state', formData.state)
      body.append('zipCode', formData.zipCode)
      body.append('hoursOfOperation', formData.hoursOfOperation)
      body.append('categories', selectedCategories.join(','))

      const hasCoords = formData.latitude && formData.longitude
      body.append(
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

      if (logoFile) body.append('logo', logoFile)
      if (coverImageFile) body.append('coverImage', coverImageFile)
      if (removeLogo) body.append('removeLogo', 'true')
      if (removeCoverImage) body.append('removeCoverImage', 'true')

      const response = await fetch('/api/admin/business-review', {
        method: 'POST',
        credentials: 'include',
        body,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save changes')
      }

      setSuccessMessage(
        action === 'approve' ? 'Business approved successfully!' : 'Changes saved.',
      )
      setTimeout(() => {
        router.refresh()
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSavingAction(null)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
      {/* Status banner */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            business.approvalStatus === 'approved'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : business.approvalStatus === 'rejected'
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
          }`}
        >
          {business.approvalStatus === 'approved'
            ? 'Approved'
            : business.approvalStatus === 'rejected'
              ? 'Rejected'
              : 'Pending Approval'}
        </span>
        {isAlreadyApproved && business.approvedAt && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Approved on{' '}
            {new Date(business.approvedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900 dark:text-red-200">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-900 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      {/* Owner / Account */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Owner / Account
        </h2>
        {owner ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Current owner: <span className="font-medium">{owner.name}</span> ({owner.email})
          </p>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            No owner is currently linked to this business.
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ownerName">Owner Name</Label>
            <Input
              id="ownerName"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="ownerEmail">Owner Login Email</Label>
            <Input
              id="ownerEmail"
              name="ownerEmail"
              type="email"
              value={formData.ownerEmail}
              onChange={handleChange}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              If this email matches an existing user we&apos;ll link them; otherwise we&apos;ll
              create an account and email them a login.
            </p>
          </div>
        </div>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* Business */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Business</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Business Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="tier">Membership Tier</Label>
            <Select value={formData.tier} onValueChange={(value) => handleSelectChange('tier', value)}>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="phone">Business Phone</Label>
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
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
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
                    style={{ maxHeight: '120px', width: 'auto' }}
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={clearLogo}
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
                    onChange={handleLogoChange}
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
                    style={{ maxHeight: '100px', width: 'auto' }}
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={clearCoverImage}
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
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* Address + Map */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Address</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="mt-1"
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
              <Label htmlFor="zipCode">ZIP</Label>
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
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Map Location</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Use &quot;Lookup Address&quot; to find this location, or click &quot;Edit
              Location&quot; to drop the pin manually. If you clear this, the location will be
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

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={savingAction !== null}
          onClick={() => submit('save')}
        >
          {savingAction === 'save' ? 'Saving...' : 'Save Changes'}
        </Button>
        {!isAlreadyApproved && (
          <Button
            type="button"
            size="lg"
            className="bg-green-600 hover:bg-green-700"
            disabled={savingAction !== null}
            onClick={() => submit('approve')}
          >
            {savingAction === 'approve' ? 'Approving...' : 'Save & Approve Business'}
          </Button>
        )}
      </div>
    </div>
  )
}
