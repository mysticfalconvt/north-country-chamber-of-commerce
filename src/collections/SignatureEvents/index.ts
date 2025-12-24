import type { CollectionConfig } from 'payload'

import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { chamberStaffOrAdmin } from '../../access/chamberStaffOrAdmin'
import { slugField } from 'payload'

export const SignatureEvents: CollectionConfig = {
  slug: 'signature-events',
  labels: {
    singular: 'Signature Event',
    plural: 'Signature Events',
  },
  access: {
    create: chamberStaffOrAdmin,
    delete: chamberStaffOrAdmin,
    read: authenticatedOrPublished,
    update: chamberStaffOrAdmin,
  },
  hooks: {},
  admin: {
    defaultColumns: ['name', 'year', 'eventStatus'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'e.g., "Hot Rod ChiliFest"',
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
      admin: {
        description: 'Event-specific branding/logo',
      },
    },
    {
      name: 'gallery',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'schedule',
      type: 'richText',
      localized: true,
      admin: {
        description: 'Day-of schedule',
      },
    },
    {
      name: 'vendors',
      type: 'richText',
      localized: true,
      admin: {
        description: 'Vendor list/information',
      },
    },
    {
      name: 'rules',
      type: 'richText',
      localized: true,
      admin: {
        description: 'Rules & regulations',
      },
    },
    {
      name: 'applicationForm',
      type: 'richText',
      localized: true,
      admin: {
        description: 'Application instructions & requirements',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'applicationOpen',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Accept applications?',
          },
        },
        {
          name: 'applicationDeadline',
          type: 'date',
          admin: {
            description: 'Deadline for entries',
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
      ],
    },
    {
      name: 'contactEmail',
      type: 'email',
      admin: {
        description: 'Event coordinator email',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'year',
          type: 'number',
          required: true,
          admin: {
            description: 'Current year\'s info',
          },
        },
        {
          name: 'eventStatus',
          type: 'select',
          required: true,
          defaultValue: 'upcoming',
          options: [
            { label: 'Upcoming', value: 'upcoming' },
            { label: 'Active', value: 'active' },
            { label: 'Archived', value: 'archived' },
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
