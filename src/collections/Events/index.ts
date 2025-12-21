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
  hooks: {},
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
    },
    {
      name: 'business',
      type: 'relationship',
      relationTo: 'businesses',
      admin: {
        description: 'Hosting business (optional)',
      },
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Community', value: 'community' },
        { label: 'Networking', value: 'networking' },
        { label: 'Workshop', value: 'workshop' },
        { label: 'Fundraiser', value: 'fundraiser' },
        { label: 'Social', value: 'social' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'featured',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'eventStatus',
          type: 'select',
          required: true,
          defaultValue: 'published',
          options: [
            { label: 'Published', value: 'published' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
        },
      ],
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
