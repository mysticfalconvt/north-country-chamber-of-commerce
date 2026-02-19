import type { CollectionConfig } from 'payload'

import { chamberStaffOrAdmin } from '../../access/chamberStaffOrAdmin'
import { isAdminOrOwner } from '../../access/isAdminOrOwner'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { adminPanelAccess } from '../../access/adminPanelAccess'
import { autoTranslate } from './hooks'

export const Businesses: CollectionConfig = {
  slug: 'businesses',
  access: {
    admin: adminPanelAccess,
    // Allow unauthenticated users to create during self-registration
    create: () => true,
    delete: chamberStaffOrAdmin,
    read: authenticatedOrPublished,
    update: isAdminOrOwner,
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation, context }) => {
        // Auto-link business to the user creating it (for self-registration)
        if (operation === 'create' && req.user?.role === 'business_member' && !data.owner) {
          data.owner = req.user.id
          req.payload.logger.info(`Auto-linked business ${data.name} to user ${req.user.id}`)
        }

        // Auto-geocode address to get coordinates
        // Skip geocoding if called from membership hook to prevent hangs
        if ((operation === 'create' || operation === 'update') && !context?.skipMembershipUpdate) {
          const hasAddressData = data.address || data.city || data.state || data.zipCode
          const hasCoordinates = data.coordinates?.latitude && data.coordinates?.longitude

          // Only geocode if we have address data but no coordinates
          if (hasAddressData && !hasCoordinates) {
            const addressParts = [data.address, data.city, data.state, data.zipCode].filter(Boolean)

            if (addressParts.length > 0) {
              try {
                // Use Nominatim (OpenStreetMap) geocoding API with timeout
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

                // Build structured query parameters for better results
                const params = new URLSearchParams({
                  format: 'json',
                  limit: '1',
                  country: 'USA',
                })

                // Add available address components
                if (data.address) params.append('street', data.address)
                if (data.city) params.append('city', data.city)
                if (data.state) params.append('state', data.state)
                if (data.zipCode) params.append('postalcode', data.zipCode)

                const geocodeUrl = `https://nominatim.openstreetmap.org/search?${params.toString()}`
                const response = await fetch(geocodeUrl, {
                  headers: {
                    'User-Agent':
                      'North Country Chamber of Commerce (contact@northcountrychamber.com)',
                  },
                  signal: controller.signal,
                })

                clearTimeout(timeoutId)
                let results = await response.json()

                // If no results with structured query, try fallback with just city/state
                if ((!results || results.length === 0) && data.city && data.state) {
                  const fallbackParams = new URLSearchParams({
                    format: 'json',
                    limit: '1',
                    q: `${data.city}, ${data.state}, USA`,
                  })
                  const fallbackUrl = `https://nominatim.openstreetmap.org/search?${fallbackParams.toString()}`
                  const fallbackResponse = await fetch(fallbackUrl, {
                    headers: {
                      'User-Agent':
                        'North Country Chamber of Commerce (contact@northcountrychamber.com)',
                    },
                    signal: controller.signal,
                  })
                  results = await fallbackResponse.json()
                }

                if (results && results.length > 0) {
                  const { lat, lon } = results[0]

                  if (!data.coordinates) {
                    data.coordinates = {}
                  }

                  data.coordinates.latitude = parseFloat(lat)
                  data.coordinates.longitude = parseFloat(lon)

                  req.payload.logger.info(`Geocoded ${data.name}: ${lat}, ${lon}`)
                }
              } catch (error) {
                req.payload.logger.error(`Failed to geocode ${data.name}: ${error}`)
              }
            }
          }
        }

        return data
      },
    ],
    afterChange: [
      autoTranslate,
      async ({ doc, req, operation, context }) => {
        // Prevent infinite loops from cascading hooks
        if (context?.skipUserUpdate) {
          return
        }

        // When a business is created by a business_member, link it back to their user account
        if (operation === 'create' && doc.owner && req.user?.role === 'business_member') {
          try {
            await req.payload.update({
              collection: 'users',
              id: doc.owner,
              data: {
                business: doc.id,
              },
              context: {
                skipBusinessUpdate: true,
              },
            })

            req.payload.logger.info(`Linked business ${doc.id} to user ${doc.owner}`)
          } catch (error) {
            req.payload.logger.error(`Failed to link business to user: ${error}`)
          }
        }
      },
    ],
  },
  admin: {
    defaultColumns: ['name', 'category', 'approvalStatus', 'membershipStatus', 'memberSince'],
    useAsTitle: 'name',
    description: 'Member business directory listings',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Business name (not localized)',
      },
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User account that manages this business (optional)',
        condition: (data, siblingData, { user }) => {
          // Only show to admin and chamber staff
          return user?.role === 'admin' || user?.role === 'chamber_staff'
        },
      },
      access: {
        read: ({ req: { user } }) => {
          // Only admin and chamber staff can see who owns a business
          return user?.role === 'admin' || user?.role === 'chamber_staff'
        },
        create: ({ req: { user } }) => {
          return user?.role === 'admin' || user?.role === 'chamber_staff'
        },
        update: ({ req: { user } }) => {
          return user?.role === 'admin' || user?.role === 'chamber_staff'
        },
      },
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      localized: true,
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      required: true,
      admin: {
        description: 'Business categories',
      },
    },
    {
      name: 'address',
      type: 'text',
      admin: {
        description: 'Street address',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'city',
          type: 'text',
          admin: {
            description: 'City or town',
          },
        },
        {
          name: 'state',
          type: 'text',
          defaultValue: 'VT',
          admin: {
            description: 'State (e.g., VT)',
          },
        },
        {
          name: 'zipCode',
          type: 'text',
          admin: {
            description: 'ZIP code',
          },
        },
      ],
    },
    {
      type: 'group',
      name: 'coordinates',
      label: 'Map Coordinates',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'latitude',
              type: 'number',
              admin: {
                description: 'Latitude (e.g., 44.9369)',
              },
            },
            {
              name: 'longitude',
              type: 'number',
              admin: {
                description: 'Longitude (e.g., -72.2052)',
              },
            },
          ],
        },
      ],
      admin: {
        description: 'Coordinates for map display. Leave empty to geocode from address.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'phone',
          type: 'text',
        },
        {
          name: 'email',
          type: 'email',
        },
      ],
    },
    {
      name: 'website',
      type: 'text',
      admin: {
        description: 'Full URL including https://',
      },
    },
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'Twitter/X', value: 'twitter' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'YouTube', value: 'youtube' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'memberSince',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'monthOnly',
            },
            description: 'When membership started',
          },
        },
        {
          name: 'membershipExpires',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayOnly',
            },
            description: 'Membership expiration date',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'membershipTier',
          type: 'text',
          admin: {
            description: 'Membership tier slug (set automatically after payment)',
          },
        },
        {
          name: 'featured',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Show on homepage',
          },
        },
      ],
    },
    {
      name: 'advertisingSlots',
      type: 'array',
      label: 'Advertising Slots',
      admin: {
        description: 'Gallery images, videos, or promotional content for business page',
      },
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          options: [
            { label: 'Image', value: 'image' },
            { label: 'Video URL', value: 'video' },
            { label: 'Offer/Promotion', value: 'offer' },
          ],
        },
        {
          name: 'media',
          type: 'upload',
          relationTo: 'media',
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'image',
          },
        },
        {
          name: 'videoUrl',
          type: 'text',
          admin: {
            description: 'YouTube or Vimeo URL',
            condition: (data, siblingData) => siblingData?.type === 'video',
          },
        },
        {
          name: 'offerTitle',
          type: 'text',
          localized: true,
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'offer',
          },
        },
        {
          name: 'offerDescription',
          type: 'richText',
          localized: true,
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'offer',
          },
        },
        {
          name: 'caption',
          type: 'text',
          localized: true,
          admin: {
            description: 'Optional caption for this slot',
          },
        },
      ],
    },
    {
      name: 'hoursOfOperation',
      type: 'richText',
      localized: true,
      admin: {
        description: 'Business hours (e.g., Mon-Fri: 9am-5pm)',
      },
    },
    {
      name: 'membershipStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Pending', value: 'pending' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Membership status',
      },
    },
    {
      name: 'paymentStatus',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Overdue', value: 'overdue' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Has this business paid their membership dues?',
      },
    },
    {
      name: 'approvalStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Approval status for new business applications',
      },
    },
    {
      name: 'approvedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        description: 'Admin who approved this business',
      },
    },
    {
      name: 'approvedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'When this business was approved',
      },
    },
    {
      name: 'applicationDate',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'When application was submitted',
      },
    },
    {
      name: 'rejectionReason',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        description: 'Reason for rejection (if applicable)',
        condition: (data) => data.approvalStatus === 'rejected',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ value, data, operation }) => {
            if (operation === 'create' || !value) {
              const name = data?.name || ''
              return name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
            }
            return value
          },
        ],
      },
    },
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
    },
  },
}
