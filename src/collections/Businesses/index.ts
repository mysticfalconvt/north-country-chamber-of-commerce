import type { CollectionConfig } from 'payload'

import { chamberStaffOrAdmin } from '../../access/chamberStaffOrAdmin'
import { isAdminOrOwner } from '../../access/isAdminOrOwner'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'

export const Businesses: CollectionConfig = {
  slug: 'businesses',
  access: {
    create: chamberStaffOrAdmin,
    delete: chamberStaffOrAdmin,
    read: authenticatedOrPublished,
    update: isAdminOrOwner,
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Auto-geocode address to get coordinates
        if (operation === 'create' || operation === 'update') {
          const hasAddressData = data.address || data.city || data.state || data.zipCode
          const hasCoordinates = data.coordinates?.latitude && data.coordinates?.longitude

          // Only geocode if we have address data but no coordinates
          if (hasAddressData && !hasCoordinates) {
            const addressParts = [
              data.address,
              data.city,
              data.state,
              data.zipCode,
            ].filter(Boolean)

            if (addressParts.length > 0) {
              const addressString = addressParts.join(', ')

              try {
                // Use Nominatim (OpenStreetMap) geocoding API
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1`,
                  {
                    headers: {
                      'User-Agent': 'North Country Chamber of Commerce',
                    },
                  },
                )

                const results = await response.json()

                if (results && results.length > 0) {
                  const { lat, lon } = results[0]

                  if (!data.coordinates) {
                    data.coordinates = {}
                  }

                  data.coordinates.latitude = parseFloat(lat)
                  data.coordinates.longitude = parseFloat(lon)

                  req.payload.logger.info(
                    `Geocoded address for ${data.name}: ${lat}, ${lon}`,
                  )
                }
              } catch (error) {
                req.payload.logger.error(
                  `Failed to geocode address for ${data.name}: ${error}`,
                )
              }
            }
          }
        }

        return data
      },
    ],
  },
  admin: {
    defaultColumns: ['name', 'category', 'membershipStatus', 'memberSince'],
    useAsTitle: 'name',
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
          type: 'select',
          options: [
            { label: 'Basic', value: 'basic' },
            { label: 'Premium', value: 'premium' },
            { label: 'Featured', value: 'featured' },
          ],
          defaultValue: 'basic',
          admin: {
            description: 'Membership level determines benefits',
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
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Membership status',
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
