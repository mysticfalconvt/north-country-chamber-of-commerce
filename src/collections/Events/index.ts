import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { chamberStaffOrAdmin } from '../../access/chamberStaffOrAdmin'
import { slugField } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  access: {
    create: authenticated,
    delete: chamberStaffOrAdmin,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Auto-geocode address to get coordinates
        if (operation === 'create' || operation === 'update') {
          const hasAddressData = data.address || data.city || data.state || data.zipCode || data.location
          const hasCoordinates = data.coordinates?.latitude && data.coordinates?.longitude

          // Only geocode if we have address data but no coordinates
          if (hasAddressData && !hasCoordinates) {
            // Build address string from separate fields (preferred) or fall back to location
            const addressParts = [
              data.address,
              data.city,
              data.state,
              data.zipCode,
            ].filter(Boolean)

            // If no structured address, use location field
            if (addressParts.length === 0 && data.location) {
              addressParts.push(data.location)
            }

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
                    `Geocoded address for event ${data.title}: ${lat}, ${lon}`,
                  )
                }
              } catch (error) {
                req.payload.logger.error(
                  `Failed to geocode address for event ${data.title}: ${error}`,
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
    defaultColumns: ['title', 'date', 'category', 'eventStatus'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      localized: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
        {
          name: 'endDate',
          type: 'date',
          admin: {
            description: 'For multi-day events',
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startTime',
          type: 'text',
          admin: {
            description: 'e.g., "10:00 AM"',
          },
        },
        {
          name: 'endTime',
          type: 'text',
          admin: {
            description: 'e.g., "2:00 PM"',
          },
        },
      ],
    },
    {
      name: 'location',
      type: 'text',
      admin: {
        description: 'Venue/location name',
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
      admin: {
        description:
          'Auto-populated from address. Leave empty to geocode automatically, or enter manually to override.',
      },
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
    },
    {
      type: 'row',
      fields: [
        {
          name: 'business',
          type: 'relationship',
          relationTo: 'businesses',
          admin: {
            description: 'Hosting business (optional)',
          },
        },
        {
          name: 'organizer',
          type: 'text',
          admin: {
            description: 'For external organizations',
          },
        },
      ],
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Chamber Event', value: 'chamber' },
        { label: 'Community Event', value: 'community' },
        { label: 'Networking', value: 'networking' },
        { label: 'Workshop', value: 'workshop' },
        { label: 'Festival', value: 'festival' },
        { label: 'Fundraiser', value: 'fundraiser' },
        { label: 'Social', value: 'social' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'recurring',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Is this a recurring event?',
          },
        },
        {
          name: 'externalUrl',
          type: 'text',
          admin: {
            description: 'Link to external registration/info page',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'featured',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Highlight on homepage',
          },
        },
        {
          name: 'eventStatus',
          type: 'select',
          required: true,
          defaultValue: 'published',
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
        },
      ],
    },
    {
      name: 'submittedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User who submitted this event (for tracking)',
        position: 'sidebar',
      },
    },
    slugField(),
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
    },
  },
}
