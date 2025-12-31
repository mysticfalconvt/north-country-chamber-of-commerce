import type { CollectionConfig } from 'payload'

import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { chamberStaffOrAdmin } from '../../access/chamberStaffOrAdmin'
import { adminPanelAccess } from '../../access/adminPanelAccess'
import { slugField } from 'payload'

export const Announcements: CollectionConfig = {
  slug: 'announcements',
  access: {
    admin: adminPanelAccess,
    create: chamberStaffOrAdmin,
    delete: chamberStaffOrAdmin,
    read: authenticatedOrPublished,
    update: chamberStaffOrAdmin,
  },
  hooks: {},
  admin: {
    defaultColumns: ['title', 'publishDate', 'featured', '_status'],
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
    slugField(),
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
