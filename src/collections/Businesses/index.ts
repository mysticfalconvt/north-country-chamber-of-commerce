import type { CollectionConfig } from 'payload'

import { chamberStaffOrAdmin } from '../../access/chamberStaffOrAdmin'
import { isAdminOrOwner } from '../../access/isAdminOrOwner'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { adminPanelAccess } from '../../access/adminPanelAccess'

export const Businesses: CollectionConfig = {
  slug: 'businesses',
  access: {
    admin: adminPanelAccess,
    // Allow unauthenticated users to create during self-registration
    create: true,
    delete: chamberStaffOrAdmin,
    read: authenticatedOrPublished,
    update: isAdminOrOwner,
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation, context }) => {
        req.payload.logger.info(
          `[BUSINESS beforeChange] operation=${operation}, data=${JSON.stringify({
            id: data.id,
            name: data.name,
            address: data.address,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            hasCoordinates: !!data.coordinates?.latitude,
          })}, context=${JSON.stringify(context)}`,
        )

        // Auto-link business to the user creating it (for self-registration)
        if (operation === 'create' && req.user?.role === 'business_member' && !data.owner) {
          data.owner = req.user.id
          req.payload.logger.info(`Auto-linked business ${data.name} to user ${req.user.id}`)
        }

        // Auto-geocode address to get coordinates
        // Skip geocoding if called from membership hook to prevent hangs
        if ((operation === 'create' || operation === 'update') && !context?.skipMembershipUpdate) {
          req.payload.logger.info('[BUSINESS beforeChange] Checking if geocoding needed...')
          const hasAddressData = data.address || data.city || data.state || data.zipCode
          const hasCoordinates = data.coordinates?.latitude && data.coordinates?.longitude

          // Only geocode if we have address data but no coordinates
          if (hasAddressData && !hasCoordinates) {
            req.payload.logger.info('[BUSINESS beforeChange] Starting geocoding...')
            const addressParts = [data.address, data.city, data.state, data.zipCode].filter(Boolean)

            if (addressParts.length > 0) {
              const addressString = addressParts.join(', ')

              try {
                // Use Nominatim (OpenStreetMap) geocoding API with timeout
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

                const response = await fetch(
                  `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1`,
                  {
                    headers: {
                      'User-Agent': 'North Country Chamber of Commerce',
                    },
                    signal: controller.signal,
                  },
                )

                clearTimeout(timeoutId)
                const results = await response.json()

                if (results && results.length > 0) {
                  const { lat, lon } = results[0]

                  if (!data.coordinates) {
                    data.coordinates = {}
                  }

                  data.coordinates.latitude = parseFloat(lat)
                  data.coordinates.longitude = parseFloat(lon)

                  req.payload.logger.info(`Geocoded address for ${data.name}: ${lat}, ${lon}`)
                }
              } catch (error) {
                req.payload.logger.error(`Failed to geocode address for ${data.name}: ${error}`)
              }
            }
          }
        } else {
          req.payload.logger.info(
            '[BUSINESS beforeChange] Skipping geocoding (skipMembershipUpdate=true or wrong operation)',
          )
        }

        req.payload.logger.info('[BUSINESS beforeChange] Done, returning data')
        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation, context }) => {
        req.payload.logger.info(
          `[BUSINESS afterChange] operation=${operation}, context=${JSON.stringify(context)}`,
        )

        // Prevent infinite loops from cascading hooks
        if (context?.skipUserUpdate) {
          req.payload.logger.info('[BUSINESS afterChange] Skipping (skipUserUpdate=true)')
          return
        }

        // When a business is created by a business_member, link it back to their user account
        if (operation === 'create' && doc.owner && req.user?.role === 'business_member') {
          req.payload.logger.info('[BUSINESS afterChange] Linking business to user...')
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

            req.payload.logger.info(`Updated user ${doc.owner} with business ${doc.id}`)
          } catch (error) {
            req.payload.logger.error(`Failed to update user with business reference: ${error}`)
          }
        }

        req.payload.logger.info('[BUSINESS afterChange] Done')
      },
    ],
  },
  admin: {
    defaultColumns: ['name', 'category', 'membershipStatus', 'memberSince'],
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
