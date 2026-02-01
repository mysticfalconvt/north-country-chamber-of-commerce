import type { CollectionConfig } from 'payload'

import { chamberStaffOrAdmin } from '../../access/chamberStaffOrAdmin'
import { isAdmin } from '../../access/isAdmin'

export const EmailCampaigns: CollectionConfig = {
  slug: 'email-campaigns',
  labels: {
    singular: 'Email Campaign',
    plural: 'Email Campaigns',
  },
  access: {
    create: chamberStaffOrAdmin,
    read: chamberStaffOrAdmin,
    update: chamberStaffOrAdmin,
    delete: isAdmin,
  },
  admin: {
    defaultColumns: ['subject', 'sentAt', 'recipientCount', 'sentBy'],
    useAsTitle: 'subject',
    description: 'History of sent newsletters and email campaigns',
  },
  fields: [
    {
      name: 'newsItem',
      type: 'relationship',
      relationTo: 'news',
      required: false, // Allow null so news items can be deleted
      admin: {
        description: 'The news item that was sent (may be null if news item was deleted)',
      },
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
      admin: {
        description: 'Email subject line',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'sentAt',
          type: 'date',
          required: true,
          admin: {
            description: 'When the email was sent',
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'recipientCount',
          type: 'number',
          required: true,
          admin: {
            description: 'Number of subscribers who received the email',
          },
        },
      ],
    },
    {
      name: 'sentBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Admin/staff member who sent the campaign',
      },
    },
    {
      name: 'includedEvents',
      type: 'relationship',
      relationTo: 'events',
      hasMany: true,
      admin: {
        description: 'Upcoming events included in the email',
      },
    },
  ],
  timestamps: true,
}
