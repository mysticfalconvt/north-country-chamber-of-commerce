import type { CollectionConfig } from 'payload'

import { chamberStaffOrAdmin } from '../../access/chamberStaffOrAdmin'
import { isAdmin } from '../../access/isAdmin'

export const MailingList: CollectionConfig = {
  slug: 'mailing-list',
  labels: {
    singular: 'Mailing List Subscriber',
    plural: 'Mailing List',
  },
  access: {
    create: () => true, // Public can subscribe
    read: chamberStaffOrAdmin,
    update: chamberStaffOrAdmin,
    delete: isAdmin,
  },
  admin: {
    defaultColumns: ['email', 'name', 'subscribed', 'subscribedAt'],
    useAsTitle: 'email',
    description: 'Newsletter and mailing list subscribers',
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Subscriber email address',
      },
    },
    {
      name: 'name',
      type: 'text',
      admin: {
        description: 'Subscriber name (optional)',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'subscribed',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Currently subscribed to mailing list',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'subscribedAt',
          type: 'date',
          admin: {
            description: 'Date subscribed',
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'unsubscribedAt',
          type: 'date',
          admin: {
            description: 'Date unsubscribed',
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },
    {
      name: 'unsubscribeToken',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        hidden: true,
        description: 'Secure token for unsubscribe links',
      },
    },
  ],
  timestamps: true,
}
