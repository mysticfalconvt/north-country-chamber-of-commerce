import type { CollectionConfig } from 'payload'

import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { chamberStaffOrAdmin } from '../../access/chamberStaffOrAdmin'
import { adminPanelAccess } from '../../access/adminPanelAccess'

// Helper to create URL-safe slugs
const formatSlug = (val: string): string =>
  val
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100) // Limit length

export const News: CollectionConfig = {
  slug: 'news',
  access: {
    admin: adminPanelAccess,
    create: chamberStaffOrAdmin,
    delete: chamberStaffOrAdmin,
    read: authenticatedOrPublished,
    update: chamberStaffOrAdmin,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        // Get the title (handle localized field)
        const title = data?.title
          ? typeof data.title === 'string'
            ? data.title
            : data.title?.en || Object.values(data.title)[0]
          : null

        // Auto-generate slug from title on create
        if (operation === 'create' && title) {
          data.slug = formatSlug(title)
        }
        // Fix malformed slugs (containing spaces or uppercase) on any save
        else if (data?.slug && /[^a-z0-9-]/.test(data.slug)) {
          data.slug = formatSlug(data.slug)
        }
        // Generate slug if missing
        else if (!data?.slug && title) {
          data.slug = formatSlug(title)
        }

        return data
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        // Nullify references in email-campaigns before deleting
        const campaigns = await req.payload.find({
          collection: 'email-campaigns',
          where: {
            newsItem: { equals: id },
          },
          limit: 1000,
        })

        for (const campaign of campaigns.docs) {
          await req.payload.update({
            collection: 'email-campaigns',
            id: campaign.id,
            data: {
              newsItem: null,
            },
          })
        }
      },
    ],
  },
  admin: {
    defaultColumns: ['title', 'author', 'publishDate', 'featured', '_status'],
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
      name: 'content',
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
          name: 'publishDate',
          type: 'date',
          required: true,
          defaultValue: () => new Date().toISOString(),
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'featured',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      admin: {
        position: 'sidebar',
        description: 'Who wrote this news item',
      },
    },
    {
      name: 'emailSent',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Has this news item been sent as a newsletter?',
        readOnly: true,
      },
    },
    {
      name: 'sentAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'When the newsletter was sent',
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'sendNewsletter',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/collections/News/components/SendNewsletterButton#SendNewsletterButton',
        },
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Auto-generated from title',
      },
    },
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
      schedulePublish: true,
    },
  },
}
