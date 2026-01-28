import type { GlobalConfig } from 'payload'

import { chamberStaffOrAdmin } from '../../access/chamberStaffOrAdmin'

export const Banners: GlobalConfig = {
  slug: 'banners',
  label: 'Site Banners',
  access: {
    read: () => true, // Public can read to display banners
    update: chamberStaffOrAdmin,
  },
  admin: {
    description: 'Manage site-wide announcement banners',
  },
  fields: [
    {
      name: 'activeBanners',
      type: 'array',
      label: 'Site-Wide Banners',
      admin: {
        description: 'Banners displayed at the top of all pages',
      },
      fields: [
        {
          name: 'message',
          type: 'richText',
          required: true,
          localized: true,
          admin: {
            description: 'Banner message (keep brief - 1-2 sentences)',
          },
        },
        {
          name: 'style',
          type: 'select',
          required: true,
          defaultValue: 'info',
          options: [
            { label: 'Info (Blue)', value: 'info' },
            { label: 'Warning (Yellow)', value: 'warning' },
            { label: 'Error (Red)', value: 'error' },
            { label: 'Success (Green)', value: 'success' },
          ],
          admin: {
            description: 'Visual style of the banner',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'startDate',
              type: 'date',
              required: true,
              defaultValue: () => new Date().toISOString(),
              admin: {
                date: {
                  pickerAppearance: 'dayAndTime',
                },
                description: 'When to start showing this banner',
              },
            },
            {
              name: 'endDate',
              type: 'date',
              required: true,
              admin: {
                date: {
                  pickerAppearance: 'dayAndTime',
                },
                description: 'When to stop showing this banner',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description: 'Enable/disable this banner',
              },
            },
            {
              name: 'dismissible',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Allow users to close/dismiss this banner',
              },
            },
          ],
        },
      ],
    },
  ],
}
