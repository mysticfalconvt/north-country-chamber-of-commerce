import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { chamberStaffOrAdmin } from '../../access/chamberStaffOrAdmin'
import { adminPanelAccess } from '../../access/adminPanelAccess'
import { slugField } from 'payload'
import {
  sendBenefitApprovalNotification,
  sendBenefitSubmissionConfirmation,
} from '../../utilities/email'
import { getAdminNotificationEmails } from '../../utilities/getAdminEmails'

export const Benefits: CollectionConfig = {
  slug: 'benefits',
  access: {
    admin: adminPanelAccess,
    create: authenticated,
    delete: chamberStaffOrAdmin,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        // Send notification email when a new benefit is created with pending status
        if (operation === 'create' && doc.benefitStatus === 'pending') {
          try {
            // Get admin notification emails (from env var or fallback to database)
            const adminEmails = await getAdminNotificationEmails(req.payload)

            if (adminEmails.length === 0) {
              req.payload.logger.warn(
                'No admin notification emails configured. Set ADMIN_NOTIFICATION_EMAIL env var.',
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

            // Send notification email to admins
            await sendBenefitApprovalNotification({
              benefitId: doc.id,
              benefitTitle:
                typeof doc.title === 'string' ? doc.title : doc.title?.en || 'Untitled Benefit',
              businessName,
              submitterEmail,
              adminEmails,
            })

            req.payload.logger.info(`Sent benefit approval notification for "${doc.title}"`)

            // Send confirmation email to the submitter
            if (submitterEmail && submitterEmail !== 'Unknown') {
              try {
                await sendBenefitSubmissionConfirmation({
                  to: submitterEmail,
                  benefitTitle:
                    typeof doc.title === 'string' ? doc.title : doc.title?.en || 'Untitled Benefit',
                  businessName,
                })
                req.payload.logger.info(
                  `Sent benefit submission confirmation to ${submitterEmail} for "${doc.title}"`,
                )
              } catch (confirmError) {
                req.payload.logger.error(
                  `Failed to send benefit submission confirmation: ${confirmError}`,
                )
              }
            }
          } catch (error) {
            req.payload.logger.error(`Failed to send benefit approval notification: ${error}`)
          }
        }
      },
    ],
  },
  admin: {
    defaultColumns: ['title', 'business', 'benefitStatus', 'expirationDate'],
    useAsTitle: 'title',
    description: 'Member business benefits, offers, coupons, and discounts',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'Name of the benefit or offer',
      },
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      localized: true,
      admin: {
        description: 'Full description of the benefit/offer including terms and conditions',
      },
    },
    {
      name: 'discountValue',
      type: 'text',
      admin: {
        description: 'e.g., "10% off", "$5 off", "Buy 1 Get 1 Free"',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Promotional image for this benefit',
      },
    },
    {
      name: 'attachment',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'PDF coupon or flyer for printing',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'externalUrl',
          type: 'text',
          admin: {
            description: 'Link to redeem online or more info',
          },
        },
        {
          name: 'linkText',
          type: 'text',
          admin: {
            description: 'Text to display for the link (e.g., "Redeem Online", "Learn More")',
          },
        },
      ],
    },
    {
      name: 'code',
      type: 'text',
      admin: {
        description: 'Promo/discount code if applicable',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          admin: {
            date: { pickerAppearance: 'dayOnly' },
            description: 'When this benefit becomes active',
          },
        },
        {
          name: 'expirationDate',
          type: 'date',
          admin: {
            date: { pickerAppearance: 'dayOnly' },
            description: 'When this benefit expires',
          },
        },
      ],
    },
    {
      name: 'business',
      type: 'relationship',
      relationTo: 'businesses',
      required: true,
      admin: {
        description: 'Business offering this benefit',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'featured',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Highlight on benefits page',
          },
        },
        {
          name: 'benefitStatus',
          type: 'select',
          required: true,
          defaultValue: 'pending',
          options: [
            { label: 'Pending Approval', value: 'pending' },
            { label: 'Published', value: 'published' },
            { label: 'Draft', value: 'draft' },
            { label: 'Expired', value: 'expired' },
          ],
        },
      ],
    },
    {
      name: 'submittedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User who submitted this benefit (for tracking)',
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
