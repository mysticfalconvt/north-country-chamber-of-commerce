import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { chamberStaffOrAdmin } from '../../access/chamberStaffOrAdmin'
import { adminPanelAccess } from '../../access/adminPanelAccess'
import { slugField } from 'payload'
import { sendEventApprovalNotification, sendEventSubmissionConfirmation } from '../../utilities/email'
import { autoTranslate } from './hooks'

export const Events: CollectionConfig = {
  slug: 'events',
  access: {
    admin: adminPanelAccess,
    create: authenticated,
    delete: chamberStaffOrAdmin,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Only enforce isChamberEvent=false when a business_member is creating/updating
        // Admins and chamber_staff can set isChamberEvent to whatever they want
        if (operation === 'create' || operation === 'update') {
          const user = req.user as { role?: string } | undefined

          // Only restrict for business members
          if (user?.role === 'business_member') {
            data.isChamberEvent = false
          }
        }

        return data
      },
      async ({ data, req, operation }) => {
        // Auto-geocode address to get coordinates
        if (operation === 'create' || operation === 'update') {
          const hasAddressData =
            data.address || data.city || data.state || data.zipCode || data.location
          const hasCoordinates = data.coordinates?.latitude && data.coordinates?.longitude

          // Only geocode if we have address data but no coordinates
          if (hasAddressData && !hasCoordinates) {
            // Build address string from separate fields (preferred) or fall back to location
            const addressParts = [data.address, data.city, data.state, data.zipCode].filter(Boolean)

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
      autoTranslate,
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        // Send notification email when a new event is created with pending status
        if (operation === 'create' && doc.eventStatus === 'pending') {
          try {
            // Get all admin and chamber_staff users
            const adminUsers = await req.payload.find({
              collection: 'users',
              where: {
                or: [{ role: { equals: 'admin' } }, { role: { equals: 'chamber_staff' } }],
              },
              limit: 100,
            })

            const adminEmails = adminUsers.docs
              .map((user) => user.email)
              .filter((email): email is string => !!email)

            if (adminEmails.length === 0) {
              req.payload.logger.warn(
                'No admin or chamber staff emails found for event approval notification',
              )
              return
            }

            // Get business name if available
            let businessName = 'Unknown Business'
            if (doc.business) {
              const businessId = typeof doc.business === 'number' ? doc.business : doc.business.id
              const business = await req.payload.findByID({
                collection: 'businesses',
                id: businessId,
              })
              businessName = business.name || businessName
            }

            // Get submitter email
            let submitterEmail = 'Unknown'
            if (doc.submittedBy) {
              const userId =
                typeof doc.submittedBy === 'number' ? doc.submittedBy : doc.submittedBy.id
              const user = await req.payload.findByID({
                collection: 'users',
                id: userId,
              })
              submitterEmail = user.email || submitterEmail
            }

            // Send notification email
            await sendEventApprovalNotification({
              eventId: doc.id,
              eventTitle:
                typeof doc.title === 'string' ? doc.title : doc.title?.en || 'Untitled Event',
              eventDate: doc.date,
              businessName,
              submitterEmail,
              adminEmails,
            })

            req.payload.logger.info(
              `Sent event approval notification for "${doc.title}" to ${adminEmails.length} recipient(s)`,
            )

            // Send confirmation email to the submitter
            if (submitterEmail && submitterEmail !== 'Unknown') {
              try {
                await sendEventSubmissionConfirmation({
                  to: submitterEmail,
                  eventTitle:
                    typeof doc.title === 'string' ? doc.title : doc.title?.en || 'Untitled Event',
                  eventDate: doc.date,
                  businessName,
                })
                req.payload.logger.info(
                  `Sent event submission confirmation to ${submitterEmail} for "${doc.title}"`,
                )
              } catch (confirmError) {
                req.payload.logger.error(
                  `Failed to send event submission confirmation: ${confirmError}`,
                )
              }
            }
          } catch (error) {
            req.payload.logger.error(`Failed to send event approval notification: ${error}`)
          }
        }
      },
    ],
  },
  admin: {
    defaultColumns: ['title', 'date', 'isChamberEvent', 'eventStatus'],
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
      name: 'attachment',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'PDF flyer or event document',
      },
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
            description: 'End of multi-day event, or when recurring series ends',
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
      name: 'isChamberEvent',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Official Chamber of Commerce event',
        condition: (data, siblingData, { user }) =>
          user?.role === 'admin' || user?.role === 'chamber_staff',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'externalUrl',
          type: 'text',
          admin: {
            description: 'Link to external registration/info page',
          },
        },
        {
          name: 'linkTitle',
          type: 'text',
          admin: {
            description: 'Custom text for registration link (e.g., "Buy Tickets", "RSVP")',
            condition: (data) => !!data?.externalUrl,
          },
        },
      ],
    },
    {
      name: 'isRecurring',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Is this a recurring event?',
      },
    },
    {
      type: 'group',
      name: 'recurrence',
      label: 'Recurrence Settings',
      admin: {
        condition: (data) => data?.isRecurring === true,
      },
      fields: [
        {
          name: 'recurrenceType',
          type: 'select',
          required: true,
          options: [
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
          ],
          admin: {
            description: 'How often this event repeats (pattern from start date, ends on end date)',
          },
        },
        {
          name: 'monthlyType',
          type: 'select',
          options: [
            { label: 'Same day of month (e.g., 15th)', value: 'dayOfMonth' },
            { label: 'Same week & day (e.g., 2nd Tuesday)', value: 'dayOfWeek' },
          ],
          admin: {
            description: 'How to determine the monthly date (auto-calculated from start date)',
            condition: (data, siblingData) => siblingData?.recurrenceType === 'monthly',
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
          defaultValue: 'pending',
          options: [
            { label: 'Pending Approval', value: 'pending' },
            { label: 'Published', value: 'published' },
            { label: 'Draft', value: 'draft' },
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
